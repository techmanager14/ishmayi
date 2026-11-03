import { getCmsFresh } from "@/lib/cms";
import { NextResponse, type NextRequest } from "next/server";
import { checkoutAllowed } from "@/lib/catalog";
import { SUBMISSION_ID_PATTERN } from "@/lib/enquiry";
import { validateCheckout } from "@/lib/order";
import { recordOrder } from "@/lib/orders";
import { orderRef, quoteOrder, type PendingOrder } from "@/lib/payments";
import { formatInr, site } from "@/lib/site";
import { clientIp, createRateLimiter, sameOrigin } from "@/lib/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// No payment is taken for COD, so keep fake/bulk orders out.
const limited = createRateLimiter(5, 30 * 60 * 1000);
const placed = new Map<string, { at: number; ref: string; total: number }>();
// COD on/off and the order limit are set in the admin panel (Settings → Store);
// NEXT_PUBLIC_ALLOW_COD=false / COD_MAX_AMOUNT in the environment still override.
const codSettings = async () => {
  const { store } = await getCmsFresh();
  return { enabled: site.codEnabled && store.codEnabled, max: Number(process.env.COD_MAX_AMOUNT) || store.codMaxAmount || 25000 };
};

const fail = (status: number, code: string, message: string, extra: object = {}) =>
  NextResponse.json({ ok: false, code, message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

/** Place a Cash-on-Delivery order: validate, price from the store, record in GHL. */
export async function POST(req: NextRequest) {
  const cod = await codSettings();
  if (!cod.enabled) return fail(403, "cod_disabled", "Cash on Delivery isn't available right now.");
  if (!sameOrigin(req)) return fail(403, "forbidden", "This request was not accepted.");

  const raw = await req.text();
  if (raw.length > 16 * 1024) return fail(413, "too_large", "The order was too large.");
  let body: { customer?: Record<string, unknown>; lines?: unknown; coupon?: unknown; submissionId?: unknown; website?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "malformed", "The order could not be read. Please try again.");
  }

  const submissionId = typeof body.submissionId === "string" ? body.submissionId : "";
  if (!SUBMISSION_ID_PATTERN.test(submissionId)) return fail(400, "malformed", "The order could not be read. Please try again.");

  // Retry of an order that already went through (double click / flaky network).
  const done = placed.get(submissionId);
  if (done) return NextResponse.json({ ok: true, ref: done.ref, total: done.total, method: "cod" });

  // Honeypot: real customers never fill this.
  if (typeof body.website === "string" && body.website.trim()) return fail(400, "rejected", "This order could not be placed.");
  if (limited(clientIp(req))) return fail(429, "rate_limited", "Too many orders from this connection. Please contact us to complete your order.");

  const customer = validateCheckout(body.customer ?? {});
  if (!customer.ok) return fail(422, "invalid", "Please check the highlighted fields.", { fieldErrors: customer.errors });
  if (!(await checkoutAllowed())) return fail(503, "store_not_live", "Online ordering opens soon. Please contact us to place your order.");

  const priced = await quoteOrder(body.lines, body.coupon);
  if (!priced.ok) return fail(priced.code === "store_closed" ? 503 : 409, priced.code, priced.message, { productId: priced.productId });
  if (priced.couponError) return fail(422, "coupon_invalid", priced.couponError);
  if (cod.max > 0 && priced.total > cod.max)
    return fail(422, "cod_limit", `Cash on Delivery is available for orders up to ${formatInr(cod.max)}. Please contact us to place this order.`);

  const order: PendingOrder = {
    ref: orderRef(),
    razorpayOrderId: "",
    createdAt: new Date().toISOString(),
    customer: customer.data,
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

  const res = await recordOrder(order, { method: "cod", status: "pending", amount: order.total });
  if (!res.ok) {
    // Without a record the team can't fulfil it — never confirm an unrecorded COD order.
    return fail(502, "not_recorded", "We couldn't place your order just now. Please try again in a moment, or contact us to order.");
  }
  placed.set(submissionId, { at: Date.now(), ref: order.ref, total: order.total });
  for (const [k, v] of placed) if (Date.now() - v.at > 60 * 60 * 1000) placed.delete(k);
  console.info(`[checkout] ${order.ref} COD placed total=${order.total} via=${res.via}`);

  return NextResponse.json({ ok: true, ref: order.ref, total: order.total, method: "cod" }, { headers: { "Cache-Control": "no-store" } });
}
