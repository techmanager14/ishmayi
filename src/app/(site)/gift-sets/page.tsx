import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { ProductCard } from "@/components/ProductCard";
import { PageHero, SectionHeading } from "@/components/Sections";
import { setsShelf, shelfHref } from "@/data/shelves";
import { shelfProducts } from "@/lib/catalog/shelves";

export const metadata: Metadata = {
  title: "Customised Gift Sets",
  description: "Ask Ishmayi to put together a customised jewellery gift set for your occasion and budget.",
  alternates: { canonical: "/gift-sets" },
};

const SETS_SHOWN = 4;

const STEPS = [
  { title: "Share your idea", body: "Tell us the occasion, your budget and the pieces you have in mind." },
  { title: "We reply with options", body: "We email you about what we can put together and what it costs." },
  { title: "Confirm your set", body: "Once you are happy, we confirm the details and prepare your gift set." },
];

export default async function GiftSetsPage() {
  const sets = ((await shelfProducts(setsShelf)) ?? []).filter((p) => p.available).slice(0, SETS_SHOWN);
  return (
    <>
      <PageHero eyebrow="Customised gift sets" title="A gift set made for them">
        <p>Tell us who it&apos;s for and what you have in mind, and we&apos;ll reply about putting a set together.</p>
      </PageHero>

      <section className="container-page py-10 md:py-14" aria-labelledby="set-how-title">
        <SectionHeading id="set-how-title" title="How it works" />
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

      <section className="container-page max-w-3xl pb-10 md:pb-14">
        <div id="request" className="scroll-mt-24 rounded-2xl border border-parchment bg-white p-5 sm:p-8">
          <h2 className="text-[1.3rem] leading-tight font-bold text-charcoal">Request a customised set</h2>
          <p className="mt-1 mb-6 text-sm text-ink-muted">We&apos;ll reply by email.</p>
          <ContactForm initialTopic="gift" />
        </div>
      </section>

      {sets.length > 0 && (
        <section className="container-page pb-12 md:pb-16" aria-labelledby="set-ideas-title">
          <SectionHeading id="set-ideas-title" title="Sets to inspire you" />
          <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 md:gap-x-6 lg:grid-cols-4">
            {sets.map((p) => (
              <li key={p.handle}>
                <ProductCard product={p} location="gift_sets" />
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
