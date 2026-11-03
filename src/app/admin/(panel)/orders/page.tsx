import { OpportunityList } from "@/components/admin/Opportunities";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  return <OpportunityList kind="order" status={status} q={q} />;
}
