// Offers page content. Discount wording is never invented: a percentage appears
// only when `discountLabel` is set here or the listed products really are reduced
// (a compare-at price in GoHighLevel).

import type { ArtMotif, ArtTone } from "./shelves";

export interface PromoCard {
  title: string;
  body: string;
  href: string;
  motif: ArtMotif;
  tone: ArtTone;
}

export const promoCards: PromoCard[] = [
  { title: "Offers", body: "Pieces at reduced prices, right now.", href: "#current-offers", motif: "tag", tone: "plum" },
  { title: "Promo Codes", body: "Codes you can copy and use at checkout.", href: "/promo-codes", motif: "ticket", tone: "sand" },
  { title: "Bulk Orders with Discounts", body: "Buying in quantity? Ask us for a quote.", href: "/bulk-orders", motif: "boxes", tone: "rose" },
  { title: "Filtering Sets / Bulk Order", body: "Browse and filter matching sets.", href: "/shop?collection=sets", motif: "sets", tone: "sage" },
];

export interface LimitedOffer {
  id: string;
  title: string;
  body: string;
  /** e.g. "Up to 20% off". Empty: worked out from reduced prices, if there are any. */
  discountLabel?: string;
  /** Last moment of the offer (ISO). No date: no countdown, and it never expires by itself. */
  endsAt?: string;
  motif: ArtMotif;
  tone: ArtTone;
  image?: string;
}

export const limitedOffers: LimitedOffer[] = [
  {
    id: "diwali-sale",
    title: "Diwali Sale",
    body: "A festive edit of jewellery for gifting and celebration.",
    endsAt: "2026-11-10T23:59:59+05:30",
    motif: "diya",
    tone: "sand",
  },
  {
    id: "flash-sale",
    title: "Flash Sale",
    body: "A short, sharp sale on selected pieces. Be quick, it won't last.",
    endsAt: "2026-11-07T23:59:59+05:30",
    motif: "bolt",
    tone: "rose",
  },
];

/** A limited offer is active until its end time passes. */
/** Every campaign has its own page. */
export const saleHref = (o: Pick<LimitedOffer, "id">) => `/sale/${o.id}`;

export const isOfferActive = (o: Pick<LimitedOffer, "endsAt">, now = Date.now()) => !o.endsAt || Date.parse(o.endsAt) > now;
