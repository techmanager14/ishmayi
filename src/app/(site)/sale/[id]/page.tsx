import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Art } from "@/components/Art";
import { SaleCountdown } from "@/components/OfferCards";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs, EmptyState, SectionHeading } from "@/components/Sections";
import { isOfferActive, limitedOffers, saleHref } from "@/data/offers";
import { getCollection, type StoreProduct } from "@/lib/catalog";
import { ALL_HANDLE } from "@/lib/catalog/config";

interface Props {
  params: Promise<{ id: string }>;
}

const PRODUCTS_SHOWN = 12;

const percentOff = (p: StoreProduct) => (p.compareAtPrice && p.price ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0);

export const generateStaticParams = () => limitedOffers.map((o) => ({ id: o.id }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const offer = limitedOffers.find((o) => o.id === id);
  if (!offer) return { title: "Sale not found", robots: { index: false } };
  return { title: offer.title, description: offer.body, alternates: { canonical: saleHref(offer) } };
}

export default async function SalePage({ params }: Props) {
  const { id } = await params;
  const offer = limitedOffers.find((o) => o.id === id);
  if (!offer) notFound();

  const all = (await getCollection(ALL_HANDLE)) ?? [];
  const reduced = all.filter((p) => p.available && percentOff(p) > 0).sort((a, b) => percentOff(b) - percentOff(a));
  // Only reduced pieces count as "on sale"; until there are some, show the collection without a discount claim.
  const products = (reduced.length ? reduced : all.filter((p) => p.available && p.image)).slice(0, PRODUCTS_SHOWN);
  const maxOff = reduced.length ? percentOff(reduced[0]) : 0;
  const label = offer.discountLabel || (maxOff > 0 ? `Up to ${maxOff}% off` : "Limited time");
  const active = isOfferActive(offer);
  const others = limitedOffers.filter((o) => o.id !== offer.id && isOfferActive(o));

  return (
    <>
      <section className="bg-burgundy text-white">
        <div className="container-page grid items-center gap-6 py-7 md:grid-cols-[1.2fr_1fr] md:gap-12 md:py-12">
          <div className="min-w-0">
            <div className="[&_a]:text-white/75 [&_a:hover]:text-white [&_nav]:text-white/75 [&_span]:text-white">
              <Breadcrumbs items={[{ href: "/offers", label: "Offers" }, { label: offer.title }]} />
            </div>
            <p className="mt-5 w-fit rounded-full bg-gold-light px-3 py-1 text-[0.72rem] font-bold tracking-wide text-burgundy-deep uppercase">{label}</p>
            <h1 className="mt-3 text-[2.25rem] leading-tight font-bold md:text-[3.5rem]">{offer.title}</h1>
            <p className="mt-2 max-w-lg text-white/85 md:text-[1.1rem]">{offer.body}</p>
            {active && offer.endsAt && (
              <div className="mt-5">
                <SaleCountdown endsAt={offer.endsAt} light />
              </div>
            )}
            {!active && <p className="mt-5 text-lg font-bold text-gold-light">This sale has ended.</p>}
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-72 overflow-hidden rounded-3xl md:max-w-sm">
            <Art motif={offer.motif} tone={offer.tone} fit="contain" className="absolute inset-0 h-full w-full" />
          </div>
        </div>
      </section>

      <section className="container-page py-10 md:py-14" aria-labelledby="sale-products-title">
        <SectionHeading id="sale-products-title" title={reduced.length ? "Pieces on sale" : "Shop the collection"} />
        {products.length ? (
          <>
            <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
              {products.map((p) => (
                <li key={p.handle}>
                  <ProductCard product={p} location={`sale_${offer.id}`} />
                </li>
              ))}
            </ul>
            <p className="mt-8 text-center">
              <Link href="/shop" className="btn btn-outline min-w-52">View all products</Link>
            </p>
          </>
        ) : (
          <div className="mt-6">
            <EmptyState title="Our collection is taking a moment to load" action={<Link href="/shop" className="btn btn-primary">Go to the shop</Link>}>
              <p>Please refresh the page in a little while.</p>
            </EmptyState>
          </div>
        )}
      </section>

      {others.length > 0 && (
        <section className="container-page pb-12 md:pb-16">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-blush p-6">
            <p className="text-[1.2rem] font-bold text-charcoal">Also on now: {others.map((o) => o.title).join(", ")}</p>
            <Link href={saleHref(others[0])} className="btn btn-primary">See {others[0].title}</Link>
          </div>
        </section>
      )}
    </>
  );
}
