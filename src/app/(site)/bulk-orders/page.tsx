import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { ProductCard } from "@/components/ProductCard";
import { PageHero, SectionHeading } from "@/components/Sections";
import { setsShelf, shelfHref } from "@/data/shelves";
import { shelfProducts } from "@/lib/catalog/shelves";

export const metadata: Metadata = {
  title: "Bulk Orders",
  description: "Buying jewellery in quantity for an event, corporate gifting or a boutique? Send Ishmayi a bulk order enquiry for a quote.",
  alternates: { canonical: "/bulk-orders" },
};

const SETS_SHOWN = 4;

const STEPS = [
  { title: "Tell us what you need", body: "Share the pieces, the quantities and when you need them." },
  { title: "Get a quote", body: "We reply by email with pricing for your quantity and the delivery timeline." },
  { title: "Confirm your order", body: "Once you are happy with the quote, we confirm the details and prepare your order." },
];

const USES = ["Weddings and family functions", "Corporate and festive gifting", "Boutiques and resellers", "Events and exhibitions"];

export default async function BulkOrdersPage() {
  const sets = ((await shelfProducts(setsShelf)) ?? []).filter((p) => p.available).slice(0, SETS_SHOWN);
  return (
    <>
      <PageHero eyebrow="Bulk orders" title="Buying in quantity?">
        <p>For events, gifting and boutiques, we price by quantity. Tell us what you have in mind and we will reply with a quote.</p>
      </PageHero>

      <section className="container-page py-10 md:py-14" aria-labelledby="how-title">
        <SectionHeading id="how-title" title="How it works" />
        <ol className="mt-6 grid gap-3 md:grid-cols-3 md:gap-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl bg-blush p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-burgundy text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 text-[1.05rem] font-bold text-charcoal">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page grid gap-8 pb-10 md:pb-14 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <h2 className="text-[1.3rem] font-bold text-charcoal">Popular for</h2>
          <ul className="mt-3 space-y-2 text-ink-muted">
            {USES.map((u) => (
              <li key={u} className="flex items-center gap-2.5">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-burgundy" />
                {u}
              </li>
            ))}
          </ul>
        </div>
        <div id="enquiry" className="scroll-mt-24 rounded-2xl border border-parchment bg-white p-5 sm:p-8">
          <h2 className="text-[1.3rem] leading-tight font-bold text-charcoal">Send a bulk enquiry</h2>
          <p className="mt-1 mb-6 text-sm text-ink-muted">We&apos;ll reply by email.</p>
          <ContactForm initialTopic="bulk" />
        </div>
      </section>

      {sets.length > 0 && (
        <section className="container-page pb-12 md:pb-16" aria-labelledby="sets-title">
          <SectionHeading id="sets-title" title="Sets to start from" />
          <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 md:gap-x-6 lg:grid-cols-4">
            {sets.map((p) => (
              <li key={p.handle}>
                <ProductCard product={p} location="bulk_orders" />
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center">
            <Link href={shelfHref(setsShelf)} className="btn btn-outline min-w-52">View all sets</Link>
          </p>
        </section>
      )}
    </>
  );
}
