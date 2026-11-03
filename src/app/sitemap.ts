import type { MetadataRoute } from "next";
import { getCollection } from "@/lib/catalog";
import { ALL_HANDLE } from "@/lib/catalog/config";
import { limitedOffers, saleHref } from "@/data/offers";
import { site } from "@/lib/site";

const routes = [
  { path: "", priority: 1 },
  { path: "/shop", priority: 0.9 },
  { path: "/offers", priority: 0.8 },
  { path: "/explore", priority: 0.8 },
  { path: "/promo-codes", priority: 0.7 },
  { path: "/gift-sets", priority: 0.7 },
  { path: "/gifting", priority: 0.7 },
  { path: "/bulk-orders", priority: 0.7 },
  { path: "/jewellery-care", priority: 0.5 },
  { path: "/about", priority: 0.6 },
  { path: "/faqs", priority: 0.5 },
  { path: "/contact", priority: 0.6 },
  { path: "/policies", priority: 0.3 },
  { path: "/policies/privacy", priority: 0.3 },
  { path: "/policies/terms", priority: 0.3 },
  { path: "/policies/shipping", priority: 0.3 },
  { path: "/policies/cancellation-refund", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = (await getCollection(ALL_HANDLE)) ?? [];
  return [
    ...limitedOffers.map((o) => ({ url: `${site.url}${saleHref(o)}`, priority: 0.8, changeFrequency: "daily" as const })),
    ...routes.map((r) => ({ url: `${site.url}${r.path}`, priority: r.priority, changeFrequency: "monthly" as const })),
    ...products.map((p) => ({ url: `${site.url}/product/${p.handle}`, priority: 0.7, changeFrequency: "weekly" as const })),
  ];
}
