import { PagesEditor } from "@/components/admin/editors-more";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getCmsFresh } from "@/lib/cms";

export const metadata = { title: "Pages & text" };

export default async function Page() {
  await requireAdmin();
  const c = await getCmsFresh();
  return (
    <>
      <PageTitle title="Pages & text" sub="Brand lines, section titles, pillars and the About page." />
      <PagesEditor initial={c.pages} />
    </>
  );
}
