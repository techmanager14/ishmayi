import "server-only";
import { getCms } from "../cms";
import { getProduct } from "./index";

// "Perfect match": products the admin paired with each other (product editor →
// Perfect match). Pairings are stored both ways, so A lists B and B lists A.

export interface PairItem {
  handle: string;
  title: string;
  image: string | null;
  price: number;
  compareAtPrice: number | null;
  /** Cheapest option in stock, added to the bag with one tap. */
  variantId: string;
  /** Has sizes or options to pick, so the customer chooses on its own page. */
  needsChoice: boolean;
}

const MAX = 4;

async function toItem(handle: string): Promise<PairItem | null> {
  const p = await getProduct(handle).catch(() => null);
  const inStock = p?.variants.filter((v) => v.available) ?? [];
  if (!p || !inStock.length) return null;
  const v = inStock.reduce((a, b) => (b.price < a.price ? b : a));
  return { handle: p.handle, title: p.title, image: p.images[0]?.src ?? null, price: v.price, compareAtPrice: v.compareAtPrice, variantId: v.id, needsChoice: p.showVariantPicker };
}

/** In-stock matches for the given products, leaving out the products themselves. */
export async function perfectMatches(handles: string[]): Promise<PairItem[]> {
  const { pairings } = await getCms();
  const skip = new Set(handles);
  const ids = [...new Set(handles.flatMap((h) => pairings[h] ?? []))].filter((id) => !skip.has(id)).slice(0, MAX * 2);
  const items = (await Promise.all(ids.map(toItem))).filter((x): x is PairItem => x !== null);
  return items.slice(0, MAX);
}
