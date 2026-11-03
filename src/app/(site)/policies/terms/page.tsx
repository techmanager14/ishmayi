import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/PolicyPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using the Ishmayi website and ordering products.",
  alternates: { canonical: "/policies/terms" },
};

export default function TermsPage() {
  return (
    <PolicyPage policy="terms" title="Terms of Use" intro="The terms that apply when you use this website and order from us.">
      <h2>About these terms</h2>
      <p>
        {site.name} is operated by {site.legalName}. By using this website or placing an order, you agree to these terms.
      </p>

      <h2>Orders</h2>
      <ul>
        <li>{site.codEnabled ? "Orders can be paid in full online at checkout, or by Cash on Delivery (cash or UPI to the delivery partner)." : "Full (100%) payment is required at the time of placing an order."}</li>
        <li>Listed prices exclude GST, which is added at checkout and shown before you pay.</li>
        <li>
          Orders are placed and paid for on this website; payments are processed securely by Razorpay. See our{" "}
          <Link href="/policies/shipping">Shipping Policy</Link> and{" "}
          <Link href="/policies/cancellation-refund">Cancellation &amp; Refund Policy</Link>.
        </li>
        <li>Natural stones vary in colour, pattern and size; small variations from photographs are part of their character.</li>
      </ul>

      <h2>Offers and promo codes</h2>
      <p>
        Offers and promo codes are subject to the conditions shown with them, may end at any time and cannot be exchanged for cash. One offer applies per order unless stated.
      </p>

      <h2>Earlier consultation bookings</h2>
      <p>
        We no longer offer consultations. Any consultation booked and paid for before this change remains covered by the terms you accepted when you booked; please <Link href="/contact">contact us</Link> with any questions.
      </p>

      <h2>Website content</h2>
      <p>
        All text, designs and images on this website belong to {site.legalName} or its licensors and may not be copied
        without permission. The final price and availability are confirmed at checkout.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent permitted by law, we are not liable for indirect or consequential loss arising from use of this
        website. Nothing in these terms limits your rights as a consumer under Indian law.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India, and the courts of Mumbai have jurisdiction.</p>
    </PolicyPage>
  );
}
