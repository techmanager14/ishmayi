import { NextResponse, type NextRequest } from "next/server";
import { allShelves, shelfHref } from "@/data/shelves";
import { getCollection, type StoreProduct } from "@/lib/catalog";
import { ALL_HANDLE, getCatalogue } from "@/lib/catalog/config";

const MAX_PRODUCTS = 6;
const MAX_COLLECTIONS = 3;

export interface SearchResponse {
  collections: { href: string; title: string }[];
  products: (Pick<StoreProduct, "handle" | "title" | "subtitle" | "price"> & { image: string | null })[];
}

/** Search suggestions: product name, category, material and gemstone. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  const empty: SearchResponse = { collections: [], products: [] };
  if (q.length < 2) return NextResponse.json(empty);

  const [all, catalogue] = await Promise.all([getCollection(ALL_HANDLE), getCatalogue()]);
  const words = q.split(" ");
  const hit = (text: string) => words.every((w) => text.toLowerCase().includes(w));

  const collections = [
    ...catalogue.categories.map((c) => ({ href: `/shop?collection=${c.handle}`, title: c.label, match: c.label })),
    ...allShelves.map((s) => ({ href: shelfHref(s), title: s.title, match: `${s.title} ${s.keywords?.join(" ") ?? ""}` })),
  ];
  const seen = new Set<string>();

  return NextResponse.json({
    collections: collections
      .filter((c) => hit(c.match) && !seen.has(c.title) && seen.add(c.title))
      // A collection named after the search beats one that only lists it as a keyword.
      .sort((a, b) => Number(hit(b.title)) - Number(hit(a.title)))
      .slice(0, MAX_COLLECTIONS)
      .map(({ href, title }) => ({ href, title })),
    products: (all ?? [])
      .filter((p) => hit(`${p.title} ${p.subtitle ?? ""}`))
      .sort((a, b) => Number(b.available) - Number(a.available))
      .slice(0, MAX_PRODUCTS)
      .map((p) => ({ handle: p.handle, title: p.title, subtitle: p.subtitle, price: p.price, image: p.image?.src ?? null })),
  } satisfies SearchResponse);
}
