import type { Metadata } from "next";
import Link from "next/link";
import { PromoCodeCard } from "@/components/OfferCards";
import { EmptyState, PageHero, SectionHeading } from "@/components/Sections";
import { getCms } from "@/lib/cms";
import { couponConditions, couponValue, publicCoupons } from "@/lib/promo-codes";

export const metadata: Metadata = {
  title: "Promo Codes",
  description: "Current Ishmayi promo codes and their conditions. Copy a code and use it at checkout.",
  alternates: { canonical: "/promo-codes" },
};

const STEPS = [
  { title: "Copy a code", body: "Tap any code on this page to copy it." },
  { title: "Add your pieces", body: "Add what you love to your bag and go to checkout." },
  { title: "Apply and save", body: "Paste the code at checkout to see your discount before you pay." },
];

export default async function PromoCodesPage() {
  const codes = publicCoupons(await getCms());
  return (
    <>
      <PageHero eyebrow="Promo codes" title="Copy a code, save at checkout">
        <p>Each code shows its conditions. One offer applies per order.</p>
      </PageHero>

      <section className="container-page py-10 md:py-14" aria-labelledby="codes-title">
        <SectionHeading id="codes-title" align="left" title="Available codes" />
        {codes.length ? (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {codes.map((c) => (
              <PromoCodeCard key={c.code} code={c.code} value={couponValue(c)} conditions={couponConditions(c)} />
            ))}
          </ul>
        ) : (
          <div className="mt-6">
            <EmptyState title="No promo codes right now" action={<Link href="/offers" className="btn btn-primary">See all offers</Link>}>
              <p>Please check back soon. Any available codes will be listed here.</p>
            </EmptyState>
          </div>
        )}
      </section>

      <section className="bg-ivory-deep py-10 md:py-14" aria-labelledby="use-title">
        <div className="container-page">
          <SectionHeading id="use-title" title="How to use a code" />
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
    </>
  );
}
