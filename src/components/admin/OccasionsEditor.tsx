"use client";

import { Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { MAX_OCCASION_PRODUCTS, slugify, type CmsContent, type CmsOccasion } from "@/lib/cms-types";
import { thumbUrl } from "@/lib/images";
import { CmsForm, ListControls, Panel, Text, Toggle, move } from "./CmsForm";
import { MediaField } from "./media";
import { btn, input } from "./ui";

interface Product {
  handle: string;
  title: string;
  image: string | null;
}

/** Hand-picked products for one occasion: chips + search to add. */
function ProductPicker({ value, onChange, products, id }: { value: string[]; onChange: (v: string[]) => void; products: Product[]; id: string }) {
  const [q, setQ] = useState("");
  const byHandle = new Map(products.map((p) => [p.handle, p]));
  const query = q.trim().toLowerCase();
  const results = products.filter((p) => !value.includes(p.handle) && (!query || p.title.toLowerCase().includes(query))).slice(0, 8);
  const full = value.length >= MAX_OCCASION_PRODUCTS;
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-charcoal">Products ({value.length})</p>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {value.map((h) => {
            const p = byHandle.get(h);
            return (
              <li key={h} className="flex items-center gap-2 rounded-full bg-blush py-1 pr-1 pl-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p?.image ? <img src={thumbUrl(p.image, 80)} alt="" className="h-7 w-7 rounded-full object-cover" /> : <span className="h-7 w-7 rounded-full bg-ivory-deep" />}
                <span className="max-w-[12rem] truncate text-xs font-semibold">{p?.title ?? "Product no longer on sale"}</span>
                <button type="button" onClick={() => onChange(value.filter((x) => x !== h))} aria-label={`Remove ${p?.title ?? "product"}`} className="flex h-6 w-6 items-center justify-center rounded-full text-burgundy hover:bg-white">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <input id={id} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} placeholder="Search products to add" aria-label="Search products to add" className={`${input} pl-9`} />
      </div>
      <ul className="mt-1.5 max-h-60 space-y-0.5 overflow-y-auto">
        {results.map((p) => (
          <li key={p.handle}>
            <button type="button" disabled={full} onClick={() => onChange([...value, p.handle])} className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-ivory-deep disabled:opacity-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.image ? <img src={thumbUrl(p.image, 80)} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" /> : <span className="h-9 w-9 shrink-0 rounded-lg bg-ivory-deep" />}
              <span className="min-w-0 flex-1 truncate text-sm">{p.title}</span>
              <Plus className="h-4 w-4 shrink-0 text-burgundy" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OccasionsEditor({ initial, products, builtIn }: { initial: CmsContent["occasions"]; products: Product[]; builtIn: string[] }) {
  const [title, setTitle] = useState(initial.title);
  const [list, setList] = useState(initial.items);
  const [name, setName] = useState("");
  const upd = (i: number, p: Partial<CmsOccasion>) => setList((cur) => cur.map((o, j) => (j === i ? { ...o, ...p } : o)));
  const add = () => {
    const t = name.trim();
    let id = slugify(t);
    if (!t || !id) return;
    if (list.some((o) => o.id === id) || builtIn.includes(id)) id = `${id}-${list.length + 1}`;
    setList([...list, { id, title: t, blurb: "", image: "", enabled: true, products: [], autoMatch: false }]);
    setName("");
  };

  return (
    <CmsForm patch={{ occasions: { title, items: list } }}>
      <Panel title="Section" sub="Heading and new occasions." open>
        <Text id="occ-title" label="Heading on the home page" value={title} onChange={setTitle} />
        <div className="flex flex-wrap gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder="New occasion, e.g. Party" aria-label="New occasion name" className={`${input} max-w-sm`} />
          <button type="button" onClick={add} disabled={!name.trim()} className={btn.outline}>
            + Add occasion
          </button>
        </div>
      </Panel>

      {list.map((o, i) => {
        const isBuiltIn = builtIn.includes(o.id);
        return (
          <Panel
            key={o.id}
            title={o.title}
            sub={`${o.enabled ? "Showing" : "Hidden"} · ${o.products.length} picked${o.autoMatch && isBuiltIn ? " + matching names" : ""}`}
            actions={<ListControls index={i} length={list.length} onMove={(to) => setList(move(list, i, to))} onRemove={() => setList(list.filter((_, j) => j !== i))} />}
          >
            <Toggle checked={o.enabled} onChange={(v) => upd(i, { enabled: v })} label="Show on the home page" />
            <div className="grid gap-3 md:grid-cols-2">
              <Text id={`o${i}-t`} label="Name" value={o.title} onChange={(v) => upd(i, { title: v })} />
              <Text id={`o${i}-b`} label="Short line (shop page)" value={o.blurb} onChange={(v) => upd(i, { blurb: v })} />
            </div>
            <MediaField label="Card photo" value={o.image} onChange={(v) => upd(i, { image: v })} hint="Portrait (4:5) looks best. Empty = first product photo." />
            <ProductPicker id={`o${i}-q`} value={o.products} onChange={(v) => upd(i, { products: v })} products={products} />
            {isBuiltIn && (
              <Toggle
                checked={o.autoMatch}
                onChange={(v) => upd(i, { autoMatch: v })}
                label="Also add products automatically"
                hint={`Products whose names suit “${o.title}” are added after your picks.`}
              />
            )}
            <p className="text-xs text-ink-muted">Link: /shop?collection={o.id}</p>
          </Panel>
        );
      })}
    </CmsForm>
  );
}
