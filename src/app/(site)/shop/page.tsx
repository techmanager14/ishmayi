import type { Metadata } from "next";
import Link from "next/link";
import { ArtOrPhoto } from "@/components/Art";
import { CatalogueBrowser, type CategoryOption } from "@/components/CatalogueBrowser";
import { ProductCard } from "@/components/ProductCard";
import { QuickNav } from "@/components/QuickNav";
import { Breadcrumbs, EmptyState, SectionHeading } from "@/components/Sections";
import { TrackView } from "@/components/Tracking";
import { allShelves, featuredCategories, quickNav, shelfBySlug, shelfHref } from "@/data/shelves";
import { getCollection, type StoreProduct } from "@/lib/catalog";
import { ALL_HANDLE, getCatalogue } from "@/lib/catalog/config";
import { shelfProducts, shelfViews } from "@/lib/catalog/shelves";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop Ishmayi: stone and pearl jewellery, necklaces, anklets, statement sets and curated collections. Secure online checkout.",
  alternates: { canonical: "/shop" },
};

const ALTERNATIVES_SHOWN = 8;
const SIDEBAR_HIDDEN = new Set(["stone", "pearl", "silver", "wedding", "office", "daily", "festive"]);

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ collection?: string; q?: string; max?: string; offer?: string }> }) {
  const { collection: requested, q, max, offer } = await searchParams;
  const catalogue = await getCatalogue();

  // A collection is either an admin category (a GoHighLevel collection) or a merchandising shelf.
  const category = catalogue.all.find((c) => c.handle === requested && c.status !== "hidden") ?? null;
  const shelf = category ? null : (shelfBySlug(requested) ?? null);
  const active = category?.handle ?? shelf?.slug ?? ALL_HANDLE;
  const title = category?.label ?? shelf?.title ?? "All products";
  const intro = category?.blurb ?? shelf?.blurb ?? "The complete Ishmayi collection.";

  const query = (q ?? "").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  const budget = Number(max);

  const products: StoreProduct[] | null = shelf ? await shelfProducts(shelf) : await getCollection(active);

  const alternatives = products?.length === 0 ? ((await getCollection(ALL_HANDLE)) ?? []).filter((p) => p.available && p.image).slice(0, ALTERNATIVES_SHOWN) : [];

  // Sidebar: everything on sale, then only the shelves that currently hold products.
  // Material and occasion shelves have their own links, so they only appear while being viewed.
  const candidates = [...new Map([...featuredCategories, ...allShelves].map((s) => [s.slug, s])).values()].filter((s) => !s.newest && (!SIDEBAR_HIDDEN.has(s.slug) || s.slug === active));
  const shelfCounts = await Promise.all(candidates.map(async (s) => ({ s, count: (await shelfProducts(s))?.length ?? 0 })));
  const categoryCounts = await Promise.all(catalogue.categories.map(async (c) => ({ c, count: (await getCollection(c.handle))?.length ?? null })));
  const allCount = (await getCollection(ALL_HANDLE))?.length ?? null;
  const options: CategoryOption[] = [
    { href: "/shop", label: "All products", count: allCount, active: active === ALL_HANDLE },
    ...categoryCounts.map(({ c, count }) => ({ href: `/shop?collection=${c.handle}`, label: c.label, count, active: active === c.handle })),
    ...shelfCounts.filter(({ s, count }) => count > 0 || s.slug === active).map(({ s, count }) => ({ href: shelfHref(s), label: s.title, count, active: active === s.slug })),
  ];

  return (
    <>
      <QuickNav items={(await shelfViews(quickNav)).map((s) => ({ slug: s.slug, href: s.href, title: s.title, art: <ArtOrPhoto image={s.image} motif={s.motif} tone={s.tone} sizes="130px" /> }))} />

      <section className="border-y border-parchment bg-ivory-deep/60">
        <div className="container-page py-5 md:py-8">
          <Breadcrumbs items={active === ALL_HANDLE ? [{ label: "Shop" }] : [{ href: "/shop", label: "Shop" }, { label: title }]} />
          <h1 className="mt-2 font-display text-[1.6rem] leading-tight text-charcoal md:text-[2.2rem]">
            {query ? <>Results for &ldquo;{query}&rdquo;</> : title}
          </h1>
          <p className="mt-0.5 max-w-2xl text-[0.92rem] text-ink-muted md:text-base">{query ? `Searching in ${title.toLowerCase()}.` : intro}</p>
        </div>
      </section>

      <section className="container-page pt-2 pb-12 md:pt-4 lg:pt-8 lg:pb-20" aria-label={`${title} products`}>
        {products === null ? (
          <div className="mt-8">
            <EmptyState title="Our collection is taking a moment to load" action={<Link href="/contact" className="btn btn-outline">Contact us</Link>}>
              <p>We couldn&apos;t load the products right now. Please refresh in a little while.</p>
            </EmptyState>
          </div>
        ) : products.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title={`${title}: arriving soon`}
              action={
                <>
                  <Link href="/shop" className="btn btn-primary">Browse all products</Link>
                  <Link href="/explore" className="btn btn-outline">Explore</Link>
                </>
              }
            >
              <p>We&apos;re preparing this collection. Explore what&apos;s available now, and check back soon.</p>
            </EmptyState>
            {/* A collection with nothing in it yet still shows what can be bought today. */}
            {alternatives.length > 0 && (
              <div className="mt-10 md:mt-14">
                <SectionHeading title="Available now" />
                <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
                  {alternatives.map((p) => (
                    <li key={p.handle}>
                      <ProductCard product={p} location="shop_empty" />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <>
            <TrackView event="view_embedded_store" params={{ location: "shop_page", collection: active }} />
            <CatalogueBrowser
              key={`${active}|${query}|${max ?? ""}|${offer ?? ""}`}
              products={products}
              categories={options}
              collection={active}
              initialQuery={query}
              initialMax={Number.isFinite(budget) && budget > 0 ? budget : null}
              initialOffer={offer === "1"}
            />
          </>
        )}
      </section>
    </>
  );
}
