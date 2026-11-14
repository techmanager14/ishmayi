"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { thumbUrl } from "@/lib/images";
import { CmsForm, Panel } from "./CmsForm";
import { btn, input, label } from "./ui";

interface Product {
  handle: string;
  title: string;
  image: string | null;
}

const MAX_PER_PRODUCT = 8;

/** Unique A + B pairs from the stored two-way map. */
function toPairs(map: Record<string, string[]>): [string, string][] {
  const seen = new Set<string>();
  const out: [string, string][] = [];
  for (const [a, list] of Object.entries(map)) {
    for (const b of list) {
      const key = [a, b].sort().join("|");
      if (!seen.has(key)) {
        seen.add(key);
        out.push([a, b]);
      }
    }
  }
  return out;
}

/** Back to the two-way map the website reads: A lists B and B lists A. */
function toMap(pairs: [string, string][]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const [a, b] of pairs) {
    (map[a] ??= []).includes(b) || map[a].push(b);
    (map[b] ??= []).includes(a) || map[b].push(a);
  }
  return map;
}

function Thumb({ p }: { p?: Product }) {
  return p?.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={thumbUrl(p.image, 120)} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
  ) : (
    <span className="h-12 w-12 shrink-0 rounded-xl bg-ivory-deep" />
  );
}

export function MatchesEditor({ initial, products }: { initial: Record<string, string[]>; products: Product[] }) {
  const [pairs, setPairs] = useState(() => toPairs(initial));
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const byHandle = new Map(products.map((p) => [p.handle, p]));
  const count = (h: string) => pairs.filter(([x, y]) => x === h || y === h).length;
  const exists = pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const blocked = !a || !b || a === b || exists || count(a) >= MAX_PER_PRODUCT || count(b) >= MAX_PER_PRODUCT;

  const picker = (id: string, value: string, set: (v: string) => void, text: string) => (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className={label}>
        {text}
      </label>
      <div className="flex items-center gap-2">
        <Thumb p={byHandle.get(value)} />
        <select id={id} value={value} onChange={(e) => set(e.target.value)} className={input}>
          <option value="">Choose a product</option>
          {products.map((p) => (
            <option key={p.handle} value={p.handle}>
              {p.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <CmsForm patch={{ pairings: toMap(pairs) }}>
      <Panel title="Add a perfect match" sub="Two pieces suggested together on the product page and in the bag." open>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          {picker("match-a", a, setA, "Product")}
          <Plus className="mx-auto h-5 w-5 shrink-0 text-gold-deep md:mb-3.5" aria-hidden="true" />
          {picker("match-b", b, setB, "Goes with")}
          <button
            type="button"
            disabled={blocked}
            onClick={() => {
              setPairs([...pairs, [a, b]]);
              setA("");
              setB("");
            }}
            className={`${btn.primary} md:mb-0.5`}
          >
            Add match
          </button>
        </div>
        {exists && <p className="text-xs font-semibold text-amber-800">These two are already a match.</p>}
      </Panel>

      <Panel title={`Matches (${pairs.length})`} open>
        {pairs.length === 0 ? (
          <p className="text-sm text-ink-muted">No matches yet.</p>
        ) : (
          <ul className="divide-y divide-parchment">
            {pairs.map(([x, y]) => {
              const px = byHandle.get(x);
              const py = byHandle.get(y);
              return (
                <li key={`${x}|${y}`} className="flex items-center gap-3 py-2.5">
                  <Thumb p={px} />
                  <Plus className="h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
                  <Thumb p={py} />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block truncate font-semibold">{px?.title ?? "Product no longer on sale"}</span>
                    <span className="block truncate text-ink-muted">{py?.title ?? "Product no longer on sale"}</span>
                  </span>
                  <button type="button" onClick={() => setPairs(pairs.filter((p) => p !== pairs.find(([m, n]) => m === x && n === y)))} aria-label="Remove this match" className={`${btn.ghost} text-rose-800`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </CmsForm>
  );
}
