import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProductAction } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/forms";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminProduct, siteCollections } from "@/lib/admin/data";
import { htmlToText } from "@/lib/admin/text";
import { getCollection } from "@/lib/catalog";
import { ALL_HANDLE } from "@/lib/catalog/config";
import { getCmsFresh } from "@/lib/cms";
import { DEFAULT_PROMISES, PROMISE_PRESETS, promiseLabel } from "@/lib/promises";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  const [product, cats, cms, all] = await Promise.all([getAdminProduct(id), siteCollections(), getCmsFresh(), getCollection(ALL_HANDLE).catch(() => null)]);
  if (!product) notFound();
  return (
    <>
      <PageTitle
        title={product.name}
        sub={
          <Link href="/admin/products" className="font-semibold text-burgundy hover:underline">
            Products
          </Link>
        }
        actions={
          <form action={deleteProductAction}>
            <input type="hidden" name="id" value={product.id} />
            <ConfirmButton message={`Delete “${product.name}” from the store? This can't be undone.`}>Delete product</ConfirmButton>
          </form>
        }
      />
      {saved && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Product created.</p>}
      <ProductForm
        key={product.id}
        product={{ ...product, description: htmlToText(product.description) }}
        categories={cats.map((c) => ({ label: c.label, onSale: c.onSale, collectionId: c.collection?.id ?? null }))}
        promises={{
          selected: cms.promises[product.id] ?? DEFAULT_PROMISES,
          presets: PROMISE_PRESETS.map((id) => ({ id, label: promiseLabel(id, cms.store) })),
        }}
        pairing={{
          selected: cms.pairings[product.id] ?? [],
          options: (all ?? []).filter((p) => p.handle !== product.id).map((p) => ({ handle: p.handle, title: p.title, image: p.image?.src ?? null, price: p.price })),
        }}
      />
    </>
  );
}
