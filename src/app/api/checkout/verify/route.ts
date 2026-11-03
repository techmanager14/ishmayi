import { NextResponse, type NextRequest } from "next/server";
import { readOrder, verifyPaymentSignature } from "@/lib/payments";
import { recordOrder } from "@/lib/orders";
import { clientIp, createRateLimiter, sameOrigin } from "@/lib/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Recording a paid order also creates and emails its invoice.
export const maxDuration = 60;

const limited = createRateLimiter(20, 10 * 60 * 1000);
const recorded = new Map<string, number>();

/**
 * Step 2 of payment: Razorpay's popup returns a signed result. We verify the
 * signature, then record the paid order (webhook or GoHighLevel). If recording
 * fails the customer still sees success — they have paid — and the Razorpay
 * webhook (/api/razorpay/webhook) acts as a backup record.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 });
  if (limited(clientIp(req))) return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429 });

  const body = (await req.json().catch(() => null)) as {
    token?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  } | null;

  const order = readOrder(body?.token);
  const orderId = String(body?.razorpay_order_id ?? "");
  const paymentId = String(body?.razorpay_payment_id ?? "");
  const signature = String(body?.razorpay_signature ?? "");

  if (!order || order.razorpayOrderId !== orderId || !paymentId || !verifyPaymentSignature(orderId, paymentId, signature)) {
    console.warn(`[checkout] verification failed for ${orderId || "unknown order"}`);
    return NextResponse.json(
      { ok: false, code: "verification_failed", message: "We couldn't verify this payment. If money was deducted, please contact us with your payment ID." },
      { status: 400 },
    );
  }

  // Record once per payment (retries / double submits).
  let recordedOk = recorded.has(paymentId);
  if (!recordedOk) {
    const res = await recordOrder(order, { method: "online", provider: "razorpay", status: "captured", orderId, paymentId, amount: order.total });
    recordedOk = res.ok;
    if (recordedOk) recorded.set(paymentId, Date.now());
  }
  console.info(`[checkout] ${order.ref} paid payment=${paymentId} recorded=${recordedOk}`);

  return NextResponse.json({ ok: true, ref: order.ref, paymentId, total: order.total, recorded: recordedOk }, { headers: { "Cache-Control": "no-store" } });
}
