// Refunds are recorded as notes on the customer's GoHighLevel contact, e.g.
//   💸 Refund TRV-ABC123: ₹500 of ₹3,397.97 — Razorpay rfnd_xyz — clasp broken
// so the original order amount and the refunded amount stay separate.

export const REFUND_PREFIX = "💸 Refund";

/** The refunded amount at the start of a refund note. */
export const parseRefundAmount = (body: string) => Number(body.match(/: ₹([\d,]+(?:\.\d+)?)/)?.[1].replace(/,/g, "") ?? 0);

/** The paid total in an order note ("Total: ₹3,397.97 · …"). */
export const parseOrderTotal = (body: string) => Number(body.match(/^Total: ₹([\d,]+(?:\.\d+)?)/m)?.[1].replace(/,/g, "") ?? 0);

/** The Razorpay payment id in an order note. */
export const parsePaymentId = (body: string) => body.match(/Razorpay (pay_\w+)/)?.[1] ?? null;
