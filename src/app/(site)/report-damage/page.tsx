import type { Metadata } from "next";
import Link from "next/link";
import { DamageClaimForm } from "@/components/DamageClaimForm";
import { PageHero } from "@/components/Sections";

// Submitting a claim copies the video (up to 300 MB) into GoHighLevel.
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Report a damaged parcel",
  description: "Upload your unboxing video within 24 hours of delivery and we will refund any piece that arrived damaged.",
  alternates: { canonical: "/report-damage" },
};

export default function ReportDamagePage() {
  return (
    <>
      <PageHero eyebrow="Damaged parcel?" title="Report a damaged parcel">
        <p>If any piece arrived damaged, we will refund it. Upload your unboxing video within 24 hours of delivery.</p>
      </PageHero>
      <section className="container-page py-10 md:py-14">
        <ul className="mx-auto mb-8 grid max-w-3xl gap-3 sm:grid-cols-3">
          {[
            ["🎥", "Video is mandatory", "One continuous video from the sealed parcel to the item inside."],
            ["⏱️", "Within 24 hours", "Upload it within 24 hours of delivery."],
            ["↩️", "Full refund", "If the piece is damaged, we refund it to your payment method."],
          ].map(([icon, t, b]) => (
            <li key={t} className="rounded-2xl border border-parchment bg-white p-4 text-center">
              <span className="text-2xl" aria-hidden="true">
                {icon}
              </span>
              <p className="mt-1 font-bold text-charcoal">{t}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{b}</p>
            </li>
          ))}
        </ul>
        <DamageClaimForm />
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-ink-muted">
          See our{" "}
          <Link href="/policies/cancellation-refund" className="font-semibold text-burgundy hover:underline">
            Cancellation &amp; Refund Policy
          </Link>
          . Trouble uploading?{" "}
          <Link href="/contact" className="font-semibold text-burgundy hover:underline">
            Contact us
          </Link>
          .
        </p>
      </section>
    </>
  );
}
