import { PoliciesEditor } from "@/components/admin/editors-more";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getCmsFresh } from "@/lib/cms";

export const metadata = { title: "Policies" };

export default async function Page() {
  await requireAdmin();
  const c = await getCmsFresh();
  return (
    <>
      <PageTitle title="Policies" sub="Privacy, terms, shipping and refund policies." />
      <PoliciesEditor initial={c.policies} />
    </>
  );
}
