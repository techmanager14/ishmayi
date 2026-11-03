import "server-only";
import { ghlConfigured } from "./catalog/ghl";
import { getCmsFresh } from "./cms";
import { addNote, addTags, createOpportunity, updateContact, upsertContact } from "./crm";
import { dateInDays, setReward } from "./customer/rewards";
import { invoiceOrder } from "./invoicing";
import { formatInr, formatInrExact } from "./site";
import type { PendingOrder } from "./payments";
import { orderWebhook, sendWebhook, webhookUrlAllowed } from "./webhook";

// Where placed/paid orders are recorded:
//   1. ORDER_WEBHOOK_URL (or CONSULTATION_WEBHOOK_URL) if set — e.g. a GHL workflow
//   2. otherwise straight into GoHighLevel: contact (upsert) + tags + an order note
// Needs GHL token scopes contacts.write (and contacts.readonly).

export type OrderPayment =
  | { method: "cod"; status: "pending"; amount: number }
  | { method: "online"; provider: "razorpay"; status: "captured"; orderId: string; paymentId: string; amount: number };

export interface RecordResult {
  ok: boolean;
  via: "webhook" | "ghl" | "none";
  reference: string | null;
}


function orderNote(order: PendingOrder, payment: OrderPayment) {
  const c = order.customer;
  const a = c.address;
  const lines = order.lines.map((l) => `• ${l.qty} × ${l.title}${l.variantTitle ? ` (${l.variantTitle})` : ""} — ${formatInrExact(l.lineTotal)}`);
  return [
    `🛍️ Website order ${order.ref}`,
    ...(c.gift ? ["🎁 GIFT ORDER — deliver to the recipient below. Do not put prices in the parcel."] : []),
    payment.method === "cod"
      ? `Payment: CASH ON DELIVERY — collect ${formatInrExact(payment.amount)}`
      : `Payment: PAID ONLINE (Razorpay ${payment.paymentId}) — ${formatInrExact(payment.amount)}`,
    "",
    ...lines,
    `Subtotal: ${formatInrExact(order.subtotal)}${order.discount ? ` · Discount${order.discountLabel ? ` (${order.discountLabel})` : order.coupon ? ` (${order.coupon})` : ""}: −${formatInrExact(order.discount)}` : ""}`,
    `Total: ${formatInrExact(order.total)}${order.gst ? ` · GST ${order.gstRate}%: ${formatInrExact(order.gst)}` : ""} · Shipping: ${order.shipping ? formatInrExact(order.shipping) : "free"}`,
    "",
    ...(c.gift ? [`Gift for: ${c.gift.recipient}`, ...(c.gift.message ? [`Gift message: ${c.gift.message}`] : []), `Ordered by: ${c.fullName} · ${c.phone} · ${c.email}`, ""] : []),
    "Deliver to:",
    c.gift ? c.gift.recipient : c.fullName,
    a.line1,
    ...(a.line2 ? [a.line2] : []),
    `${a.city}, ${a.state} – ${a.pincode}`,
    c.gift ? `Phone: ${c.gift.phone}` : `Phone: ${c.phone} · Email: ${c.email}`,
    ...(c.notes ? ["", `Customer note: ${c.notes}`] : []),
  ].join("\n");
}

async function recordInGhl(order: PendingOrder, payment: OrderPayment): Promise<RecordResult> {
  const c = order.customer;
  // A gift's delivery address is the recipient's, so it isn't saved as the buyer's own.
  const own = c.gift ? {} : { address1: [c.address.line1, c.address.line2].filter(Boolean).join(", "), city: c.address.city, state: c.address.state, postalCode: c.address.pincode };
  let contactId = order.accountContactId ?? "";
  if (contactId) {
    // Signed-in customer: keep the order on their account. Details are a convenience, so a refusal (e.g. phone on another contact) doesn't matter.
    await updateContact(contactId, { phone: c.phone, ...own }).catch((err) => console.warn(`[order] ${order.ref} contact not updated: ${err instanceof Error ? err.message : "error"}`));
  } else {
    contactId = await upsertContact({ fullName: c.fullName, email: c.email, phone: c.phone, ...own, source: "Trivana website" });
  }
  const tags = ["website-order", payment.method === "cod" ? "cod" : "paid-online", ...(c.gift ? ["gift-order"] : [])];
  try {
    await addTags(contactId, tags);
  } catch (err) {
    // The account's contact is gone (deleted or merged in GHL). A paid order must still be recorded.
    console.warn(`[order] ${order.ref} contact ${contactId} unusable, finding by email: ${err instanceof Error ? err.message : "error"}`);
    contactId = await upsertContact({ fullName: c.fullName, email: c.email, phone: c.phone, ...own, source: "Trivana website" });
    await addTags(contactId, tags);
  }
  await addNote(contactId, orderNote(order, payment));

  // Show the order as a card on a pipeline board. Best effort: the contact +
  // note above are the record, so a failure here does not lose the order.
  const items = order.lines.map((l) => `${l.qty}× ${l.title}`).join(", ");
  try {
    await createOpportunity({
      contactId,
      pipeline: "orders",
      value: order.total,
      name: `🛍️ ${order.ref} · ${payment.method === "cod" ? "COD" : "Paid"}${c.gift ? " 🎁 Gift" : ""} · ${formatInrExact(order.total)} · ${items}`,
    });
  } catch (err) {
    console.warn(`[order] ${order.ref} opportunity not created: ${err instanceof Error ? err.message : "error"}`);
  }
  await updateRewards(order, contactId);

  // The invoice is a courtesy on top of the recorded order: its failure must not fail a paid order.
  if (payment.method === "online") {
    try {
      const { store } = await getCmsFresh();
      await invoiceOrder({
        contact: { id: contactId, name: c.fullName, email: c.email, phone: c.phone },
        ref: order.ref,
        lines: order.lines,
        discount: order.discount ?? 0,
        gst: order.gst ?? 0,
        gstRate: order.gstRate ?? store.gstJewellery,
        shipping: order.shipping,
        total: order.total,
        paymentId: payment.paymentId,
        hsn: store.hsnJewellery,
      });
    } catch (err) {
      console.warn(`[order] ${order.ref} invoice not sent: ${err instanceof Error ? err.message : "error"}`);
    }
  }
  return { ok: true, via: "ghl", reference: contactId };
}

/**
 * Rewards after an order is recorded (best effort — never blocks the order):
 * the reward used on this order is cleared, and a jewellery spend above the
 * threshold earns the loyalty discount for the next order.
 */
async function updateRewards(order: PendingOrder, contactId: string) {
  try {
    const { store } = await getCmsFresh();
    if (order.reward) await setReward(order.reward.contactId, order.reward.kind, "");
    const spent = order.subtotal - (order.discount ?? 0);
    if (store.loyaltyPercent > 0 && store.loyaltyDays > 0 && spent > store.loyaltyMinSpend) {
      const until = dateInDays(store.loyaltyDays);
      await setReward(contactId, "loyalty", until);
      await addTags(contactId, ["loyalty-reward"]);
      await addNote(
        contactId,
        `🎁 Loyalty reward: ${store.loyaltyPercent}% off the next order, valid until ${until} (earned on ${order.ref}, jewellery ${formatInr(spent)}). Applied automatically at checkout.`,
      );
    }
  } catch (err) {
    console.warn(`[order] ${order.ref} rewards not updated: ${err instanceof Error ? err.message : "error"}`);
  }
}

export async function recordOrder(order: PendingOrder, payment: OrderPayment): Promise<RecordResult> {
  const cfg = orderWebhook();
  if (webhookUrlAllowed(cfg.url)) {
    const id = payment.method === "online" ? payment.paymentId : order.ref;
    const res = await sendWebhook(
      cfg,
      {
        event: payment.method === "online" ? "order.paid" : "order.placed",
        source: "trivana_website",
        submissionId: id,
        placedAt: new Date().toISOString(),
        order: { ref: order.ref, lines: order.lines, subtotal: order.subtotal, shipping: order.shipping, total: order.total, currency: order.currency },
        customer: {
          fullName: order.customer.fullName,
          phone: order.customer.phone,
          email: order.customer.email,
          shippingAddress: order.customer.address,
          notes: order.customer.notes,
          gift: order.customer.gift,
        },
        payment,
        consent: { privacyNoticeAccepted: true, marketingConsent: order.customer.marketingConsent },
      },
      id,
      { name: "order", system: "order system" },
    );
    return { ok: res.success, via: "webhook", reference: res.success ? res.reference : null };
  }

  if (ghlConfigured()) {
    try {
      return await recordInGhl(order, payment);
    } catch (err) {
      console.error(`[order] ${order.ref} could not be recorded in GHL: ${err instanceof Error ? err.message : "error"}`);
      return { ok: false, via: "ghl", reference: null };
    }
  }

  console.error(`[order] ${order.ref}: no ORDER_WEBHOOK_URL and no GHL connection — order not recorded`);
  return { ok: false, via: "none", reference: null };
}
