import { cache } from "react";
import { ALL_HANDLE, getCatalogue } from "./config";
import { slugify, splitTitle, toParagraphs } from "./text";
import type { CatalogProvider, ProductDetail, ProductImage, ProductVariant, StoreProduct } from "./types";

// GoHighLevel (LeadConnector API v2) store. Server-only: the private
// integration token never reaches the browser.
//
//   GET /products/?locationId=…            products (paged)
//   GET /products/{id}/price?locationId=…  prices = variants (amount in rupees)
//   GET /products/collections?altId=…&altType=location  store collections
//
// Categories on this site map to GHL collections by slug or name (see
// the admin panel → Categories). Only products in an on-sale collection are listed or sold.

const env = (k: string) => process.env[k]?.trim() ?? "";
// GHL_API_BASE only exists so the integration can be tested against a mock server.
const apiBase = () => env("GHL_API_BASE") || "https://services.leadconnectorhq.com";

export { ghlConfigured } from "../ghl-api";
import { ghlConfigured } from "../ghl-api";

/** Cache tag for every GHL catalogue request (purged by /api/revalidate). */
export const GHL_TAG = "ghl-catalog";
// GoHighLevel allows ~100 API requests / 10 s and 200,000 / day per location, shared
// by the site, the admin and checkout. A listing refresh costs ~1 request per product,
// so listings refresh every 15 minutes (or instantly via /api/revalidate and admin
// edits); product quick views are cached for 1 minute. Checkout is always live.
const LISTING_TTL = 900;
const PRODUCT_TTL = 60;

async function ghl<T>(path: string, params: Record<string, string | number> = {}, opts: { fresh?: boolean; ttl?: number } = {}): Promise<T | null> {
  const url = new URL(apiBase() + path);
  url.searchParams.set("locationId", env("GHL_LOCATION_ID"));
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  // Retry politely on GHL's rate limit (≈100 requests / 10 s), server errors and
  // dropped connections; give up on real errors (401, 404…) straight away.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${env("GHL_PRIVATE_TOKEN")}`,
          Version: env("GHL_API_VERSION") || "2021-07-28",
          Accept: "application/json",
        },
        ...(opts.fresh ? { cache: "no-store" as const } : { next: { revalidate: opts.ttl ?? LISTING_TTL, tags: [GHL_TAG] } }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return (await res.json()) as T;
      if (res.status !== 429 && res.status < 500) {
        console.warn(`[ghl] ${path} → ${res.status}`);
        return null;
      }
      console.warn(`[ghl] ${path} → ${res.status} (retrying)`);
    } catch (err) {
      console.warn(`[ghl] ${path} failed: ${err instanceof Error ? (err.cause as Error | undefined)?.message ?? err.name : "error"} (retrying)`);
    }
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }
  return null;
}

// ---- Raw shapes (only the fields we use; everything optional to be safe) ----
interface GhlMedia {
  url?: string;
  type?: string;
  isFeatured?: boolean;
  title?: string;
}
interface GhlProduct {
  _id: string;
  name?: string;
  description?: string;
  image?: string;
  medias?: GhlMedia[];
  productType?: string;
  availableInStore?: boolean;
  collectionIds?: string[];
  isLabelEnabled?: boolean;
}
interface GhlPrice {
  _id: string;
  name?: string;
  amount?: number;
  currency?: string;
  compareAtPrice?: number;
  availableQuantity?: number;
  trackInventory?: boolean;
  allowOutOfStockPurchases?: boolean;
  type?: string;
}
interface GhlCollection {
  _id: string;
  name?: string;
  slug?: string;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

function images(p: GhlProduct, alt: string): ProductImage[] {
  const list: ProductImage[] = [];
  const media = [...(p.medias ?? [])].sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured));
  for (const m of media) if (m.url && (!m.type || m.type === "image")) list.push({ src: m.url, alt: m.title || alt });
  if (p.image && !list.some((i) => i.src === p.image)) list.unshift({ src: p.image, alt });
  return list.slice(0, 10);
}

function variants(prices: GhlPrice[]): ProductVariant[] {
  return prices
    .filter((pr) => pr.type !== "recurring" && num(pr.amount) !== null)
    .map((pr) => {
      const price = num(pr.amount)!;
      const compare = num(pr.compareAtPrice);
      const inStock = !pr.trackInventory || pr.allowOutOfStockPurchases || (pr.availableQuantity ?? 0) > 0;
      return { id: pr._id, title: pr.name || "Default", price, compareAtPrice: compare && compare > price ? compare : null, available: isInr(pr) && inStock };
    });
}
// Payments are taken in rupees, so only INR prices can be bought.
const isInr = (pr: GhlPrice) => !pr.currency || pr.currency.toUpperCase() === "INR";

/** Every product id in the store (paged, cached). */
const allProducts = cache(async (): Promise<GhlProduct[] | null> => {
  const out: GhlProduct[] = [];
  for (let offset = 0; offset < 2000; offset += 100) {
    const page = await ghl<{ products?: GhlProduct[] }>("/products/", { limit: 100, offset });
    if (!page) return offset === 0 ? null : out;
    const list = page.products ?? [];
    out.push(...list);
    if (list.length < 100) break;
  }
  // Whatever the client marks "Available in store" in GHL can be listed (if in an on-sale collection).
  return out.filter((p) => p.availableInStore !== false);
});

const pricesFor = cache(async (productId: string, fresh = false, ttl?: number): Promise<GhlPrice[] | null> => {
  const res = await ghl<{ prices?: GhlPrice[] }>(`/products/${encodeURIComponent(productId)}/price`, { limit: 100 }, { fresh, ttl });
  return res ? (res.prices ?? []) : null;
});

const collections = cache(async (): Promise<GhlCollection[]> => {
  const res = await ghl<{ data?: GhlCollection[]; collections?: GhlCollection[] }>("/products/collections", {
    altId: env("GHL_LOCATION_ID"),
    altType: "location",
    limit: 100,
  });
  return res?.data ?? res?.collections ?? [];
});

/** Run async work with limited concurrency (GHL allows ~100 requests / 10 s). */
async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

/** Priced listing of every store product (GHL's list endpoint has no prices, photos gallery or collections). */
async function buildListing(): Promise<StoreProduct[] | null> {
  const [all, sale] = await Promise.all([allProducts(), onSaleIds()]);
  if (!all || !sale) return null;
  const products = all.filter((p) => sale.has(p._id));
  const priced = await mapLimit(products, 2, async (p) => {
    const raw = await pricesFor(p._id);
    return { p, v: variants(raw ?? []), failed: raw === null };
  });
  // A price that couldn't be read this time keeps the product's last known listing.
  const previous = new Map((current?.data ?? []).map((x) => [x.handle, x]));
  return priced
    .filter(({ p, v, failed }) => v.length > 0 || (failed && previous.has(p._id)))
    .map(({ p, v, failed }) => {
      if (failed && v.length === 0) return previous.get(p._id)!;
      const { title, subtitle } = splitTitle(p.name ?? "Untitled");
      const cheapest = v.reduce((x, y) => (y.price < x.price ? y : x));
      return {
        handle: p._id,
        title,
        subtitle,
        image: images(p, title)[0] ?? null,
        price: cheapest.price,
        compareAtPrice: cheapest.compareAtPrice,
        available: v.some((x) => x.available),
      };
    });
}

// Building the listing costs ~1 GHL request per product (~15 s for 150 products),
// so all visitors on this server share one copy and one in-flight build, and a
// stale copy is served instantly while a fresh one builds in the background
// (stale-while-revalidate). Only the very first visit after a deploy waits.
let current: { at: number; data: StoreProduct[] } | null = null;
let building: Promise<StoreProduct[] | null> | null = null;
// A refresh asked for while a build is already running (which may have read old
// data) runs again as soon as that build finishes.
let again = false;

function rebuild() {
  building ??= buildListing()
    .then((data) => {
      if (data) current = { at: Date.now(), data };
      return data;
    })
    .catch(() => null)
    .finally(() => {
      building = null;
      if (again) {
        again = false;
        void rebuild();
      }
    });
  return building;
}

/** Refresh the shared listing now (called by /api/revalidate and admin edits after a change in GHL). */
export function resetGhlListing(): Promise<unknown> {
  if (current) current.at = 0;
  if (building) {
    again = true;
    // Resolves once the follow-up build (with fresh data) has finished.
    return building.then(() => building ?? null);
  }
  return rebuild();
}

const listing = cache(async (): Promise<StoreProduct[] | null> => {
  if (!current) return (await rebuild()) ?? null;
  if (Date.now() - current.at > LISTING_TTL * 1000) void rebuild();
  return current.data;
});

/** Product ids in a GHL collection (list endpoint filtered by collectionIds). */
const collectionMembers = cache(async (collectionId: string): Promise<Set<string> | null> => {
  const ids = new Set<string>();
  for (let offset = 0; offset < 2000; offset += 100) {
    const page = await ghl<{ products?: GhlProduct[] }>("/products/", { limit: 100, offset, collectionIds: collectionId });
    if (!page) return offset === 0 ? null : ids;
    for (const p of page.products ?? []) ids.add(p._id);
    if ((page.products ?? []).length < 100) break;
  }
  return ids;
});

/** Our category handle → GHL collection id (matched by slug or by label). */
async function collectionIdFor(handle: string): Promise<string | null> {
  const label = (await getCatalogue()).all.find((c) => c.handle === handle)?.label ?? handle;
  const cols = await collections();
  const want = new Set([handle, slugify(label), slugify(handle.replace(/-/g, " "))]);
  return cols.find((c) => want.has(c.slug ?? "") || want.has(slugify(c.name ?? "")))?._id ?? null;
}

/** Ids of every product in an on-sale collection (null if GHL couldn't be read). */
const onSaleIds = cache(async (): Promise<Set<string> | null> => {
  const ids = new Set<string>();
  for (const c of (await getCatalogue()).categories) {
    const id = await collectionIdFor(c.handle);
    if (!id) continue; // collection not created in GHL yet
    const members = await collectionMembers(id);
    if (!members) return null;
    members.forEach((m) => ids.add(m));
  }
  return ids;
});

export const ghlProvider: CatalogProvider = {
  async collection(handle) {
    const all = await listing();
    if (!all) return null;
    if (handle === ALL_HANDLE) return all;
    const id = await collectionIdFor(handle);
    if (!id) return [];
    const members = await collectionMembers(id);
    return members ? all.filter((p) => members.has(p.handle)) : null;
  },

  async product(handle, opts) {
    if (!/^[A-Za-z0-9_-]{6,64}$/.test(handle)) return null;
    // Single-product lookup: includes the photo gallery, and finds brand-new products immediately.
    const raw = await ghl<GhlProduct & { product?: GhlProduct }>(`/products/${encodeURIComponent(handle)}`, {}, { fresh: opts?.fresh, ttl: PRODUCT_TTL });
    const p = raw?.product ?? raw;
    if (!p?._id || p.availableInStore === false) return null;
    if (!(await onSaleIds())?.has(p._id)) return null; // not in an on-sale collection
    const v = variants((await pricesFor(p._id, opts?.fresh, PRODUCT_TTL)) ?? []);
    if (v.length === 0) return null;
    const { title, subtitle } = splitTitle(p.name ?? "Untitled");
    const detail: ProductDetail = {
      handle: p._id,
      title,
      subtitle,
      description: toParagraphs(p.description ?? ""),
      images: images(p, title),
      variants: v,
      showVariantPicker: v.length > 1,
      // e.g. bangles: "Size 2.4" / "Red & Gold · Size 2.6"
      optionName: v.every((x) => /\bsize\b/i.test(x.title)) ? (v.some((x) => x.title.includes("·")) ? "Colour & size" : "Size") : "Option",
    };
    return detail;
  },
};
