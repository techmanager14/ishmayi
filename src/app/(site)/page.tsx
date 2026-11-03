import { ArrowRight, Gift, Package, Percent, Ticket, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Art, ArtOrPhoto, Photo } from "@/components/Art";
import { CategoryCard } from "@/components/Cards";
import { Carousel } from "@/components/Carousel";
import { HeroSlider } from "@/components/HeroSlider";
import { LimitedOfferCard } from "@/components/OfferCards";
import { ProductChips } from "@/components/ProductChips";
import { QuickNav } from "@/components/QuickNav";
import { SectionHeading, TrustBadges } from "@/components/Sections";
import { isOfferActive, limitedOffers, saleHref } from "@/data/offers";
import { featuredCategories, occasions, quickNav, type ArtMotif, type ArtTone } from "@/data/shelves";
import { getCollection } from "@/lib/catalog";
import { ALL_HANDLE } from "@/lib/catalog/config";
import { distinctShelfViews, shelfViews } from "@/lib/catalog/shelves";
import { getCms } from "@/lib/cms";
import type { BannerTone, CmsBanner } from "@/lib/cms-types";
import { formatInr } from "@/lib/site";

const BUDGETS = [1000, 2000, 3000];

// Card backgrounds match each artwork's own tone, so art and text read as one tile.
const WAYS_TO_BUY: { title: string; body: string; action: string; href: string; motif: ArtMotif; tone: ArtTone; bg: string; dark: boolean; Icon: LucideIcon }[] = [
  { title: "Offers", body: "Pieces at reduced prices and limited-time campaigns.", action: "View offers", href: "/offers", motif: "tag", tone: "plum", bg: "bg-[#5e0f2c]", dark: true, Icon: Percent },
  { title: "Promo Codes", body: "Copy a code and use it at checkout.", action: "See codes", href: "/promo-codes", motif: "ticket", tone: "sand", bg: "bg-[#efe6d8]", dark: false, Icon: Ticket },
  { title: "Bulk Orders", body: "Order in quantity with discounts. Ask us for a quote.", action: "Enquire now", href: "/bulk-orders", motif: "boxes", tone: "rose", bg: "bg-[#efd8d2]", dark: false, Icon: Package },
  { title: "Customised Gift Sets", body: "Gift sets customised to your order.", action: "Customise a set", href: "/gift-sets", motif: "sets", tone: "sage", bg: "bg-[#dfe3d3]", dark: false, Icon: Gift },
];

const SLIDE_TONE: Record<BannerTone, { art: ArtTone; bg: string; dark: boolean }> = {
  dark: { art: "plum", bg: "bg-burgundy", dark: true },
  cream: { art: "sand", bg: "bg-[#efe6d8]", dark: false },
  light: { art: "rose", bg: "bg-[#efd8d2]", dark: false },
};

/** Artwork for the built-in banners; photos and videos set in the admin panel replace it. */
const SLIDE_MOTIF: Record<string, ArtMotif> = { offers: "tag", catalogue: "necklace", lookbook: "indian", seasonal: "diya" };

function HeroSlide({ banner: b, first }: { banner: CmsBanner; first: boolean }) {
  const Title = first ? "h1" : "p";
  const tone = SLIDE_TONE[b.tone];
  return (
    <Link href={b.ctaHref || "/shop"} draggable={false} className={`group grid grid-cols-[1.15fr_1fr] items-stretch md:min-h-[24rem] ${tone.bg}`}>
      <span className="flex flex-col items-start justify-center px-4 py-6 md:py-10 md:pr-8 md:pl-14 lg:pl-24">
        {b.eyebrow && <span className={`eyebrow text-[0.62rem] md:text-[0.75rem] ${tone.dark ? "!text-gold-light" : ""}`}>{b.eyebrow}</span>}
        <Title className={`mt-1.5 text-[1.45rem] leading-[1.12] font-normal md:mt-3 md:text-[2.75rem] lg:text-[3.25rem] ${tone.dark ? "text-white" : "text-charcoal"}`}>
          {b.title} {b.highlight && <span className={`font-bold ${tone.dark ? "text-gold-light" : "text-burgundy"}`}>{b.highlight}</span>}
        </Title>
        {b.body && <span className={`mt-3 hidden max-w-md text-[1rem] leading-relaxed md:block ${tone.dark ? "text-white/85" : "text-ink-muted"}`}>{b.body}</span>}
        {b.ctaLabel && <span className={`btn mt-3 !min-h-9 !px-4 !py-1.5 !text-[0.8rem] md:mt-6 md:!min-h-[2.875rem] md:!px-6 md:!text-[0.92rem] ${tone.dark ? "btn-light" : "btn-primary"}`}>{b.ctaLabel}</span>}
      </span>
      <span className="relative block min-h-44 overflow-hidden md:min-h-0">
        {b.video ? (
          <video src={b.video} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
        ) : b.image ? (
          <span className="absolute inset-0 block">
            <Photo src={b.image} alt="" sizes="(min-width: 768px) 50vw, 100vw" eager={first} />
          </span>
        ) : (
          <Art motif={SLIDE_MOTIF[b.id] ?? "necklace"} tone={tone.art} fit="contain" className="absolute inset-0 h-full w-full" />
        )}
      </span>
    </Link>
  );
}

function EntryBanner({ href, eyebrow, title, body, motif, tone, dark }: { href: string; eyebrow: string; title: string; body: string; motif: ArtMotif; tone: ArtTone; dark: boolean }) {
  return (
    <Link href={href} className={`group relative grid min-h-48 grid-cols-[1fr_40%] overflow-hidden rounded-2xl md:min-h-64 ${dark ? "bg-burgundy" : "bg-[#efe6d8]"}`}>
      <span className="flex flex-col items-start justify-center p-5 md:p-9">
        <span className={`eyebrow ${dark ? "!text-gold-light" : ""}`}>{eyebrow}</span>
        <span className={`mt-1.5 text-[1.3rem] leading-tight md:text-[1.9rem] ${dark ? "text-white" : "text-charcoal"}`}>{title}</span>
        <span className={`mt-1.5 max-w-xs text-[0.88rem] leading-relaxed ${dark ? "text-white/80" : "text-ink-muted"}`}>{body}</span>
        <ArrowRight className={`mt-3 h-5 w-5 transition-transform group-hover:translate-x-1.5 ${dark ? "text-gold-light" : "text-burgundy"}`} strokeWidth={1.6} aria-hidden="true" />
      </span>
      <Art motif={motif} tone={tone} className="h-full w-full" />
    </Link>
  );
}

export default async function HomePage() {
  const [cms, quick, categories, occasionViews, all] = await Promise.all([getCms(), shelfViews(quickNav), shelfViews(featuredCategories), distinctShelfViews(occasions), getCollection(ALL_HANDLE)]);
  const banners = cms.banners.filter((b) => b.enabled);
  const on = cms.sections;
  const H = cms.pages.headings;
  const products = (all ?? []).filter((p) => p.available && p.image);
  const campaigns = limitedOffers.filter((o) => isOfferActive(o));
  // Only quote a discount that the listed prices really show.
  const maxOff = Math.max(0, ...(all ?? []).filter((p) => p.available && p.compareAtPrice && p.price).map((p) => Math.round((1 - p.price! / p.compareAtPrice!) * 100)));

  return (
    <>
      {banners.length > 0 && (
        <HeroSlider labels={banners.map((b) => `${b.title} ${b.highlight}`.trim() || "Banner")}>
          {banners.map((b, i) => (
            <HeroSlide key={b.id} banner={b} first={i === 0} />
          ))}
        </HeroSlider>
      )}

      {on.quickNav && (
        <QuickNav
          items={quick.map((s) => ({
            slug: s.slug,
            href: s.href,
            title: s.title,
            art: <ArtOrPhoto image={s.image} motif={s.motif} tone={s.tone} sizes="150px" />,
          }))}
        />
      )}

      {on.trust && <TrustBadges />}

      <section className="container-page py-6 md:py-10" aria-labelledby="budget-title">
        <SectionHeading id="budget-title" title="Shop by Budget" />
        <ul className="mt-5 grid grid-cols-3 gap-2.5 md:mt-7 md:gap-5">
          {BUDGETS.map((b) => (
            <li key={b}>
              <Link href={`/shop?max=${b}`} className="flex flex-col items-center justify-center rounded-2xl bg-burgundy px-2 py-5 text-center text-white transition-colors hover:bg-burgundy-deep md:py-9">
                <span className="text-[0.85rem] md:text-[1.1rem]">Under</span>
                <span className="text-[1.25rem] font-bold md:text-[2.25rem]">{formatInr(b)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {on.categories && (
        <section className="container-page py-6 md:py-10" aria-labelledby="cat-title">
          <SectionHeading id="cat-title" title={H.categories.title}>
            {H.categories.sub && <p>{H.categories.sub}</p>}
          </SectionHeading>
          <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 md:mt-8 md:grid-cols-3 md:gap-x-6 md:gap-y-10">
            {categories.map((c) => (
              <li key={c.slug}>
                <CategoryCard shelf={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {on.entries && (
        <section className="container-page py-6 md:py-10" aria-label="Offers">
          <EntryBanner href="/offers" eyebrow="Offers" title="Offers & promo codes" body="Limited-time campaigns, promo codes and bulk orders." motif="ticket" tone="plum" dark />
        </section>
      )}

      {on.products && products.length > 0 && (
        <section className="container-page py-6 md:py-10" aria-labelledby="home-products-title">
          <SectionHeading id="home-products-title" title="Explore Now" />
          <ProductChips products={products} />
        </section>
      )}

      {on.waysToBuy && (
        <>
          <section className="container-page py-6 md:py-10" aria-labelledby="ways-title">
            <SectionHeading id="ways-title" title="Offers, Bulk Orders & Gifting" />
            <div className="mt-4 md:mt-7">
              <Carousel label="Offers, bulk orders and gifting" itemClassName="w-[60%] sm:w-[36%] lg:w-[23.5%]">
                {WAYS_TO_BUY.map(({ title, body, action, href, motif, tone, bg, dark, Icon }) => (
                  <Link key={title} href={href} draggable={false} className={`group relative flex h-full flex-col overflow-hidden rounded-2xl transition-shadow hover:shadow-[var(--shadow-soft)] ${bg}`}>
                    <span className="relative block aspect-[16/9] overflow-hidden">
                      <Art motif={motif} tone={tone} fit="contain" className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.06]" />
                      <span className="absolute top-2.5 left-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-burgundy shadow-sm md:h-10 md:w-10">
                        <Icon className="h-4 w-4 md:h-5 md:w-5" strokeWidth={1.8} aria-hidden="true" />
                      </span>
                    </span>
                    <span className="flex flex-1 flex-col px-3.5 pb-3.5 md:px-5 md:pb-5">
                      <span className={`text-[1rem] leading-tight font-bold md:text-[1.2rem] ${dark ? "text-white" : "text-charcoal"}`}>{title}</span>
                      <span className={`mt-1 line-clamp-2 flex-1 text-[0.78rem] leading-snug md:text-[0.9rem] ${dark ? "text-white/85" : "text-charcoal/75"}`}>{body}</span>
                      <span className="mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[0.74rem] font-bold text-burgundy md:mt-3 md:px-4 md:py-2 md:text-[0.85rem]">
                        {action}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </span>
                  </Link>
                ))}
              </Carousel>
            </div>
          </section>

          {campaigns.length > 0 && (
            <section className="mt-2 bg-burgundy py-7 md:py-12" aria-labelledby="limited-title">
              <div className="container-page">
                <h2 id="limited-title" className="text-center text-[1.5rem] leading-tight text-white md:text-[2rem]">{H.limited.title}</h2>
                <div className="mt-4 md:mt-7">
                  <Carousel label={H.limited.title} itemClassName="w-[90%] sm:w-[62%] lg:w-[49%]">
                    {campaigns.map((o) => (
                      <LimitedOfferCard
                        key={o.id}
                        title={o.title}
                        body={o.body}
                        label={o.discountLabel || (maxOff > 0 ? `Up to ${maxOff}% off` : "Limited time")}
                        endsAt={o.endsAt}
                        href={saleHref(o)}
                        art={<ArtOrPhoto image={o.image} motif={o.motif} tone={o.tone} fit="contain" sizes="(min-width: 1024px) 20vw, 35vw" />}
                      />
                    ))}
                  </Carousel>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {on.occasions && (
        <section className="container-page max-w-4xl py-7 md:py-10" aria-labelledby="occasion-title">
          <h2 id="occasion-title" className="text-center text-[1.15rem] text-charcoal md:text-[1.35rem]">Shop by Occasion</h2>
          <div className="mt-3.5 md:mt-5">
            <Carousel label="Shop by occasion" itemClassName="w-[38%] sm:w-[23.5%]">
              {occasionViews.map((o) => (
                <Link key={o.slug} href={o.href} draggable={false} aria-label={`Shop ${o.title} jewellery`} className="group block">
                  <span className="relative block aspect-[4/5] overflow-hidden rounded-xl">
                    <span className="absolute inset-0 block transition-transform duration-700 group-hover:scale-[1.04]">
                      <ArtOrPhoto image={o.image} motif={o.motif} tone={o.tone} sizes="(min-width: 640px) 200px, 38vw" />
                    </span>
                  </span>
                  <span className="mt-1.5 flex items-center justify-between gap-1.5 md:mt-2">
                    <span className="text-[0.88rem] font-bold text-charcoal md:text-[1rem]">{o.title}</span>
                    <span aria-hidden="true" className="flex h-6 w-9 shrink-0 items-center justify-center rounded-full bg-burgundy text-white transition-colors group-hover:bg-burgundy-deep">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </span>
                </Link>
              ))}
            </Carousel>
          </div>
        </section>
      )}
    </>
  );
}
