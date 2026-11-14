import { ReviewsEditor } from "@/components/admin/editors";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getCmsFresh } from "@/lib/cms";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  await requireAdmin();
  const c = await getCmsFresh();
  return (
    <>
      <PageTitle title="Reviews" sub="Customer reviews." />
      <ReviewsEditor initial={c.reviews} />
    </>
  );
}
