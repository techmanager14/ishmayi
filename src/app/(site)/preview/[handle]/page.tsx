import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductView } from "@/components/ProductView";
import { currentAdmin } from "@/lib/admin/auth";
import { previewProduct } from "@/lib/catalog";
import { getCmsFresh } from "@/lib/cms";
import { variantKey } from "@/lib/cms-types";
import { productPromises } from "@/lib/promises";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/** How a product page will look, for the signed-in admin — also for products not on sale yet. */
export default async function PreviewPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!(await currentAdmin())) redirect("/admin/login");
  const [found, cms] = await Promise.all([previewProduct(handle), getCmsFresh()]);
  if (!found) notFound();
  const photos = cms.variantImages[found.handle] ?? {};
  const product = { ...found, variants: found.variants.map((v) => ({ ...v, images: v.options.length ? (photos[variantKey(v.options)] ?? []) : [] })) };
  return (
    <>
      <div className="sticky top-[3.75rem] z-30 border-b border-gold/40 bg-[#fff6e5] lg:top-[7.4rem]">
        <p className="container-page flex flex-wrap items-center justify-between gap-2 py-2 text-sm text-charcoal">
          <span>
            <b>Preview</b> · only you can see this page.
          </span>
          <Link href={`/admin/products/${found.handle}`} className="font-bold text-burgundy hover:underline">
            Back to editing
          </Link>
        </p>
      </div>
      <ProductView product={product} promises={productPromises(cms, product.handle)} code={cms.productCodes[product.handle]} />
    </>
  );
}
