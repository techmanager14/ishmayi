// Prices and options (variants) as edited in Admin → Products. The editor sends this as JSON;
// the server checks it with parsePricing before anything is saved to GoHighLevel.

export const MAX_OPTIONS = 3;
export const MAX_VALUES = 30;
export const MAX_VARIANTS = 150;
export const MAX_VARIANT_PHOTOS = 10;

export interface PricingOption {
  name: string;
  values: string[];
}

export interface PricingRow {
  /** Existing GHL price id, or "" for a new one. */
  priceId: string;
  /** One value per option, in option order ([] for a simple product). */
  values: string[];
  amount: string;
  compare: string;
  track: boolean;
  qty: string;
  /** Photos for this variant (urls from the product's photos). */
  images: string[];
}

export interface Pricing {
  options: PricingOption[];
  rows: PricingRow[];
}

export interface CleanRow {
  priceId: string | null;
  values: string[];
  amount: number;
  compareAtPrice: number | null;
  trackInventory: boolean;
  availableQuantity: number | null;
  images: string[];
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const money = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[,₹\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Checks the editor's prices/options. Returns a message for the admin when something needs fixing. */
export function parsePricing(raw: unknown): { ok: true; options: PricingOption[]; rows: CleanRow[] } | { ok: false; message: string } {
  const p = (raw && typeof raw === "object" ? raw : {}) as Partial<Pricing>;
  const options: PricingOption[] = [];
  for (const o of (Array.isArray(p.options) ? p.options : []).slice(0, MAX_OPTIONS + 1)) {
    const name = text(o?.name, 30);
    const values: string[] = [];
    for (const v of Array.isArray(o?.values) ? o.values : []) {
      const t = text(v, 40);
      if (t && !values.some((x) => same(x, t))) values.push(t);
    }
    if (!name && !values.length) continue;
    if (!name) return { ok: false, message: "Give each option a name, e.g. Size or Colour." };
    if (!values.length) return { ok: false, message: `Add at least one value to “${name}”, e.g. 7 or Gold.` };
    if (options.some((x) => same(x.name, name))) return { ok: false, message: `There are two options called “${name}”.` };
    if (values.length > MAX_VALUES) return { ok: false, message: `“${name}” can have up to ${MAX_VALUES} values.` };
    options.push({ name, values });
  }
  if (options.length > MAX_OPTIONS) return { ok: false, message: `Up to ${MAX_OPTIONS} options per product (e.g. Colour, Size, Length).` };

  const rows: CleanRow[] = [];
  const seen = new Set<string>();
  for (const r of (Array.isArray(p.rows) ? p.rows : []).slice(0, MAX_VARIANTS + 1)) {
    const values = options.length ? (Array.isArray(r?.values) ? r.values.map((v) => text(v, 40)) : []) : [];
    if (options.length && (values.length !== options.length || values.some((v, i) => !options[i].values.includes(v)))) continue; // a value was removed
    const key = values.join(" / ").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const amount = money(r?.amount);
    const label = values.join(" / ") || "the product";
    if (!amount) return { ok: false, message: `Enter a price for ${label}.` };
    const compare = money(r?.compare);
    const track = r?.track === true;
    rows.push({
      priceId: typeof r?.priceId === "string" && /^[\w-]{6,64}$/.test(r.priceId) ? r.priceId : null,
      values,
      amount,
      compareAtPrice: compare && compare > amount ? compare : null,
      trackInventory: track,
      availableQuantity: track ? Math.max(0, Math.floor(Number(r?.qty) || 0)) : null,
      images: (Array.isArray(r?.images) ? r.images : []).filter((u): u is string => typeof u === "string" && /^https:\/\//.test(u)).slice(0, MAX_VARIANT_PHOTOS),
    });
  }
  if (rows.length > MAX_VARIANTS) return { ok: false, message: `Up to ${MAX_VARIANTS} variants per product. Remove some values.` };
  if (!rows.length) return { ok: false, message: options.length ? "Switch on at least one variant." : "Enter a price." };
  if (!options.length && rows.length > 1) return { ok: false, message: "Add an option (e.g. Size) to sell more than one version." };
  return { ok: true, options, rows };
}

/** Every combination of the options' values, in order (Gold/6, Gold/7, Silver/6…). */
export function combinations(options: PricingOption[]): string[][] {
  return options.reduce<string[][]>((acc, o) => acc.flatMap((combo) => o.values.map((v) => [...combo, v])), [[]]);
}
