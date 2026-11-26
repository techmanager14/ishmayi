"use client";

import { BadgeCheck, Check, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { saveProductAction } from "@/app/admin/actions";
import { thumbUrl } from "@/lib/images";
import { ActionForm, Submit } from "./forms";
import { PhotoAdder } from "./media";
import { btn, input, label } from "./ui";

export interface ProductFormProps {
  product: {
    id: string;
    name: string;
    description: string;
    availableInStore: boolean;
    collectionIds: string[];
    images: string[];
    prices: { id: string; name: string; amount: number; compareAtPrice: number | null; trackInventory: boolean; availableQuantity: number | null }[];
  } | null;
  categories: { label: string; onSale: boolean; collectionId: string | null }[];
  /** Perfect match picker (existing products only). */
  pairing?: { selected: string[]; options: { handle: string; title: string; image: string | null; price: number | null }[] };
  /** Promises: this product's choice, the built-in choices, and the admin's own saved list. */
  promises: { selected: string[]; presets: { id: string; label: string }[]; library: string[] };
  /** Product code (SKU) shown on the website. */
  code: string;
}

interface PriceRow {
  key: string;
  id: string;
  name: string;
  amount: string;
  compare: string;
  track: boolean;
  qty: string;
}
let rowSeq = 0;
const blankPrice = (): PriceRow => ({ key: `new-${++rowSeq}`, id: "", name: "", amount: "", compare: "", track: false, qty: "" });

const MAX_PROMISES = 6;
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function Chip({ on, disabled, onClick, children }: { on: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${on ? "border-burgundy bg-burgundy text-white" : "border-parchment bg-white text-charcoal hover:border-burgundy"}`}
    >
      {on ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </button>
  );
}

function PromisesPicker({ selected, presets, library: initialLibrary }: ProductFormProps["promises"]) {
  const [picked, setPicked] = useState(selected);
  // The admin's own promises, offered on every product. Anything already on this product is listed too.
  const [library, setLibrary] = useState(() => {
    const presetIds = new Set(presets.map((p) => p.id));
    const extra = selected.filter((x) => !presetIds.has(x) && !initialLibrary.some((l) => same(l, x)));
    return [...initialLibrary, ...extra];
  });
  const [text, setText] = useState("");
  const full = picked.length >= MAX_PROMISES;
  const isOn = (v: string) => picked.some((x) => same(x, v));
  const toggle = (v: string) => setPicked(isOn(v) ? picked.filter((x) => !same(x, v)) : full ? picked : [...picked, v]);
  const query = text.replace(/\s+/g, " ").trim().slice(0, 40);
  const suggestions = query ? library.filter((l) => l.toLowerCase().includes(query.toLowerCase()) && !isOn(l)).slice(0, 5) : [];

  const add = (value = query) => {
    if (!value || full) return;
    const existing = library.find((l) => same(l, value)) ?? presets.find((p) => same(p.label, value))?.id;
    if (existing) {
      if (!isOn(existing)) setPicked([...picked, existing]);
    } else {
      setLibrary([...library, value]);
      setPicked([...picked, value]);
    }
    setText("");
  };
  const removeFromLibrary = (v: string) => {
    if (!window.confirm(`Delete “${v}” from your promises? It will be removed from every product when you save.`)) return;
    setLibrary(library.filter((l) => !same(l, v)));
    setPicked(picked.filter((x) => !same(x, v)));
  };

  return (
    <section className="rounded-2xl border border-parchment bg-panel p-5">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <BadgeCheck className="h-4 w-4 text-gold-deep" aria-hidden="true" /> Promises
      </h2>
      <p className="mt-0.5 text-xs text-ink-muted">Shown under the buy buttons. Pick up to {MAX_PROMISES}; only promise what you offer for this piece.</p>
      <input type="hidden" name="promisesEditable" value="1" />
      {picked.map((x) => (
        <input key={x} type="hidden" name="promise" value={x} />
      ))}
      {library.map((x) => (
        <input key={x} type="hidden" name="promiseLibrary" value={x} />
      ))}
      <ul className="mt-3 flex flex-wrap gap-2">
        {presets.map((p) => (
          <li key={p.id}>
            <Chip on={isOn(p.id)} disabled={!isOn(p.id) && full} onClick={() => toggle(p.id)}>
              {p.label}
            </Chip>
          </li>
        ))}
      </ul>
      {library.length > 0 && (
        <>
          <p className="mt-3 text-xs font-bold text-charcoal">Your promises</p>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {library.map((l) => (
              <li key={l} className="flex items-center gap-0.5">
                <Chip on={isOn(l)} disabled={!isOn(l) && full} onClick={() => toggle(l)}>
                  {l}
                </Chip>
                <button type="button" onClick={() => removeFromLibrary(l)} aria-label={`Delete ${l} from your promises`} title="Delete from your promises" className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-rose-50 hover:text-rose-800">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="relative mt-3 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            value={text}
            maxLength={40}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(suggestions[0] && same(suggestions[0], query) ? suggestions[0] : query);
              }
            }}
            placeholder="Add your own, e.g. Lifetime polishing"
            aria-label="Add your own promise"
            className={input}
          />
          {suggestions.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-parchment bg-white shadow-lg">
              {suggestions.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => add(s)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ivory-deep">
                    <Plus className="h-3.5 w-3.5 text-burgundy" aria-hidden="true" /> {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={() => add()} disabled={!query || full} className={`${btn.outline} shrink-0`}>
          Add
        </button>
      </div>
      {picked.length === 0 && <p className="mt-2 text-xs font-semibold text-amber-800">No promises will show on this product.</p>}
    </section>
  );
}

export function ProductForm({ product, categories, pairing, promises, code }: ProductFormProps) {
  const [images, setImages] = useState(product?.images ?? []);
  const [pairs, setPairs] = useState(pairing?.selected ?? []);
  const [pairQuery, setPairQuery] = useState("");
  // Options are kept as typed text so nothing is lost while editing; the server checks the numbers.
  const [prices, setPrices] = useState<PriceRow[]>(() =>
    product?.prices.length
      ? product.prices.map((p) => ({
          key: p.id,
          id: p.id,
          // A single option named after the product doesn't need a name of its own.
          name: product.prices.length === 1 && p.name === product.name ? "" : p.name,
          amount: p.amount ? String(p.amount) : "",
          compare: p.compareAtPrice ? String(p.compareAtPrice) : "",
          track: p.trackInventory,
          qty: p.availableQuantity === null ? "" : String(p.availableQuantity),
        }))
      : [blankPrice()],
  );
  const [removedPrices, setRemovedPrices] = useState<string[]>([]);
  const setPrice = (key: string, patch: Partial<PriceRow>) => setPrices((cur) => cur.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const siteIds = new Set(categories.map((c) => c.collectionId).filter(Boolean));
  // Collections outside the website's categories are kept as they are.
  const otherCollections = (product?.collectionIds ?? []).filter((id) => !siteIds.has(id));

  return (
    <ActionForm action={saveProductAction} className="grid gap-4 xl:grid-cols-[1fr_22rem]">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      {otherCollections.map((id) => (
        <input key={id} type="hidden" name="collectionIds" value={id} />
      ))}
      <div className="space-y-4">
        <section className="space-y-4 rounded-2xl border border-parchment bg-panel p-5">
          <div>
            <label className={label} htmlFor="name">
              Product name
            </label>
            <input id="name" name="name" required defaultValue={product?.name} className={input} placeholder="e.g. Amethyst 925 Sterling Silver Ring" />
            <p className="mt-1 text-xs text-ink-muted">Customers see this name. Mention the stone or material, e.g. “925 Silver”, “Natural Pearl”, so it appears in the right collections.</p>
          </div>
          <div>
            <label className={label} htmlFor="description">
              Description
            </label>
            <textarea id="description" name="description" rows={7} defaultValue={product?.description} className={input} placeholder="Stone, material, finish, size and care…" />
            <p className="mt-1 text-xs text-ink-muted">Leave a blank line between paragraphs.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-parchment bg-panel p-5">
          <h2 className="mb-3 text-base font-bold">Photos</h2>
          {images.length > 0 && (
            <ul className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((src, i) => (
                <li key={src} className="relative">
                  <input type="hidden" name="images" value={src} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl(src, 240)} alt="" loading="lazy" className={`aspect-square w-full rounded-lg object-cover ${i === 0 ? "ring-2 ring-[#5e0f2c]" : ""}`} />
                  {i === 0 && <span className="absolute top-1 left-1 rounded bg-[#5e0f2c] px-1.5 py-0.5 text-[0.6rem] font-bold text-white">Cover</span>}
                  <div className="mt-1 flex gap-1">
                    {i > 0 && (
                      <button type="button" onClick={() => setImages([src, ...images.filter((x) => x !== src)])} className="rounded border border-parchment px-1.5 py-0.5 text-[0.7rem] font-semibold">
                        Make cover
                      </button>
                    )}
                    <button type="button" onClick={() => setImages(images.filter((x) => x !== src))} className="rounded border border-rose-500/40 px-1.5 py-0.5 text-[0.7rem] font-semibold text-rose-800">
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <PhotoAdder onAdd={(urls) => setImages((cur) => [...cur, ...urls.filter((u) => !cur.includes(u))])} />
          <p className="mt-2 text-xs text-ink-muted">Photos upload straight away and are resized automatically. Square photos look best; the first is the cover.</p>
        </section>

        <section className="rounded-2xl border border-parchment bg-panel p-5">
          <h2 className="text-base font-bold">Price & options</h2>
          <p className="mt-0.5 mb-3 text-xs text-ink-muted">One row = one choice the customer can pick (size, colour, length…). With 2 or more, customers choose on the product page.</p>
          {removedPrices.map((pid) => (
            <input key={pid} type="hidden" name="priceDelete" value={pid} />
          ))}
          <ul className="space-y-3">
            {prices.map((p, i) => {
              const many = prices.length > 1;
              return (
                <li key={p.key} className="rounded-xl bg-ivory-deep p-3">
                  <input type="hidden" name="priceId" value={p.id} />
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-charcoal">{many ? `Option ${i + 1}` : "Price"}</span>
                    {many && (
                      <button
                        type="button"
                        onClick={() => {
                          if (p.id) setRemovedPrices((r) => [...r, p.id]);
                          setPrices(prices.filter((x) => x.key !== p.key));
                        }}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className={many ? "" : "hidden"}>
                      <label className="mb-1 block text-xs font-semibold" htmlFor={`pn-${p.key}`}>
                        Option name
                      </label>
                      <input id={`pn-${p.key}`} name="priceName" value={p.name} onChange={(e) => setPrice(p.key, { name: e.target.value })} required={many} className={input} placeholder="e.g. Size 7, Gold, 16 inch" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold" htmlFor={`pa-${p.key}`}>
                        Price ₹
                      </label>
                      <input id={`pa-${p.key}`} name="priceAmount" inputMode="decimal" required value={p.amount} onChange={(e) => setPrice(p.key, { amount: e.target.value })} className={input} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold" htmlFor={`pc-${p.key}`}>
                        Was ₹ (optional)
                      </label>
                      <input id={`pc-${p.key}`} name="priceCompare" inputMode="decimal" value={p.compare} onChange={(e) => setPrice(p.key, { compare: e.target.value })} className={input} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold" htmlFor={`pt-${p.key}`}>
                        Stock
                      </label>
                      <div className="grid grid-cols-[minmax(0,1fr)_4.5rem] gap-1.5">
                        <select id={`pt-${p.key}`} name="priceTrack" value={p.track ? "yes" : "no"} onChange={(e) => setPrice(p.key, { track: e.target.value === "yes" })} className={`${input} px-2`}>
                          <option value="no">Always in stock</option>
                          <option value="yes">Track quantity</option>
                        </select>
                        <input name="priceQty" inputMode="numeric" value={p.qty} onChange={(e) => setPrice(p.key, { qty: e.target.value })} readOnly={!p.track} tabIndex={p.track ? undefined : -1} className={`${input} px-2 ${p.track ? "" : "opacity-40"}`} aria-label="Quantity in stock" placeholder="Qty" />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => {
              // The first option needs a name too once there are two.
              const first = prices[0];
              const named = prices.length === 1 && first && (!first.name || first.name === product?.name) ? [{ ...first, name: "" }] : prices;
              setPrices([...named, blankPrice()]);
            }}
            className={`${btn.outline} mt-3`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add option
          </button>
        </section>

        <PromisesPicker {...promises} />

        {product && pairing && (
          <section className="rounded-2xl border border-parchment bg-panel p-5">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Sparkles className="h-4 w-4 text-gold-deep" aria-hidden="true" /> Perfect match
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">Suggested with this piece on its page and in the bag. Works both ways.</p>
            <input type="hidden" name="pairingsEditable" value="1" />
            {pairs.map((h) => (
              <input key={h} type="hidden" name="pairWith" value={h} />
            ))}
            {pairs.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {pairs.map((h) => {
                  const o = pairing.options.find((x) => x.handle === h);
                  return (
                    <li key={h} className="flex items-center gap-2 rounded-full bg-blush py-1 pr-1 pl-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {o?.image && <img src={thumbUrl(o.image, 80)} alt="" className="h-7 w-7 rounded-full object-cover" />}
                      <span className="max-w-[12rem] truncate text-xs font-semibold">{o?.title ?? "Product no longer on sale"}</span>
                      <button type="button" onClick={() => setPairs(pairs.filter((x) => x !== h))} aria-label={`Remove ${o?.title ?? "match"}`} className="flex h-6 w-6 items-center justify-center rounded-full text-burgundy hover:bg-white">
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input
                value={pairQuery}
                onChange={(e) => setPairQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                placeholder="Search products to pair"
                aria-label="Search products to pair"
                className={`${input} pl-9`}
              />
            </div>
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
              {pairing.options
                .filter((o) => !pairs.includes(o.handle) && o.title.toLowerCase().includes(pairQuery.trim().toLowerCase()))
                .slice(0, 8)
                .map((o) => (
                  <li key={o.handle}>
                    <button type="button" disabled={pairs.length >= 8} onClick={() => setPairs([...pairs, o.handle])} className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-ivory-deep disabled:opacity-40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {o.image ? <img src={thumbUrl(o.image, 80)} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" /> : <span className="h-9 w-9 shrink-0 rounded-lg bg-ivory-deep" />}
                      <span className="min-w-0 flex-1 truncate text-sm">{o.title}</span>
                      <Plus className="h-4 w-4 shrink-0 text-burgundy" aria-hidden="true" />
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </div>

      <div className="space-y-4">
        <section className="space-y-4 rounded-2xl border border-parchment bg-panel p-5">
          <div>
            <label className={label} htmlFor="productCode">
              Product code
            </label>
            <input
              id="productCode"
              name="productCode"
              defaultValue={code}
              maxLength={24}
              autoCapitalize="characters"
              onInput={(e) => (e.currentTarget.value = e.currentTarget.value.toUpperCase())}
              className={`${input} font-mono tracking-wider uppercase`}
              placeholder="e.g. ISH-BR-012"
            />
            <p className="mt-1 text-xs text-ink-muted">Shown on the product page and on orders. Customers can search by it.</p>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input type="checkbox" name="availableInStore" defaultChecked={product?.availableInStore ?? true} className="h-5 w-5 accent-burgundy" />
            Available to buy
          </label>
          <div>
            <p className={label}>Website category</p>
            <ul className="space-y-2">
              {categories.map((c) => (
                <li key={c.label}>
                  <label className={`flex items-center gap-3 text-sm ${c.collectionId ? "" : "opacity-50"}`}>
                    <input
                      type="checkbox"
                      name="collectionIds"
                      value={c.collectionId ?? ""}
                      disabled={!c.collectionId}
                      defaultChecked={!!c.collectionId && (product?.collectionIds ?? []).includes(c.collectionId)}
                      className="h-5 w-5 accent-burgundy"
                    />
                    <span>
                      {c.label} {!c.onSale && <span className="text-xs text-amber-700">(coming soon — not shown yet)</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-muted">A product shows on the website when it&apos;s available and in an on-sale category.</p>
          </div>
          <Submit pendingText="Saving…">{product ? "Save changes" : "Create product"}</Submit>
        </section>
      </div>
    </ActionForm>
  );
}
