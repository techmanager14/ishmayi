import { MediaLibrary } from "@/components/admin/media";
import { Card, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = { title: "Media library" };

export default async function MediaPage() {
  await requireAdmin();
  return (
    <>
      <PageTitle title="Media library" sub="Your photos and videos." />
      <Card>
        <MediaLibrary manage />
      </Card>
    </>
  );
}
