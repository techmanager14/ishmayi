"use client";

import { BadgeCheck, Check, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { saveProductAction } from "@/app/admin/actions";
import { thumbUrl } from "@/lib/images";
import { ActionForm, Submit } from "./forms";
import { PhotoAdder } from "./media";
import { btn, input, label } from "./ui";
import { VariantsEditor, type VariantsInitial } from "./VariantsEditor";

export interface ProductFormProps {
  product: {
    id: string;
    name: string;
    description: string;
    availableInStore: boolean;
    collectionIds: string[];
    images: string[];
    options: VariantsInitial["options"];
    prices: VariantsInitial["prices"];
  } | null;
  /** Saved photos per variant ("Gold / 7" → urls). */
  variantImages: Record<string, string[]>;
  categories: { label: string; onSale: boolean; collectionId: string | null }[];
  /** Perfect match picker (existing products only). */
  pairing?: { selected: string[]; options: { handle: string; title: string; image: string | null; price: number | null }[] };
  /** Promises: this product's choice, the built-in choices, and the admin's own saved list. */
  promises: { selected: string[]; presets: { id: string; label: string }[]; library: string[] };
  /** Product code (SKU) shown on the website. */
  code: string;
}

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

export function ProductForm({ product, categories, pairing, promises, code, variantImages }: ProductFormProps) {
  const [images, setImages] = useState(product?.images ?? []);
  const [variantsInitial] = useState<VariantsInitial>(() => ({ options: product?.options ?? [], prices: product?.prices ?? [], images: variantImages }));
  const [pairs, setPairs] = useState(pairing?.selected ?? []);
  const [pairQuery, setPairQuery] = useState("");
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

        <VariantsEditor initial={variantsInitial} photos={images} />

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
