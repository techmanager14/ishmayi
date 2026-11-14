import { OccasionsEditor } from "@/components/admin/OccasionsEditor";
import { PageTitle } from "@/components/admin/ui";
import { occasions as builtIn } from "@/data/shelves";
import { requireAdmin } from "@/lib/admin/auth";
import { getCollection } from "@/lib/catalog";
import { ALL_HANDLE } from "@/lib/catalog/config";
import { getCmsFresh } from "@/lib/cms";

export const metadata = { title: "Shop by Occasion" };

export default async function OccasionsPage() {
  await requireAdmin();
  const [cms, all] = await Promise.all([getCmsFresh(), getCollection(ALL_HANDLE).catch(() => null)]);
  const products = (all ?? []).map((p) => ({ handle: p.handle, title: p.title, image: p.image?.src ?? null })).sort((x, y) => x.title.localeCompare(y.title));
  return (
    <>
      <PageTitle title="Shop by Occasion" sub="Cards on the home page and the products in each." />
      <OccasionsEditor initial={cms.occasions} products={products} builtIn={builtIn.map((o) => o.slug)} />
    </>
  );
}
