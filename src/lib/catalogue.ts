// Which store collections the site shows. Only products in the "on sale"
// collections are listed or can be bought — everything else in the GoHighLevel
// store (malas, rings, older stock…) stays hidden.

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
    { handle: "necklaces", label: "Necklaces", blurb: "Including 12 unique necklaces, one for each zodiac sign." },
    { handle: "pyrite-anklets", label: "Pyrite Anklets", blurb: "Natural pyrite anklets, made to wear every day." },
    { handle: "fashion-jewellery", label: "Fashion Jewellery", blurb: "Necklaces, bangles, earrings and more — contemporary designs." },
  ] satisfies Category[],
  /** Announced, not on sale yet. Check the GHL collection holds only the new range before moving one to categories. */
  comingSoon: [
    { handle: "pendants", label: "Pendants", blurb: "Our pendant collection is on its way." },
    { handle: "bracelets", label: "Bracelets", blurb: "Our bracelet collection is on its way." },
  ] satisfies Category[],
  /** Legacy store setting, kept so saved content stays valid. */
  zodiacHandle: "necklaces",
};

