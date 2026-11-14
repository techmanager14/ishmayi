import "server-only";
import { occasions as builtIn, type Shelf } from "@/data/shelves";
import { getCms } from "@/lib/cms";

/**
 * "Shop by Occasion" shelves as set in the admin (Admin → Shop by Occasion): name, photo,
 * hand-picked products and, for the built-in occasions, optional keyword matching.
 * Hidden occasions are left out unless `includeHidden` (so their links still open).
 */
export async function occasionShelves({ includeHidden = false } = {}): Promise<Shelf[]> {
  const { occasions } = await getCms();
  return occasions.items
    .filter((o) => includeHidden || o.enabled)
    .map((o) => {
      const b = builtIn.find((x) => x.slug === o.id);
      return {
        slug: o.id,
        title: o.title,
        blurb: o.blurb || b?.blurb || `Pieces for ${o.title.toLowerCase()}.`,
        motif: b?.motif ?? "sparkle",
        tone: b?.tone ?? "plum",
        image: o.image || undefined,
        keywords: o.autoMatch ? b?.keywords : undefined,
        handles: o.products,
      };
    });
}
