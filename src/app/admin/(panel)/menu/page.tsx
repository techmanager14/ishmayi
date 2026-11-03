import { NavEditor } from "@/components/admin/editors-more";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getCmsFresh } from "@/lib/cms";

export const metadata = { title: "Menu" };

export default async function Page() {
  await requireAdmin();
  const c = await getCmsFresh();
  return (
    <>
      <PageTitle title="Menu" sub="The main menu links." />
      <NavEditor initial={c.nav} />
    </>
  );
}
