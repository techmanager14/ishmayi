"use client";

import { Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { thumbUrl } from "@/lib/images";
import { formatInr } from "@/lib/site";
import type { SearchResponse } from "@/app/api/search/route";

const EMPTY: SearchResponse = { collections: [], products: [] };
const SUGGESTIONS = ["Necklace", "Pearl", "Amethyst", "Rose Quartz"];

/** Product search with live suggestions; pressing Enter opens the full results. */
export function SearchBar({ className = "" }: { className?: string }) {
  const id = useId();
  const router = useRouter();
  const pathname = usePathname();
  const box = useRef<HTMLFormElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [results, setResults] = useState<SearchResponse>(EMPTY);
  const [active, setActive] = useState(-1);
  const term = q.trim();

  // Debounced lookup; a newer keystroke cancels the request before it.
  useEffect(() => {
    if (term.length < 2) {
      setStatus("idle");
      setResults(EMPTY);
      return;
    }
    const ctl = new AbortController();
    setStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctl.signal });
        if (!res.ok) throw new Error(String(res.status));
        setResults((await res.json()) as SearchResponse);
        setActive(-1);
        setStatus("done");
      } catch (err) {
        if ((err as Error).name !== "AbortError") setStatus("error");
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [term]);

  useEffect(() => {
    setOpen(false);
    setQ("");
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const options = [...results.collections.map((c) => c.href), ...results.products.map((p) => `/product/${p.handle}`)];
  const allHref = `/shop?q=${encodeURIComponent(term)}`;
  const nothing = status === "done" && options.length === 0;
  const showPanel = open && term.length >= 2;

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") return setOpen(false);
    if (!options.length || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    e.preventDefault();
    setOpen(true);
    setActive((i) => (e.key === "ArrowDown" ? (i + 1) % options.length : (i <= 0 ? options.length : i) - 1));
  };

  const optionClass = (href: string) =>
    `flex items-center gap-3 px-4 py-2 transition-colors hover:bg-ivory-deep ${options[active] === href ? "bg-ivory-deep" : ""}`;

  return (
    <form
      ref={box}
      action="/shop"
      method="get"
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && options[active]) router.push(options[active]);
        else if (term) router.push(allHref);
        setOpen(false);
      }}
    >
      <label htmlFor={`${id}-q`} className="sr-only">
        Search products
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted" strokeWidth={1.5} aria-hidden="true" />
      <input
        id={`${id}-q`}
        name="q"
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        maxLength={60}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder="Search by product, category, material or gemstone"
        className="h-11 w-full rounded-lg border border-charcoal/25 bg-white pr-10 pl-11 text-[0.92rem] text-charcoal placeholder:text-ink-muted focus:border-burgundy focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {q && (
        <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-ink-muted hover:text-charcoal">
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <X className="h-4 w-4" aria-hidden="true" />}
        </button>
      )}

      {showPanel && (
        <div id={`${id}-list`} role="listbox" aria-label="Search suggestions" className="absolute inset-x-0 top-full z-50 mt-1 max-h-[70dvh] overflow-y-auto rounded-xl border border-parchment bg-ivory py-2 shadow-[var(--shadow-soft)]">
          {status === "loading" && options.length === 0 && (
            <div aria-busy="true" className="space-y-3 px-4 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton h-12 w-12" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {status === "error" && <p className="px-4 py-3 text-sm text-ink-muted">Search isn&apos;t available just now. Please try again in a moment.</p>}

          {nothing && (
            <div className="px-4 py-3" role="status">
              <p className="font-display text-lg text-charcoal">No results for &ldquo;{term}&rdquo;</p>
              <p className="mt-1 text-sm text-ink-muted">Check the spelling, or try one of these:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => setQ(s)} className="border border-parchment px-3 py-1 text-[0.8rem] text-charcoal hover:border-burgundy">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.collections.length > 0 && (
            <>
              <p className="eyebrow px-4 pt-1 pb-1">Collections</p>
              {results.collections.map((c, i) => (
                <Link key={c.href} id={`${id}-opt-${i}`} role="option" aria-selected={active === i} href={c.href} onClick={() => setOpen(false)} className={optionClass(c.href)}>
                  <Search className="h-4 w-4 text-ink-muted" strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-[0.92rem] text-charcoal">{c.title}</span>
                </Link>
              ))}
            </>
          )}

          {results.products.length > 0 && (
            <>
              <p className="eyebrow px-4 pt-2 pb-1">Products</p>
              {results.products.map((p, i) => {
                const index = results.collections.length + i;
                const href = `/product/${p.handle}`;
                return (
                  <Link key={p.handle} id={`${id}-opt-${index}`} role="option" aria-selected={active === index} href={href} onClick={() => setOpen(false)} className={optionClass(href)}>
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ivory-deep">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.image && <img src={thumbUrl(p.image, 160)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.92rem] text-charcoal">{p.title}</span>
                      {p.subtitle && <span className="block truncate text-xs text-ink-muted">{p.subtitle}</span>}
                    </span>
                    {p.price !== null && <span className="shrink-0 text-sm text-charcoal">{formatInr(p.price)}</span>}
                  </Link>
                );
              })}
              <Link href={allHref} onClick={() => setOpen(false)} className="mt-1 block border-t border-parchment px-4 pt-3 pb-1 text-[0.72rem] font-medium tracking-[0.18em] text-burgundy uppercase hover:text-gold-deep">
                See all results
              </Link>
            </>
          )}
        </div>
      )}
    </form>
  );
}
