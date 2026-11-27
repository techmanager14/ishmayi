"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { MAX_VARIANT_PHOTOS, type Pricing, type PricingOption } from "@/lib/admin/pricing";
import { thumbUrl } from "@/lib/images";
import { PhotoAdder } from "./media";
import { btn, input } from "./ui";

/**
 * Price & variants, kept simple for the shop owner:
 * one main price, then (optionally) a list of variants that differ by Colour, Size and/or Length.
 * Each variant: same price as the main one or its own, main photos or its own, in stock or not.
 */

export interface VariantsInitial {
  options: PricingOption[];
  prices: { id: string; name: string; amount: number; compareAtPrice: number | null; trackInventory: boolean; availableQuantity: number | null; optionValues: string[] }[];
  /** Saved photos per variant key ("Gold / 7"). */
  images: Record<string, string[]>;
}

const TYPES = ["Colour", "Size", "Length"] as const;
type VariantType = (typeof TYPES)[number];
const PLACEHOLDER: Record<VariantType, string> = { Colour: "e.g. Gold", Size: "e.g. 7 or M", Length: "e.g. 16 inch" };

interface Variant {
  uid: string;
  priceId: string;
  values: Record<VariantType, string>;
  samePrice: boolean;
  price: string;
  original: string;
  ownPhotos: boolean;
  photos: string[];
  inStock: boolean;
  /** Kept from GoHighLevel so a counted stock isn't lost. */
  track: boolean;
  qty: string;
}

let seq = 0;
const uid = () => `v${++seq}`;
const emptyValues = (): Record<VariantType, string> => ({ Colour: "", Size: "", Length: "" });
const newVariant = (): Variant => ({ uid: uid(), priceId: "", values: emptyValues(), samePrice: true, price: "", original: "", ownPhotos: false, photos: [], inStock: true, track: false, qty: "" });
const money = (n: number | null) => (n ? String(n) : "");

/** Old option names (e.g. "Color", "Option") mapped onto Colour / Size / Length. */
function typeFor(name: string, used: VariantType[]): VariantType | null {
  const n = name.trim().toLowerCase();
  const direct: VariantType | null = /colou?r/.test(n) ? "Colour" : /size/.test(n) ? "Size" : /length/.test(n) ? "Length" : null;
  if (direct && !used.includes(direct)) return direct;
  return TYPES.find((t) => !used.includes(t)) ?? null;
}

function initialState(init: VariantsInitial) {
  const prices = init.prices;
  const amounts = prices.map((p) => p.amount).filter(Boolean);
  // Main price: the most common variant price (or the only price).
  const common = amounts.sort((a, b) => amounts.filter((x) => x === b).length - amounts.filter((x) => x === a).length)[0] ?? 0;
  const mainSource = prices.find((p) => p.amount === common) ?? prices[0];
  const main = { priceId: prices.length === 1 && !init.options.length ? (prices[0]?.id ?? "") : "", price: money(mainSource?.amount ?? null), original: money(mainSource?.compareAtPrice ?? null), track: prices.length === 1 ? !!prices[0]?.trackInventory : false, qty: prices.length === 1 ? String(prices[0]?.availableQuantity ?? "") : "" };

  const hasOptions = init.options.length > 0 && prices.every((p) => p.optionValues.length === init.options.length && p.optionValues.every(Boolean));
  if (!hasOptions && prices.length <= 1) return { on: false, types: ["Colour"] as VariantType[], main, variants: [newVariant()] };

  // Map saved options (or older plain prices) onto Colour / Size / Length.
  const types: VariantType[] = [];
  const optionTypes = hasOptions ? init.options.map((o) => { const t = typeFor(o.name, types); if (t) types.push(t); return t; }) : [];
  if (!hasOptions) types.push("Size");
  const variants = prices.map((p) => {
    const values = emptyValues();
    if (hasOptions) p.optionValues.forEach((v, i) => { const t = optionTypes[i]; if (t) values[t] = v; });
    else values.Size = p.name.trim();
    const key = hasOptions ? p.optionValues.join(" / ") : "";
    const photos = (key && init.images[key]) || [];
    const same = p.amount === common && (p.compareAtPrice ?? null) === (mainSource?.compareAtPrice ?? null);
    return {
      uid: uid(),
      priceId: p.id,
      values,
      samePrice: same,
      price: money(p.amount),
      original: money(p.compareAtPrice),
      ownPhotos: photos.length > 0,
      photos,
      inStock: !(p.trackInventory && (p.availableQuantity ?? 0) <= 0),
      track: p.trackInventory,
      qty: p.availableQuantity === null ? "" : String(p.availableQuantity),
    };
  });
  return { on: true, types: types.length ? types : (["Colour"] as VariantType[]), main, variants };
}

function Money({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-semibold text-charcoal">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-muted">₹</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" className={`${input} pl-7`} />
      </span>
      {hint && <span className="mt-1 block text-[0.7rem] text-ink-muted">{hint}</span>}
    </label>
  );
}

/** Two big, clear choices (like radio buttons). */
function Choice({ value, onChange, yes, no, name }: { value: boolean; onChange: (v: boolean) => void; yes: string; no: string; name: string }) {
  return (
    <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label={name}>
      {[
        [true, yes],
        [false, no],
      ].map(([v, text]) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v as boolean)}
          className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm font-semibold transition ${value === v ? "border-burgundy bg-blush text-burgundy" : "border-parchment bg-white text-charcoal hover:border-charcoal/40"}`}
        >
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${value === v ? "border-burgundy" : "border-[#c9c4bd]"}`}>{value === v && <span className="h-2 w-2 rounded-full bg-burgundy" />}</span>
          {text as string}
        </button>
      ))}
    </div>
  );
}

export function VariantsEditor({ initial }: { initial: VariantsInitial; photos?: string[] }) {
  const [start] = useState(() => initialState(initial));
  const [main, setMain] = useState(start.main);
  const [on, setOn] = useState(start.on);
  const [types, setTypes] = useState<VariantType[]>(start.types);
  const [variants, setVariants] = useState<Variant[]>(start.variants);
  const set = (id: string, patch: Partial<Variant>) => setVariants((cur) => cur.map((v) => (v.uid === id ? { ...v, ...patch } : v)));

  const label = (v: Variant) => types.map((t) => v.values[t].trim()).filter(Boolean).join(" · ") || "New variant";
  const keys = variants.map((v) => types.map((t) => v.values[t].trim().toLowerCase()).join("|"));
  const duplicateOf = (i: number) => (keys[i] && keys.indexOf(keys[i]) !== i ? keys.indexOf(keys[i]) + 1 : 0);

  // What the server saves (see lib/admin/pricing).
  const pricing: Pricing = !on
    ? { options: [], rows: [{ priceId: main.priceId || variants.find((v) => v.priceId)?.priceId || "", values: [], amount: main.price, compare: main.original, track: main.track, qty: main.qty, images: [] }] }
    : {
        options: types.map((t) => ({ name: t, values: [...new Set(variants.map((v) => v.values[t].trim()).filter(Boolean))] })),
        rows: variants.map((v) => ({
          priceId: v.priceId,
          values: types.map((t) => v.values[t].trim()),
          amount: v.samePrice ? main.price : v.price,
          compare: v.samePrice ? main.original : v.original,
          track: v.inStock ? v.track : true,
          qty: v.inStock ? v.qty : "0",
          images: v.ownPhotos ? v.photos : [],
        })),
      };
  const missing = on ? variants.findIndex((v) => types.some((t) => !v.values[t].trim())) : -1;

  return (
    <section className="rounded-2xl border border-parchment bg-panel p-5">
      <input type="hidden" name="pricing" value={JSON.stringify(pricing)} />
      <h2 className="text-base font-bold">Price</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Money label="Selling price" value={main.price} onChange={(price) => setMain({ ...main, price })} />
        <Money label="Original price (optional)" value={main.original} onChange={(original) => setMain({ ...main, original })} hint="Shown crossed out, e.g. ₹2,000 → ₹1,500" />
      </div>
      {!on && (
        <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-charcoal">
          <input
            type="checkbox"
            checked={!(main.track && !Number(main.qty))}
            onChange={(e) => setMain({ ...main, ...(e.target.checked ? { track: false, qty: "" } : { track: true, qty: "0" }) })}
            className="h-5 w-5 accent-burgundy"
          />
          In stock
        </label>
      )}

      {/* Variants on/off */}
      <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl bg-ivory-deep p-3">
        <span className="relative inline-flex shrink-0">
          <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="peer sr-only" />
          <span className="h-6 w-11 rounded-full bg-parchment transition peer-checked:bg-[#5e0f2c]" />
          <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </span>
        <span>
          <span className="block text-sm font-bold text-charcoal">This product has variants</span>
          <span className="block text-xs text-ink-muted">Different colours, sizes or lengths the customer can choose.</span>
        </span>
      </label>

      {on && (
        <>
          <p className="mt-4 text-sm font-bold text-charcoal">Variants differ by</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const picked = types.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={picked}
                  onClick={() => setTypes(picked ? (types.length > 1 ? types.filter((x) => x !== t) : types) : TYPES.filter((x) => x === t || types.includes(x)))}
                  className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition ${picked ? "border-burgundy bg-burgundy text-white" : "border-parchment bg-white text-charcoal hover:border-burgundy"}`}
                >
                  {picked ? "✓ " : "+ "}
                  {t}
                </button>
              );
            })}
          </div>

          <ul className="mt-4 space-y-3">
            {variants.map((v, i) => {
              const dup = duplicateOf(i);
              return (
                <li key={v.uid} className="rounded-xl border border-parchment bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-charcoal">
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-burgundy text-xs text-white">{i + 1}</span>
                      {label(v)}
                    </p>
                    {variants.length > 1 && (
                      <button type="button" onClick={() => setVariants(variants.filter((x) => x.uid !== v.uid))} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-50">
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove
                      </button>
                    )}
                  </div>

                  {/* Colour / Size / Length */}
                  <div className={`mt-3 grid gap-3 ${types.length === 1 ? "grid-cols-1" : types.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
                    {types.map((t) => (
                      <label key={t} className="block min-w-0">
                        <span className="mb-1 block text-xs font-semibold text-charcoal">{t}</span>
                        <input value={v.values[t]} onChange={(e) => set(v.uid, { values: { ...v.values, [t]: e.target.value.slice(0, 40) } })} placeholder={PLACEHOLDER[t]} className={input} />
                      </label>
                    ))}
                  </div>
                  {dup > 0 && <p className="mt-1.5 text-xs font-semibold text-amber-800">Same as variant {dup}. Change one of them.</p>}

                  {/* Price */}
                  <p className="mt-4 mb-1.5 text-xs font-semibold text-charcoal">Price</p>
                  <Choice name={`Price of variant ${i + 1}`} value={v.samePrice} onChange={(samePrice) => set(v.uid, { samePrice, price: v.price || main.price })} yes={`Same as main${main.price ? ` (₹${main.price})` : ""}`} no="Different price" />
                  {!v.samePrice && (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <Money label="Selling price" value={v.price} onChange={(price) => set(v.uid, { price })} />
                      <Money label="Original price (optional)" value={v.original} onChange={(original) => set(v.uid, { original })} />
                    </div>
                  )}

                  {/* Photos */}
                  <p className="mt-4 mb-1.5 text-xs font-semibold text-charcoal">Photos</p>
                  <Choice name={`Photos of variant ${i + 1}`} value={!v.ownPhotos} onChange={(useMain) => set(v.uid, { ownPhotos: !useMain })} yes="Use main photos" no="Has its own photos" />
                  {v.ownPhotos && (
                    <div className="mt-2 rounded-lg bg-ivory-deep p-3">
                      {v.photos.length > 0 && (
                        <ul className="mb-3 flex flex-wrap gap-2">
                          {v.photos.map((src) => (
                            <li key={src} className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={thumbUrl(src, 160)} alt="" className="h-16 w-16 rounded-lg object-cover" />
                              <button type="button" onClick={() => set(v.uid, { photos: v.photos.filter((x) => x !== src) })} aria-label="Remove photo" className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-burgundy text-white shadow">
                                <X className="h-3 w-3" aria-hidden="true" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {v.photos.length < MAX_VARIANT_PHOTOS ? (
                        <PhotoAdder onAdd={(urls) => set(v.uid, { photos: [...v.photos, ...urls.filter((u) => !v.photos.includes(u))].slice(0, MAX_VARIANT_PHOTOS) })} />
                      ) : (
                        <p className="text-xs text-ink-muted">Up to {MAX_VARIANT_PHOTOS} photos per variant.</p>
                      )}
                    </div>
                  )}

                  {/* Stock */}
                  <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-charcoal">
                    <input type="checkbox" checked={v.inStock} onChange={(e) => set(v.uid, { inStock: e.target.checked, ...(e.target.checked && v.track && !Number(v.qty) ? { track: false, qty: "" } : {}) })} className="h-5 w-5 accent-burgundy" />
                    In stock
                    {!v.inStock && <span className="text-xs font-normal text-ink-muted">— shown as sold out</span>}
                  </label>
                </li>
              );
            })}
          </ul>
          {missing >= 0 && <p className="mt-2 text-xs font-semibold text-amber-800">Fill in {types.filter((t) => !variants[missing].values[t].trim()).join(" and ")} for variant {missing + 1}.</p>}
          <button type="button" onClick={() => setVariants([...variants, newVariant()])} className={`${btn.outline} mt-3 w-full justify-center sm:w-auto`}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add variant
          </button>
        </>
      )}
    </section>
  );
}
