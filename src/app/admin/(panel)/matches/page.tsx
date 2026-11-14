import { MatchesEditor } from "@/components/admin/MatchesEditor";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getCollection } from "@/lib/catalog";
import { ALL_HANDLE } from "@/lib/catalog/config";
import { getCmsFresh } from "@/lib/cms";

export const metadata = { title: "Perfect match" };

export default async function MatchesPage() {
  await requireAdmin();
  const [cms, all] = await Promise.all([getCmsFresh(), getCollection(ALL_HANDLE).catch(() => null)]);
  const products = (all ?? []).map((p) => ({ handle: p.handle, title: p.title, image: p.image?.src ?? null })).sort((x, y) => x.title.localeCompare(y.title));
  return (
    <>
      <PageTitle title="Perfect match" sub="Pieces suggested together." />
      <MatchesEditor initial={cms.pairings} products={products} />
    </>
  );
}
