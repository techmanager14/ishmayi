// The pill row above the home page products. Plain data, so a later API can supply it.

import type { StoreProduct } from "@/lib/catalog/types";
import { matchesShelf, type Shelf } from "./shelves";

/**
 * Handles of real best sellers, most popular first. "Most Bought" stays hidden
 * while this is empty, so the site never claims popularity it can't show.
 */
export const MOST_BOUGHT: string[] = [];

const giftShelf = (keywords: string[]): Shelf => ({ slug: "", title: "", blurb: "", motif: "sets", tone: "sand", keywords });

export interface ProductChip {
  id: string;
  label: string;
  /** Where "View all" leads for this chip. */
  href: string;
  pick: (products: StoreProduct[]) => StoreProduct[];
}

export const productChips: ProductChip[] = [
  { id: "under-5000", label: "Under ₹5,000", href: "/shop?max=5000", pick: (all) => all.filter((p) => p.price !== null && p.price < 5000) },
  { id: "for-you", label: "For You", href: "/shop", pick: (all) => all },
  {
    id: "most-bought",
    label: "Most Bought",
    href: "/shop",
    pick: (all) => MOST_BOUGHT.flatMap((handle) => all.filter((p) => p.handle === handle)),
  },
  {
    id: "for-brother",
    label: "For Brother",
    href: "/shop?collection=shop-bracelets",
    pick: (all) => all.filter((p) => matchesShelf(p, giftShelf(["kada", "bracelet", "pendant", "ring"]))),
  },
  {
    id: "for-sister",
    label: "For Sister",
    href: "/shop?collection=sets",
    pick: (all) => all.filter((p) => matchesShelf(p, giftShelf(["necklace", "earring", "anklet", "bangle", "set"]))),
  },
];
