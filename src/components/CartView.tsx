"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { cartCount, cartSubtotal, useCart } from "@/lib/cart";
import { shippingLabel } from "@/lib/cms-types";
import { formatInr } from "@/lib/site";
import { CartLineRow } from "./CartDrawer";
import { useCms } from "./CmsProvider";

export function CartView() {
  const { store } = useCms();
  const lines = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-parchment bg-ivory-deep/60 px-6 py-12 text-center" role="status">
        <ShoppingBag className="mx-auto h-9 w-9 text-gold-deep" strokeWidth={1} aria-hidden="true" />
        <p className="mt-3 font-display text-[1.35rem] text-charcoal">Your cart is empty</p>
        <p className="mt-1 text-[0.92rem] text-ink-muted">Pieces you add will wait for you here.</p>
        <Link href="/shop" className="btn btn-primary mt-6">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-14">
      <ul className="divide-y divide-parchment border-y border-parchment">
        {lines.map((l) => (
          <CartLineRow key={`${l.productId}:${l.variantId}`} line={l} />
        ))}
      </ul>
      <aside className="rounded-2xl bg-ivory-deep p-5 md:p-7 lg:sticky lg:top-24 lg:self-start">
        <h2 className="font-display text-[1.25rem] font-bold text-charcoal">Order summary</h2>
        <dl className="mt-4 space-y-2 text-[0.95rem]">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Items ({cartCount(lines)})</dt>
            <dd className="text-charcoal">{formatInr(cartSubtotal(lines))}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Shipping</dt>
            <dd className="text-charcoal">{shippingLabel(store)}</dd>
          </div>
        </dl>
        <p className="mt-3 border-t border-parchment pt-3 text-xs leading-relaxed text-ink-muted">
          {store.gstJewellery}% GST, promo codes and any shipping charge are worked out at checkout, before you pay.
        </p>
        <Link href="/checkout" className="btn btn-primary mt-5 w-full">
          Checkout securely
        </Link>
        <Link href="/shop" className="mt-2 block py-2 text-center text-sm text-ink-muted hover:text-charcoal">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
