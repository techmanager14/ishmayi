import { OpportunityDetail } from "@/components/admin/Opportunities";

export const metadata = { title: "Consultation" };

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OpportunityDetail kind="consultation" id={id} />;
}
