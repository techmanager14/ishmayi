"use client";

import { BadgeCheck, Check, Plus, Search, Sparkles, X } from "lucide-react";
import { useState } from "react";
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
  /** Promises shown on the product page: preset ids or custom text, plus the preset choices. */
  promises: { selected: string[]; presets: { id: string; label: string }[] };
}

const MAX_PROMISES = 6;

function PromisesPicker({ selected, presets }: ProductFormProps["promises"]) {
  const [picked, setPicked] = useState(selected);
  const [custom, setCustom] = useState("");
  const presetIds = new Set(presets.map((p) => p.id));
  const customs = picked.filter((x) => !presetIds.has(x));
  const full = picked.length >= MAX_PROMISES;
  const toggle = (id: string) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : full ? picked : [...picked, id]);
  const addCustom = () => {
    const text = custom.replace(/\s+/g, " ").trim().slice(0, 40);
    if (!text || full || picked.some((x) => x.toLowerCase() === text.toLowerCase())) return;
    setPicked([...picked, text]);
    setCustom("");
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
      <ul className="mt-3 flex flex-wrap gap-2">
        {presets.map((p) => {
          const on = picked.includes(p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={on}
                disabled={!on && full}
                onClick={() => toggle(p.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${on ? "border-burgundy bg-burgundy text-white" : "border-parchment bg-white text-charcoal hover:border-burgundy"}`}
              >
                {on ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                {p.label}
              </button>
            </li>
          );
        })}
        {customs.map((c) => (
          <li key={c} className="flex items-center gap-1 rounded-full border border-burgundy bg-burgundy py-1.5 pr-1.5 pl-3 text-xs font-semibold text-white">
            {c}
            <button type="button" onClick={() => setPicked(picked.filter((x) => x !== c))} aria-label={`Remove ${c}`} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/20">
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <input
          value={custom}
          maxLength={40}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Your own, e.g. Lifetime polishing"
          aria-label="Add your own promise"
          className={input}
        />
        <button type="button" onClick={addCustom} disabled={!custom.trim() || full} className={`${btn.outline} shrink-0`}>
          Add
        </button>
      </div>
      {picked.length === 0 && <p className="mt-2 text-xs font-semibold text-amber-800">No promises will show on this product.</p>}
    </section>
  );
}

export function ProductForm({ product, categories, pairing, promises }: ProductFormProps) {
  const [images, setImages] = useState(product?.images ?? []);
  const [pairs, setPairs] = useState(pairing?.selected ?? []);
  const [pairQuery, setPairQuery] = useState("");
  const [prices, setPrices] = useState(product?.prices ?? []);
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

        {product && (
          <section className="rounded-2xl border border-parchment bg-panel p-5">
            <h2 className="mb-3 text-base font-bold">Prices & stock</h2>
            <ul className="space-y-3">
              {prices.map((p, i) => (
                <li key={p.id || `new-${i}`} className="grid grid-cols-1 gap-3 rounded-xl bg-ivory-deep p-3 sm:grid-cols-2">
                  <input type="hidden" name="priceId" value={p.id} />
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Size / option</label>
                    <input name="priceName" defaultValue={p.name} className={input} placeholder="e.g. Size 7, or leave as is" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Price ₹</label>
                    <input name="priceAmount" inputMode="decimal" required defaultValue={p.amount || ""} className={input} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Was ₹ (optional)</label>
                    <input name="priceCompare" inputMode="decimal" defaultValue={p.compareAtPrice ?? ""} className={input} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Stock</label>
                    <div className="grid grid-cols-[minmax(0,1fr)_4.5rem] gap-1.5">
                      <select name="priceTrack" defaultValue={p.trackInventory ? "yes" : "no"} className={`${input} px-2`}>
                        <option value="no">Always in stock</option>
                        <option value="yes">Track quantity</option>
                      </select>
                      <input name="priceQty" inputMode="numeric" defaultValue={p.availableQuantity ?? ""} className={`${input} px-2`} aria-label="Quantity in stock" placeholder="Qty" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setPrices([...prices, { id: "", name: "", amount: 0, compareAtPrice: null, trackInventory: false, availableQuantity: null }])}
              className={`${btn.outline} mt-3`}
            >
              + Add size / option
            </button>
          </section>
        )}

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
          {!product && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={label} htmlFor="amount">
                  Price ₹
                </label>
                <input id="amount" name="amount" inputMode="decimal" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="compareAtPrice">
                  Was ₹
                </label>
                <input id="compareAtPrice" name="compareAtPrice" inputMode="decimal" className={input} placeholder="optional" />
              </div>
            </div>
          )}
          <Submit pendingText="Saving…">{product ? "Save changes" : "Create product"}</Submit>
        </section>
      </div>
    </ActionForm>
  );
}
