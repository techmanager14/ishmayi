import { NextResponse, type NextRequest } from "next/server";
import { checkoutAllowed } from "@/lib/catalog";
import { currentCustomer } from "@/lib/customer/session";
import { validateCheckout } from "@/lib/order";
import { createRazorpayOrder, orderRef, quoteOrder, razorpayConfigured, razorpayKeyId, signOrder, type PendingOrder } from "@/lib/payments";
import { clientIp, createRateLimiter, sameOrigin } from "@/lib/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limited = createRateLimiter(10, 10 * 60 * 1000);
const fail = (status: number, code: string, message: string, extra: object = {}) =>
  NextResponse.json({ ok: false, code, message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Step 1 of payment: validate the customer, re-price the bag from the store and
 * create a Razorpay order for exactly that amount.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return fail(403, "forbidden", "This request was not accepted.");
  if (limited(clientIp(req))) return fail(429, "rate_limited", "Too many attempts. Please wait a few minutes.");

  const raw = await req.text();
  if (raw.length > 16 * 1024) return fail(413, "too_large", "The order was too large.");
  let body: { customer?: Record<string, unknown>; lines?: unknown; coupon?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "malformed", "The order could not be read. Please try again.");
  }

  // An account is required: the order is placed under the signed-in customer's email.
  const me = await currentCustomer();
  if (!me) return fail(401, "login_required", "Please sign in or create an account to place your order.");
  const customer = validateCheckout({ ...(body.customer ?? {}), email: me.email });
  if (!customer.ok) return fail(422, "invalid", "Please check the highlighted fields.", { fieldErrors: customer.errors });

  if (!(await checkoutAllowed())) return fail(503, "store_not_live", "Online ordering opens soon. Please contact us to place your order.");
  if (!razorpayConfigured()) {
    console.error("[checkout] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured");
    return fail(503, "payments_not_configured", "Online payments are being set up. Please contact us to place your order.");
  }

  const priced = await quoteOrder(body.lines, body.coupon, me.contactId);
  if (!priced.ok) return fail(priced.code === "store_closed" ? 503 : 409, priced.code, priced.message, { productId: priced.productId });
  if (priced.couponError) return fail(422, "coupon_invalid", priced.couponError);

  const ref = orderRef();
  const c = customer.data;
  const rzp = await createRazorpayOrder(priced.total, ref, {
    ref,
    name: c.fullName.slice(0, 100),
    phone: c.phone,
    email: c.email.slice(0, 100),
    items: priced.lines.map((l) => `${l.qty}× ${l.title}`).join(", ").slice(0, 250),
  });
  if (!rzp) return fail(502, "gateway_error", "We couldn't start the payment. Please try again in a moment.");

  const order: PendingOrder = {
    ref,
    razorpayOrderId: rzp.id,
    createdAt: new Date().toISOString(),
    accountContactId: me.contactId,
    customer: c,
    lines: priced.lines,
    subtotal: priced.subtotal,
    discount: priced.discount,
    coupon: priced.coupon,
    discountLabel: priced.discountLabel,
    reward: priced.reward,
    gstRate: priced.gstRate,
    gst: priced.gst,
    shipping: priced.shipping,
    total: priced.total,
    currency: "INR",
  };
  console.info(`[checkout] ${ref} created razorpay=${rzp.id} total=${priced.total}`);

  return NextResponse.json(
    {
      ok: true,
      ref,
      token: signOrder(order),
      lines: priced.lines,
      total: priced.total,
      razorpay: { keyId: razorpayKeyId(), orderId: rzp.id, amount: rzp.amount, currency: rzp.currency },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
