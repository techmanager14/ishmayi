import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/PolicyPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description: "Cancellation and refund terms for Ishmayi orders.",
  alternates: { canonical: "/policies/cancellation-refund" },
};

export default function CancellationRefundPage() {
  return (
    <PolicyPage policy="refund" title="Cancellation & Refunds" intro="What happens if you need to cancel or have a concern about your order.">
      <h2>Orders</h2>
      <ul>
        <li>{site.codEnabled ? "Orders can be paid online at order placement or by Cash on Delivery." : "Orders require full payment at order placement."}</li>
        <li>Made-to-order pieces are crafted specifically for you, so they cannot be cancelled once production has begun.</li>
      </ul>

      <h2>Damaged parcels: unboxing video required</h2>
      <ul>
        <li>
          <strong>Please record a video while opening your parcel</strong>, from the sealed package to the item inside, in one continuous clip
          without cuts. This video is <strong>mandatory</strong> for any damage claim.
        </li>
        <li>
          If any piece arrives damaged, <strong>we will refund it</strong>, in full or in part depending on the damage. Upload your unboxing video on our{" "}
          <Link href="/report-damage">Report a damaged parcel</Link> page <strong>within 24 hours of delivery</strong>, with your order
          number and the phone number you ordered with.
        </li>
        <li>Claims without an unboxing video, or reported more than 24 hours after delivery, cannot be accepted.</li>
        <li>Once we have reviewed your video, the refund is issued to your original payment method.</li>
      </ul>

      <h2>How refunds are paid</h2>
      <p>
        Approved refunds are issued to the original payment method through Razorpay. Processing times depend on your
        bank or payment provider.
      </p>

      <h2>Earlier consultation bookings</h2>
      <p>
        We no longer offer consultations. If you have a consultation booked and paid for, please <Link href="/contact">contact us</Link> and we will help you.
      </p>
    </PolicyPage>
  );
}
