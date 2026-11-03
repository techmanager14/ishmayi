import { CategoriesEditor } from "@/components/admin/editors";
import { GhlError, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listProducts } from "@/lib/admin/data";
import { getCmsFresh } from "@/lib/cms";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();
  let c, products;
  try {
    [c, products] = await Promise.all([getCmsFresh(), listProducts()]);
  } catch (err) {
    return <GhlError error={err} />;
  }
  const counts = Object.fromEntries(c.categories.map((cat) => [cat.handle, products.filter((p) => p.categories.includes(cat.label)).length]));
  return (
    <>
      <PageTitle
        title="Categories"
        sub="Shop categories: Live ones are on sale, Coming soon ones show a teaser, Hidden ones don't appear. Assign products to categories on each product."
      />
      <CategoriesEditor initial={c.categories} counts={counts} />
    </>
  );
}
