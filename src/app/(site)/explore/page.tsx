import type { Metadata } from "next";
import { CollectionCard, FeatureCard } from "@/components/Cards";
import { Carousel } from "@/components/Carousel";
import { PageHero, SectionHeading } from "@/components/Sections";
import { exploreCollections, exploreGemstones, exploreStyles } from "@/data/shelves";
import { shelfViews } from "@/lib/catalog/shelves";
import { getCms } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Explore",
  description: "Discover Ishmayi by collection, gemstone and style: stone, pearl, silver and rose pieces, amethyst, rose quartz and more.",
  alternates: { canonical: "/explore" },
};

export default async function ExplorePage() {
  const [cms, collections, gemstones, styles] = await Promise.all([getCms(), shelfViews(exploreCollections), shelfViews(exploreGemstones), shelfViews(exploreStyles)]);
  const H = cms.pages.headings;

  return (
    <>
      <PageHero eyebrow="Explore" title="Discover what speaks to you">
        <p>Browse by the material you love, the stone you are looking for or the way you like to dress.</p>
      </PageHero>

      <section id="collections" className="container-page scroll-mt-24 py-12 md:py-20" aria-labelledby="col-title">
        <SectionHeading id="col-title" align="left" eyebrow="Collections" title={H.collections.title}>
          {H.collections.sub && <p>{H.collections.sub}</p>}
        </SectionHeading>
        <div className="mt-8">
          <Carousel label="Collections" itemClassName="w-[66%] sm:w-[40%] lg:w-[23.5%]">
            {collections.map((c) => (
              <CollectionCard key={c.slug} shelf={c} />
            ))}
          </Carousel>
        </div>
      </section>

      <section id="gemstones" className="scroll-mt-24 bg-ivory-deep py-12 md:py-20" aria-labelledby="gem-title">
        <div className="container-page">
          <SectionHeading id="gem-title" align="left" eyebrow="Gemstones" title={H.gemstones.title}>
            {H.gemstones.sub && <p>{H.gemstones.sub}</p>}
          </SectionHeading>
          <ul className="mt-8 grid gap-4 md:grid-cols-2 md:gap-6">
            {gemstones.map((g) => (
              <li key={g.slug}>
                <FeatureCard shelf={g} action="View collection" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="styles" className="container-page scroll-mt-24 py-12 md:py-20" aria-labelledby="style-title">
        <SectionHeading id="style-title" align="left" eyebrow="Styles" title={H.styles.title}>
          {H.styles.sub && <p>{H.styles.sub}</p>}
        </SectionHeading>
        <ul className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-6">
          {styles.map((s) => (
            <li key={s.slug}>
              <FeatureCard shelf={s} action="Explore" />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
