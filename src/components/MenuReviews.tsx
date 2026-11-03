"use client";

import { useState } from "react";

export interface MenuReview {
  id: string;
  name: string;
  city?: string;
  text: string;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

/** Customer reviews in the side menu: swipe sideways, dots show the position. */
export function MenuReviews({ reviews }: { reviews: MenuReview[] }) {
  const [index, setIndex] = useState(0);
  if (reviews.length === 0) return null;
  return (
    <section aria-label="Customer reviews" className="mt-5">
      <ul
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {reviews.map((r) => (
          <li key={r.id} className="w-full shrink-0 snap-center px-4">
            <div className="h-full rounded-xl border border-gold-light bg-white p-4">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-burgundy text-sm font-bold text-white">
                  {initials(r.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.82rem] font-bold tracking-wide text-charcoal uppercase">{r.name}</span>
                  {r.city && <span className="block truncate text-xs text-ink-muted">{r.city}</span>}
                </span>
              </div>
              <p className="mt-2.5 line-clamp-4 text-[0.88rem] leading-relaxed text-ink-muted">{r.text}</p>
            </div>
          </li>
        ))}
      </ul>
      {reviews.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
          {reviews.map((r, i) => (
            <span key={r.id} className={`h-1.5 w-7 rounded-full transition-colors ${i === index ? "bg-burgundy" : "bg-charcoal/20"}`} />
          ))}
        </div>
      )}
    </section>
  );
}
