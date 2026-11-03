"use client";

import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { shippingLabel } from "@/lib/cms-types";
import { cart, cartCount, cartSubtotal, MAX_QTY, useCart, type CartLine } from "@/lib/cart";
import { thumbUrl } from "@/lib/images";
import { formatInr } from "@/lib/site";
import { useCms } from "./CmsProvider";

/** Bag icon with item count; opens the drawer. */
export function CartButton({ className = "", labelClassName = "" }: { className?: string; labelClassName?: string }) {
  const lines = useCart();
  const count = cartCount(lines);
  return (
    <button type="button" onClick={() => cart.open()} className={className} aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}>
      <span className="relative">
        <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.4} aria-hidden="true" />
        {count > 0 && <span className="absolute -top-1.5 -right-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-burgundy px-1 text-[0.62rem] text-white">{count}</span>}
      </span>
      <span className={labelClassName}>Bag</span>
    </button>
  );
}

/** One bag line with quantity controls (bag drawer and cart page). */
export function CartLineRow({ line: l, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  return (
    <li className="flex gap-4 py-4">
      <Link href={`/product/${l.productId}`} onClick={onNavigate} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ivory-deep">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {l.image && <img src={thumbUrl(l.image, 240)} alt="" className="h-full w-full object-cover" />}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/product/${l.productId}`} onClick={onNavigate} className="line-clamp-2 font-display text-[0.95rem] leading-snug text-charcoal hover:text-gold-deep">
          {l.title}
        </Link>
        {l.variantTitle && <p className="text-xs text-ink-muted">{l.variantTitle}</p>}
        <p className="mt-1 text-[0.95rem] font-bold text-charcoal">{formatInr(l.price)}</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center rounded-lg border border-parchment">
            <button type="button" aria-label={`Decrease quantity of ${l.title}`} onClick={() => cart.setQty(l.productId, l.variantId, l.qty - 1)} className="flex h-9 w-9 items-center justify-center text-charcoal">
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="w-7 text-center text-sm" aria-live="polite">{l.qty}</span>
            <button type="button" aria-label={`Increase quantity of ${l.title}`} disabled={l.qty >= MAX_QTY} onClick={() => cart.setQty(l.productId, l.variantId, l.qty + 1)} className="flex h-9 w-9 items-center justify-center text-charcoal disabled:opacity-30">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <button type="button" onClick={() => cart.remove(l.productId, l.variantId)} aria-label={`Remove ${l.title}`} className="text-xs text-ink-muted underline-offset-2 hover:text-burgundy hover:underline">
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

/** Slide-in bag. Mounted once in the layout; opened with cart.open(). */
export function CartDrawer() {
  const { store } = useCms();
  const lines = useCart();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  const close = useCallback(() => {
    setOpen(false);
    lastFocus.current?.focus();
  }, []);

  useEffect(() => {
    const onOpen = () => {
      lastFocus.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    window.addEventListener(cart.OPEN_EVENT, onOpen);
    return () => window.removeEventListener(cart.OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  if (!open) return null;
  const count = cartCount(lines);

  return (
    <div className="fixed inset-0 z-[75] flex justify-end" role="presentation">
      <button type="button" aria-label="Close bag" tabIndex={-1} className="absolute inset-0 bg-burgundy-deep/50" onClick={close} />
      <div ref={panel} role="dialog" aria-modal="true" aria-label="Your bag" tabIndex={-1} className="relative flex h-full w-full max-w-md flex-col bg-ivory shadow-2xl outline-none">
        <div className="flex items-center justify-between border-b border-parchment px-5 py-4">
          <p className="font-display text-xl text-charcoal">
            Your bag {count > 0 && <span className="text-base text-ink-muted">({count})</span>}
          </p>
          <button type="button" onClick={close} aria-label="Close bag" className="-mr-2 flex h-10 w-10 items-center justify-center hover:text-gold-deep">
            <X className="h-5 w-5" strokeWidth={1.4} aria-hidden="true" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <ShoppingBag className="h-10 w-10 text-gold-deep" strokeWidth={1} aria-hidden="true" />
            <p className="mt-4 font-display text-xl text-charcoal">Your bag is empty</p>
            <p className="mt-1 text-sm text-ink-muted">Pieces you add will wait for you here.</p>
            <Link href="/shop" onClick={close} className="btn btn-primary mt-6">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-parchment overflow-y-auto overscroll-contain px-5">
              {lines.map((l) => (
                <CartLineRow key={`${l.productId}:${l.variantId}`} line={l} onNavigate={close} />
              ))}
            </ul>
            <div className="border-t border-parchment px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between text-[0.95rem] text-charcoal">
                <span>Subtotal</span>
                <span>{formatInr(cartSubtotal(lines))}</span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                + {store.gstJewellery}% GST at checkout · {shippingLabel(store)}
              </p>
              <Link href="/checkout" onClick={close} className="btn btn-primary mt-4 w-full">
                Checkout securely
              </Link>
              <Link href="/cart" onClick={close} className="mt-2 block py-2 text-center text-sm text-ink-muted hover:text-charcoal">
                View full cart
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
