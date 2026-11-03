"use client";

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
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const [images, setImages] = useState(product?.images ?? []);
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
            <input id="name" name="name" required defaultValue={product?.name} className={input} placeholder="e.g. Leo Zodiac Necklace — Citrine" />
            <p className="mt-1 text-xs text-ink-muted">For zodiac necklaces, include the sign (e.g. “Leo”) so it links from its sign on the home page.</p>
          </div>
          <div>
            <label className={label} htmlFor="description">
              Description
            </label>
            <textarea id="description" name="description" rows={7} defaultValue={product?.description} className={input} placeholder="Gemstone, symbolism, materials, size, care…" />
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
                  <img src={thumbUrl(src, 240)} alt="" loading="lazy" className={`aspect-square w-full rounded-lg object-cover ${i === 0 ? "ring-2 ring-[#e3425c]" : ""}`} />
                  {i === 0 && <span className="absolute top-1 left-1 rounded bg-[#e3425c] px-1.5 py-0.5 text-[0.6rem] font-bold text-white">Cover</span>}
                  <div className="mt-1 flex gap-1">
                    {i > 0 && (
                      <button type="button" onClick={() => setImages([src, ...images.filter((x) => x !== src)])} className="rounded border border-parchment px-1.5 py-0.5 text-[0.7rem] font-semibold">
                        Make cover
                      </button>
                    )}
                    <button type="button" onClick={() => setImages(images.filter((x) => x !== src))} className="rounded border border-rose-500/40 px-1.5 py-0.5 text-[0.7rem] font-semibold text-rose-300">
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
                <li key={p.id || `new-${i}`} className="grid gap-2 rounded-xl bg-ivory-deep p-3 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
                  <input type="hidden" name="priceId" value={p.id} />
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Option name</label>
                    <input name="priceName" defaultValue={p.name} className={input} />
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
                    <div className="flex gap-1">
                      <select name="priceTrack" defaultValue={p.trackInventory ? "yes" : "no"} className={`${input} px-2`}>
                        <option value="no">Unlimited</option>
                        <option value="yes">Count</option>
                      </select>
                      <input name="priceQty" inputMode="numeric" defaultValue={p.availableQuantity ?? ""} className={`${input} w-16 px-2`} aria-label="Quantity" />
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
