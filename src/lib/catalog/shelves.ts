import "server-only";
import { matchesShelf, shelfHref, type Shelf } from "@/data/shelves";
import { getCollection, type StoreProduct } from "./index";
import { ALL_HANDLE } from "./config";

const NEWEST_COUNT = 12;

/** On-sale products for a shelf: its keywords plus any GoHighLevel collection of the same slug. */
export async function shelfProducts(shelf: Shelf): Promise<StoreProduct[] | null> {
  const all = await getCollection(ALL_HANDLE);
  if (!all) return null;
  if (shelf.newest) return all.filter((p) => p.available).slice(0, NEWEST_COUNT);
  const inCollection = new Set(((await getCollection(shelf.slug).catch(() => null)) ?? []).map((p) => p.handle));
  const picked = shelf.handles ?? [];
  const byHandle = new Map(all.map((p) => [p.handle, p]));
  const first = picked.flatMap((h) => byHandle.get(h) ?? []);
  const rest = all.filter((p) => !picked.includes(p.handle) && (inCollection.has(p.handle) || matchesShelf(p, shelf)));
  return [...first, ...rest];
}

export interface ShelfView extends Shelf {
  href: string;
  /** null when the store could not be reached. */
  count: number | null;
}

/** Like shelfViews, but each shelf shows a different product photo where it can. */
export async function distinctShelfViews(shelves: Shelf[]): Promise<ShelfView[]> {
  const rows = await Promise.all(shelves.map(async (s) => ({ s, products: await shelfProducts(s) })));
  const used = new Set<string>();
  return rows.map(({ s, products }) => {
    const photos = (products ?? []).flatMap((p) => (p.image ? [p.image.src] : []));
    const image = s.image ?? photos.find((src) => !used.has(src)) ?? photos[0];
    if (image) used.add(image);
    return { ...s, href: shelfHref(s), count: products?.length ?? null, image };
  });
}

export const shelfViews = (shelves: Shelf[]): Promise<ShelfView[]> =>
  Promise.all(
    shelves.map(async (s) => {
      const products = await shelfProducts(s);
      // The shelf's own photo, else its first product's, else the artwork.
      return { ...s, href: shelfHref(s), count: products?.length ?? null, image: s.image ?? products?.find((p) => p.image)?.image?.src };
    }),
  );
