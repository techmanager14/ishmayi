import "server-only";
import { cache } from "react";
import { ghlConfigured, ghlProvider } from "./ghl";
import type { CollectionSummary, ProductDetail, StoreProduct } from "./types";

// The shop is the client's GoHighLevel store. Without GHL settings the shop is
// simply empty ("launching soon") — nothing from the old catalogue is shown.

const isGhlId = (handle: string) => /^[a-f0-9]{24}$/i.test(handle);

export const getCollection = cache(async (handle: string): Promise<StoreProduct[] | null> => {
  if (!ghlConfigured()) return [];
  return ghlProvider.collection(handle);
});

/** fresh = read prices live from the store (quick view, checkout). */
export const getProduct = cache(async (handle: string, fresh = false): Promise<ProductDetail | null> => {
  if (!isGhlId(handle) || !ghlConfigured()) return null;
  const p = await ghlProvider.product(handle, { fresh });
  return p ? { ...p, purchasable: true } : null;
});

/** Ordering is open once the GHL store is connected. */
export const checkoutAllowed = async () => ghlConfigured();

export async function getCollectionProducts(handle: string, limit = 24): Promise<StoreProduct[] | null> {
  return (await getCollection(handle))?.slice(0, limit) ?? null;
}

export async function getCollectionSummary(handle: string): Promise<CollectionSummary | null> {
  const products = await getCollection(handle);
  if (!products) return null;
  const prices = products.filter((p) => p.available && p.price).map((p) => p.price!);
  return {
    count: products.length,
    minPrice: prices.length ? Math.min(...prices) : null,
    image: products.find((p) => p.image)?.image ?? null,
  };
}

export { shopifySrcSet, thumbUrl } from "../images";
export type { CollectionSummary, ProductDetail, StoreProduct } from "./types";
