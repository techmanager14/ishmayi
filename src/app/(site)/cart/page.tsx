import type { Metadata } from "next";
import { CartView } from "@/components/CartView";
import { PageHero } from "@/components/Sections";

export const metadata: Metadata = { title: "Your cart", robots: { index: false, follow: true } };

export default function CartPage() {
  return (
    <>
      <PageHero eyebrow="Cart" title="Your cart" />
      <section className="container-page py-8 md:py-12">
        <CartView />
      </section>
    </>
  );
}
