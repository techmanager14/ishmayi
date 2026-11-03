import { ContentEditor } from "@/components/admin/editors";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getCmsFresh } from "@/lib/cms";

export const metadata = { title: "Content & FAQs" };

export default async function ContentPage() {
  await requireAdmin();
  const c = await getCmsFresh();
  return (
    <>
      <PageTitle title="Content & FAQs" sub="Announcement bar and FAQs. Changes go live as soon as you save." />
      <ContentEditor initial={{ announcement: c.announcement, faqs: c.faqs }} />
    </>
  );
}
