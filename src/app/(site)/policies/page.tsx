import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/Sections";
import { policyLinks } from "@/lib/site";

export const metadata: Metadata = {
  title: "Policies",
  description: "Ishmayi's privacy notice, terms of use, shipping policy and cancellation and refund policy.",
  alternates: { canonical: "/policies" },
};

export default function PoliciesPage() {
  return (
    <>
      <PageHero eyebrow="Policies" title="Our policies">
        <p>How we handle your information, your orders, delivery and refunds.</p>
      </PageHero>
      <section className="container-page max-w-3xl py-10 md:py-14">
        <ul className="space-y-3">
          {policyLinks.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="flex items-center justify-between rounded-2xl border border-parchment bg-white p-5 font-bold text-charcoal transition-colors hover:border-burgundy hover:text-burgundy">
                {p.label}
                <ChevronRight className="h-5 w-5 text-ink-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
