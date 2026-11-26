"use client";

import { Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Expand, Gem, MessageCircle, Minus, PackageCheck, Plus, Share2, ShieldCheck, ShoppingBag, Sparkles, Truck, X, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { cart } from "@/lib/cart";
import { flyToBag } from "@/lib/fly-to-bag";
import { productCode } from "@/lib/catalog/text";
import type { PairItem } from "@/lib/catalog/pairs";
import type { ProductDetail, StoreProduct } from "@/lib/catalog/types";
import { shippingLabel, waLink } from "@/lib/cms-types";
import { thumbUrl } from "@/lib/images";
import type { ProductPromise } from "@/lib/promises";
import { formatInr } from "@/lib/site";
import { useCms } from "./CmsProvider";
import { PROMISE_ICONS } from "./promiseIcons";
import { WishlistButton } from "./WishlistButton";

const MAX_QTY = 10;

/** A public promo code shown on the product page. */
export interface ProductOffer {
  code: string;
  value: string;
  conditions: string;
}

// Material and stone labels, read from the product name and details.
const MATERIALS: [RegExp, string][] = [
  [/\b925\b|sterling/i, "925 Sterling Silver"],
  [/natural pearl|freshwater pearl|real pearl|original pearl/i, "Natural Pearl"],
  [/\b316l\b|stainless steel/i, "316L Steel"],
  [/18k gold/i, "18K Gold Plated"],
  [/\bbrass\b/i, "Brass"],
];
const STONES = ["Amethyst", "Rose Quartz", "Clear Quartz", "Moonstone", "Labradorite", "Tiger Eye", "Lapis Lazuli", "Black Tourmaline", "Turquoise", "Aquamarine", "Citrine", "Pyrite", "Carnelian", "Garnet", "Jade", "Amazonite", "Aventurine", "Ruby", "Malachite", "Opal", "Larimar", "Peridot", "Fluorite"];

function badgesFor(text: string) {
  const out = MATERIALS.filter(([rx]) => rx.test(text)).map(([, label]) => label);
  for (const s of STONES) if (new RegExp(`\\b${s}\\b`, "i").test(text) && out.length < 5) out.push(s);
  return out;
}

function Fold({ title, icon, children, open = false }: { title: string; icon: ReactNode; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-parchment">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-4 font-bold text-charcoal [&::-webkit-details-marker]:hidden">
        <span className="text-gold-deep">{icon}</span>
        <span className="flex-1">{title}</span>
        <ChevronDown className="h-5 w-5 text-ink-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pb-4 text-[0.93rem] leading-relaxed text-ink-muted">{children}</div>
    </details>
  );
}

function OfferCode({ offer }: { offer: ProductOffer }) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-gold bg-white px-3 py-2.5">
      <span className="min-w-0">
        <span className="block font-bold text-charcoal">{offer.value}</span>
        <span className="block truncate text-xs text-ink-muted">{offer.conditions}</span>
      </span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(offer.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard blocked: the code stays visible */
          }
        }}
        aria-label={`Copy code ${offer.code}`}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-ivory-deep px-3 py-2 text-sm font-bold tracking-wider text-burgundy hover:bg-blush"
      >
        {offer.code}
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      </button>
    </li>
  );
}

/** Product page body: gallery with full-screen view, options, buy buttons, offers and details. */
export function ProductView({
  product: p,
  offers = [],
  matches = [],
  promises = [],
  code: savedCode,
}: {
  product: ProductDetail;
  offers?: ProductOffer[];
  matches?: PairItem[];
  promises?: ProductPromise[];
  /** Product code set in the admin. */
  code?: string;
}) {
  const { store, contact } = useCms();
  const router = useRouter();
  const gallery = useRef<HTMLDivElement>(null);
  const buyButtons = useRef<HTMLDivElement>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [variantId, setVariantId] = useState((p.variants.find((v) => v.available) ?? p.variants[0]).id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const [shared, setShared] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [addedMatches, setAddedMatches] = useState<string[]>([]);

  const variant = p.variants.find((v) => v.id === variantId) ?? p.variants[0];
  const off = variant.compareAtPrice ? Math.round((1 - variant.price / variant.compareAtPrice) * 100) : 0;
  const canBuy = variant.available && store.ordersOpen;
  const code = savedCode || productCode(p.subtitle);
  const badges = badgesFor(`${p.title} ${p.subtitle ?? ""}`);
  const whatsapp = waLink(contact.whatsapp, `Hello Ishmayi, I'd like to know more about "${p.title}".`);

  // What the wishlist keeps: the cheapest option, as on the listing pages.
  const cheapest = p.variants.reduce((a, b) => (b.price < a.price ? b : a));
  const summary: StoreProduct = { handle: p.handle, title: p.title, subtitle: p.subtitle, image: p.images[0] ?? null, price: cheapest.price, compareAtPrice: cheapest.compareAtPrice, available: p.variants.some((v) => v.available) };

  // Phone buy bar: appears once the main buttons have scrolled away.
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const el = buyButtons.current;
      if (el) setShowBar(el.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    check();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Full-screen view: arrow keys and Escape.
  useEffect(() => {
    if (zoom === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
      if (e.key === "ArrowRight") setZoom((z) => (z === null ? z : (z + 1) % p.images.length));
      if (e.key === "ArrowLeft") setZoom((z) => (z === null ? z : (z - 1 + p.images.length) % p.images.length));
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [zoom, p.images.length]);

  const goTo = (i: number) => {
    setImageIndex(i);
    const el = gallery.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const addToBag = () => {
    cart.add({ productId: p.handle, variantId: variant.id, title: p.title, variantTitle: p.showVariantPicker ? variant.title : null, image: p.images[0]?.src ?? null, price: variant.price }, qty);
    track("add_to_cart", { location: "product_page", product: p.handle });
  };
  const onAdd = (e: MouseEvent<HTMLElement>) => {
    if (added) return cart.open();
    addToBag();
    setAdded(true);
    // Fly the photo to the bag: from the photo on screen, or from the button if the photo has scrolled away.
    const photo = gallery.current?.querySelectorAll("img")[imageIndex];
    const r = photo?.getBoundingClientRect();
    const photoVisible = r && r.bottom > 80 && r.top < window.innerHeight - 80;
    flyToBag(p.images[imageIndex] ? thumbUrl(p.images[imageIndex].src, 240) : null, photoVisible ? photo! : e.currentTarget);
  };
  /** Perfect match: this piece (if not in the bag yet) plus its match, then show the bag. */
  const addBoth = (m: PairItem) => {
    if (!added) {
      addToBag();
      setAdded(true);
    }
    cart.add({ productId: m.handle, variantId: m.variantId, title: m.title, variantTitle: null, image: m.image, price: m.price }, 1);
    track("add_to_cart", { location: "perfect_match", product: m.handle });
    setAddedMatches((cur) => [...cur, m.handle]);
    cart.open();
  };
  const onBuy = () => {
    if (!added) addToBag();
    router.push("/checkout");
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      /* share sheet closed */
    }
  };

  const iconBtn = "flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-parchment bg-white text-sm font-bold text-charcoal transition-colors hover:border-burgundy hover:text-burgundy";

  return (
    <>
      <section className="container-page grid gap-5 pb-12 md:grid-cols-[1.1fr_1fr] md:gap-10 md:pt-6 md:pb-16 lg:gap-14">
        {/* Gallery: edge to edge on phones, framed on larger screens */}
        <div className="-mx-4 min-w-0 md:sticky md:top-24 md:mx-0 md:self-start">
          <div className="relative">
            <div
              ref={gallery}
              onScroll={(e) => {
                const el = e.currentTarget;
                const i = Math.round(el.scrollLeft / el.clientWidth);
                if (i !== imageIndex) setImageIndex(i);
              }}
              className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto bg-ivory-deep md:rounded-2xl"
            >
              {p.images.map((img, i) => (
                <button key={img.src} type="button" onClick={() => setZoom(i)} aria-label={`View image ${i + 1} full screen`} className="h-full w-full shrink-0 snap-center cursor-zoom-in">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl(img.src, 1080)} alt={i === 0 ? img.alt : `${img.alt}, view ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} draggable={false} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
            {off >= 5 && <span className="absolute top-3 left-3 rounded-full bg-burgundy px-3 py-1 text-xs font-bold text-white">{off}% OFF</span>}
            <button type="button" onClick={() => setZoom(imageIndex)} aria-label="View full screen" className="absolute right-3 bottom-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-sm hover:text-burgundy">
              <Expand className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
            {p.images.length > 1 && (
              <span className="absolute bottom-3 left-3 hidden rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white md:block">
                {imageIndex + 1} / {p.images.length}
              </span>
            )}
          </div>
          {/* Phones: dots under the photo; swipe to change it. */}
          {p.images.length > 1 && p.images.length <= 10 && (
            <div className="mt-2.5 flex justify-center gap-1.5 md:hidden" aria-hidden="true">
              {p.images.map((img, i) => (
                <span key={img.src} className={`h-1.5 rounded-full transition-all ${i === imageIndex ? "w-5 bg-burgundy" : "w-1.5 bg-charcoal/25"}`} />
              ))}
            </div>
          )}
          {/* Too many photos for dots on a phone: a counter instead. */}
          {p.images.length > 10 && (
            <p className="mt-2 text-center text-xs font-bold text-ink-muted md:hidden" aria-hidden="true">
              {imageIndex + 1} / {p.images.length}
            </p>
          )}
          {p.images.length > 1 && (
            <div className="no-scrollbar mt-3 hidden gap-2 overflow-x-auto md:flex">
              {p.images.map((img, i) => (
                <button key={img.src} type="button" onClick={() => goTo(i)} aria-label={`Show image ${i + 1}`} aria-current={i === imageIndex} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${i === imageIndex ? "border-burgundy" : "border-transparent opacity-70 hover:opacity-100"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl(img.src, 160)} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0">
          {badges.length > 0 && (
            <ul className="mb-3 flex flex-wrap gap-1.5" aria-label="Materials">
              {badges.map((b) => (
                <li key={b} className="flex items-center gap-1 rounded-full bg-blush px-2.5 py-1 text-xs font-bold text-burgundy">
                  <Gem className="h-3 w-3" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          )}
          <h1 className="font-display text-[1.45rem] leading-snug text-charcoal md:text-[1.9rem]">{p.title}</h1>
          {code ? <p className="mt-1.5 text-[0.72rem] tracking-[0.16em] text-gold-deep">CODE {code}</p> : p.subtitle && <p className="mt-1.5 text-[0.95rem] text-ink-muted">{p.subtitle}</p>}

          <div className="mt-4 rounded-2xl bg-ivory-deep p-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[1.75rem] leading-none font-bold text-charcoal">{formatInr(variant.price)}</span>
              {variant.compareAtPrice && <s className="text-base text-ink-muted">{formatInr(variant.compareAtPrice)}</s>}
              {off >= 5 && <span className="rounded-full bg-burgundy px-2.5 py-0.5 text-xs font-bold text-white">Save {formatInr(variant.compareAtPrice! - variant.price)}</span>}
            </div>
            <p className="mt-1.5 text-[0.8rem] text-ink-muted">
              + {store.gstJewellery}% GST at checkout · {shippingLabel(store)}
            </p>
          </div>

          {p.showVariantPicker && (
            <fieldset className="mt-5">
              <legend className="text-sm font-bold text-charcoal">{p.optionName}</legend>
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
                    className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${v.id === variantId ? "border-burgundy bg-burgundy text-white" : "border-parchment text-charcoal hover:border-charcoal/50"}`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-5 flex items-center gap-4">
            <div className="flex items-center rounded-xl border-2 border-parchment">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="flex h-11 w-11 items-center justify-center text-charcoal disabled:opacity-30">
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="w-8 text-center font-bold" aria-live="polite">{qty}</span>
              <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} className="flex h-11 w-11 items-center justify-center text-charcoal disabled:opacity-30">
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <span className={`flex items-center gap-1.5 text-sm font-bold ${variant.available ? "text-[#2e6b4a]" : "text-[#b0233a]"}`}>
              <span className={`h-2 w-2 rounded-full ${variant.available ? "bg-[#2e6b4a]" : "bg-[#b0233a]"}`} aria-hidden="true" />
              {variant.available ? "In stock" : "Sold out"}
            </span>
          </div>

          {!store.ordersOpen && <p className="mt-4 rounded-xl border border-gold/50 bg-ivory-deep p-3 text-sm text-charcoal">{store.closedMessage}</p>}

          {/* Buy buttons */}
          <div ref={buyButtons} className="mt-5 grid gap-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <button type="button" disabled={!canBuy} onClick={onAdd} className="flex h-13 items-center justify-center gap-2 rounded-xl border-2 border-burgundy py-3.5 text-[0.95rem] font-bold text-burgundy transition-colors hover:bg-burgundy hover:text-white disabled:opacity-50">
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                {added ? "View bag" : "Add to bag"}
              </button>
              <button type="button" disabled={!canBuy} onClick={onBuy} className="flex h-13 items-center justify-center gap-2 rounded-xl bg-burgundy py-3.5 text-[0.95rem] font-bold text-white transition-colors hover:bg-burgundy-deep disabled:opacity-60">
                <Zap className="h-5 w-5" aria-hidden="true" />
                Buy now
              </button>
            </div>
            <div className="flex gap-2.5">
              <WishlistButton product={summary} withLabel className={`${iconBtn} !min-h-0 !px-2 !tracking-normal !normal-case`} />
              <button type="button" onClick={share} className={iconBtn}>
                {shared ? <Check className="h-[18px] w-[18px]" aria-hidden="true" /> : <Share2 className="h-[18px] w-[18px]" aria-hidden="true" />}
                {shared ? "Link copied" : "Share"}
              </button>
            </div>
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp_click", { location: "product_page", product: p.handle })} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1f8a4c] text-sm font-bold text-white transition-colors hover:bg-[#18733f]">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Ask about this piece on WhatsApp
              </a>
            )}
          </div>

          {/* Perfect match: this piece + its match */}
          {matches.length > 0 && (
            <div className="mt-5 rounded-2xl border-2 border-gold-light bg-gradient-to-br from-blush to-white p-3.5 md:p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-burgundy">
                <Sparkles className="h-4 w-4" aria-hidden="true" /> Perfect match
              </p>
              <ul className="mt-3 space-y-3">
                {matches.map((m) => {
                  const done = addedMatches.includes(m.handle);
                  return (
                    <li key={m.handle} className="flex items-center gap-3">
                      <span className="flex shrink-0 items-center gap-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.images[0] ? <img src={thumbUrl(p.images[0].src, 160)} alt="" className="h-14 w-14 rounded-xl object-cover" /> : <span className="h-14 w-14 rounded-xl bg-ivory-deep" />}
                        <Plus className="h-4 w-4 text-gold-deep" aria-hidden="true" />
                        <Link href={`/product/${m.handle}`} className="block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {m.image ? <img src={thumbUrl(m.image, 160)} alt={m.title} className="h-14 w-14 rounded-xl object-cover" /> : <span className="block h-14 w-14 rounded-xl bg-ivory-deep" />}
                        </Link>
                      </span>
                      <span className="min-w-0 flex-1">
                        <Link href={`/product/${m.handle}`} className="line-clamp-2 text-[0.82rem] leading-snug font-semibold text-charcoal hover:text-burgundy">
                          {m.title}
                        </Link>
                        <span className="mt-0.5 block text-xs text-ink-muted">
                          Together <b className="text-charcoal">{formatInr(variant.price + m.price)}</b>
                        </span>
                      </span>
                      {m.needsChoice ? (
                        <Link href={`/product/${m.handle}`} className="shrink-0 rounded-xl border-2 border-burgundy px-3 py-2 text-xs font-bold text-burgundy">
                          Choose
                        </Link>
                      ) : (
                        <button type="button" disabled={!canBuy || done} onClick={() => addBoth(m)} className="flex shrink-0 items-center gap-1 rounded-xl bg-burgundy px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                          {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                          {done ? "Added" : "Add both"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Promises (chosen per product in the admin) */}
          {promises.length > 0 && (
            <ul className="mt-5 grid grid-cols-3 gap-2 text-center text-[0.72rem] leading-tight font-semibold text-charcoal">
              {promises.map(({ kind, label }) => {
                const Icon = PROMISE_ICONS[kind];
                return (
                  <li key={label} className="flex flex-col items-center gap-1.5 rounded-xl bg-blush px-2 py-3">
                    <Icon className="h-5 w-5 text-burgundy" strokeWidth={1.6} aria-hidden="true" />
                    {label}
                  </li>
                );
              })}
            </ul>
          )}

          {offers.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-bold text-charcoal">Available offers</p>
              <ul className="mt-2 space-y-2">
                {offers.map((o) => (
                  <OfferCode key={o.code} offer={o} />
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 border-t border-parchment">
            {p.description.length > 0 && (
              <Fold title="About this piece" icon={<Gem className="h-5 w-5" aria-hidden="true" />} open>
                <div className="space-y-3">
                  {/* Lines without any words (stray bullets) are skipped. */}
                  {p.description.filter((para) => /\p{L}/u.test(para)).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </Fold>
            )}
            <Fold title="Delivery & returns" icon={<Truck className="h-5 w-5" aria-hidden="true" />}>
              <p>
                {shippingLabel(store)}. Delivered in {store.deliveryDays} days from order confirmation, with tracking once dispatched.
              </p>
              <p className="mt-2">
                If a piece arrives damaged, record an unboxing video and{" "}
                <Link href="/report-damage" className="font-bold text-burgundy underline">report it within 24 hours</Link>.
              </p>
            </Fold>
            <Fold title="Care" icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}>
              <p>
                Keep it dry, away from perfume, and stored on its own. <Link href="/jewellery-care" className="font-bold text-burgundy underline">Full care guide</Link>
              </p>
            </Fold>
          </div>
        </div>
      </section>

      {/* Phone buy bar */}
      <div
        className={`fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 border-t border-parchment bg-white/95 px-3 py-2.5 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.25)] backdrop-blur transition-transform lg:hidden ${showBar ? "translate-y-0" : "pointer-events-none translate-y-[200%]"}`}
        aria-hidden={!showBar}
        inert={!showBar}
      >
        <div className="flex items-center gap-2.5">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs text-ink-muted">{p.title}</span>
            <span className="block font-bold text-charcoal">{formatInr(variant.price)}</span>
          </span>
          <button type="button" disabled={!canBuy} onClick={onAdd} aria-label={added ? "View bag" : "Add to bag"} className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-burgundy text-burgundy disabled:opacity-50">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" disabled={!canBuy} onClick={onBuy} className="flex h-11 items-center gap-1.5 rounded-xl bg-burgundy px-5 text-sm font-bold text-white disabled:opacity-60">
            Buy now
          </button>
        </div>
      </div>

      {/* Full-screen photos */}
      {zoom !== null && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Product photos">
          <div className="flex items-center justify-between p-3 text-white">
            <span className="text-sm font-bold">
              {zoom + 1} / {p.images.length}
            </span>
            <button type="button" onClick={() => setZoom(null)} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10">
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbUrl(p.images[zoom].src, 1600)} alt={p.images[zoom].alt} className="max-h-full max-w-full object-contain" />
            {p.images.length > 1 && (
              <>
                <button type="button" onClick={() => setZoom((zoom - 1 + p.images.length) % p.images.length)} aria-label="Previous photo" className="absolute left-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setZoom((zoom + 1) % p.images.length)} aria-label="Next photo" className="absolute right-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
