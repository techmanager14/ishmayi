import type { ReactNode } from "react";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Header, type MenuTile } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { CmsProvider } from "@/components/CmsProvider";
import { AnalyticsConsent, WhatsAppFloat } from "@/components/Tracking";
import { featuredCategories, shelfHref } from "@/data/shelves";
import { getCollection, type StoreProduct } from "@/lib/catalog";
import { getCatalogue } from "@/lib/catalog/config";
import { shelfProducts } from "@/lib/catalog/shelves";
import { getCms } from "@/lib/cms";
import type { CmsContent } from "@/lib/cms-types";
import { site } from "@/lib/site";

const organisationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  legalName: site.legalName,
  url: site.url,
  description: site.description,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: `${site.address.locality}, ${site.address.city}`,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: site.address.country,
  },
  ...(site.contact.phone ? { telephone: site.contact.phone } : {}),
  ...(site.contact.email ? { email: site.contact.email } : {}),
};

/** Menu tiles: categories that hold products first, each with a different product photo where possible. */
async function menuTiles(): Promise<MenuTile[]> {
  const { categories } = await getCatalogue();
  const rows = await Promise.all([
    ...categories.map(async (c) => ({ href: `/shop?collection=${c.handle}`, label: c.label, image: c.image || undefined, motif: "necklace" as const, tone: "plum" as const, products: (await getCollection(c.handle)) ?? [] })),
    ...featuredCategories.map(async (s) => ({ href: shelfHref(s), label: s.title, image: s.image, motif: s.motif, tone: s.tone, products: (await shelfProducts(s)) ?? [] })),
  ]);
  const used = new Set<string>();
  const photo = (products: StoreProduct[]) => {
    const srcs = products.flatMap((p) => (p.image ? [p.image.src] : []));
    const src = srcs.find((x) => !used.has(x)) ?? srcs[0];
    if (src) used.add(src);
    return src;
  };
  return [...rows]
    .sort((a, b) => Number(b.products.length > 0) - Number(a.products.length > 0))
    .map(({ products, ...t }) => ({ ...t, image: t.image ?? photo(products) }));
}

/** Only reviews tagged as being about a product: the older testimonials are about consultations we no longer offer. */
const productReviews = (c: CmsContent) =>
  c.reviews.texts
    .filter((r) => r.enabled && r.highlight && /jewel|necklace|ring|bracelet|bangle|anklet|pendant|shawl|saree|painting|product/i.test(r.service))
    .map((r) => ({ id: r.id, name: r.name, city: r.city, text: r.highlight }));

/** Public website frame: header, footer, tab bar and bag. */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const [tiles, cms] = await Promise.all([menuTiles(), getCms()]);
  return (
    <CmsProvider value={{ contact: cms.contact, store: cms.store, nav: cms.nav }}>
      <div className="flex min-h-dvh flex-col pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-burgundy focus:px-5 focus:py-3 focus:text-ivory">
          Skip to content
        </a>
        {cms.announcement.enabled && cms.announcement.text && <AnnouncementBar text={cms.announcement.text} href={cms.announcement.link} />}
        <Header tiles={tiles} reviews={productReviews(cms)} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer social={cms.social} nav={cms.nav} gstin={cms.business.gstin} essence={cms.pages.brand.essence} />
        <MobileTabBar />
        <CartDrawer />
        <WhatsAppFloat />
        <AnalyticsConsent />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd) }} />
      </div>
    </CmsProvider>
  );
}
