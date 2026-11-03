import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments";
import { orderWebhook, sendWebhook, webhookUrlAllowed } from "@/lib/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Backup record of payments, straight from Razorpay (Dashboard → Webhooks →
 * events "payment.captured", secret = RAZORPAY_WEBHOOK_SECRET). Covers the case
 * where a customer pays but closes the page before /api/checkout/verify runs.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") ?? "")) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: Record<string, unknown> } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (event.event !== "payment.captured") return NextResponse.json({ ok: true, ignored: true });

  const p = event.payload?.payment?.entity ?? {};
  const notes = (p.notes ?? {}) as Record<string, string>;
  const paymentId = String(p.id ?? "");
  const cfg = orderWebhook();
  if (!paymentId || !webhookUrlAllowed(cfg.url)) return NextResponse.json({ ok: true });

  const res = await sendWebhook(
    cfg,
    {
      event: "order.payment_captured",
      source: "razorpay_webhook",
      submissionId: `${paymentId}-captured`,
      payment: {
        provider: "razorpay",
        paymentId,
        orderId: p.order_id ?? null,
        amount: typeof p.amount === "number" ? p.amount / 100 : null,
        currency: p.currency ?? "INR",
        method: p.method ?? null,
      },
      order: { ref: notes.ref ?? null, items: notes.items ?? null },
      customer: { fullName: notes.name ?? null, phone: notes.phone ?? p.contact ?? null, email: notes.email ?? p.email ?? null },
    },
    `${paymentId}-captured`,
    { name: "razorpay-webhook", system: "order system" },
  );
  // 5xx makes Razorpay retry later if GoHighLevel didn't acknowledge.
  return NextResponse.json({ ok: res.success }, { status: res.success ? 200 : 502 });
}
