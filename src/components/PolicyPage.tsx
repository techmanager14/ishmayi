import Link from "next/link";
import type { ReactNode } from "react";
import { policyLinks, site } from "@/lib/site";
import { getCms } from "@/lib/cms";
import type { PolicyKey } from "@/lib/cms-types";
import { RichText } from "./RichText";
import { PageHero } from "./Sections";

export const POLICY_UPDATED = "3 November 2026";

export async function PolicyPage({ title, intro, children, policy }: { title: string; intro: ReactNode; children: ReactNode; policy?: PolicyKey }) {
  // Text written in the admin panel (Content → Policies) replaces the built-in policy.
  const custom = policy ? (await getCms()).policies[policy].trim() : "";
  return (
    <>
      <PageHero eyebrow="Policies" title={title}>
        <p>{intro}</p>
        <p className="mt-3 text-sm">Last updated: {POLICY_UPDATED}</p>
      </PageHero>
      <section className="py-14 md:py-20">
        <div className="container-page grid gap-12 lg:grid-cols-[14rem_1fr] lg:gap-20">
          <nav aria-label="Policies" className="order-2 lg:order-1">
            <ul className="space-y-3 text-sm lg:sticky lg:top-36">
              {policyLinks.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="text-ink-muted hover:text-burgundy">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <article className="prose-policy order-1 max-w-3xl lg:order-2">
            {!site.policiesReviewed && (
              <p className="!mt-0 mb-8 rounded-xl border border-gold/50 bg-ivory-deep px-5 py-4 text-sm !text-charcoal">
                This policy is a draft pending final review by {site.legalName}.
              </p>
            )}
            {custom ? <RichText text={custom} /> : children}
          </article>
        </div>
      </section>
    </>
  );
}
