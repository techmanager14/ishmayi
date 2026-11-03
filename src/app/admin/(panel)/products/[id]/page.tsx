import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProductAction } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/forms";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminProduct, siteCollections } from "@/lib/admin/data";
import { htmlToText } from "@/lib/admin/text";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  const [product, cats] = await Promise.all([getAdminProduct(id), siteCollections()]);
  if (!product) notFound();
  return (
    <>
      <PageTitle
        title={product.name}
        sub={
          <Link href="/admin/products" className="font-semibold text-[#ff8197] hover:underline">
            ← Products
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
      />
    </>
  );
}
