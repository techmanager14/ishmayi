import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Art, ArtOrPhoto } from "@/components/Art";
import { Carousel } from "@/components/Carousel";
import { LimitedOfferCard, PromoCodeCard } from "@/components/OfferCards";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs, EmptyState, SectionHeading } from "@/components/Sections";
import { TrackView } from "@/components/Tracking";
import { isOfferActive, limitedOffers, promoCards, saleHref } from "@/data/offers";
import { getCollection, type StoreProduct } from "@/lib/catalog";
import { ALL_HANDLE } from "@/lib/catalog/config";
import { getCms } from "@/lib/cms";
import { couponConditions, couponValue, publicCoupons } from "@/lib/promo-codes";

export const metadata: Metadata = {
  title: "Offers & Products",
  description: "Current offers, promo codes, bulk order enquiries and limited-time campaigns at Ishmayi.",
  alternates: { canonical: "/offers" },
};

const CAROUSEL_ITEM = "w-[62%] sm:w-[38%] lg:w-[23.5%]";
const FEATURED_COUNT = 12;

const percentOff = (p: StoreProduct) => (p.compareAtPrice && p.price ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0);

export default async function OffersPage() {
  const [cms, all] = await Promise.all([getCms(), getCollection(ALL_HANDLE)]);
  const H = cms.pages.headings;
  const onOffer = (all ?? []).filter((p) => p.available && percentOff(p) > 0).sort((a, b) => percentOff(b) - percentOff(a));
  const maxOff = onOffer.length ? percentOff(onOffer[0]) : 0;
  const featured = (all ?? []).filter((p) => p.available && p.image).slice(0, FEATURED_COUNT);
  const codes = publicCoupons(cms);
  const campaigns = limitedOffers.filter((o) => isOfferActive(o));

  return (
    <>
      <section className="bg-grain">
        <div className="container-page py-7 md:py-10">
          <Breadcrumbs items={[{ label: "Offers" }]} />
          <h1 className="mt-3 font-display text-[1.75rem] leading-tight text-charcoal md:text-[2.4rem]">{H.offers.title}</h1>
          {H.offers.sub && <p className="mt-1 max-w-2xl text-ink-muted md:text-[1.05rem]">{H.offers.sub}</p>}
          <ul className="mt-6 grid grid-cols-2 gap-3 md:mt-8 lg:grid-cols-4 lg:gap-4">
            {promoCards.map((c) => (
              <li key={c.title}>
                <Link href={c.href} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-parchment bg-white transition-colors hover:border-gold">
                  <span className="relative block aspect-[5/3] overflow-hidden">
                    <Art motif={c.motif} tone={c.tone} className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.04]" />
                  </span>
                  <span className="flex flex-1 flex-col p-3.5 md:p-5">
                    <span className="font-display text-[1rem] leading-tight font-bold text-charcoal md:text-[1.15rem]">{c.title}</span>
                    <span className="mt-1 text-[0.8rem] leading-snug text-ink-muted md:text-[0.88rem]">{c.body}</span>
                    <ArrowRight className="mt-3 h-4 w-4 text-burgundy transition-transform group-hover:translate-x-1" strokeWidth={1.4} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="current-offers" className="container-page scroll-mt-24 py-12 md:py-20" aria-labelledby="current-title">
        <SectionHeading id="current-title" align="left" eyebrow="Offers" title="Currently on offer">
          <p>{onOffer.length ? `Save up to ${maxOff}% on these pieces.` : "Reduced pieces appear here as soon as an offer is live."}</p>
        </SectionHeading>
        <div className="mt-8">
          {onOffer.length ? (
            <Carousel label="Products on offer" itemClassName={CAROUSEL_ITEM}>
              {onOffer.map((p) => (
                <ProductCard key={p.handle} product={p} location="offers_current" />
              ))}
            </Carousel>
          ) : (
            <EmptyState title="No offers live right now" action={<Link href="/shop" className="btn btn-primary">Browse all products</Link>}>
              <p>New offers are added regularly. In the meantime, the full collection is ready to explore.</p>
            </EmptyState>
          )}
        </div>
      </section>

      <section id="promo-codes" className="scroll-mt-24 bg-ivory-deep py-12 md:py-20" aria-labelledby="codes-title">
        <div className="container-page">
          <SectionHeading id="codes-title" align="left" eyebrow="Promo codes" title="Copy a code, use it at checkout">
            <p>Each code shows its conditions. One offer applies per order.</p>
          </SectionHeading>
          {codes.length ? (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {codes.map((c) => (
                <PromoCodeCard key={c.code} code={c.code} value={couponValue(c)} conditions={couponConditions(c)} />
              ))}
            </ul>
          ) : (
            <div className="mt-8">
              <EmptyState title="No promo codes right now">
                <p>Please check back soon. Any available codes will be listed here.</p>
              </EmptyState>
            </div>
          )}
        </div>
      </section>

      <section id="limited-offers" className="container-page scroll-mt-24 py-12 md:py-20" aria-labelledby="limited-title">
        <SectionHeading id="limited-title" align="left" eyebrow="Limited time" title={H.limited.title}>
          {H.limited.sub && <p>{H.limited.sub}</p>}
        </SectionHeading>
        {campaigns.length ? (
          <ul className="mt-8 grid gap-4 lg:grid-cols-2 lg:gap-6">
            {campaigns.map((o) => (
              <li key={o.id}>
                <LimitedOfferCard
                  title={o.title}
                  body={o.body}
                  label={o.discountLabel || (maxOff > 0 ? `Up to ${maxOff}% off` : "Limited time")}
                  endsAt={o.endsAt}
                  href={saleHref(o)}
                  art={<ArtOrPhoto image={o.image} motif={o.motif} tone={o.tone} fit="contain" sizes="(min-width: 1024px) 20vw, 100vw" />}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8">
            <EmptyState title="No limited-time offers right now">
              <p>Our next campaign will appear here.</p>
            </EmptyState>
          </div>
        )}
      </section>

      <section id="bulk-orders" className="scroll-mt-24 bg-burgundy py-12 text-white md:py-20" aria-labelledby="bulk-title">
        <div className="container-page grid items-center gap-8 md:grid-cols-[1.2fr_1fr] md:gap-16">
          <div>
            <p className="eyebrow !text-gold-light">Bulk orders</p>
            <h2 id="bulk-title" className="mt-2 font-display text-[1.6rem] leading-tight md:text-[2.1rem]">Buying in quantity?</h2>
            <p className="mt-3 max-w-lg leading-relaxed text-white/80">
              For events, gifting and boutiques, we price by quantity. Tell us the pieces and quantities you have in mind, and we will reply with a quote.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
            <Link href="/bulk-orders" className="btn btn-light flex-1">Enquire about bulk orders</Link>
            <Link href="/shop?collection=sets" className="btn flex-1 border border-white/40 text-white hover:bg-white/10">Browse &amp; filter sets</Link>
          </div>
        </div>
      </section>

      <section className="container-page py-12 md:py-20" aria-labelledby="featured-title">
        <SectionHeading id="featured-title" align="left" title={H.featured.title}>
          {H.featured.sub && <p>{H.featured.sub}</p>}
        </SectionHeading>
        <div className="mt-8">
          {all === null ? (
            <EmptyState title="Our collection is taking a moment to load" action={<Link href="/shop" className="btn btn-primary">Try the shop</Link>}>
              <p>Please refresh the page in a little while.</p>
            </EmptyState>
          ) : featured.length === 0 ? (
            <EmptyState title="New pieces are on their way" />
          ) : (
            <>
              <TrackView event="view_embedded_store" params={{ location: "offers_featured", collection: ALL_HANDLE }} />
              <Carousel label="Featured products" itemClassName={CAROUSEL_ITEM}>
                {featured.map((p) => (
                  <ProductCard key={p.handle} product={p} location="offers_featured" collection={ALL_HANDLE} />
                ))}
              </Carousel>
              <p className="mt-10 text-center">
                <Link href="/shop" className="btn btn-outline min-w-52">View all</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </>
  );
}
