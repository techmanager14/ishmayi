"use client";

import { useState } from "react";
import type { Faq } from "@/content/faqs";

/** All FAQs with topic tabs; each question expands in place. */
export function FaqTabs({ groups }: { groups: { id: string; title: string; items: Faq[] }[] }) {
  const all = groups.flatMap((g) => g.items);
  const tabs = [{ id: "all", title: "All", items: all }, ...groups];
  const [active, setActive] = useState("all");
  const [open, setOpen] = useState<string | null>(all[0]?.q ?? null);
  const items = tabs.find((t) => t.id === active)!.items;

  return (
    <div>
      <div role="tablist" aria-label="FAQ topics" className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="faq-panel"
              onClick={() => {
                setActive(t.id);
                setOpen(t.items[0]?.q ?? null);
              }}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[0.82rem] sm:h-10 sm:gap-2 sm:px-4 sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                on ? "border-burgundy bg-burgundy text-white" : "border-parchment bg-white text-charcoal hover:border-charcoal/30"
              }`}
            >
              {t.title}
              <span className={`rounded-full px-1.5 text-[0.7rem] ${on ? "bg-white/20 text-white" : "bg-ivory-deep text-ink-muted"}`}>{t.items.length}</span>
            </button>
          );
        })}
      </div>

      <ul id="faq-panel" role="tabpanel" className="mt-5 space-y-3">
        {items.map((f) => {
          const isOpen = open === f.q;
          const id = `faq-${f.q.length}-${f.q.slice(0, 12).replace(/\W+/g, "")}`;
          return (
            <li key={f.q} className={`overflow-hidden rounded-2xl border bg-white transition-colors ${isOpen ? "border-gold/60 shadow-[var(--shadow-soft)]" : "border-parchment"}`}>
              <h3 className="[text-wrap:wrap]">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={id}
                  onClick={() => setOpen(isOpen ? null : f.q)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:gap-4 sm:px-5 sm:py-4 md:px-6"
                >
                  <span className={`min-w-0 flex-1 text-[0.95rem] leading-snug font-semibold [text-wrap:pretty] sm:text-[0.98rem] md:text-[1.03rem] ${isOpen ? "text-burgundy" : "text-charcoal"}`}>{f.q}</span>
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg transition-all ${isOpen ? "rotate-45 bg-burgundy text-white" : "bg-ivory-deep text-burgundy"}`}
                  >
                    +
                  </span>
                </button>
              </h3>
              <div id={id} hidden={!isOpen} className="px-4 pb-4 text-[0.92rem] leading-relaxed text-ink-muted sm:px-5 sm:pb-5 sm:text-[0.95rem] md:px-6">
                {f.a}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
