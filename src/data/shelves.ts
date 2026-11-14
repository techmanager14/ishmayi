// The storefront's merchandising structure: categories, collections, gemstones and
// styles. A "shelf" is any of these. It lists the on-sale products that match its
// keywords, plus everything in a GoHighLevel collection with the same slug, so a
// shelf fills up by itself as products are added. Structured so it can later come
// from an API without changing the components.

import type { StoreProduct } from "@/lib/catalog/types";

export type ArtMotif =
  | "necklace" | "ring" | "pendant" | "earrings" | "bracelet" | "pearlBracelet" | "pearls" | "stones" | "silver" | "rose" | "amethyst" | "roseQuartz"
  | "shawl" | "saree" | "painting" | "indian" | "western" | "daily" | "clothing" | "sparkle" | "diya" | "bolt" | "tag" | "ticket" | "boxes" | "sets";
export type ArtTone = "plum" | "ink" | "sand" | "rose" | "amethyst" | "sage" | "pearl";

export interface Shelf {
  slug: string;
  title: string;
  blurb: string;
  motif: ArtMotif;
  tone: ArtTone;
  /** Real photograph; takes the place of the artwork once there is one. */
  image?: string;
  /** Match when the product name or details contain one of these words. */
  keywords?: string[];
  /** ...and also one of these (e.g. stone words + "bracelet"). */
  within?: string[];
  /** Newest products instead of a keyword match. */
  newest?: boolean;
  /** Products picked by hand in the admin (shown first). */
  handles?: string[];
}

/** Gemstone names, without the generic word "stone". */
const GEMSTONES = [
  "amethyst", "quartz", "agate", "aquamarine", "aventurine", "carnelian", "citrine", "garnet", "jade", "jasper",
  "lapis", "moonstone", "obsidian", "onyx", "pyrite", "selenite", "sunstone", "tiger eye", "tourmaline", "turquoise", "amazonite", "labradorite", "fluorite",
];

const STONE_WORDS = [
  "stone", "gemstone", "amethyst", "quartz", "agate", "aquamarine", "aventurine", "carnelian", "citrine", "garnet", "jade", "jasper",
  "lapis", "moonstone", "obsidian", "onyx", "pyrite", "selenite", "sunstone", "tiger eye", "tourmaline", "turquoise", "amazonite",
];

/** Home: the row of category tiles. Set `image` on a shelf to use your own photo. */
export const quickNav: Shelf[] = [
  { slug: "shop-bracelets", title: "मणिबंध - Bracelets", blurb: "Bracelets, bangles and kadas.", motif: "bracelet", tone: "plum", image: "/tiles/bracelets.jpg", keywords: ["bracelet", "bangle", "kada"] },
  { slug: "shop-earrings", title: "Earrings", blurb: "Studs, drops and jhumkas.", motif: "earrings", tone: "plum", image: "/tiles/earrings.jpg", keywords: ["earring", "jhumka", "stud"] },
  { slug: "shop-pendants", title: "Pendants", blurb: "Pendants to wear close.", motif: "pendant", tone: "plum", image: "/tiles/pendants.jpg", keywords: ["pendant"] },
  { slug: "shop-necklaces", title: "Necklace", blurb: "Necklaces and necklace sets.", motif: "necklace", tone: "plum", image: "/tiles/necklaces.jpg", keywords: ["necklace"] },
  { slug: "shop-rings", title: "Rings", blurb: "Rings for every day and every occasion.", motif: "ring", tone: "plum", image: "/tiles/rings.jpg", keywords: ["ring"] },
  { slug: "shop-hasli", title: "Hasli", blurb: "Traditional collar necklaces.", motif: "necklace", tone: "plum", image: "/tiles/hasli.jpg", keywords: ["hasli", "choker", "collar"] },
];

/** Earlier tiles: no longer in the tile row, but their links (menu, search, New Arrivals) still work. */
export const moreShelves: Shelf[] = [
  { slug: "stone-bracelets", title: "Stone Bracelets", blurb: "Natural stones, made to layer.", motif: "bracelet", tone: "amethyst", keywords: STONE_WORDS, within: ["bracelet"] },
  { slug: "pearl-bracelets", title: "Pearl Bracelets", blurb: "Soft lustre for the wrist.", motif: "pearlBracelet", tone: "sand", keywords: ["pearl"], within: ["bracelet"] },
  { slug: "stone-necklaces", title: "Stone Necklaces", blurb: "Colour and character, close to you.", motif: "necklace", tone: "plum", keywords: STONE_WORDS, within: ["necklace"] },
  { slug: "shawls", title: "Shawls", blurb: "Fine weaves with an easy drape.", motif: "shawl", tone: "rose", keywords: ["shawl", "stole", "pashmina"] },
  { slug: "sarees", title: "Sarees", blurb: "Six yards, beautifully considered.", motif: "saree", tone: "sage", keywords: ["saree", "sari"] },
  { slug: "paintings", title: "Paintings", blurb: "Original work for your walls.", motif: "painting", tone: "ink", keywords: ["painting", "artwork"] },
  { slug: "stone-jewellery", title: "Stone Jewellery", blurb: "Jewellery set with natural stones.", motif: "stones", tone: "plum", keywords: STONE_WORDS },
  { slug: "pearl-collection", title: "Pearl Collection", blurb: "Pieces finished with lustrous pearls.", motif: "pearls", tone: "sand", keywords: ["pearl"] },
  { slug: "silver-collection", title: "Silver Collection", blurb: "Silver pieces with a clean, bright finish.", motif: "silver", tone: "ink", keywords: ["silver", "925"] },
  { slug: "clothing", title: "Clothing", blurb: "Shawls, sarees and fine textiles.", motif: "clothing", tone: "rose", keywords: ["shawl", "stole", "pashmina", "saree", "sari", "dupatta", "kurta", "kurti", "dress"] },
  { slug: "new-arrivals", title: "New Arrivals", blurb: "The latest additions to Ishmayi.", motif: "sparkle", tone: "sage", newest: true },
];

/** Home: the category grid. */
export const featuredCategories: Shelf[] = [
  { slug: "semiprecious-stones", title: "Semiprecious natural stones", blurb: "Amethyst, rose quartz, citrine and more.", motif: "stones", tone: "plum", image: "/tiles/category-stones.jpg", keywords: GEMSTONES },
  { slug: "original-pearl", title: "Original Pearl jewellery", blurb: "Natural and freshwater pearls.", motif: "pearls", tone: "sand", image: "/tiles/category-pearl.jpg", keywords: ["natural pearl", "freshwater pearl", "original pearl", "real pearl"] },
  { slug: "sterling-silver", title: "925 sterling silver jewellery", blurb: "Hallmark-grade 925 silver.", motif: "silver", tone: "ink", image: "/tiles/category-silver.jpg", keywords: ["925", "sterling"] },
  { slug: "demifine-steel", title: "Demifine 316L steel jewellery", blurb: "316L stainless steel, made for everyday wear.", motif: "western", tone: "sand", image: "/tiles/category-demifine.jpg", keywords: ["316l", "stainless steel", "demifine", "demi-fine"] },
];

/** Explore: by material. */
export const exploreCollections: Shelf[] = [
  { slug: "stone", title: "Stone", blurb: "Natural stones in every colour.", motif: "stones", tone: "plum", keywords: STONE_WORDS },
  { slug: "pearl", title: "Pearl", blurb: "Quiet, lustrous and timeless.", motif: "pearls", tone: "sand", keywords: ["pearl"] },
  { slug: "silver", title: "Silver", blurb: "Clean lines in bright metal.", motif: "silver", tone: "ink", keywords: ["silver", "925"] },
  { slug: "rose-collection", title: "Rose Collection", blurb: "Blush tones and rose quartz.", motif: "rose", tone: "rose", keywords: ["rose"] },
];

/** Explore: by gemstone. Add more stones here as the range grows. */
export const exploreGemstones: Shelf[] = [
  { slug: "amethyst", title: "Amethyst", blurb: "A deep, regal violet quartz.", motif: "amethyst", tone: "amethyst", keywords: ["amethyst"] },
  { slug: "rose-quartz", title: "Rose Quartz", blurb: "A soft, translucent blush pink.", motif: "roseQuartz", tone: "rose", keywords: ["rose quartz"] },
];

/** Explore: by style. */
export const exploreStyles: Shelf[] = [
  { slug: "indian", title: "Indian", blurb: "Antique finishes and traditional forms.", motif: "indian", tone: "plum", keywords: ["antique", "oxidised", "oxidized", "filigree", "kada", "kundan", "temple", "jhumka", "saree", "shawl"] },
  { slug: "western", title: "Foreign / Western", blurb: "Modern shapes with a minimal line.", motif: "western", tone: "ink", keywords: ["modern", "contemporary", "western", "minimal"] },
  { slug: "daily-wear", title: "Daily Wear", blurb: "Light, easy pieces for every day.", motif: "daily", tone: "sage", keywords: ["anklet", "daily", "everyday", "bangles"] },
];

/** Home: shop by occasion. */
export const occasions: Shelf[] = [
  { slug: "wedding", title: "Wedding", blurb: "Statement pieces for the big day.", motif: "indian", tone: "plum", image: "/tiles/occasion-wedding.jpg", keywords: ["wedding", "bridal", "statement", "filigree", "kundan", "temple"] },
  { slug: "office", title: "Office", blurb: "Polished pieces for the working day.", motif: "western", tone: "ink", image: "/tiles/occasion-office.jpg", keywords: ["office", "minimal", "modern", "contemporary", "pendant", "stud"] },
  { slug: "daily", title: "Daily", blurb: "Light, easy pieces for every day.", motif: "daily", tone: "sage", image: "/tiles/occasion-daily.jpg", keywords: ["daily", "everyday", "anklet", "bangle"] },
  { slug: "festive", title: "Festive", blurb: "Pieces made for celebration.", motif: "diya", tone: "sand", image: "/tiles/occasion-festive.jpg", keywords: ["festive", "festival", "antique", "oxidised", "oxidized", "jhumka", "green"] },
];

/** Offers: matching sets, the natural starting point for a bulk order. */
export const setsShelf: Shelf = { slug: "sets", title: "Sets", blurb: "Matching sets, ready to gift or buy in quantity.", motif: "sets", tone: "sand", keywords: ["set"] };

export const allShelves: Shelf[] = [...quickNav, ...moreShelves, ...featuredCategories, ...exploreCollections, ...exploreGemstones, ...exploreStyles, ...occasions, setsShelf];

export const shelfBySlug = (slug: string | null | undefined) => allShelves.find((s) => s.slug === slug);
export const shelfHref = (s: Pick<Shelf, "slug">) => `/shop?collection=${s.slug}`;

const hasWord = (text: string, word: string) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`).test(text);

/** True when a product belongs on a shelf by its name and details. */
export function matchesShelf(p: Pick<StoreProduct, "title" | "subtitle">, shelf: Shelf) {
  if (!shelf.keywords?.length) return false;
  const text = `${p.title} ${p.subtitle ?? ""}`.toLowerCase();
  if (shelf.within?.length && !shelf.within.some((w) => hasWord(text, w))) return false;
  return shelf.keywords.some((k) => hasWord(text, k));
}
