import "server-only";
import { getCollection } from "./index";
import { getCatalogue } from "./config";

// The round tile row at the top of the home and shop pages. It lists the categories
// from the admin panel (Admin → Categories) that aren't hidden, in the same order.

export interface CategoryTile {
  slug: string;
  href: string;
  title: string;
  image?: string;
}

/** Built-in photos and labels for the launch categories, used until the admin sets their own. */
const BUILT_IN: Record<string, { label: string; title: string; image: string }> = {
  bracelets: { label: "Bracelets", title: "मणिबंध - Bracelets", image: "/tiles/bracelets.jpg" },
  earrings: { label: "Earrings", title: "Earrings", image: "/tiles/earrings.jpg" },
  pendants: { label: "Pendants", title: "Pendants", image: "/tiles/pendants.jpg" },
  necklaces: { label: "Necklaces", title: "Necklace", image: "/tiles/necklaces.jpg" },
  rings: { label: "Rings", title: "Rings", image: "/tiles/rings.jpg" },
  hasli: { label: "Hasli", title: "Hasli", image: "/tiles/hasli.jpg" },
};

export async function categoryTiles(): Promise<CategoryTile[]> {
  const { all } = await getCatalogue();
  return Promise.all(
    all
      .filter((c) => c.status !== "hidden")
      .map(async (c) => {
        const built = BUILT_IN[c.handle];
        // Photo: the admin's own, else the built-in one, else the category's first product photo.
        const image = c.image || built?.image || ((await getCollection(c.handle)) ?? []).find((p) => p.image)?.image?.src;
        // A renamed category shows its new name; an untouched one keeps its tile label.
        const title = built && c.label === built.label ? built.title : c.label;
        return { slug: c.handle, href: `/shop?collection=${c.handle}`, title, image };
      }),
  );
}
