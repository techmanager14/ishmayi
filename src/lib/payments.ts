import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getProduct } from "./catalog";
import { productCode } from "./catalog/text";
import { getCmsFresh } from "./cms";
import { rewardsForContact, type RewardKind } from "./customer/rewards";
import type { Attribution } from "./enquiry";
import type { CheckoutCustomer, CheckoutLineInput, PricedLine } from "./order";

// Razorpay (https://razorpay.com/docs/api/orders/) — payment happens in
// Razorpay's checkout popup on our own page. Keys stay on the server, except
// the public key id which Razorpay's popup needs.

const env = (k: string) => process.env[k]?.trim() ?? "";

export const razorpayConfigured = () => Boolean(env("RAZORPAY_KEY_ID") && env("RAZORPAY_KEY_SECRET"));
export const razorpayKeyId = () => env("RAZORPAY_KEY_ID");

const tokenSecret = () => env("ORDER_TOKEN_SECRET") || env("RAZORPAY_KEY_SECRET");

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

// ---------------------------------------------------------------------------
// Pricing — always from the store, never from the browser.
// ---------------------------------------------------------------------------

export type PriceResult = { ok: true; lines: PricedLine[]; total: number } | { ok: false; code: string; message: string; productId?: string };

export async function priceCart(input: unknown): Promise<PriceResult> {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, code: "empty", message: "Your bag is empty." };
  if (input.length > 20) return { ok: false, code: "too_many", message: "Too many items in one order." };

  const lines: PricedLine[] = [];
  for (const raw of input as Partial<CheckoutLineInput>[]) {
    const productId = typeof raw?.productId === "string" ? raw.productId.slice(0, 120) : "";
    const variantId = typeof raw?.variantId === "string" ? raw.variantId.slice(0, 120) : "";
    const qty = Number(raw?.qty);
    if (!productId || !variantId || !Number.isInteger(qty) || qty < 1 || qty > 10)
      return { ok: false, code: "invalid_line", message: "Your bag couldn't be read. Please try again." };

    const product = await getProduct(productId, true); // live price, never cached
    const variant = product?.variants.find((v) => v.id === variantId);
    if (!product || !variant)
      return { ok: false, code: "unavailable", productId, message: "One item in your bag is no longer available. Please remove it and try again." };
    if (product.purchasable === false)
      return { ok: false, code: "not_online", productId, message: `${product.title} can’t be ordered online yet. Please remove it, or contact us to order it.` };
    if (!variant.available)
      return { ok: false, code: "sold_out", productId, message: `${product.title} has just sold out. Please remove it to continue.` };

    lines.push({
      productId,
      variantId,
      // Fashion jewellery carries its code into the order, so the team can identify the piece.
      title: productCode(product.subtitle) ? `${product.title} [${productCode(product.subtitle)}]` : product.title,
      variantTitle: product.showVariantPicker ? variant.title : null,
      image: product.images[0]?.src ?? null,
      unitPrice: variant.price,
      qty,
      lineTotal: Math.round(variant.price * qty * 100) / 100,
    });
  }
  const total = Math.round(lines.reduce((n, l) => n + l.lineTotal, 0) * 100) / 100;
  if (total <= 0) return { ok: false, code: "zero_total", message: "This order can't be paid online. Please contact us." };
  return { ok: true, lines, total };
}

/**
 * Final price of an order: live product prices, then the discount code and the
 * delivery charge set in the admin panel. Everything is worked out here on the
 * server; the browser only ever sends product ids, quantities and a code.
 */
/** A customer reward applied to the order (see lib/customer/rewards). */
export interface AppliedReward {
  kind: RewardKind;
  contactId: string;
  label: string;
}

export type Quote =
  | {
      ok: true;
      lines: PricedLine[];
      subtotal: number;
      /** The one discount applied: the best of the discount code and the customer's rewards. */
      discount: number;
      discountLabel: string | null;
      coupon: string | null;
      couponError: string | null;
      reward: AppliedReward | null;
      /** GST added on top of the (discounted) jewellery price. */
      gstRate: number;
      gst: number;
      shipping: number;
      total: number;
      /** Rewards the customer has but which weren't the best offer this time (for display). */
      rewardNote: string | null;
    }
  | { ok: false; code: string; message: string; productId?: string };

const round2 = (n: number) => Math.round(n * 100) / 100;
const todayIst = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * Prices the order. The signed-in customer's loyalty / Gemstone-consultation
 * rewards apply; only one discount is used — whichever saves the most. GST is
 * added on top (prices are listed without GST).
 */
export async function quoteOrder(input: unknown, couponCode?: unknown, contactId?: string | null): Promise<Quote> {
  const [priced, cms, rewards] = await Promise.all([
    priceCart(input),
    getCmsFresh(),
    contactId ? rewardsForContact(contactId).catch(() => null) : Promise.resolve(null),
  ]);
  if (!priced.ok) return priced;
  const { store, coupons } = cms;
  if (!store.ordersOpen) return { ok: false, code: "store_closed", message: store.closedMessage };

  const subtotal = priced.total;
  type Offer = { amount: number; label: string; coupon?: string; reward?: AppliedReward };
  const offers: Offer[] = [];
  let couponError: string | null = null;
  const code = typeof couponCode === "string" ? couponCode.trim().toUpperCase().slice(0, 30) : "";
  if (code) {
    const c = coupons.find((x) => x.active && x.code === code);
    if (!c) couponError = "That discount code isn't valid.";
    else if (c.expires && todayIst() > c.expires) couponError = "That discount code has expired.";
    else if (c.minOrder > 0 && subtotal < c.minOrder) couponError = `This code needs an order of at least ${inr(c.minOrder)}.`;
    else {
      const amount = round2(c.type === "percent" ? (subtotal * c.value) / 100 : c.value);
      // A code worth the whole order would leave nothing to pay online.
      if (amount >= subtotal) couponError = `This code is worth ${inr(amount)}, which is more than this order. Please add more items to use it.`;
      else offers.push({ amount, label: `Code ${c.code}`, coupon: c.code });
    }
  }
  if (rewards?.loyalty && store.loyaltyPercent > 0) {
    const label = `Loyalty ${store.loyaltyPercent}% off`;
    offers.push({ amount: round2((subtotal * store.loyaltyPercent) / 100), label, reward: { kind: "loyalty", contactId: rewards.contactId, label } });
  }
  if (rewards?.benefit && store.benefitAmount > 0 && store.benefitAmount < subtotal) {
    const label = `Gemstone Consultation benefit`;
    offers.push({ amount: round2(store.benefitAmount), label, reward: { kind: "benefit", contactId: rewards.contactId, label } });
  }
  const best = offers.reduce<Offer | null>((a, b) => (!a || b.amount > a.amount ? b : a), null);
  const unused = offers.filter((o) => o !== best);
  const rewardNote = unused.length && best ? `Only one offer applies per order — we used the best one (${best.label}).` : null;

  const discount = best?.amount ?? 0;
  const afterDiscount = round2(subtotal - discount);
  const gstRate = store.gstJewellery;
  const gst = round2((afterDiscount * gstRate) / 100);
  const shipping = store.shippingFee > 0 && !(store.freeShippingAbove > 0 && afterDiscount >= store.freeShippingAbove) ? store.shippingFee : 0;
  const total = round2(afterDiscount + gst + shipping);
  if (total <= 0) return { ok: false, code: "zero_total", message: "This order can't be placed online. Please contact us." };
  return {
    ok: true,
    lines: priced.lines,
    subtotal,
    discount,
    discountLabel: best?.label ?? null,
    coupon: best?.coupon ?? null,
    couponError,
    reward: best?.reward ?? null,
    gstRate,
    gst,
    shipping,
    total,
    rewardNote,
  };
}

// ---------------------------------------------------------------------------
// Razorpay
// ---------------------------------------------------------------------------

export async function createRazorpayOrder(amountRupees: number, receipt: string, notes: Record<string, string>) {
  const auth = Buffer.from(`${env("RAZORPAY_KEY_ID")}:${env("RAZORPAY_KEY_SECRET")}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: Math.round(amountRupees * 100), currency: "INR", receipt: receipt.slice(0, 40), notes }),
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error(`[checkout] razorpay order create failed: ${res.status}`);
    return null;
  }
  const order = (await res.json()) as { id?: string; amount?: number; currency?: string };
  return order.id ? { id: order.id, amount: order.amount ?? Math.round(amountRupees * 100), currency: order.currency ?? "INR" } : null;
}

/**
 * Sends a full or partial refund back to the customer's payment method. Razorpay
 * itself refuses more than what is left on the payment. Returns the refund id.
 */
export async function refundPayment(paymentId: string, amountRupees: number, note: string): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const auth = Buffer.from(`${env("RAZORPAY_KEY_ID")}:${env("RAZORPAY_KEY_SECRET")}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: Math.round(amountRupees * 100), notes: { reason: note.slice(0, 200) } }),
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  }).catch(() => null);
  if (!res) return { ok: false, message: "Couldn't reach Razorpay. No refund was made; please try again." };
  const body = (await res.json().catch(() => null)) as { id?: string; error?: { description?: string } } | null;
  if (!res.ok || !body?.id) return { ok: false, message: body?.error?.description || `Razorpay refused the refund (${res.status}). No refund was made.` };
  return { ok: true, id: body.id };
}

/** Checkout success handler signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", env("RAZORPAY_KEY_SECRET")).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Razorpay webhook signature: HMAC_SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = env("RAZORPAY_WEBHOOK_SECRET");
  if (!secret || !signature) return false;
  return safeEqual(createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}

// ---------------------------------------------------------------------------
// Order token: the priced order travels from "create" to "verify" without a
// database. It is HMAC-signed, so the browser can't alter amounts or items.
// ---------------------------------------------------------------------------

export interface PendingOrder {
  ref: string;
  razorpayOrderId: string;
  createdAt: string;
  /** The signed-in customer's contact, so the order lands on their account. */
  accountContactId?: string;
  customer: CheckoutCustomer;
  lines: PricedLine[];
  subtotal: number;
  /** Discount-code saving (₹) and the code used. */
  discount?: number;
  coupon?: string | null;
  /** What the discount was ("Code DIWALI10", "Loyalty 5% off"…) and the reward used, if any. */
  discountLabel?: string | null;
  reward?: AppliedReward | null;
  /** GST added on top (rate %, amount ₹). */
  gstRate?: number;
  gst?: number;
  shipping: number;
  total: number;
  currency: "INR";
}

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

export function signOrder(order: PendingOrder) {
  const body = Buffer.from(JSON.stringify(order)).toString("base64url");
  const sig = createHmac("sha256", tokenSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readOrder(token: unknown): PendingOrder | null {
  if (typeof token !== "string" || token.length > 20000) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", tokenSecret()).update(body).digest("base64url");
  if (!safeEqual(expected, sig)) return null;
  try {
    const order = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PendingOrder;
    if (Date.now() - Date.parse(order.createdAt) > TOKEN_TTL_MS) return null;
    return order;
  } catch {
    return null;
  }
}

/** Short, readable order reference, e.g. TRV-K3M9Q2. */
export function orderRef() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return `TRV-${s}`;
}
