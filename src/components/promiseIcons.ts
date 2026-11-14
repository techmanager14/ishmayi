import { BadgeCheck, CreditCard, Gem, Gift, Hand, Heart, Leaf, PackageCheck, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import type { ProductPromise } from "@/lib/promises";

/** Icon for each product promise; the admin's own promises get a check badge. */
export const PROMISE_ICONS: Record<ProductPromise["kind"], LucideIcon> = {
  delivery: Truck,
  secure: CreditCard,
  damage: ShieldCheck,
  shipping: PackageCheck,
  handcrafted: Hand,
  silver: Gem,
  natural: Leaf,
  skin: Heart,
  gift: Gift,
  custom: BadgeCheck,
};
