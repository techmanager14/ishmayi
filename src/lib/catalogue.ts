// Which store collections the site shows. Only products in the "on sale"
// collections are listed or can be bought — everything else in the GoHighLevel
// store stays hidden.

export interface Category {
  /** Collection handle (matched to a GoHighLevel store collection by slug or name). */
  handle: string;
  label: string;
  /** One line shown on category tiles and the shop header. */
  blurb: string;
}

export const catalogue = {
  /** Pseudo-collection: every product on sale ("All jewellery"). */
  allHandle: "all",
  /** On sale now — add products to these collections in GHL and they appear here. */
  categories: [
    { handle: "bracelets", label: "Bracelets", blurb: "Bracelets, bangles and kadas." },
    { handle: "earrings", label: "Earrings", blurb: "Studs, drops and jhumkas." },
    { handle: "pendants", label: "Pendants", blurb: "Pendants to wear close." },
    { handle: "necklaces", label: "Necklaces", blurb: "Necklaces and necklace sets." },
    { handle: "rings", label: "Rings", blurb: "Rings for every day and every occasion." },
  ] satisfies Category[],
  /** Announced, not on sale yet. Check the GHL collection holds only the new range before moving one to categories. */
  comingSoon: [{ handle: "hasli", label: "Hasli", blurb: "Traditional collar necklaces, coming soon." }] satisfies Category[],
  /** Legacy store setting, kept so saved content stays valid. */
  zodiacHandle: "necklaces",
};

