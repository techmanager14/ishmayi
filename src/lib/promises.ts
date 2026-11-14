// Product page promises ("7–15 day delivery", "Secure payment", …). Each product stores a list
// of preset ids and/or its own custom text in the website content (cms.promises).
import { shippingLabel, type CmsContent } from "./cms-types";

export const PROMISE_PRESETS = ["delivery", "secure", "damage", "shipping", "handcrafted", "silver", "natural", "skin", "gift"] as const;
export type PromisePreset = (typeof PROMISE_PRESETS)[number];
/** What a product shows until the admin picks its own. */
export const DEFAULT_PROMISES: string[] = ["delivery", "secure", "damage"];
export const MAX_PROMISES = 6;

export interface ProductPromise {
  /** Preset id, or "custom" for the admin's own text. */
  kind: PromisePreset | "custom";
  label: string;
}

const isPreset = (v: string): v is PromisePreset => (PROMISE_PRESETS as readonly string[]).includes(v);

export function promiseLabel(id: string, store: CmsContent["store"]): string {
  if (!isPreset(id)) return id;
  return {
    delivery: `${store.deliveryDays} day delivery`,
    secure: "Secure payment",
    damage: "Damage cover",
    shipping: shippingLabel(store),
    handcrafted: "Handcrafted",
    silver: "925 sterling silver",
    natural: "Natural stones",
    skin: "Skin-friendly",
    gift: "Gift-ready packing",
  }[id];
}

/** A product's promises, ready to show. */
export function productPromises(cms: Pick<CmsContent, "promises" | "store">, productId: string): ProductPromise[] {
  return (cms.promises[productId] ?? DEFAULT_PROMISES).map((id) => ({ kind: isPreset(id) ? id : "custom", label: promiseLabel(id, cms.store) }));
}
