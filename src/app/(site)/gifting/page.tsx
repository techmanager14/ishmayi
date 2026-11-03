import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { PageHero, SectionHeading } from "@/components/Sections";
import { setsShelf, shelfHref } from "@/data/shelves";
import { shelfProducts } from "@/lib/catalog/shelves";
import { formatInr } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gifting",
  description: "Jewellery gifts from Ishmayi: shop by budget, choose a matching set and send it straight to the person you are celebrating.",
  alternates: { canonical: "/gifting" },
};

const BUDGETS = [1000, 2000, 3000];
const GIFTS_SHOWN = 8;

const STEPS = [
  { title: "Choose a piece", body: "Browse by budget or start with a matching set." },
  { title: "Mark it as a gift", body: "At checkout, tick “This order is a gift” and add the recipient's name and mobile number." },
  { title: "We deliver it", body: "Your gift is packed with care and delivered across India." },
];

export default async function GiftingPage() {
  const sets = ((await shelfProducts(setsShelf)) ?? []).filter((p) => p.available).slice(0, GIFTS_SHOWN);
  return (
    <>
      <PageHero eyebrow="Gifting" title="Gifts they'll keep wearing">
        <p>Find something for every occasion, and send it straight to the person you are celebrating.</p>
      </PageHero>

      <section className="container-page py-10 md:py-14" aria-labelledby="gift-budget-title">
        <SectionHeading id="gift-budget-title" title="Gifts by Budget" />
        <ul className="mt-6 grid grid-cols-3 gap-2.5 md:gap-5">
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

      <section className="bg-ivory-deep py-10 md:py-14" aria-labelledby="gift-how-title">
        <div className="container-page">
          <SectionHeading id="gift-how-title" title="Sending a gift is simple" />
          <ol className="mt-6 grid gap-3 md:grid-cols-3 md:gap-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-white p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-burgundy text-sm font-bold text-white">{i + 1}</span>
                <h3 className="mt-3 text-[1.05rem] font-bold text-charcoal">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {sets.length > 0 && (
        <section className="container-page py-10 md:py-14" aria-labelledby="gift-sets-title">
          <SectionHeading id="gift-sets-title" title="Matching sets to gift" />
          <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 md:gap-x-6 lg:grid-cols-4">
            {sets.map((p) => (
              <li key={p.handle}>
                <ProductCard product={p} location="gifting" />
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center">
            <Link href={shelfHref(setsShelf)} className="btn btn-outline min-w-52">View all sets</Link>
          </p>
        </section>
      )}

      <section className="container-page pb-10 md:pb-14">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-burgundy p-6 text-white md:p-8">
          <div>
            <h2 className="text-[1.3rem] font-bold md:text-[1.6rem]">Customise a gift set</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/85">Tell us the occasion, your budget and the pieces you have in mind, and we&apos;ll reply about putting a set together.</p>
          </div>
          <Link href="/gift-sets" className="btn btn-light">Customise a gift set</Link>
        </div>
      </section>

      <section className="container-page pb-12 md:pb-16">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-blush p-6">
          <div>
            <p className="text-[1.2rem] font-bold text-charcoal">Gifting for a group or a company?</p>
            <p className="text-sm text-ink-muted">We price larger orders by quantity.</p>
          </div>
          <Link href="/bulk-orders" className="btn btn-primary">Bulk orders</Link>
        </div>
      </section>
    </>
  );
}
