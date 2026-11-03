import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/PolicyPage";
import { getCms } from "@/lib/cms";
import { shippingLabel } from "@/lib/cms-types";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description: "Shipping charges and estimated delivery times for Ishmayi orders.",
  alternates: { canonical: "/policies/shipping" },
};

export default async function ShippingPage() {
  const { store } = await getCms();
  return (
    <PolicyPage policy="shipping" title="Shipping Policy" intro="How and when your order reaches you.">
      <h2>Shipping charges</h2>
      <p>{shippingLabel(store)}. Any charge is shown at checkout before you pay.</p>

      <h2>Delivery time</h2>
      <p>
        Estimated delivery is {store.deliveryDays} days from order confirmation. Because many pieces are
        handcrafted to order, timelines can vary slightly; we will keep you informed if your order needs more time.
      </p>

      <h2>Order confirmation</h2>
      <p>
        {site.codEnabled
          ? "Online-paid orders are confirmed once payment is received; Cash on Delivery orders are confirmed by phone or WhatsApp before dispatch."
          : "Your order is confirmed once full payment has been received at checkout on this website."} You will
        receive an order confirmation, and tracking details once your parcel is dispatched.
      </p>

      <h2>Delivery address</h2>
      <p>
        Please check your delivery address carefully at checkout. If you need to change it, contact us as soon as
        possible; we can only update it before the order is dispatched.
      </p>

      <h2>Damaged or missing parcels</h2>
      <p>
        <strong>A video of the parcel being opened is mandatory.</strong> Please record one continuous video from the sealed package to the
        item inside. If any piece arrives damaged, we will refund it. Upload your unboxing video on our{" "}
        <Link href="/report-damage">Report a damaged parcel</Link> page within 24 hours of delivery. See our{" "}
        <Link href="/policies/cancellation-refund">Cancellation &amp; Refund Policy</Link>.
      </p>
    </PolicyPage>
  );
}
