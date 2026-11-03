"use client";

import { Heart } from "lucide-react";
import type { StoreProduct } from "@/lib/catalog/types";
import { useWishlist, wishlist } from "@/lib/wishlist";

export function WishlistButton({ product, className = "", withLabel = false }: { product: StoreProduct; className?: string; withLabel?: boolean }) {
  const saved = useWishlist().some((p) => p.handle === product.handle);
  const label = saved ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`;
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={label}
      onClick={() => wishlist.toggle(product)}
      className={
        withLabel
          ? `btn btn-outline w-full ${className}`
          : `flex h-10 w-10 items-center justify-center rounded-full bg-ivory/90 text-charcoal transition-colors hover:text-burgundy ${className}`
      }
    >
      <Heart className={`h-[18px] w-[18px] ${saved ? "fill-current" : ""}`} strokeWidth={1.5} aria-hidden="true" />
      {withLabel && (saved ? "Saved to wishlist" : "Save to wishlist")}
    </button>
  );
}
