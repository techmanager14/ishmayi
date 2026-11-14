import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { GhlError, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { siteCollections } from "@/lib/admin/data";
import { getCmsFresh } from "@/lib/cms";
import { DEFAULT_PROMISES, PROMISE_PRESETS, promiseLabel } from "@/lib/promises";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdmin();
  let cats;
  try {
    cats = await siteCollections();
  } catch (err) {
    return <GhlError error={err} />;
  }
  const cms = await getCmsFresh();
  return (
    <>
      <PageTitle
        title="Add product"
        sub={
          <Link href="/admin/products" className="font-semibold text-burgundy hover:underline">
            Products
          </Link>
        }
      />
      <ProductForm
        product={null}
        categories={cats.map((c) => ({ label: c.label, onSale: c.onSale, collectionId: c.collection?.id ?? null }))}
        promises={{ selected: DEFAULT_PROMISES, presets: PROMISE_PRESETS.map((id) => ({ id, label: promiseLabel(id, cms.store) })) }}
      />
    </>
  );
}
