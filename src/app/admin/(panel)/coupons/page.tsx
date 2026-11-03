import { CouponsEditor } from "@/components/admin/editors-more";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getCmsFresh } from "@/lib/cms";

export const metadata = { title: "Discount codes" };

export default async function Page() {
  await requireAdmin();
  const c = await getCmsFresh();
  return (
    <>
      <PageTitle title="Discount codes" sub="Codes customers can use at checkout. Discounts are checked on the server." />
      <CouponsEditor initial={c.coupons} />
    </>
  );
}
