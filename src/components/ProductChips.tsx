"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { productChips } from "@/data/chips";
import type { StoreProduct } from "@/lib/catalog/types";
import { ProductCard } from "./ProductCard";

const SHOWN = 8;

/** Pills that switch the products shown below them; a pill with no products is left out. */
export function ProductChips({ products }: { products: StoreProduct[] }) {
  const chips = useMemo(() => productChips.map((c) => ({ ...c, items: c.pick(products) })).filter((c) => c.items.length > 0), [products]);
  const [active, setActive] = useState(chips[0]?.id);
  const chip = chips.find((c) => c.id === active) ?? chips[0];
  if (!chip) return null;

  return (
    <>
      <div role="group" aria-label="Filter products" className="no-scrollbar mx-auto mt-4 flex w-max max-w-full gap-2 overflow-x-auto overscroll-x-contain py-1 md:mt-6 md:gap-3">
        {chips.map((c) => {
          const on = c.id === chip.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(c.id)}
              className={`shrink-0 rounded-full border-2 px-4 py-2 text-[0.85rem] font-bold whitespace-nowrap text-charcoal transition-colors md:px-5 md:text-[0.95rem] ${on ? "border-burgundy/25 bg-blush" : "border-parchment bg-white hover:border-burgundy/40"}`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 md:mt-7 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {chip.items.slice(0, SHOWN).map((p) => (
          <li key={p.handle}>
            <ProductCard product={p} location={`home_${chip.id}`} />
          </li>
        ))}
      </ul>
      <p className="mt-8 mb-4 text-center">
        <Link href={chip.href} className="btn btn-outline min-w-52">View all</Link>
      </p>
    </>
  );
}
