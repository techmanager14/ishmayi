import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Carousel } from "@/components/Carousel";
import { ProductCard } from "@/components/ProductCard";
import { ProductView } from "@/components/ProductView";
import { Breadcrumbs, SectionHeading } from "@/components/Sections";
import { getCollection, getProduct } from "@/lib/catalog";
import { ALL_HANDLE } from "@/lib/catalog/config";
import { site } from "@/lib/site";

interface Props {
  params: Promise<{ handle: string }>;
}

const RELATED_COUNT = 8;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const p = await getProduct(handle);
  if (!p) return { title: "Product not found", robots: { index: false } };
  const description = p.description[0]?.slice(0, 160) ?? `${p.title}${p.subtitle ? `, ${p.subtitle}` : ""}, from ${site.name}.`;
  return {
    title: p.title,
    description,
    alternates: { canonical: `/product/${p.handle}` },
    openGraph: { title: p.title, description, ...(p.images[0] ? { images: [{ url: p.images[0].src }] } : {}) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const [product, all] = await Promise.all([getProduct(handle), getCollection(ALL_HANDLE)]);
  if (!product) notFound();

  const related = (all ?? []).filter((p) => p.handle !== product.handle && p.available && p.image).slice(0, RELATED_COUNT);
  const lowest = product.variants.reduce((a, b) => (b.price < a.price ? b : a));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description.join(" ").slice(0, 5000) || undefined,
    image: product.images.map((i) => i.src),
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      url: `${site.url}/product/${product.handle}`,
      priceCurrency: "INR",
      price: lowest.price,
      availability: product.variants.some((v) => v.available) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <div className="container-page pt-5 md:pt-7">
        <Breadcrumbs items={[{ href: "/shop", label: "Shop" }, { label: product.title }]} />
      </div>
      <ProductView product={product} />
      {related.length > 0 && (
        <section className="container-page border-t border-parchment py-12 md:py-20" aria-labelledby="related-title">
          <SectionHeading id="related-title" align="left" title="You may also like" />
          <div className="mt-8">
            <Carousel label="You may also like" itemClassName="w-[62%] sm:w-[38%] lg:w-[23.5%]">
              {related.map((p) => (
                <ProductCard key={p.handle} product={p} location="product_related" />
              ))}
            </Carousel>
          </div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
