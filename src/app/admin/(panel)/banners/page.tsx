import { BannersEditor } from "@/components/admin/editors";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getCmsFresh } from "@/lib/cms";

export const metadata = { title: "Banners" };

export default async function BannersPage() {
  await requireAdmin();
  const c = await getCmsFresh();
  return (
    <>
      <PageTitle title="Home page banners" sub="The slides at the top of the home page — photo or video, text and buttons. Drag order with ↑ ↓." />
      <BannersEditor initial={c.banners} categories={c.categories.map((x) => ({ handle: x.handle, label: x.label }))} />
    </>
  );
}
