"use client";

import { Check, ImagePlus, Layers, Plus, Tag, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { MAX_OPTIONS, MAX_VALUES, MAX_VARIANT_PHOTOS, combinations, type Pricing, type PricingOption } from "@/lib/admin/pricing";
import { thumbUrl } from "@/lib/images";
import { btn, input } from "./ui";

export interface VariantsInitial {
  options: PricingOption[];
  prices: { id: string; name: string; amount: number; compareAtPrice: number | null; trackInventory: boolean; availableQuantity: number | null; optionValues: string[] }[];
  /** Saved photos per variant key ("Gold / 7"). */
  images: Record<string, string[]>;
}

interface Row {
  priceId: string;
  on: boolean;
  amount: string;
  compare: string;
  track: boolean;
  qty: string;
  images: string[];
}

const OPTION_SUGGESTIONS = ["Size", "Colour", "Length", "Metal", "Stone", "Style"];
const VALUE_HINTS: Record<string, string> = { size: "e.g. 6, 7, 8 or S, M, L", colour: "e.g. Gold, Silver, Rose gold", color: "e.g. Gold, Silver, Rose gold", length: "e.g. 16 inch, 18 inch", metal: "e.g. 925 Silver, Brass", stone: "e.g. Amethyst, Rose Quartz" };
const keyOf = (values: string[]) => values.join(" / ");
const blankRow = (from?: Partial<Row>): Row => ({ priceId: "", on: true, amount: from?.amount ?? "", compare: from?.compare ?? "", track: from?.track ?? false, qty: "", images: [] });
const priceRow = (p: VariantsInitial["prices"][number], images: string[] = []): Row => ({
  priceId: p.id,
  on: true,
  amount: p.amount ? String(p.amount) : "",
  compare: p.compareAtPrice ? String(p.compareAtPrice) : "",
  track: p.trackInventory,
  qty: p.availableQuantity === null ? "" : String(p.availableQuantity),
  images,
});

function initialState(init: VariantsInitial) {
  const prices = init.prices;
  // Product with options (Size, Colour…).
  if (init.options.length && prices.every((p) => p.optionValues.length === init.options.length && p.optionValues.every(Boolean))) {
    const rows: Record<string, Row> = {};
    for (const p of prices) rows[keyOf(p.optionValues)] = priceRow(p, init.images[keyOf(p.optionValues)] ?? []);
    for (const combo of combinations(init.options)) rows[keyOf(combo)] ??= { ...blankRow(), on: false };
    return { mode: "options" as const, options: init.options, rows, simple: blankRow() };
  }
  // Older products with several plain prices: shown as one option, so nothing is lost.
  if (prices.length > 1) {
    const values = [...new Set(prices.map((p) => p.name.trim() || "Option"))];
    const rows: Record<string, Row> = {};
    for (const p of prices) rows[p.name.trim() || "Option"] ??= priceRow(p);
    return { mode: "options" as const, options: [{ name: "Option", values }], rows, simple: blankRow() };
  }
  return { mode: "simple" as const, options: [] as PricingOption[], rows: {} as Record<string, Row>, simple: prices[0] ? priceRow(prices[0]) : blankRow() };
}

function Money({ value, onChange, label, placeholder }: { value: string; onChange: (v: string) => void; label: string; placeholder?: string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[0.7rem] font-semibold text-ink-muted">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-ink-muted">₹</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" placeholder={placeholder} className={`${input} pl-6`} />
      </span>
    </label>
  );
}

function Stock({ track, qty, onChange }: { track: boolean; qty: string; onChange: (p: { track?: boolean; qty?: string }) => void }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[0.7rem] font-semibold text-ink-muted">Stock</span>
      <span className="grid grid-cols-[minmax(0,1fr)_4rem] gap-1.5">
        <select value={track ? "yes" : "no"} onChange={(e) => onChange({ track: e.target.value === "yes" })} className={`${input} px-2`}>
          <option value="no">Always in stock</option>
          <option value="yes">Count stock</option>
        </select>
        <input value={qty} onChange={(e) => onChange({ qty: e.target.value })} inputMode="numeric" readOnly={!track} tabIndex={track ? undefined : -1} aria-label="Quantity in stock" placeholder="Qty" className={`${input} px-2 ${track ? "" : "opacity-40"}`} />
      </span>
    </label>
  );
}

/** One option (e.g. Size) with its values as chips. */
function OptionCard({ option, index, onChange, onRemove, taken }: { option: PricingOption; index: number; onChange: (o: PricingOption) => void; onRemove: () => void; taken: string[] }) {
  const [draft, setDraft] = useState("");
  const addValues = (raw: string) => {
    // Several at once: "6, 7, 8".
    const next = [...option.values];
    for (const v of raw.split(",").map((x) => x.replace(/\s+/g, " ").trim().slice(0, 40))) if (v && !next.some((x) => x.toLowerCase() === v.toLowerCase())) next.push(v);
    onChange({ ...option, values: next.slice(0, MAX_VALUES) });
    setDraft("");
  };
  const hint = VALUE_HINTS[option.name.trim().toLowerCase()] ?? "Type a value and press Enter";
  return (
    <div className="rounded-xl border border-parchment bg-white p-3">
      <div className="flex items-start gap-2">
        <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-burgundy text-xs font-bold text-white">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <input value={option.name} onChange={(e) => onChange({ ...option, name: e.target.value.slice(0, 30) })} placeholder="Option name, e.g. Size" aria-label={`Option ${index + 1} name`} className={`${input} font-semibold`} />
          {!option.name.trim() && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {OPTION_SUGGESTIONS.filter((s) => !taken.some((t) => t.toLowerCase() === s.toLowerCase())).map((s) => (
                <button key={s} type="button" onClick={() => onChange({ ...option, name: s })} className="rounded-full border border-parchment px-2.5 py-1 text-xs font-semibold hover:border-burgundy">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={onRemove} aria-label={`Remove option ${option.name || index + 1}`} className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-rose-50 hover:text-rose-800">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2.5 ml-8 flex flex-wrap items-center gap-1.5">
        {option.values.map((v) => (
          <span key={v} className="flex items-center gap-1 rounded-full bg-blush py-1 pr-1 pl-2.5 text-xs font-semibold text-charcoal">
            {v}
            <button type="button" onClick={() => onChange({ ...option, values: option.values.filter((x) => x !== v) })} aria-label={`Remove ${v}`} className="flex h-5 w-5 items-center justify-center rounded-full text-burgundy hover:bg-white">
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => (e.target.value.endsWith(",") ? addValues(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValues(draft);
            }
            if (e.key === "Backspace" && !draft && option.values.length) onChange({ ...option, values: option.values.slice(0, -1) });
          }}
          onBlur={() => draft.trim() && addValues(draft)}
          placeholder={option.values.length ? "Add value" : hint}
          aria-label={`Add a value to ${option.name || "this option"}`}
          className="min-w-[9rem] flex-1 rounded-lg border border-dashed border-parchment bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-burgundy"
        />
      </div>
    </div>
  );
}

/** Photo chooser for one variant: tick the product photos that show it. */
function PhotoPicker({ photos, value, onChange, onApply, applyLabels }: { photos: string[]; value: string[]; onChange: (v: string[]) => void; onApply: (i: number) => void; applyLabels: string[] }) {
  if (!photos.length) return <p className="text-xs text-ink-muted">Add product photos above first, then pick which ones show this variant.</p>;
  return (
    <div>
      <ul className="grid grid-cols-5 gap-1.5 sm:grid-cols-8">
        {photos.map((src) => {
          const on = value.includes(src);
          return (
            <li key={src}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onChange(on ? value.filter((x) => x !== src) : [...value, src].slice(0, MAX_VARIANT_PHOTOS))}
                className={`relative block aspect-square w-full overflow-hidden rounded-lg border-2 ${on ? "border-burgundy" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbUrl(src, 120)} alt="" className="h-full w-full object-cover" />
                {on && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-burgundy text-white">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {applyLabels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {applyLabels.map((l, i) => (
            <button key={l} type="button" onClick={() => onApply(i)} className="rounded-full border border-parchment px-2.5 py-1 text-xs font-semibold hover:border-burgundy">
              Use these for every “{l}”
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function VariantsEditor({ initial, photos }: { initial: VariantsInitial; photos: string[] }) {
  const start = useMemo(() => initialState(initial), [initial]);
  const [mode, setMode] = useState<"simple" | "options">(start.mode);
  const [simple, setSimple] = useState<Row>(start.simple);
  const [options, setOptions] = useState<PricingOption[]>(start.options.length ? start.options : [{ name: "", values: [] }]);
  const [rows, setRows] = useState<Record<string, Row>>(start.rows);
  const [openPhotos, setOpenPhotos] = useState<string | null>(null);
  const [bulk, setBulk] = useState({ amount: "", compare: "" });

  const ready = options.filter((o) => o.name.trim() && o.values.length);
  const combos = combinations(ready);
  // New combinations start switched on, with the product's usual price.
  const fallback = Object.values(rows).find((r) => r.on && r.amount) ?? simple;
  const rowFor = (combo: string[]) => rows[keyOf(combo)] ?? blankRow({ amount: fallback.amount, compare: fallback.compare, track: fallback.track });
  const setRow = (key: string, patch: Partial<Row>) => setRows((cur) => ({ ...cur, [key]: { ...(cur[key] ?? rowFor(key.split(" / "))), ...patch } }));
  const onCount = combos.filter((c) => rowFor(c).on).length;

  const pricing: Pricing =
    mode === "simple"
      ? { options: [], rows: [{ ...simple, values: [], priceId: simple.priceId || Object.values(rows).find((r) => r.priceId)?.priceId || "" }] }
      : { options: ready, rows: combos.map((c) => ({ values: c, ...rowFor(c) })).filter((r) => r.on) };

  const switchTo = (m: "simple" | "options") => {
    if (m === mode) return;
    if (m === "simple" && onCount > 1 && !window.confirm("Use one price for this product? Its variants will be removed when you save.")) return;
    if (m === "simple") {
      const first = combos.map((c) => rowFor(c)).find((r) => r.on);
      if (first && !simple.amount) setSimple({ ...simple, amount: first.amount, compare: first.compare, priceId: first.priceId });
    }
    setMode(m);
  };

  return (
    <section className="rounded-2xl border border-parchment bg-panel p-5">
      <input type="hidden" name="pricing" value={JSON.stringify(pricing)} />
      <h2 className="text-base font-bold">Price & variants</h2>
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-ivory-deep p-1" role="radiogroup" aria-label="How is this product sold?">
        {(
          [
            ["simple", "One price", "Same price for everyone", Tag],
            ["options", "Variants", "Size, colour, length…", Layers],
          ] as const
        ).map(([m, title, sub, Icon]) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => switchTo(m)} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition ${mode === m ? "bg-white shadow-sm ring-1 ring-burgundy/30" : "hover:bg-white/60"}`}>
            <Icon className={`h-5 w-5 shrink-0 ${mode === m ? "text-burgundy" : "text-ink-muted"}`} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-charcoal">{title}</span>
              <span className="block truncate text-[0.7rem] text-ink-muted">{sub}</span>
            </span>
          </button>
        ))}
      </div>

      {mode === "simple" ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Money label="Price" value={simple.amount} onChange={(amount) => setSimple({ ...simple, amount })} />
          <Money label="Was (optional)" value={simple.compare} onChange={(compare) => setSimple({ ...simple, compare })} placeholder="Shows a discount" />
          <Stock track={simple.track} qty={simple.qty} onChange={(p) => setSimple({ ...simple, ...p })} />
        </div>
      ) : (
        <>
          {/* Step 1: options */}
          <p className="mt-5 text-sm font-bold text-charcoal">1 · What can customers choose?</p>
          <p className="text-xs text-ink-muted">Add an option, then its values. Type several at once with commas: 6, 7, 8.</p>
          <div className="mt-2.5 space-y-2.5">
            {options.map((o, i) => (
              <OptionCard
                key={i}
                option={o}
                index={i}
                taken={options.map((x) => x.name)}
                onChange={(next) => setOptions(options.map((x, j) => (j === i ? next : x)))}
                onRemove={() => setOptions(options.length > 1 ? options.filter((_, j) => j !== i) : [{ name: "", values: [] }])}
              />
            ))}
          </div>
          {options.length < MAX_OPTIONS && (
            <button type="button" onClick={() => setOptions([...options, { name: "", values: [] }])} className={`${btn.outline} mt-2.5`}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add another option
            </button>
          )}

          {/* Step 2: variants */}
          <div className="mt-6 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-charcoal">2 · Variants {combos.length > 0 && <span className="font-semibold text-ink-muted">({onCount} on sale)</span>}</p>
              <p className="text-xs text-ink-muted">Each combination has its own price, stock and photos. Switch off any you don&apos;t sell.</p>
            </div>
          </div>
          {combos.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-parchment bg-ivory-deep/60 px-4 py-5 text-center text-sm text-ink-muted">Your variants appear here once an option has a name and a value.</p>
          ) : (
            <>
              {combos.length > 1 && (
                <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-ivory-deep p-2.5">
                  <div className="w-28">
                    <Money label="Price for all" value={bulk.amount} onChange={(amount) => setBulk({ ...bulk, amount })} />
                  </div>
                  <div className="w-28">
                    <Money label="Was for all" value={bulk.compare} onChange={(compare) => setBulk({ ...bulk, compare })} />
                  </div>
                  <button
                    type="button"
                    disabled={!bulk.amount && !bulk.compare}
                    onClick={() => {
                      const next = { ...rows };
                      for (const c of combos) next[keyOf(c)] = { ...rowFor(c), ...(bulk.amount ? { amount: bulk.amount } : {}), ...(bulk.compare ? { compare: bulk.compare } : {}) };
                      setRows(next);
                      setBulk({ amount: "", compare: "" });
                    }}
                    className={btn.outline}
                  >
                    Apply to all
                  </button>
                </div>
              )}
              <ul className="mt-2.5 space-y-2">
                {combos.map((combo) => {
                  const key = keyOf(combo);
                  const r = rowFor(combo);
                  const open = openPhotos === key;
                  return (
                    <li key={key} className={`rounded-xl border p-2.5 transition ${r.on ? "border-parchment bg-white" : "border-dashed border-parchment bg-ivory-deep/50"}`}>
                      <div className="flex items-center gap-2.5">
                        <label className="relative inline-flex shrink-0 cursor-pointer" title={r.on ? "On sale" : "Not sold"}>
                          <input type="checkbox" checked={r.on} onChange={(e) => setRow(key, { on: e.target.checked })} className="peer sr-only" aria-label={`Sell ${key}`} />
                          <span className="h-5 w-9 rounded-full bg-parchment transition peer-checked:bg-[#5e0f2c]" />
                          <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
                        </label>
                        <button
                          type="button"
                          onClick={() => setOpenPhotos(open ? null : key)}
                          aria-label={`Photos for ${key}`}
                          aria-expanded={open}
                          className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border ${open ? "border-burgundy" : "border-parchment"} bg-ivory-deep`}
                        >
                          {r.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumbUrl(r.images[0], 120)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImagePlus className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                          )}
                          {r.images.length > 1 && <span className="absolute right-0 bottom-0 rounded-tl bg-burgundy px-1 text-[0.6rem] font-bold text-white">{r.images.length}</span>}
                        </button>
                        <span className={`min-w-0 flex-1 truncate text-sm font-bold ${r.on ? "text-charcoal" : "text-ink-muted line-through"}`}>{combo.join(" · ")}</span>
                      </div>
                      {r.on && (
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1.4fr] sm:pl-[5.4rem]">
                          <Money label="Price" value={r.amount} onChange={(amount) => setRow(key, { amount })} />
                          <Money label="Was" value={r.compare} onChange={(compare) => setRow(key, { compare })} placeholder="optional" />
                          <div className="col-span-2 sm:col-span-1">
                            <Stock track={r.track} qty={r.qty} onChange={(p) => setRow(key, p)} />
                          </div>
                        </div>
                      )}
                      {open && (
                        <div className="mt-2.5 border-t border-parchment pt-2.5 sm:pl-[5.4rem]">
                          <p className="mb-1.5 text-xs font-semibold text-charcoal">Photos that show {combo.join(" · ")}</p>
                          <PhotoPicker
                            photos={photos}
                            value={r.images.filter((x) => photos.includes(x))}
                            onChange={(images) => setRow(key, { images })}
                            applyLabels={ready.length > 1 ? combo : []}
                            onApply={(i) => {
                              // Same photos for every variant with this value, e.g. all "Gold" sizes.
                              const next = { ...rows };
                              for (const c of combos) if (c[i] === combo[i]) next[keyOf(c)] = { ...rowFor(c), images: r.images };
                              setRows(next);
                            }}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
