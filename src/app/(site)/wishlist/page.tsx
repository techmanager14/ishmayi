import type { Metadata } from "next";
import { PageHero } from "@/components/Sections";
import { WishlistGrid } from "@/components/WishlistGrid";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false, follow: true } };

export default function WishlistPage() {
  return (
    <>
      <PageHero eyebrow="Wishlist" title="Your wishlist">
        <p>Pieces you&apos;ve saved are kept on this device, ready when you are.</p>
      </PageHero>
      <section className="container-page py-10 md:py-14">
        <WishlistGrid />
      </section>
    </>
  );
}
