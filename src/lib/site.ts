const clean = (value: string | undefined) => (value ?? "").trim();

export const site = {
  name: "Ishmayi",
  /** The registered business behind the store: used on invoices and in legal notices. */
  legalName: "Trivana Creations LLP",
  tagline: "Premium Adornments & Heritage",
  description: "Ishmayi is a premium jewellery house: stone and pearl jewellery, gemstones, textiles and curated collections, delivered across India.",
  url: (clean(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000").replace(/\/$/, ""),
  address: {
    street: "A 102, Mansi Regency CHS Ltd., I C Colony",
    locality: "Borivali West",
    city: "Mumbai",
    postalCode: "400103",
    region: "Maharashtra",
    country: "IN",
  },
  // Business contact details (from the client's GoHighLevel profile); env vars override.
  contact: {
    phone: clean(process.env.NEXT_PUBLIC_CONTACT_PHONE) || "+91 81697 35026",
    email: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL) || "trivanacreations99@gmail.com",
    whatsapp: (clean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) || "918169735026").replace(/\D/g, ""),
  },
  gaId: clean(process.env.NEXT_PUBLIC_GA_ID),
  /** Cash on Delivery is not offered (client decision): every order is paid online. */
  codEnabled: false as boolean,
  /** Flip to true once the business has reviewed the policy pages. */
  policiesReviewed: true,
} as const;

/** Built-in store settings; the admin panel can change them. */
export const storeDefaults = {
  deliveryDays: "7–15",
  rewardAmount: 500,
  rewardWindowHours: 24,
} as const;

export const formatInr = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

/** With paise when there are any (₹3,397.97): for GST, totals and anything actually charged. */
export const formatInrExact = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }).format(amount);

export const whatsappLink = (text?: string) =>
  site.contact.whatsapp
    ? `https://wa.me/${site.contact.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`
    : "";

export const hasAnyContact = Boolean(site.contact.phone || site.contact.email || site.contact.whatsapp);

export const nav = [
  { href: "/about", label: "About" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact" },
] as const;

export const policyLinks = [
  { href: "/policies/privacy", label: "Privacy Notice" },
  { href: "/policies/terms", label: "Terms of Use" },
  { href: "/policies/shipping", label: "Shipping Policy" },
  { href: "/policies/cancellation-refund", label: "Cancellation & Refunds" },
] as const;
