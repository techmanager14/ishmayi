"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { cart, cartSubtotal, useCart, type CartLine } from "@/lib/cart";
import { thumbUrl } from "@/lib/images";
import { INDIAN_STATES, emptyCheckout, validateCheckout, type CheckoutErrors, type CheckoutInput, type PricedLine } from "@/lib/order";
import { formatInr, formatInrExact, site } from "@/lib/site";
import { waLink } from "@/lib/cms-types";
import { useCms } from "./CmsProvider";
import { ContactLinksInline } from "./ContactLinksInline";
import { loadRazorpay } from "@/lib/razorpay-browser";

type Phase = "form" | "creating" | "paying" | "verifying" | "done";
/** The server's price for the bag (prices exclude GST; GST is added on top). */
type Priced = {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  discountLabel: string | null;
  rewardNote: string | null;
  gst: number;
  gstRate: number;
  shipping: number;
  total: number;
};

const FIELD_ORDER: (keyof CheckoutInput)[] = ["fullName", "phone", "giftRecipient", "giftPhone", "address1", "city", "state", "pincode", "privacyNoticeAccepted"];

/** The signed-in customer's saved details. */
export interface CheckoutProfile {
  email: string;
  fullName: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  pincode: string;
}

const Icon = ({ d, className = "h-5 w-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-parchment bg-white p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <p className="flex items-center gap-2.5 text-base font-bold text-charcoal" aria-hidden="true">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-burgundy text-xs text-white">{n}</span>
        {title}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function Checkout({ profile }: { profile: CheckoutProfile }) {
  const cms = useCms();
  const lines = useCart();
  const uid = useId();
  const fid = (n: string) => `${uid}-${n}`;
  const [values, setValues] = useState<CheckoutInput>(() => ({
    ...emptyCheckout,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone,
    address1: profile.address1,
    city: profile.city,
    pincode: profile.pincode,
    state: (INDIAN_STATES as readonly string[]).includes(profile.state) ? profile.state : emptyCheckout.state,
  }));
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [phase, setPhase] = useState<Phase>("form");
  const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string; productId?: string } | null>(null);
  const [priced, setPriced] = useState<Priced | null>(null);
  // Discount code: what's typed, and the one the server accepted.
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [payments, setPayments] = useState<boolean | null>(null);
  const [codAvailable, setCodAvailable] = useState<boolean | null>(null);
  const [method, setMethod] = useState<"cod" | "online">("online");
  const [done, setDone] = useState<{ ref: string; paymentId: string | null; total: number; method: "cod" | "online" } | null>(null);
  // One id per COD order attempt, reused on retry so it can't be placed twice.
  const codSubmissionId = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => setMounted(true), []);

  // Re-price the bag from the store whenever it changes.
  const linesKey = lines.map((l) => `${l.productId}:${l.variantId}:${l.qty}`).join("|");
  useEffect(() => {
    if (!lines.length || phase === "done") return;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/checkout/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: lines.map(({ productId, variantId, qty }) => ({ productId, variantId, qty })), coupon }),
      }).catch(() => null);
      const body = (await res?.json().catch(() => null)) as
        | ({ ok: true; coupon: string | null; couponError: string | null; payments: boolean; cod: boolean } & Priced)
        | { ok: false; code: string; message: string; productId?: string; payments: boolean; cod: boolean }
        | null;
      if (cancelled || !body) return;
      setPayments(body.payments);
      setCodAvailable(body.cod);
      // Default to whatever is available (online first when both are).
      setMethod("online");
      if (body.ok) {
        setPriced({
          lines: body.lines,
          subtotal: body.subtotal,
          discount: body.discount,
          discountLabel: body.discountLabel,
          rewardNote: body.rewardNote,
          gst: body.gst,
          gstRate: body.gstRate,
          shipping: body.shipping,
          total: body.total,
        });
        if (coupon) {
          if (body.couponError) {
            setCouponMsg({ ok: false, text: body.couponError });
            setCoupon("");
          } else if (body.coupon) setCouponMsg({ ok: true, text: `Code ${body.coupon} applied — you save ${formatInrExact(body.discount)}.` });
          else if (body.discountLabel) setCouponMsg({ ok: true, text: `Your ${body.discountLabel} saves more, so we applied that instead.` });
        }
        setNotice((n) => (n?.productId ? null : n));
        // Keep the bag's display prices in step with the store.
        const changed = body.lines.some((p) => {
          const l = lines.find((x) => x.productId === p.productId && x.variantId === p.variantId);
          return !l || l.price !== p.unitPrice || l.title !== p.title;
        });
        if (changed) cart.sync(body.lines.map(toCartLine));
      } else {
        setPriced(null);
        setNotice({ tone: "error", text: body.message, productId: body.productId });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, coupon]);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target;
    const value = type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name as keyof CheckoutInput]) setErrors((x) => ({ ...x, [name]: undefined }));
  };

  const focusFirst = (errs: CheckoutErrors) => {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (phase !== "form") return;
    setNotice(null);
    const v = validateCheckout(values);
    if (!v.ok) {
      setErrors(v.errors);
      focusFirst(v.errors);
      return;
    }
    setErrors({});
    setPhase("creating");
    track("begin_checkout", { location: "checkout" });

    if (method === "cod") {
      codSubmissionId.current ??= crypto.randomUUID();
      const honeypot = (formRef.current?.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
      const res = await fetch("/api/checkout/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: values,
          lines: lines.map(({ productId, variantId, qty }) => ({ productId, variantId, qty })),
          coupon,
          submissionId: codSubmissionId.current,
          website: honeypot,
        }),
      }).catch(() => null);
      const body = (await res?.json().catch(() => null)) as
        | { ok: true; ref: string; total: number }
        | { ok: false; code: string; message: string; fieldErrors?: CheckoutErrors; productId?: string }
        | null;
      if (body?.ok) {
        setDone({ ref: body.ref, paymentId: null, total: body.total, method: "cod" });
        setPhase("done");
        cart.clear();
        track("purchase", { location: "checkout_cod" });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setPhase("form");
      if (body && !body.ok && body.fieldErrors) {
        setErrors(body.fieldErrors);
        focusFirst(body.fieldErrors);
        return;
      }
      setNotice({ tone: "error", text: body && !body.ok ? body.message : "We couldn't place your order. Please check your connection and try again.", productId: body && !body.ok ? body.productId : undefined });
      track("purchase_error", { location: "checkout_cod", error_code: body && !body.ok ? body.code : "network" });
      return;
    }

    const [ready, res] = await Promise.all([
      loadRazorpay(),
      fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: values, lines: lines.map(({ productId, variantId, qty }) => ({ productId, variantId, qty })), coupon }),
      }).catch(() => null),
    ]);
    const body = (await res?.json().catch(() => null)) as
      | { ok: true; ref: string; token: string; total: number; razorpay: { keyId: string; orderId: string; amount: number; currency: string } }
      | { ok: false; code: string; message: string; fieldErrors?: CheckoutErrors; productId?: string }
      | null;

    if (!body || !body.ok) {
      setPhase("form");
      if (body && !body.ok && body.fieldErrors) {
        setErrors(body.fieldErrors);
        focusFirst(body.fieldErrors);
        return;
      }
      setNotice({ tone: "error", text: body?.message ?? "We couldn't start the payment. Please check your connection and try again.", productId: body && !body.ok ? body.productId : undefined });
      track("purchase_error", { location: "checkout", error_code: body && !body.ok ? body.code : "network" });
      return;
    }
    if (!ready || !window.Razorpay) {
      setPhase("form");
      setNotice({ tone: "error", text: "The payment window couldn't load. Please disable any blocker for this site and try again." });
      return;
    }

    setPhase("paying");
    const rzp = new window.Razorpay({
      key: body.razorpay.keyId,
      amount: body.razorpay.amount,
      currency: body.razorpay.currency,
      order_id: body.razorpay.orderId,
      name: site.legalName,
      description: `Order ${body.ref}`,
      prefill: { name: values.fullName, email: values.email, contact: values.phone },
      notes: { ref: body.ref },
      theme: { color: "#0b5d4b" },
      modal: {
        ondismiss: () => {
          setPhase((p) => (p === "paying" ? "form" : p));
          setNotice({ tone: "info", text: "Payment was cancelled. Your bag is saved — you can try again whenever you're ready." });
        },
      },
      handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        setPhase("verifying");
        const vr = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: body.token, ...r }),
        }).catch(() => null);
        const vb = (await vr?.json().catch(() => null)) as { ok: boolean; ref?: string; paymentId?: string; total?: number; message?: string } | null;
        if (vb?.ok) {
          setDone({ ref: vb.ref!, paymentId: vb.paymentId!, total: vb.total!, method: "online" });
          setPhase("done");
          cart.clear();
          track("purchase", { location: "checkout" });
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          // Money may have been taken: never ask to pay again blindly.
          setPhase("form");
          setNotice({
            tone: "error",
            text: `We couldn't confirm your payment automatically (payment ID ${r.razorpay_payment_id}). Please don't pay again — contact us and we'll sort it out right away.`,
          });
          track("purchase_error", { location: "checkout", error_code: "verify_failed" });
        }
      },
    });
    rzp.on("payment.failed", () => {
      setNotice({ tone: "error", text: "The payment didn't go through. You haven't been charged — please try again or use another method." });
    });
    rzp.open();
  }

  // ---------- Order confirmed ----------
  if (phase === "done" && done) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-parchment bg-white p-7 text-center shadow-[var(--shadow-soft)] md:p-10" role="status">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold to-burgundy text-white shadow-lg">
          <Icon d="m5 12 5 5 9-10" className="h-10 w-10" />
        </span>
        <h1 className="mt-6 text-[1.8rem] leading-tight font-bold text-charcoal">
          {done.method === "cod" ? "Thank you! Your order is placed." : "Thank you! Your order is confirmed."}
        </h1>
        <p className="mt-2 text-ink-muted">
          {done.method === "cod"
            ? `Please keep ${formatInr(done.total)} ready to pay when your order arrives. We'll confirm your order by phone / WhatsApp.`
            : `We've received your payment of ${formatInrExact(done.total)}. Your invoice is on its way to ${values.email}.`}
        </p>
        <dl className="mx-auto mt-6 grid max-w-sm grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl bg-ivory-deep p-4 text-left text-sm">
          <dt className="text-ink-muted">Order</dt>
          <dd className="font-bold text-charcoal">{done.ref}</dd>
          <dt className="text-ink-muted">Payment</dt>
          <dd className="break-all text-charcoal">{done.method === "cod" ? `Cash on Delivery · ${formatInrExact(done.total)}` : done.paymentId}</dd>
          <dt className="text-ink-muted">Delivery</dt>
          <dd className="text-charcoal">{cms.store.deliveryDays} days</dd>
          {values.isGift && (
            <>
              <dt className="text-ink-muted">Gift for</dt>
              <dd className="text-charcoal">{values.giftRecipient}</dd>
            </>
          )}
        </dl>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/account" className="btn btn-primary btn-caps">
            Track your order
          </Link>
          <Link href="/shop" className="btn btn-outline btn-caps">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Empty bag ----------
  if (mounted && lines.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-dashed border-parchment bg-ivory-deep px-6 py-14 text-center">
        <p className="text-xl font-bold text-charcoal">Your bag is empty</p>
        <p className="mt-2 text-ink-muted">Add a piece you love, then come back here to check out.</p>
        <Link href="/shop" className="btn btn-primary btn-caps mt-6">
          Shop jewellery
        </Link>
      </div>
    );
  }

  const shown: (CartLine | PricedLine)[] = priced?.lines ?? lines;
  const total = priced?.total ?? cartSubtotal(lines);
  const busy = phase !== "form";
  const field = (name: keyof CheckoutInput) => ({
    id: fid(name),
    name,
    disabled: busy,
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby": errors[name] ? fid(`${name}-err`) : undefined,
  });
  const err = (name: keyof CheckoutInput) =>
    errors[name] ? (
      <p id={fid(`${name}-err`)} className="field-error">
        {errors[name]}
      </p>
    ) : null;
  const label = (name: keyof CheckoutInput, text: string, optional = false) => (
    <label htmlFor={fid(name)} className="field-label">
      {text} {optional ? <span className="font-normal text-ink-muted">(optional)</span> : <span className="text-burgundy" aria-hidden="true">*</span>}
    </label>
  );

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
      {/* Summary (first on phones) */}
      <aside className="rounded-2xl border border-parchment bg-white p-5 sm:p-6 lg:sticky lg:top-40 lg:order-2" aria-label="Order summary">
        <p className="text-base font-bold text-charcoal">Order summary</p>
        <ul className="mt-4 space-y-3.5">
          {shown.map((l) => {
            const price = "unitPrice" in l ? l.unitPrice : l.price;
            return (
              <li key={`${l.productId}:${l.variantId}`} className="flex gap-3">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ivory-deep">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {l.image && <img src={thumbUrl(l.image, 160)} alt="" className="h-full w-full object-cover" />}
                  <span className="absolute -top-0 -right-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-charcoal/80 px-1 text-[0.65rem] font-bold text-white">
                    ×{l.qty}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm leading-snug font-semibold text-charcoal">{l.title}</span>
                  {l.variantTitle && <span className="block text-xs text-ink-muted">{l.variantTitle}</span>}
                  {notice?.productId === l.productId && (
                    <button type="button" onClick={() => cart.remove(l.productId, l.variantId)} className="mt-1 text-xs font-bold text-[#b0233a] underline">
                      Remove this item
                    </button>
                  )}
                </span>
                <span className="text-sm font-bold text-charcoal">{formatInr(price * l.qty)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 border-t border-parchment pt-4">
          <label htmlFor={fid("coupon")} className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            Discount code
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id={fid("coupon")}
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setCouponMsg(null);
                  setCoupon(couponInput.trim());
                }
              }}
              placeholder="Enter code"
              disabled={busy}
              className="field-input min-h-10 py-2 uppercase"
            />
            {coupon ? (
              <button
                type="button"
                onClick={() => {
                  setCoupon("");
                  setCouponInput("");
                  setCouponMsg(null);
                }}
                className="btn btn-outline min-h-10 px-3 text-sm"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                disabled={!couponInput.trim() || busy}
                onClick={() => {
                  setCouponMsg(null);
                  setCoupon(couponInput.trim());
                }}
                className="btn btn-outline min-h-10 px-3 text-sm"
              >
                Apply
              </button>
            )}
          </div>
          {couponMsg && (
            <p role={couponMsg.ok ? "status" : "alert"} className={`mt-1.5 text-xs font-semibold ${couponMsg.ok ? "text-[#2e8b57]" : "text-[#b0233a]"}`}>
              {couponMsg.text}
            </p>
          )}
        </div>
        <dl className="mt-4 space-y-1.5 border-t border-parchment pt-4 text-sm">
          <div className="flex justify-between text-ink-muted">
            <dt>Subtotal</dt>
            <dd className="text-charcoal">{formatInrExact(priced?.subtotal ?? total)}</dd>
          </div>
          {!!priced?.discount && (
            <div className="flex justify-between text-ink-muted">
              <dt>{priced.discountLabel ?? "Discount"}</dt>
              <dd className="font-semibold text-[#2e8b57]">−{formatInrExact(priced.discount)}</dd>
            </div>
          )}
          {!!priced?.gst && (
            <div className="flex justify-between text-ink-muted">
              <dt>GST ({priced.gstRate}%)</dt>
              <dd className="text-charcoal">{formatInrExact(priced.gst)}</dd>
            </div>
          )}
          <div className="flex justify-between text-ink-muted">
            <dt>Shipping</dt>
            {priced?.shipping ? <dd className="text-charcoal">{formatInr(priced.shipping)}</dd> : <dd className="font-semibold text-[#2e8b57]">Free</dd>}
          </div>
          {cms.store.shippingFee > 0 && cms.store.freeShippingAbove > 0 && !!priced?.shipping && (
            <p className="text-xs text-ink-muted">Free shipping on orders of {formatInr(cms.store.freeShippingAbove)} or more.</p>
          )}
          <div className="flex justify-between border-t border-dashed border-parchment pt-2 text-base font-bold text-charcoal">
            <dt>Total</dt>
            <dd>{formatInrExact(total)}</dd>
          </div>
        </dl>
        {priced?.rewardNote && <p className="mt-3 text-xs font-semibold text-[#2e8b57]">{priced.rewardNote}</p>}
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Prices exclude GST ({cms.store.gstJewellery}% on jewellery, added above). Any loyalty reward on your account is applied automatically.
        </p>
      </aside>

      <div className="space-y-5 lg:order-1">
        {payments === false && codAvailable === false && (
          <p className="rounded-xl border border-gold/50 bg-ivory-deep px-4 py-3 text-sm text-charcoal">
            Online payments are being set up. You can review your bag now — to order today, please{" "}
            <Link href="/contact" className="link-underline">
              contact us
            </Link>
            .
          </p>
        )}

        <Section n={1} title="Contact details">
          <div className="sm:col-span-2">
            {label("fullName", "Full name")}
            <input {...field("fullName")} className="field-input" autoComplete="name" value={values.fullName} onChange={onChange} />
            {err("fullName")}
          </div>
          <div>
            {label("phone", "Mobile number")}
            <input {...field("phone")} type="tel" inputMode="tel" className="field-input" autoComplete="tel" placeholder="98765 43210" value={values.phone} onChange={onChange} />
            {err("phone")}
          </div>
          <div>
            {label("email", "Email")}
            <input {...field("email")} type="email" readOnly className="field-input cursor-not-allowed bg-ivory-deep" value={values.email} />
            <p className="mt-1 text-xs text-ink-muted">Your account email. Your invoice and order updates go here.</p>
          </div>
        </Section>

        <div className="rounded-2xl border border-gold/40 bg-white p-5 sm:p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input name="isGift" type="checkbox" className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-burgundy" checked={values.isGift} onChange={onChange} disabled={busy} />
            <span>
              <span className="block font-bold text-charcoal">🎁 This order is a gift</span>
              <span className="block text-sm text-ink-muted">We&apos;ll deliver it to the person you choose, without prices in the parcel. Your invoice still comes to you.</span>
            </span>
          </label>
          {values.isGift && (
            <div className="mt-4 grid gap-4 border-t border-parchment pt-4 sm:grid-cols-2">
              <div>
                {label("giftRecipient", "Recipient's name")}
                <input {...field("giftRecipient")} className="field-input" value={values.giftRecipient} onChange={onChange} />
                {err("giftRecipient")}
              </div>
              <div>
                {label("giftPhone", "Recipient's mobile number")}
                <input {...field("giftPhone")} type="tel" inputMode="tel" className="field-input" placeholder="98765 43210" value={values.giftPhone} onChange={onChange} />
                {err("giftPhone")}
              </div>
              <div className="sm:col-span-2">
                {label("giftMessage", "Gift message", true)}
                <textarea {...field("giftMessage")} rows={3} maxLength={300} className="field-input" placeholder="Write a short message to go with the gift" value={values.giftMessage} onChange={onChange} />
                <p className="mt-1 text-xs text-ink-muted">Up to 300 characters.</p>
              </div>
            </div>
          )}
        </div>

        <Section n={2} title={values.isGift ? "Recipient's delivery address" : "Delivery address"}>
          <div className="sm:col-span-2">
            {label("address1", "House / flat, building, street")}
            <input {...field("address1")} className="field-input" autoComplete="address-line1" value={values.address1} onChange={onChange} />
            {err("address1")}
          </div>
          <div className="sm:col-span-2">
            {label("address2", "Area, landmark", true)}
            <input {...field("address2")} className="field-input" autoComplete="address-line2" value={values.address2} onChange={onChange} />
          </div>
          <div>
            {label("city", "City")}
            <input {...field("city")} className="field-input" autoComplete="address-level2" value={values.city} onChange={onChange} />
            {err("city")}
          </div>
          <div>
            {label("pincode", "PIN code")}
            <input {...field("pincode")} inputMode="numeric" maxLength={6} className="field-input" autoComplete="postal-code" value={values.pincode} onChange={onChange} />
            {err("pincode")}
          </div>
          <div className="sm:col-span-2">
            {label("state", "State")}
            <select {...field("state")} className="field-input" autoComplete="address-level1" value={values.state} onChange={onChange}>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {err("state")}
          </div>
          <p className="text-xs text-ink-muted sm:col-span-2">We currently deliver within India. Shipping is free.</p>
        </Section>

        <Section n={3} title="Order note">
          <div className="sm:col-span-2">
            {label("notes", "Anything we should know?", true)}
            <input {...field("notes")} maxLength={300} className="field-input" placeholder="e.g. size preference" value={values.notes} onChange={onChange} />
          </div>
        </Section>

        <fieldset className="rounded-2xl border border-parchment bg-white p-5 sm:p-6">
          <legend className="sr-only">Payment method</legend>
          <p className="flex items-center gap-2.5 text-base font-bold text-charcoal" aria-hidden="true">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-burgundy text-xs text-white">4</span>
            Payment
          </p>
          <div className="mt-4 grid gap-3">
            {[
              {
                id: "online" as const,
                title: "Pay online",
                sub: "UPI · Cards · Netbanking (Razorpay)",
                icon: "M3 6h18v12H3zM3 10h18M7 15h3",
                enabled: payments === true,
                note: payments === true ? null : "Coming soon",
              },
            ].map((o) => {
              const on = method === o.id && o.enabled;
              return (
                <label
                  key={o.id}
                  className={`relative flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                    !o.enabled ? "cursor-not-allowed border-parchment opacity-55" : on ? "cursor-pointer border-burgundy bg-blush" : "cursor-pointer border-parchment hover:border-charcoal/30"
                  } has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-burgundy/40`}
                >
                  <input type="radio" name="paymentMethod" value={o.id} checked={on} disabled={!o.enabled || busy} onChange={() => setMethod(o.id)} className="sr-only" />
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-burgundy" : "border-[#c9c4bd]"}`} aria-hidden="true">
                    {on && <span className="h-2.5 w-2.5 rounded-full bg-burgundy" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-bold text-charcoal">
                      <Icon d={o.icon} className="h-5 w-5 text-burgundy" />
                      {o.title}
                    </span>
                    <span className="mt-0.5 block text-[0.8rem] text-ink-muted">{o.sub}</span>
                  </span>
                  {o.note && <span className="absolute top-3 right-3 rounded-full bg-ivory-deep px-2 py-0.5 text-[0.65rem] font-bold text-ink-muted">{o.note}</span>}
                </label>
              );
            })}
          </div>
          {method === "cod" && codAvailable !== false && (
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              We&apos;ll call or WhatsApp you to confirm before dispatch. Please keep the exact amount ready on delivery.
            </p>
          )}
        </fieldset>

        {/* Honeypot — hidden from people and assistive tech. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={fid("website")}>Website</label>
          <input id={fid("website")} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        <div className="space-y-3 rounded-2xl border border-parchment bg-white p-5 sm:p-6">
          <div>
            <label className="flex items-start gap-3 text-[0.85rem] leading-relaxed text-charcoal">
              <input {...field("privacyNoticeAccepted")} type="checkbox" className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-burgundy" checked={values.privacyNoticeAccepted} onChange={onChange} />
              <span>
                I agree to the{" "}
                <Link href="/policies/terms" target="_blank" className="link-underline">
                  terms
                </Link>
                ,{" "}
                <Link href="/policies/cancellation-refund" target="_blank" className="link-underline">
                  refund policy
                </Link>{" "}
                and{" "}
                <Link href="/policies/privacy" target="_blank" className="link-underline">
                  privacy notice
                </Link>
                . <span className="text-burgundy" aria-hidden="true">*</span>
              </span>
            </label>
            {err("privacyNoticeAccepted")}
          </div>
          <label className="flex items-start gap-3 text-[0.85rem] leading-relaxed text-ink-muted">
            <input name="marketingConsent" type="checkbox" className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-burgundy" checked={values.marketingConsent} onChange={onChange} disabled={busy} />
            <span>Optional: send me occasional updates about new collections and offers.</span>
          </label>
        </div>

        {notice && (
          <div role="alert" className={`rounded-xl border p-4 text-sm ${notice.tone === "error" ? "border-[#a3283b]/30 bg-[#a3283b]/5 text-charcoal" : "border-gold/50 bg-ivory-deep text-charcoal"}`}>
            {notice.text}
            {notice.tone === "error" && (cms.contact.phone || cms.contact.email || cms.contact.whatsapp) && (
              <span className="mt-1 block">
                Need help? <ContactLinksInline location="checkout_error" />
              </span>
            )}
          </div>
        )}

        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 border-t border-parchment bg-white px-4 py-3 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
          {payments === false ? (
            // Online payment isn't switched on yet: take the order on WhatsApp instead.
            <a
              href={waLink(
                cms.contact.whatsapp,
                [
                  "Hello, I'd like to order:",
                  ...lines.map((l) => `• ${l.qty} × ${l.title}${l.variantTitle ? ` (${l.variantTitle})` : ""}`),
                  `Total: ${formatInrExact(priced?.total ?? total)} (incl. GST)`,
                  ...(values.fullName ? [`Name: ${values.fullName}`] : []),
                ].join("\n"),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary h-12 w-full text-base"
            >
              Order on WhatsApp · {formatInrExact(total)}
            </a>
          ) : (
          <button
            type="submit"
            disabled={busy || payments !== true || !!notice?.productId}
            className="btn btn-primary h-12 w-full text-base disabled:opacity-60"
          >
            {phase === "creating" || phase === "verifying" ? (
              <>
                <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                {phase === "creating" ? (method === "cod" ? "Placing your order…" : "Preparing secure payment…") : "Confirming payment…"}
              </>
            ) : phase === "paying" ? (
              "Complete payment in the window…"
            ) : method === "cod" ? (
              <>Place order · {formatInr(total)} (pay on delivery)</>
            ) : (
              <>
                <Icon d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z" className="h-4 w-4" />
                Pay {formatInrExact(total)} securely
              </>
            )}
          </button>
          )}
          <p className="mt-2 text-center text-[0.72rem] text-ink-muted">
            {payments === false ? "Online payment is being set up — we'll confirm your order and share a secure payment link on WhatsApp." : "UPI · Cards · Netbanking · Wallets — secured by Razorpay"}
          </p>
        </div>
      </div>
    </form>
  );
}

const toCartLine = (p: PricedLine): CartLine => ({
  productId: p.productId,
  variantId: p.variantId,
  title: p.title,
  variantTitle: p.variantTitle,
  image: p.image,
  price: p.unitPrice,
  qty: p.qty,
});
