"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";
import { productCode } from "@/lib/catalog/text";
import type { StoreProduct } from "@/lib/catalog/types";
import { shopifySrcSet } from "@/lib/images";
import { formatInr } from "@/lib/site";
import { WishlistButton } from "./WishlistButton";

/** Product tile: photo, name, prices, discount and wishlist. Opens the product page. */
export function ProductCard({ product: p, location, collection }: { product: StoreProduct; location: string; collection?: string }) {
  const img = p.image ? shopifySrcSet(p.image.src) : null;
  const off = p.compareAtPrice && p.price ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
  const code = productCode(p.subtitle);

  return (
    <article className="group relative">
      <Link
        href={`/product/${p.handle}`}
        className="block"
        onClick={() => track("view_embedded_store", { location: `card_${location}`, collection, product: p.handle })}
      >
        <span className="tile-img relative block aspect-square">
          {img && (
            // Plain <img>: product images come from the store's own image host.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.src}
              srcSet={img.srcSet}
              sizes="(min-width: 1280px) 290px, (min-width: 768px) 30vw, 60vw"
              alt={p.image!.alt}
              width={480}
              height={480}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          )}
          {!p.available ? (
            <span className="absolute top-2.5 left-2.5 bg-charcoal/85 px-2 py-1 text-[0.62rem] tracking-[0.06em] rounded-md text-white uppercase">Sold out</span>
          ) : off >= 5 ? (
            <span className="absolute top-2.5 left-2.5 bg-burgundy px-2 py-1 text-[0.62rem] tracking-[0.06em] rounded-md text-white uppercase">{off}% off</span>
          ) : null}
        </span>

        <span className="mt-3 block">
          <span className="line-clamp-2 font-display text-[0.95rem] leading-snug text-charcoal">{p.title}</span>
          {code ? (
            <span className="mt-0.5 block text-[0.68rem] tracking-[0.14em] text-gold-deep">CODE {code}</span>
          ) : (
            p.subtitle && <span className="mt-0.5 line-clamp-1 block text-[0.8rem] text-ink-muted">{p.subtitle}</span>
          )}
          {p.price !== null && (
            <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-[1rem] font-bold text-charcoal">
              {formatInr(p.price)}
              {p.compareAtPrice && (
                <s className="text-[0.82rem] font-normal text-ink-muted" aria-label={`was ${formatInr(p.compareAtPrice)}`}>
                  {formatInr(p.compareAtPrice)}
                </s>
              )}
            </span>
          )}
        </span>
      </Link>
      <WishlistButton product={p} className="absolute top-1.5 right-1.5" />
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-square" />
      <div className="skeleton mt-3 h-4 w-3/4" />
      <div className="skeleton mt-2 h-3 w-1/3" />
    </div>
  );
}
