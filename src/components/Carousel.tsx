"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const Arrow = ({ dir }: { dir: "left" | "right" }) => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] md:h-5 md:w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d={dir === "left" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Horizontally scrolling row. Works by finger swipe,
 * touchpad, mouse click-and-drag and the prev/next arrows; a thin progress
 * bar shows there is more to see.
 */
export function Carousel({ children, label, itemClassName }: { children: ReactNode; label: string; itemClassName: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [state, setState] = useState({ start: true, end: true, ratio: 1, progress: 0 });
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setState({
      start: el.scrollLeft < 4,
      end: el.scrollLeft >= max - 4,
      ratio: el.scrollWidth ? el.clientWidth / el.scrollWidth : 1,
      progress: max > 0 ? el.scrollLeft / max : 0,
    });
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    const ro = el ? new ResizeObserver(update) : null;
    if (el && ro) ro.observe(el);
    return () => ro?.disconnect();
  }, [update]);

  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.85, behavior: "smooth" });

  // Mouse click-and-drag (touch devices use native swiping).
  const endDrag = () => {
    const el = track.current;
    if (!drag.current.active || !el) return;
    drag.current.active = false;
    // Restoring snapping lets the browser settle on the nearest card.
    el.style.scrollSnapType = "";
    el.style.scrollBehavior = "";
    el.style.cursor = "";
  };

  const overflowing = state.ratio < 0.999;
  const btn =
    "absolute top-[40%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-parchment bg-ivory text-charcoal shadow-[var(--shadow-soft)] transition-opacity hover:bg-burgundy hover:text-white disabled:pointer-events-none disabled:opacity-0 md:flex";

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={label}>
      {overflowing && (
        <button type="button" className={`${btn} left-1 md:-left-5`} onClick={() => scroll(-1)} disabled={state.start} aria-label="Previous items">
          <Arrow dir="left" />
        </button>
      )}
      <ul
        ref={track}
        onScroll={update}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || e.button !== 0 || !track.current) return;
          drag.current = { active: true, startX: e.clientX, startLeft: track.current.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          const el = track.current;
          if (!d.active || !el) return;
          const dx = e.clientX - d.startX;
          if (!d.moved && Math.abs(dx) > 5) {
            d.moved = true;
            el.style.scrollSnapType = "none";
            el.style.scrollBehavior = "auto";
            el.style.cursor = "grabbing";
          }
          if (d.moved) el.scrollLeft = d.startLeft - dx;
        }}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={(e) => {
          // A drag shouldn't also open the card under the pointer.
          if (drag.current.moved) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = false;
          }
        }}
        onDragStart={(e) => e.preventDefault()}
        className={`no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 sm:gap-4 md:gap-[2%] ${overflowing ? "cursor-grab" : ""}`}
      >
        {Children.map(children, (child) => (
          // relative: keeps absolutely positioned content (e.g. screen-reader text) inside the scrolling row.
          <li className={`relative shrink-0 snap-start ${itemClassName}`}>{child}</li>
        ))}
      </ul>
      {overflowing && (
        <button type="button" className={`${btn} right-1 md:-right-5`} onClick={() => scroll(1)} disabled={state.end} aria-label="Next items">
          <Arrow dir="right" />
        </button>
      )}

      {overflowing && (
        <div className="mx-auto mt-4 h-px w-24 overflow-hidden bg-parchment md:mt-6 md:w-40" aria-hidden="true">
          <div
            className="h-full bg-burgundy transition-[margin] duration-150"
            style={{ width: `${Math.max(state.ratio * 100, 12)}%`, marginLeft: `${state.progress * (100 - Math.max(state.ratio * 100, 12))}%` }}
          />
        </div>
      )}
    </div>
  );
}
