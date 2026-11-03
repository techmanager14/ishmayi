"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";

const INTERVAL_MS = 6000;
const SWIPE_PX = 40;

/** Promotional slider: cross-fades, autoplays, swipes on touch and has arrows, dots and pause. */
export function HeroSlider({ children, labels }: { children: ReactNode; labels: string[] }) {
  const slides = Children.toArray(children);
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [stopped, setStopped] = useState(false);
  const startX = useRef<number | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setStopped(true);
  }, []);

  useEffect(() => {
    if (hovering || stopped || slides.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [hovering, stopped, slides.length]);

  const go = (i: number) => setIndex((i + slides.length) % slides.length);
  const arrow = "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-charcoal transition-colors hover:bg-burgundy hover:text-white md:flex";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setHovering(true)}
      onBlurCapture={() => setHovering(false)}
      onPointerDown={(e) => {
        startX.current = e.clientX;
        swiped.current = false;
      }}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > SWIPE_PX) {
          swiped.current = true;
          go(index + (dx < 0 ? 1 : -1));
        }
      }}
      onClickCapture={(e) => {
        // A swipe shouldn't also follow the banner's link.
        if (swiped.current) {
          e.preventDefault();
          e.stopPropagation();
          swiped.current = false;
        }
      }}
    >
      <div className="grid touch-pan-y">
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}: ${labels[i] ?? ""}`}
            aria-hidden={i !== index}
            inert={i !== index}
            className={`[grid-area:1/1] transition-opacity duration-700 [&>*]:h-full ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            {slide}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button type="button" className={`${arrow} left-4 lg:left-6`} onClick={() => go(index - 1)} aria-label="Previous banner">
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button type="button" className={`${arrow} right-4 lg:right-6`} onClick={() => go(index + 1)} aria-label="Next banner">
            <ChevronRight className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <div className="flex items-center justify-center gap-1 py-2">
            {slides.map((_, i) => (
              <button key={i} type="button" onClick={() => go(i)} aria-label={`Go to banner ${i + 1}: ${labels[i] ?? ""}`} aria-current={i === index} className="group flex h-8 items-center px-1">
                <span className={`block h-2 rounded-full transition-all ${i === index ? "w-10 bg-burgundy" : "w-2 bg-charcoal/25 group-hover:bg-charcoal/50"}`} />
              </button>
            ))}
            <button type="button" onClick={() => setStopped((s) => !s)} aria-label={stopped ? "Play banners" : "Pause banners"} className="ml-1 flex h-8 w-8 items-center justify-center text-ink-muted hover:text-charcoal">
              {stopped ? <Play className="h-3 w-3" aria-hidden="true" /> : <Pause className="h-3 w-3" aria-hidden="true" />}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
