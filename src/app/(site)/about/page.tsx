import type { Metadata } from "next";
import Link from "next/link";
import { Art } from "@/components/Art";
import { PageHero, SectionHeading } from "@/components/Sections";
import { getCms } from "@/lib/cms";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Ishmayi is a premium jewellery house bringing together natural gemstones, considered design and curated collections.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const { pages } = await getCms();
  const { about, brand, pillars } = pages;
  return (
    <>
      <PageHero eyebrow="About" title={about.title}>
        <p>{about.intro}</p>
      </PageHero>

      <section className="py-12 md:py-20" aria-labelledby="story-title">
        <div className="container-page grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-20">
          <div>
            <SectionHeading id="story-title" align="left" title={about.storyTitle} />
            <div className="mt-5 space-y-4 text-[1.02rem] leading-relaxed text-ink-muted">
              {about.story.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <p className="mt-7 border-l border-gold pl-4 font-display text-[1.2rem] leading-snug text-burgundy">{brand.promise}</p>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl">
            <Art motif="necklace" tone="plum" className="absolute inset-0 h-full w-full" />
          </div>
        </div>
      </section>

      <section className="bg-ivory-deep py-12 md:py-20" aria-labelledby="pillars-title">
        <div className="container-page">
          <SectionHeading id="pillars-title" title="What we stand for" />
          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <li key={p.title} className="border-t border-gold pt-4">
                <h3 className="font-display text-[1.1rem] font-bold text-charcoal">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-12 md:py-20">
        <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <p className="eyebrow">The business</p>
            <p className="mt-2 font-display text-[1.3rem] leading-tight text-charcoal">
              {site.name} is operated by {site.legalName}.
            </p>
            <p className="mt-2 text-ink-muted">
              Registered office: {site.address.street}, {site.address.locality}, {site.address.city} – {site.address.postalCode}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
            <Link href="/shop" className="btn btn-primary">Shop the collection</Link>
            <Link href="/contact" className="btn btn-outline">Contact us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
