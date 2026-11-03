"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";

export interface QuickNavItem {
  slug: string;
  href: string;
  title: string;
  art: ReactNode;
}

function Row({ items }: { items: QuickNavItem[] }) {
  const current = useSearchParams().get("collection");
  return (
    <ul className="no-scrollbar mx-auto flex w-max max-w-full gap-3 overflow-x-auto overscroll-x-contain px-4 py-4 md:gap-7 md:py-7">
      {items.map((c) => {
        const active = current === c.slug;
        return (
          <li key={c.slug} className="shrink-0">
            <Link href={c.href} aria-current={active ? "page" : undefined} className="group flex w-[5.25rem] flex-col items-center gap-2 md:w-36">
              <span className={`relative block h-[5.25rem] w-[5.25rem] overflow-hidden rounded-[1.25rem] ring-offset-2 transition-shadow md:h-36 md:w-36 md:rounded-[2rem] ${active ? "ring-2 ring-burgundy" : "group-hover:ring-2 group-hover:ring-gold"}`}>
                <span className="absolute inset-0 block">{c.art}</span>
              </span>
              <span className={`text-center text-[0.78rem] leading-tight md:text-[1.05rem] ${active ? "font-bold text-burgundy" : "text-charcoal"}`}>{c.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Rounded category tiles; swipes sideways on phones and marks the category being viewed. */
export function QuickNav({ items }: { items: QuickNavItem[] }) {
  return (
    <nav aria-label="Popular categories">
      <Suspense fallback={<div className="h-[9.5rem] md:h-[14rem]" />}>
        <Row items={items} />
      </Suspense>
    </nav>
  );
}
