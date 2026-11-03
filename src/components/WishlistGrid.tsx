"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useWishlist } from "@/lib/wishlist";
import { ProductCard } from "./ProductCard";

export function WishlistGrid() {
  const items = useWishlist();
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-parchment bg-ivory-deep/60 px-6 py-12 text-center" role="status">
        <Heart className="mx-auto h-9 w-9 text-gold-deep" strokeWidth={1} aria-hidden="true" />
        <p className="mt-3 font-display text-[1.35rem] text-charcoal">Nothing saved yet</p>
        <p className="mt-1 text-[0.92rem] text-ink-muted">Tap the heart on any piece to keep it here.</p>
        <Link href="/shop" className="btn btn-primary mt-6">
          Start shopping
        </Link>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
      {items.map((p) => (
        <li key={p.handle}>
          <ProductCard product={p} location="wishlist" />
        </li>
      ))}
    </ul>
  );
}
