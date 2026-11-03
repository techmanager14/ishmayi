import { VideosEditor } from "@/components/admin/editors";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getCmsFresh } from "@/lib/cms";

export const metadata = { title: "Videos" };

export default async function VideosPage() {
  await requireAdmin();
  const c = await getCmsFresh();
  return (
    <>
      <PageTitle title="Promotional videos" sub="Shown on the home page in a “Watch & Discover” section. Upload an MP4 or paste a YouTube link." />
      <VideosEditor initial={c.videos} />
    </>
  );
}
