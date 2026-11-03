import type { Metadata } from "next";
import Link from "next/link";
import { FaqTabs } from "@/components/FaqTabs";
import { PageHero } from "@/components/Sections";
import { getCms } from "@/lib/cms";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers about ordering, payment, delivery, returns and bulk orders at Ishmayi.",
  alternates: { canonical: "/faqs" },
};

export default async function FaqsPage() {
  const { faqs, pages } = await getCms();
  const heading = pages.headings.faqs;
  return (
    <>
      <PageHero eyebrow="FAQs" title={heading.title}>
        {heading.sub && <p>{heading.sub}</p>}
      </PageHero>
      <section className="container-page max-w-4xl py-10 md:py-16">
        <FaqTabs groups={faqs} />
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ivory-deep p-6">
          <p className="font-display text-[1.2rem] font-bold text-charcoal">Still have a question?</p>
          <Link href="/contact" className="btn btn-primary">
            Contact us
          </Link>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.flatMap((g) => g.items).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
