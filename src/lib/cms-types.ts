// Everything on the website that the admin panel can change. Stored as one JSON
// value in GoHighLevel (see cms.ts). Shared by the server and the browser. The
// defaults are the site's built-in content: anything not yet edited in the admin
// falls back to them, and malformed data is repaired by normaliseCms().

import { brand, pillars, story } from "@/content/brand";
import { faqGroups, type Faq } from "@/content/faqs";
import type { QA, Testimonial } from "@/content/testimonials";
import { catalogue } from "./catalogue";
import { nav, site, storeDefaults } from "./site";

export type CategoryStatus = "live" | "soon" | "hidden";
export interface CmsCategory {
  /** URL handle; also the slug of its GoHighLevel product collection. */
  handle: string;
  label: string;
  blurb: string;
  status: CategoryStatus;
  /** Tile image; empty = first product photo, then artwork. */
  image: string;
}

export type BannerTone = "light" | "dark" | "cream";
export interface CmsBanner {
  id: string;
  enabled: boolean;
  eyebrow: string;
  title: string;
  highlight: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  /** Photo (desktop right side + phones). */
  image: string;
  /** Optional MP4/WebM shown instead of the photo. */
  video: string;
  /** When no photo: show photos of this category's products. */
  productsFrom: string;
  tone: BannerTone;
}

export interface CmsVideo {
  id: string;
  enabled: boolean;
  title: string;
  caption: string;
  /** MP4/WebM URL or a YouTube link. */
  url: string;
  poster: string;
}

export interface CmsVideoReview {
  id: string;
  enabled: boolean;
  /** MP4 (site path or uploaded media URL). */
  src: string;
  poster: string;
  /** Seconds (shown on the card). */
  duration: number;
  /** Reviewer name — empty shows "Customer review". */
  name: string;
  /** Subtitle under the name, e.g. who they are. */
  context: string;
}

export type CmsTextReview = Testimonial & { enabled: boolean };

export interface CmsCoupon {
  code: string;
  type: "percent" | "flat";
  value: number;
  /** Minimum order (₹) for the code to apply; 0 = none. */
  minOrder: number;
  active: boolean;
  /** Listed on the public Offers page. Off by default so private codes stay private. */
  showOnOffers: boolean;
  /** Last valid day (YYYY-MM-DD, India time); empty = no expiry. */
  expires: string;
  note: string;
}

export interface Heading {
  title: string;
  sub: string;
}
export const HEADING_KEYS = ["categories", "offers", "limited", "featured", "collections", "gemstones", "styles", "faqs"] as const;
export type HeadingKey = (typeof HEADING_KEYS)[number];
export const POLICY_KEYS = ["privacy", "terms", "shipping", "refund"] as const;
export type PolicyKey = (typeof POLICY_KEYS)[number];

export interface CmsPages {
  brand: { tagline: string; promise: string; essence: string };
  headings: Record<HeadingKey, Heading>;
  pillars: { title: string; body: string }[];
  about: { title: string; intro: string; storyTitle: string; story: string[] };
}

export const SECTION_KEYS = ["quickNav", "categories", "entries", "trust", "products", "waysToBuy", "occasions"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export const SECTION_LABELS: Record<SectionKey, string> = {
  quickNav: "Category tiles",
  categories: "Featured categories",
  entries: "Offers banner",
  trust: "Shipping & payment strip",
  products: "Products",
  waysToBuy: "Offers, bulk orders & gifting cards",
  occasions: "Shop by occasion",
};

/**
 * Bump when the built-in storefront content changes in a way saved content must not
 * override. Content saved under an older revision keeps its business data (categories,
 * discount codes, store settings, contact details) but takes the new banners, menu,
 * FAQs, section titles and SEO text; the next admin save records the new revision.
 */
export const CONTENT_REV = 2;

export interface CmsContent {
  contentRev: number;
  announcement: { enabled: boolean; text: string; link: string };
  banners: CmsBanner[];
  videos: CmsVideo[];
  categories: CmsCategory[];
  sections: Record<SectionKey, boolean>;
  contact: { phone: string; email: string; whatsapp: string };
  faqs: { title: string; id: string; items: Faq[] }[];
  reviews: { videos: CmsVideoReview[]; texts: CmsTextReview[] };
  coupons: CmsCoupon[];
  pages: CmsPages;
  nav: { label: string; href: string }[];
  /** Custom policy text (simple formatting); empty = the built-in policy. */
  policies: Record<PolicyKey, string>;
  store: {
    /** Pause online ordering (shop stays visible). */
    ordersOpen: boolean;
    closedMessage: string;
    /** Flat delivery charge (₹); 0 = free shipping. */
    shippingFee: number;
    /** Orders at or above this (after discount) ship free; 0 = never. */
    freeShippingAbove: number;
    whatsappButton: boolean;
    whatsappMessage: string;
    codEnabled: boolean;
    codMaxAmount: number;
    deliveryDays: string;
    benefitAmount: number;
    benefitHours: number;
    /** Category whose products are matched to the 12 zodiac signs. */
    zodiacCategory: string;
    /** GST added on top of the listed prices (%), and the codes printed on invoices. */
    gstJewellery: number;
    gstConsultation: number;
    hsnJewellery: string;
    sacConsultation: string;
    /** Loyalty: spend more than `loyaltyMinSpend` on jewellery → `loyaltyPercent`% off the next order within `loyaltyDays`. */
    loyaltyPercent: number;
    loyaltyMinSpend: number;
    loyaltyDays: number;
  };
  business: { name: string; address: string; phone: string; email: string; gstin: string; invoiceNotes: string; invoiceTerms: string; dueDays: number };
  seo: { title: string; description: string; image: string };
  social: { instagram: string; facebook: string; youtube: string };
}

const banner = (b: Partial<CmsBanner> & Pick<CmsBanner, "id">): CmsBanner => ({
  enabled: true,
  eyebrow: "",
  title: "",
  highlight: "",
  body: "",
  ctaLabel: "",
  ctaHref: "",
  secondaryLabel: "",
  secondaryHref: "",
  image: "",
  video: "",
  productsFrom: "",
  tone: "light",
  ...b,
});

export const defaultCms: CmsContent = {
  contentRev: CONTENT_REV,
  announcement: { enabled: false, text: "", link: "" },
  banners: [
    banner({
      id: "offers",
      tone: "dark",
      eyebrow: "Special offers",
      title: "The season's",
      highlight: "finest offers.",
      body: "Promo codes, limited-time campaigns and pieces at reduced prices, all in one place.",
      ctaLabel: "View offers",
      ctaHref: "/offers",
    }),
    banner({
      id: "catalogue",
      tone: "cream",
      eyebrow: "Product catalogue",
      title: "The complete",
      highlight: "Ishmayi catalogue.",
      body: "Necklaces, anklets, bangles and statement sets. Browse everything, then filter by price or availability.",
      ctaLabel: "Shop all",
      ctaHref: "/shop",
    }),
    banner({
      id: "lookbook",
      tone: "light",
      eyebrow: "The lookbook",
      title: "Made to be",
      highlight: "worn.",
      body: "Explore by material, gemstone and style to find what feels like you.",
      ctaLabel: "Explore",
      ctaHref: "/explore",
    }),
    banner({
      id: "seasonal",
      tone: "dark",
      eyebrow: "Seasonal campaign",
      title: "A festive edit for",
      highlight: "Diwali.",
      body: "Jewellery for gifting and celebration, chosen for the season of light.",
      ctaLabel: "See the campaign",
      ctaHref: "/offers#limited-offers",
    }),
  ],
  videos: [],
  categories: [
    ...catalogue.categories.map((c) => ({ ...c, status: "live" as const, image: "" })),
    ...catalogue.comingSoon.map((c) => ({ ...c, status: "soon" as const, image: "" })),
  ],
  sections: Object.fromEntries(SECTION_KEYS.map((k) => [k, true])) as Record<SectionKey, boolean>,
  contact: { phone: site.contact.phone, email: site.contact.email, whatsapp: site.contact.whatsapp },
  faqs: faqGroups,
  reviews: { videos: [], texts: [] },
  coupons: [],
  pages: {
    brand: { tagline: brand.tagline, promise: brand.promise, essence: brand.essence },
    headings: {
      categories: { title: "Shop by Category", sub: "Jewellery, textiles and art, chosen with care." },
      offers: { title: "Offers & Discounts", sub: "Every way to save, in one place." },
      limited: { title: "Limited-Time Offers", sub: "Seasonal campaigns, here for a short while." },
      featured: { title: "Featured Products", sub: "A closer look at pieces from the collection." },
      collections: { title: "Explore by Collection", sub: "Begin with the material you love." },
      gemstones: { title: "Explore by Gemstone", sub: "Every piece set with the stone you are looking for." },
      styles: { title: "Explore by Style", sub: "From traditional forms to everyday ease." },
      faqs: { title: "Questions, answered", sub: "Ordering, payment, delivery and returns." },
    },
    pillars: pillars.map((x) => ({ ...x })),
    about: { title: "About Ishmayi", intro: brand.essence, storyTitle: "Our story", story: [...story] },
  },
  nav: nav.map((n) => ({ ...n })),
  policies: { privacy: "", terms: "", shipping: "", refund: "" },
  store: {
    ordersOpen: true,
    closedMessage: "Online ordering is paused for a short while. Please message us on WhatsApp to order.",
    shippingFee: 0,
    freeShippingAbove: 0,
    whatsappButton: true,
    whatsappMessage: "Hello Ishmayi, I have a question about a product.",
    codEnabled: site.codEnabled,
    codMaxAmount: 25000,
    deliveryDays: storeDefaults.deliveryDays,
    benefitAmount: storeDefaults.rewardAmount,
    benefitHours: storeDefaults.rewardWindowHours,
    zodiacCategory: catalogue.zodiacHandle,
    gstJewellery: 3,
    gstConsultation: 18,
    hsnJewellery: "7117",
    sacConsultation: "999799",
    loyaltyPercent: 5,
    loyaltyMinSpend: 2000,
    loyaltyDays: 30,
  },
  business: {
    name: site.legalName,
    address: `${site.address.street}, ${site.address.locality}, ${site.address.city} – ${site.address.postalCode}, ${site.address.region}`,
    phone: site.contact.phone,
    email: site.contact.email,
    gstin: "",
    invoiceNotes: "Thank you for choosing Ishmayi.",
    invoiceTerms: "Prices exclude GST (3% on jewellery, HSN 7117). Shipping within India is free. Goods once delivered can be returned only as per our Cancellation & Refund Policy.",
    dueDays: 7,
  },
  seo: { title: `${site.name} | ${site.tagline}`, description: site.description, image: "" },
  social: { instagram: "", facebook: "", youtube: "" },
};

// ---------- Validation ----------

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, d: string, max = 2000) => (typeof v === "string" ? v.slice(0, max) : d);
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
const num = (v: unknown, d: number, min = 0, max = 1e9) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : d;
};
/** Only https URLs and site paths are allowed for links and media. */
const url = (v: unknown, d = "") => {
  const s = str(v, d, 600).trim();
  return s === "" || s.startsWith("/") || /^https:\/\//i.test(s) ? s : d;
};
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
const id = (v: unknown, i: number) => (typeof v === "string" && /^[a-z0-9-]{1,40}$/i.test(v) ? v : `item-${i + 1}`);

export function normaliseCms(raw: unknown): CmsContent {
  const r = isObj(raw) ? raw : {};
  const d = defaultCms;

  // Saved under an older revision: storefront copy falls back to the built-in content.
  const current = r.contentRev === CONTENT_REV;

  const faqs = current && Array.isArray(r.faqs)
    ? (r.faqs as unknown[]).filter(isObj).map((g, i) => ({
        title: str(g.title, "Questions", 60),
        id: id(g.id, i),
        items: (Array.isArray(g.items) ? (g.items as unknown[]) : [])
          .filter(isObj)
          .filter((f) => typeof f.q === "string" && f.q.trim())
          .map((f) => ({ q: str(f.q, "", 300), a: str(f.a, "", 3000) })),
      }))
    : d.faqs;

  const banners = current && Array.isArray(r.banners)
    ? (r.banners as unknown[]).filter(isObj).slice(0, 10).map((b, i) =>
        banner({
          id: id(b.id, i),
          enabled: bool(b.enabled, true),
          eyebrow: str(b.eyebrow, "", 120),
          title: str(b.title, "", 120),
          highlight: str(b.highlight, "", 120),
          body: str(b.body, "", 400),
          ctaLabel: str(b.ctaLabel, "", 40),
          ctaHref: url(b.ctaHref),
          secondaryLabel: str(b.secondaryLabel, "", 40),
          secondaryHref: url(b.secondaryHref),
          image: url(b.image),
          video: url(b.video),
          productsFrom: slug(str(b.productsFrom, "", 60)),
          tone: (["light", "dark", "cream"] as const).includes(b.tone as BannerTone) ? (b.tone as BannerTone) : "light",
        }),
      )
    : d.banners;

  const videos = Array.isArray(r.videos)
    ? (r.videos as unknown[]).filter(isObj).slice(0, 12).map((v, i) => ({
        id: id(v.id, i),
        enabled: bool(v.enabled, true),
        title: str(v.title, "", 100),
        caption: str(v.caption, "", 200),
        url: url(v.url),
        poster: url(v.poster),
      }))
    : d.videos;

  const seen = new Set<string>();
  const categories = Array.isArray(r.categories)
    ? (r.categories as unknown[])
        .filter(isObj)
        .map((c) => ({
          handle: slug(str(c.handle, "", 60)) || slug(str(c.label, "", 60)),
          label: str(c.label, "", 40).trim(),
          blurb: str(c.blurb, "", 160),
          status: (["live", "soon", "hidden"] as const).includes(c.status as CategoryStatus) ? (c.status as CategoryStatus) : "hidden",
          image: url(c.image),
        }))
        .filter((c) => c.handle && c.label && c.handle !== "all" && !seen.has(c.handle) && seen.add(c.handle))
        .slice(0, 30)
    : d.categories;

  const qaList = (v: unknown): QA[] =>
    (Array.isArray(v) ? v : []).filter(isObj).map((x) => ({ q: str(x.q, "", 300), a: str(x.a, "", 4000) })).filter((x) => x.q.trim() || x.a.trim());
  const rv = isObj(r.reviews) ? r.reviews : {};
  const reviews = {
    videos: Array.isArray(rv.videos)
      ? (rv.videos as unknown[]).filter(isObj).slice(0, 40).map((v, i) => ({
          id: id(v.id, i),
          enabled: bool(v.enabled, true),
          src: url(v.src),
          poster: url(v.poster),
          duration: Math.round(num(v.duration, 0, 0, 36000)),
          name: str(v.name, "", 80),
          context: str(v.context, "", 200),
        })).filter((v) => v.src)
      : d.reviews.videos,
    texts: Array.isArray(rv.texts)
      ? (rv.texts as unknown[]).filter(isObj).slice(0, 60).map((t, i) => {
          const qa = qaList(t.qa);
          const letter = (Array.isArray(t.letter) ? (t.letter as unknown[]) : []).filter((p): p is string => typeof p === "string" && !!p.trim()).map((p) => p.slice(0, 4000));
          const orig = isObj(t.original) ? t.original : null;
          return {
            id: id(t.id, i),
            enabled: bool(t.enabled, true),
            name: str(t.name, "", 80),
            ...(str(t.city, "", 60) ? { city: str(t.city, "", 60) } : {}),
            ...(str(t.role, "", 120) ? { role: str(t.role, "", 120) } : {}),
            service: str(t.service, "", 60),
            highlight: str(t.highlight, "", 400),
            ...(qa.length ? { qa } : {}),
            ...(letter.length ? { letter } : {}),
            ...(orig && qaList(orig.qa).length ? { original: { language: str(orig.language, "", 30), lang: str(orig.lang, "", 10), qa: qaList(orig.qa) } } : {}),
            ...(t.endorsement === true ? { endorsement: true } : {}),
          };
        }).filter((t) => t.name && (t.highlight || t.qa || t.letter))
      : d.reviews.texts,
  };
  const sec = isObj(r.sections) ? r.sections : {};
  const st = isObj(r.store) ? r.store : {};
  const bz = isObj(r.business) ? r.business : {};
  const seo = isObj(r.seo) ? r.seo : {};
  const so = isObj(r.social) ? r.social : {};
  const c = isObj(r.contact) ? r.contact : {};
  const a = isObj(r.announcement) ? r.announcement : {};

  return {
    contentRev: CONTENT_REV,
    announcement: { enabled: a.enabled === true, text: str(a.text, "", 200), link: url(a.link) },
    banners,
    videos,
    categories: categories.length ? categories : d.categories,
    sections: Object.fromEntries(SECTION_KEYS.map((k) => [k, bool(current ? sec[k] : undefined, true)])) as Record<SectionKey, boolean>,
    contact: {
      phone: str(c.phone, d.contact.phone, 30),
      email: str(c.email, d.contact.email, 120),
      whatsapp: str(c.whatsapp, d.contact.whatsapp, 20).replace(/\D/g, ""),
    },
    faqs: faqs.length ? faqs : d.faqs,
    reviews,
    pages: normalisePages(current ? r.pages : undefined),
    nav: current && Array.isArray(r.nav)
      ? (r.nav as unknown[]).filter(isObj).map((n) => ({ label: str(n.label, "", 30).trim(), href: url(n.href) })).filter((n) => n.label && n.href).slice(0, 10)
      : d.nav,
    policies: Object.fromEntries(POLICY_KEYS.map((k) => [k, str(isObj(r.policies) ? r.policies[k] : "", "", 30000)])) as Record<PolicyKey, string>,
    coupons: Array.isArray(r.coupons)
      ? (r.coupons as unknown[]).filter(isObj).slice(0, 50).map((c) => ({
          code: str(c.code, "", 30).toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
          type: c.type === "flat" ? ("flat" as const) : ("percent" as const),
          value: Math.round(num(c.value, 0, 0, 1_000_000) * 100) / 100,
          minOrder: Math.round(num(c.minOrder, 0, 0, 10_000_000)),
          active: bool(c.active, true),
          showOnOffers: bool(c.showOnOffers, false),
          expires: /^\d{4}-\d{2}-\d{2}$/.test(str(c.expires, "", 10)) ? str(c.expires, "", 10) : "",
          note: str(c.note, "", 120),
        })).filter((c) => c.code && c.value > 0 && (c.type === "flat" || c.value <= 100))
      : d.coupons,
    store: {
      ordersOpen: bool(st.ordersOpen, d.store.ordersOpen),
      closedMessage: str(st.closedMessage, d.store.closedMessage, 300) || d.store.closedMessage,
      shippingFee: Math.round(num(st.shippingFee, 0, 0, 100_000)),
      freeShippingAbove: Math.round(num(st.freeShippingAbove, 0, 0, 10_000_000)),
      whatsappButton: bool(st.whatsappButton, true),
      whatsappMessage: (current && str(st.whatsappMessage, "", 300)) || d.store.whatsappMessage,
      codEnabled: bool(st.codEnabled, d.store.codEnabled),
      codMaxAmount: Math.round(num(st.codMaxAmount, d.store.codMaxAmount, 0, 10_000_000)),
      deliveryDays: str(st.deliveryDays, d.store.deliveryDays, 20) || d.store.deliveryDays,
      benefitAmount: Math.round(num(st.benefitAmount, d.store.benefitAmount, 0, 1_000_000)),
      benefitHours: Math.round(num(st.benefitHours, d.store.benefitHours, 0, 10_000)),
      zodiacCategory: slug(str(st.zodiacCategory, d.store.zodiacCategory, 60)) || d.store.zodiacCategory,
      gstJewellery: num(st.gstJewellery, d.store.gstJewellery, 0, 28),
      gstConsultation: num(st.gstConsultation, d.store.gstConsultation, 0, 28),
      hsnJewellery: str(st.hsnJewellery, d.store.hsnJewellery, 12),
      sacConsultation: str(st.sacConsultation, d.store.sacConsultation, 12),
      loyaltyPercent: num(st.loyaltyPercent, d.store.loyaltyPercent, 0, 50),
      loyaltyMinSpend: Math.round(num(st.loyaltyMinSpend, d.store.loyaltyMinSpend, 0, 10_000_000)),
      loyaltyDays: Math.round(num(st.loyaltyDays, d.store.loyaltyDays, 0, 365)),
    },
    business: {
      name: str(bz.name, d.business.name, 120) || d.business.name,
      address: str(bz.address, d.business.address, 300),
      phone: str(bz.phone, d.business.phone, 30),
      email: str(bz.email, d.business.email, 120),
      gstin: str(bz.gstin, "", 20).toUpperCase(),
      invoiceNotes: current ? str(bz.invoiceNotes, d.business.invoiceNotes, 1000) : d.business.invoiceNotes,
      invoiceTerms: current ? str(bz.invoiceTerms, d.business.invoiceTerms, 2000) : d.business.invoiceTerms,
      dueDays: Math.round(num(bz.dueDays, d.business.dueDays, 0, 365)),
    },
    seo: current ? { title: str(seo.title, d.seo.title, 120) || d.seo.title, description: str(seo.description, d.seo.description, 300), image: url(seo.image) } : d.seo,
    social: { instagram: url(so.instagram), facebook: url(so.facebook), youtube: url(so.youtube) },
  };
}

export const waLink = (number: string, text?: string) =>
  number ? `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}` : "";
export const slugify = slug;

/** YouTube watch/short/embed link → embed URL, or null. */
export function youtubeEmbed(link: string) {
  const m = link.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

/** Shipping wording from the store settings, e.g. "Free shipping" / "Free shipping over ₹2,000" / "Shipping ₹99". */
export function shippingLabel(store: Pick<CmsContent["store"], "shippingFee" | "freeShippingAbove">) {
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  if (store.shippingFee <= 0) return "Free shipping";
  if (store.freeShippingAbove > 0) return `Free shipping over ${inr(store.freeShippingAbove)}`;
  return `Shipping ${inr(store.shippingFee)}`;
}

function normalisePages(raw: unknown): CmsPages {
  const d = defaultCms.pages;
  const p = isObj(raw) ? raw : {};
  const b = isObj(p.brand) ? p.brand : {};
  const h = isObj(p.headings) ? p.headings : {};
  const a = isObj(p.about) ? p.about : {};
  const items = (v: unknown, def: { title: string; body: string }[]) =>
    Array.isArray(v)
      ? (v as unknown[]).filter(isObj).map((x) => ({ title: str(x.title, "", 80), body: str(x.body, "", 600) })).filter((x) => x.title).slice(0, 12)
      : def;
  const paras = (v: unknown, def: string[]) => (Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.slice(0, 2000)).slice(0, 20) : def);
  return {
    brand: { tagline: str(b.tagline, d.brand.tagline, 120) || d.brand.tagline, promise: str(b.promise, d.brand.promise, 200), essence: str(b.essence, d.brand.essence, 300) },
    headings: Object.fromEntries(
      HEADING_KEYS.map((k) => {
        const x = isObj(h[k]) ? (h[k] as Record<string, unknown>) : {};
        return [k, { title: str(x.title, d.headings[k].title, 120) || d.headings[k].title, sub: str(x.sub, d.headings[k].sub, 400) }];
      }),
    ) as Record<HeadingKey, Heading>,
    pillars: items(p.pillars, d.pillars),
    about: {
      title: str(a.title, d.about.title, 120) || d.about.title,
      intro: str(a.intro, d.about.intro, 300),
      storyTitle: str(a.storyTitle, d.about.storyTitle, 120),
      story: paras(a.story, d.about.story),
    },
  };
}
