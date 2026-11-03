"use client";

import { Minus, PackageCheck, Plus, ShieldCheck, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { cart } from "@/lib/cart";
import { productCode } from "@/lib/catalog/text";
import type { ProductDetail, StoreProduct } from "@/lib/catalog/types";
import { shippingLabel } from "@/lib/cms-types";
import { thumbUrl } from "@/lib/images";
import { formatInr } from "@/lib/site";
import { useCms } from "./CmsProvider";
import { WishlistButton } from "./WishlistButton";

const MAX_QTY = 10;

/** Product page body: swipeable gallery, options, add to bag and details. */
export function ProductView({ product: p }: { product: ProductDetail }) {
  const { store } = useCms();
  const router = useRouter();
  const gallery = useRef<HTMLDivElement>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [variantId, setVariantId] = useState((p.variants.find((v) => v.available) ?? p.variants[0]).id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = p.variants.find((v) => v.id === variantId) ?? p.variants[0];
  const off = variant.compareAtPrice ? Math.round((1 - variant.price / variant.compareAtPrice) * 100) : 0;
  const canBuy = variant.available && store.ordersOpen;
  const code = productCode(p.subtitle);

  // What the wishlist keeps: the cheapest option, as on the listing pages.
  const cheapest = p.variants.reduce((a, b) => (b.price < a.price ? b : a));
  const summary: StoreProduct = {
    handle: p.handle,
    title: p.title,
    subtitle: p.subtitle,
    image: p.images[0] ?? null,
    price: cheapest.price,
    compareAtPrice: cheapest.compareAtPrice,
    available: p.variants.some((v) => v.available),
  };

  const goTo = (i: number) => {
    setImageIndex(i);
    const el = gallery.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const addToBag = () => {
    cart.add({ productId: p.handle, variantId: variant.id, title: p.title, variantTitle: p.showVariantPicker ? variant.title : null, image: p.images[0]?.src ?? null, price: variant.price }, qty);
    track("add_to_cart", { location: "product_page", product: p.handle });
  };

  return (
    <section className="container-page grid gap-6 pt-4 pb-12 md:grid-cols-[1.15fr_1fr] md:gap-12 md:pt-6 md:pb-20 lg:gap-16">
      {/* Gallery */}
      <div className="min-w-0 md:sticky md:top-24 md:self-start">
        <div
          ref={gallery}
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== imageIndex) setImageIndex(i);
          }}
          className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto rounded-2xl bg-ivory-deep"
        >
          {p.images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.src} src={thumbUrl(img.src, 1080)} alt={i === 0 ? img.alt : `${img.alt}, view ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} draggable={false} className="h-full w-full shrink-0 snap-center object-contain" />
          ))}
        </div>
        {p.images.length > 1 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {p.images.map((img, i) => (
              <button key={img.src} type="button" onClick={() => goTo(i)} aria-label={`Show image ${i + 1}`} aria-current={i === imageIndex} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition-colors ${i === imageIndex ? "border-burgundy" : "border-transparent opacity-70 hover:opacity-100"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbUrl(img.src, 160)} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="min-w-0">
        <h1 className="font-display text-[1.45rem] leading-snug text-charcoal md:text-[1.9rem]">{p.title}</h1>
        {code ? <p className="mt-2 text-[0.72rem] tracking-[0.16em] text-gold-deep">CODE {code}</p> : p.subtitle && <p className="mt-2 text-[0.95rem] text-ink-muted">{p.subtitle}</p>}

        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-bold text-charcoal">{formatInr(variant.price)}</span>
          {variant.compareAtPrice && <s className="text-base text-ink-muted">{formatInr(variant.compareAtPrice)}</s>}
          {off >= 5 && <span className="bg-burgundy px-2 py-0.5 text-[0.65rem] tracking-[0.14em] text-white uppercase">{off}% off</span>}
        </div>
        <p className="mt-1 text-[0.8rem] text-ink-muted">
          + {store.gstJewellery}% GST at checkout · {shippingLabel(store)}
        </p>

        {p.showVariantPicker && (
          <fieldset className="mt-6">
            <legend className="text-[0.72rem] font-medium tracking-[0.18em] text-charcoal uppercase">{p.optionName}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setVariantId(v.id);
                    setAdded(false);
                  }}
                  aria-pressed={v.id === variantId}
                  disabled={!v.available}
                  className={`rounded-lg border px-3.5 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${v.id === variantId ? "border-burgundy bg-burgundy text-white" : "border-parchment text-charcoal hover:border-charcoal/50"}`}
                >
                  {v.title}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center rounded-lg border border-parchment">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="flex h-11 w-11 items-center justify-center text-charcoal disabled:opacity-30">
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-8 text-center" aria-live="polite">{qty}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} className="flex h-11 w-11 items-center justify-center text-charcoal disabled:opacity-30">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <span className={`text-sm ${variant.available ? "text-[#2e6b4a]" : "text-[#b0233a]"}`}>{variant.available ? "In stock" : "Sold out"}</span>
        </div>

        {!store.ordersOpen && <p className="mt-4 border border-gold/50 bg-ivory-deep p-3 text-sm text-charcoal">{store.closedMessage}</p>}

        <div className="mt-6 grid gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={!canBuy}
              onClick={() => {
                if (added) {
                  cart.open();
                  return;
                }
                addToBag();
                setAdded(true);
              }}
              className="btn btn-outline disabled:opacity-50"
            >
              {added ? "View bag" : "Add to bag"}
            </button>
            <button
              type="button"
              disabled={!canBuy}
              onClick={() => {
                if (!added) addToBag();
                router.push("/checkout");
              }}
              className="btn btn-primary disabled:opacity-60"
            >
              Buy now
            </button>
          </div>
          <WishlistButton product={summary} withLabel className="!border-parchment !bg-transparent !text-charcoal hover:!border-burgundy" />
        </div>

        <ul className="mt-6 grid gap-2.5 border-y border-parchment py-5 text-[0.88rem] text-charcoal">
          <li className="flex items-center gap-3">
            <Truck className="h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.3} aria-hidden="true" />
            {shippingLabel(store)}, delivered in {store.deliveryDays} days
          </li>
          <li className="flex items-center gap-3">
            <PackageCheck className="h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.3} aria-hidden="true" />
            Secure payment by UPI, card or netbanking
          </li>
          <li className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.3} aria-hidden="true" />
            Refund on damaged parcels, with an unboxing video
          </li>
        </ul>

        {p.description.length > 0 && (
          <div className="mt-6">
            <h2 className="font-display text-[1.2rem] font-bold text-charcoal">About this piece</h2>
            <div className="mt-2 space-y-3 text-[0.95rem] leading-relaxed text-ink-muted">
              {p.description.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
