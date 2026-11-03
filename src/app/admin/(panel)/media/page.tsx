import { MediaLibrary } from "@/components/admin/media";
import { Card, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = { title: "Media library" };

export default async function MediaPage() {
  await requireAdmin();
  return (
    <>
      <PageTitle title="Media library" sub="Photos and videos stored in your GoHighLevel media storage. Use them in banners, categories, products and videos." />
      <Card>
        <MediaLibrary manage />
      </Card>
    </>
  );
}
