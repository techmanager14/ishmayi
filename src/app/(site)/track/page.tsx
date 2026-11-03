import type { Metadata } from "next";
import { TrackForm } from "@/components/account/TrackForm";
import { PageHero } from "@/components/Sections";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your Ishmayi order with your order number and phone number.",
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <>
      <PageHero eyebrow="Track your order" title="Where is my order?">
        <p>Enter your order number (from your confirmation, e.g. TRV-ABC123) and the phone number you ordered with.</p>
      </PageHero>
      <section className="container-page py-10 md:py-16">
        <TrackForm />
      </section>
    </>
  );
}
