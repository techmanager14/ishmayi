import { OpportunityList } from "@/components/admin/Opportunities";

export const metadata = { title: "Consultations" };

export default async function ConsultationsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  return <OpportunityList kind="consultation" status={status} q={q} />;
}
