import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { GhlError, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { siteCollections } from "@/lib/admin/data";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdmin();
  let cats;
  try {
    cats = await siteCollections();
  } catch (err) {
    return <GhlError error={err} />;
  }
  return (
    <>
      <PageTitle
        title="Add product"
        sub={
          <Link href="/admin/products" className="font-semibold text-[#ff8197] hover:underline">
            ← Products
          </Link>
        }
      />
      <ProductForm product={null} categories={cats.map((c) => ({ label: c.label, onSale: c.onSale, collectionId: c.collection?.id ?? null }))} />
    </>
  );
}
