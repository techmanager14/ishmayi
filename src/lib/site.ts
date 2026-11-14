const clean = (value: string | undefined) => (value ?? "").trim();

export const site = {
  name: "Ishmayi",
  /** The registered business behind the store (invoices, legal notices). Set NEXT_PUBLIC_LEGAL_NAME if it differs from the brand. */
  legalName: clean(process.env.NEXT_PUBLIC_LEGAL_NAME) || "Ishmayi",
  tagline: "Premium Adornments & Heritage",
  description: "Ishmayi is a premium jewellery house: stone and pearl jewellery, gemstones, textiles and curated collections, delivered across India.",
  url: (clean(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000").replace(/\/$/, ""),
  // Ishmayi's registered office. Empty fields are hidden on the site until filled in.
  address: {
    street: clean(process.env.NEXT_PUBLIC_ADDRESS_STREET),
    locality: clean(process.env.NEXT_PUBLIC_ADDRESS_LOCALITY),
    city: clean(process.env.NEXT_PUBLIC_ADDRESS_CITY),
    postalCode: clean(process.env.NEXT_PUBLIC_ADDRESS_POSTCODE),
    region: clean(process.env.NEXT_PUBLIC_ADDRESS_REGION),
    country: "IN",
  },
  // Ishmayi's contact details (also editable in Admin → Settings).
  contact: {
    phone: clean(process.env.NEXT_PUBLIC_CONTACT_PHONE),
    email: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
    whatsapp: clean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER).replace(/\D/g, ""),
  },
  gaId: clean(process.env.NEXT_PUBLIC_GA_ID),
  /**
   * Cash on Delivery master switch (NEXT_PUBLIC_ALLOW_COD=false turns it off everywhere).
   * At checkout COD is offered when the admin turns it on, or automatically while online
   * payment (Razorpay) isn't set up — see codOffered() in lib/payments.
   */
  codEnabled: process.env.NEXT_PUBLIC_ALLOW_COD !== "false",
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

/** The registered address as one line, or "" while it hasn't been set. */
export const addressLine = [site.address.street, site.address.locality, [site.address.city, site.address.postalCode].filter(Boolean).join(" – ")].filter(Boolean).join(", ");

/** "Operated by …" only says something when the legal name differs from the brand. */
export const operatedBy = site.legalName !== site.name ? site.legalName : "";

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
