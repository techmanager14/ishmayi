"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { StoreProduct } from "@/lib/catalog/types";
import { formatInr } from "@/lib/site";
import { ProductCard } from "./ProductCard";

export interface CategoryOption {
  href: string;
  label: string;
  count: number | null;
  active: boolean;
}

type SortKey = "featured" | "price-asc" | "price-desc" | "discount";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "discount", label: "Biggest discount" },
];

const PRICE_BANDS = [
  { id: "u1", label: `Under ${formatInr(1000)}`, min: 0, max: 1000 },
  { id: "1-2", label: `${formatInr(1000)} – ${formatInr(2000)}`, min: 1000, max: 2000 },
  { id: "2-3", label: `${formatInr(2000)} – ${formatInr(3000)}`, min: 2000, max: 3000 },
  { id: "3-5", label: `${formatInr(3000)} – ${formatInr(5000)}`, min: 3000, max: 5000 },
  { id: "5p", label: `Above ${formatInr(5000)}`, min: 5000, max: Infinity },
] as const;

const PAGE = 24;

const discount = (p: StoreProduct) => (p.compareAtPrice && p.price ? 1 - p.price / p.compareAtPrice : 0);

interface Filters {
  q: string;
  bands: string[];
  inStock: boolean;
  onOffer: boolean;
}
const noFilters: Filters = { q: "", bands: [], inStock: false, onOffer: false };

/** Price bands at or under a budget, e.g. 2000 → under ₹1,000 and ₹1,000–₹2,000. */
const bandsUpTo = (max: number) => PRICE_BANDS.filter((b) => b.max <= max).map((b) => b.id);

function apply(products: StoreProduct[], f: Filters, sort: SortKey) {
  const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  let list = products.filter((p) => {
    if (words.length) {
      const hay = `${p.title} ${p.subtitle ?? ""}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    if (f.inStock && !p.available) return false;
    if (f.onOffer && !p.compareAtPrice) return false;
    if (f.bands.length) {
      const price = p.price ?? -1;
      if (!PRICE_BANDS.some((b) => f.bands.includes(b.id) && price > b.min && price <= b.max)) return false;
    }
    return true;
  });
  if (sort === "price-asc") list = [...list].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  if (sort === "price-desc") list = [...list].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
  if (sort === "discount") list = [...list].sort((a, b) => discount(b) - discount(a));
  // Sold-out pieces sink below available ones (stable within each group).
  return [...list.filter((p) => p.available), ...list.filter((p) => !p.available)];
}

const Icon = ({ d, className = "h-5 w-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICONS = {
  sort: "M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4",
  filter: "M4 6h16M7 12h10M10 18h4",
  close: "M6 6l12 12M18 6 6 18",
  check: "m5 12 5 5 9-10",
};

function Checkbox({ checked, onChange, children, count }: { checked: boolean; onChange: () => void; children: ReactNode; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-[0.92rem] text-charcoal">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-burgundy/40 ${
          checked ? "border-burgundy bg-burgundy text-white" : "border-[#c9c4bd] bg-white"
        }`}
      >
        {checked && <Icon d={ICONS.check} className="h-3.5 w-3.5" />}
      </span>
      <span className="flex-1">{children}</span>
      {count !== undefined && <span className="text-xs text-ink-muted">{count}</span>}
    </label>
  );
}

function FilterPanel({
  products,
  filters,
  setFilters,
}: {
  products: StoreProduct[];
  filters: Filters;
  setFilters: (f: Filters) => void;
}) {
  const toggleBand = (id: string) =>
    setFilters({ ...filters, bands: filters.bands.includes(id) ? filters.bands.filter((b) => b !== id) : [...filters.bands, id] });
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-1.5 text-[0.78rem] font-medium tracking-[0.18em] text-charcoal uppercase">Price</legend>
        {PRICE_BANDS.map((b) => (
          <Checkbox
            key={b.id}
            checked={filters.bands.includes(b.id)}
            onChange={() => toggleBand(b.id)}
            count={products.filter((p) => p.price !== null && p.price > b.min && p.price <= b.max).length}
          >
            {b.label}
          </Checkbox>
        ))}
      </fieldset>
      <fieldset>
        <legend className="mb-1.5 text-[0.78rem] font-medium tracking-[0.18em] text-charcoal uppercase">Availability</legend>
        <Checkbox checked={filters.inStock} onChange={() => setFilters({ ...filters, inStock: !filters.inStock })} count={products.filter((p) => p.available).length}>
          In stock only
        </Checkbox>
        <Checkbox checked={filters.onOffer} onChange={() => setFilters({ ...filters, onOffer: !filters.onOffer })} count={products.filter((p) => p.compareAtPrice).length}>
          On offer
        </Checkbox>
      </fieldset>
    </div>
  );
}

/** Phone bottom sheet used for Sort and Filter. */
function Sheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => panel.current?.focus(), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:hidden">
      <button type="button" aria-label="Close" tabIndex={-1} className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={panel} className="relative flex outline-none max-h-[85dvh] w-full flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between border-b border-parchment px-5 py-4">
          <p className="text-base font-bold text-charcoal">{title}</p>
          <button type="button" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`} className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-ivory-deep">
            <Icon d={ICONS.close} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-parchment px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function CatalogueBrowser({
  products,
  categories,
  collection,
  initialQuery = "",
  initialMax = null,
  initialOffer = false,
}: {
  products: StoreProduct[];
  categories: CategoryOption[];
  collection: string;
  initialQuery?: string;
  initialMax?: number | null;
  initialOffer?: boolean;
}) {
  const [sort, setSort] = useState<SortKey>(initialMax ? "price-asc" : "featured");
  const [filters, setFilters] = useState<Filters>({ ...noFilters, q: initialQuery, bands: initialMax ? bandsUpTo(initialMax) : [], onOffer: initialOffer });
  const [shown, setShown] = useState(PAGE);
  const [sheet, setSheet] = useState<"sort" | "filter" | null>(null);

  const results = useMemo(() => apply(products, filters, sort), [products, filters, sort]);
  const visible = results.slice(0, shown);
  const activeCount = filters.bands.length + Number(filters.inStock) + Number(filters.onOffer) + Number(!!filters.q);

  // New filters or sort: start from the top of the list again.
  const update = (f: Filters) => {
    setFilters(f);
    setShown(PAGE);
  };
  const changeSort = (s: SortKey) => {
    setSort(s);
    setShown(PAGE);
  };

  const chips = [
    ...(filters.q ? [{ key: "q", label: `“${filters.q}”`, remove: () => update({ ...filters, q: "" }) }] : []),
    ...filters.bands.map((id) => ({
      key: id,
      label: PRICE_BANDS.find((b) => b.id === id)!.label,
      remove: () => update({ ...filters, bands: filters.bands.filter((b) => b !== id) }),
    })),
    ...(filters.inStock ? [{ key: "stock", label: "In stock", remove: () => update({ ...filters, inStock: false }) }] : []),
    ...(filters.onOffer ? [{ key: "offer", label: "On offer", remove: () => update({ ...filters, onOffer: false }) }] : []),
  ];

  return (
    <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-[6rem] max-h-[calc(100vh-7rem)] space-y-7 overflow-y-auto pr-2 pb-6">
          <nav aria-label="Categories">
            <p className="mb-2 text-[0.78rem] font-medium tracking-[0.18em] text-charcoal uppercase">Category</p>
            <ul className="space-y-0.5">
              {categories.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    scroll={false}
                    aria-current={c.active ? "page" : undefined}
                    className={`flex items-center justify-between rounded-md px-2.5 py-2 text-[0.92rem] transition-colors ${
                      c.active ? "bg-blush font-bold text-burgundy" : "text-charcoal hover:bg-ivory-deep"
                    }`}
                  >
                    {c.label}
                    {c.count !== null && <span className="text-xs font-normal text-ink-muted">{c.count}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <FilterPanel products={products} filters={filters} setFilters={update} />
          {activeCount > 0 && (
            <button type="button" onClick={() => update(noFilters)} className="text-sm font-bold text-burgundy hover:underline">
              Clear all filters
            </button>
          )}
        </div>
      </aside>

      <div>
        {/* Toolbar: sticky Sort / Filter on phones, count + sort select on desktop */}
        <div className="sticky top-[3.75rem] z-20 -mx-4 border-b border-parchment bg-ivory px-4 md:top-[4.5rem] lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0">
          <div className="grid grid-cols-2 divide-x divide-parchment lg:hidden">
            <button type="button" onClick={() => setSheet("sort")} className="flex h-12 items-center justify-center gap-2 text-sm font-bold text-charcoal">
              <Icon d={ICONS.sort} className="h-[18px] w-[18px]" />
              Sort
              {sort !== "featured" && <span className="h-1.5 w-1.5 rounded-full bg-burgundy" aria-label="(changed)" />}
            </button>
            <button type="button" onClick={() => setSheet("filter")} className="flex h-12 items-center justify-center gap-2 text-sm font-bold text-charcoal">
              <Icon d={ICONS.filter} className="h-[18px] w-[18px]" />
              Filter
              {activeCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-burgundy px-1.5 text-[0.7rem] text-white">{activeCount}</span>
              )}
            </button>
          </div>
          <div className="hidden items-center justify-between gap-4 pb-4 lg:flex">
            <p className="text-sm text-ink-muted" aria-live="polite">
              Showing <strong className="text-charcoal">{results.length}</strong> {results.length === 1 ? "piece" : "pieces"}
            </p>
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              Sort by
              <select
                value={sort}
                onChange={(e) => changeSort(e.target.value as SortKey)}
                className="h-10 rounded-md border border-parchment bg-white px-3 pr-8 text-sm font-semibold text-charcoal focus:border-burgundy focus:outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Active filters */}
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 lg:mt-0 lg:mb-4">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.remove}
                aria-label={`Remove filter ${c.label}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-burgundy/30 bg-blush py-1 pr-2 pl-3 text-[0.8rem] font-semibold text-burgundy"
              >
                {c.label}
                <Icon d={ICONS.close} className="h-3.5 w-3.5" />
              </button>
            ))}
            <button type="button" onClick={() => update(noFilters)} className="px-1 text-[0.8rem] font-bold text-ink-muted underline-offset-2 hover:underline">
              Clear all
            </button>
          </div>
        )}

        <p className="mt-3 text-xs text-ink-muted lg:hidden" aria-live="polite">
          {results.length} {results.length === 1 ? "piece" : "pieces"}
        </p>

        {/* Grid */}
        {results.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-parchment bg-ivory-deep px-6 py-12 text-center">
            <p className="text-lg font-bold text-charcoal">No pieces match these filters</p>
            <p className="mt-1 text-sm text-ink-muted">Try removing a filter or choosing another category.</p>
            <button type="button" onClick={() => update(noFilters)} className="btn btn-primary mt-5">
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 lg:mt-0 xl:grid-cols-4 xl:gap-x-5">
            {visible.map((p) => (
              <li key={p.handle}>
                <ProductCard product={p} location="shop_page" collection={collection} />
              </li>
            ))}
          </ul>
        )}

        {/* Load more */}
        {results.length > 0 && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-sm text-ink-muted">
              Showing {visible.length} of {results.length}
            </p>
            <div className="h-1 w-48 overflow-hidden rounded-full bg-parchment" aria-hidden="true">
              <div className="h-full rounded-full bg-burgundy transition-all" style={{ width: `${(visible.length / results.length) * 100}%` }} />
            </div>
            {visible.length < results.length && (
              <button type="button" onClick={() => setShown((n) => n + PAGE)} className="btn btn-outline btn-caps mt-2 min-w-48">
                Load more
              </button>
            )}
          </div>
        )}
      </div>

      {/* Phone sheets */}
      {sheet === "sort" && (
        <Sheet title="Sort by" onClose={() => setSheet(null)}>
          <ul role="radiogroup" aria-label="Sort by" className="-my-1">
            {SORTS.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={sort === s.key}
                  onClick={() => {
                    changeSort(s.key);
                    setSheet(null);
                  }}
                  className={`flex w-full items-center justify-between py-3.5 text-left text-[0.95rem] ${sort === s.key ? "font-bold text-burgundy" : "text-charcoal"}`}
                >
                  {s.label}
                  {sort === s.key && <Icon d={ICONS.check} className="h-5 w-5" />}
                </button>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
      {sheet === "filter" && (
        <Sheet
          title="Filter"
          onClose={() => setSheet(null)}
          footer={
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => update(noFilters)} className="btn btn-outline" disabled={activeCount === 0}>
                Clear
              </button>
              <button type="button" onClick={() => setSheet(null)} className="btn btn-primary">
                Show {results.length}
              </button>
            </div>
          }
        >
          <FilterPanel products={products} filters={filters} setFilters={update} />
        </Sheet>
      )}
    </div>
  );
}
