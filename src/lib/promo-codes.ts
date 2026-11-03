import type { CmsContent, CmsCoupon } from "./cms-types";
import { formatInr } from "./site";

const todayIst = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

/** Codes the admin chose to show publicly, while they are still valid. */
export const publicCoupons = (cms: Pick<CmsContent, "coupons">) => {
  const today = todayIst();
  return cms.coupons.filter((c) => c.active && c.showOnOffers && (!c.expires || c.expires >= today));
};

export const couponValue = (c: CmsCoupon) => (c.type === "percent" ? `${c.value}% off` : `${formatInr(c.value)} off`);

export function couponConditions(c: CmsCoupon) {
  const parts = [c.minOrder > 0 ? `On orders of ${formatInr(c.minOrder)} or more` : "No minimum order", c.expires ? `valid until ${new Date(`${c.expires}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}` : ""];
  return `${parts.filter(Boolean).join(", ")}. One offer per order.`;
}
