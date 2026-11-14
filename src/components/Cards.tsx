import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ShelfView } from "@/lib/catalog/shelves";
import { ArtOrPhoto } from "./Art";

const countLine = (count: number | null) => (count === null ? "" : count === 0 ? "Coming soon" : `${count} ${count === 1 ? "piece" : "pieces"}`);

/**
 * Grid card for a product category. Text sits on the photo so every card is the same
 * height whatever the title length; the piece count is a small label in the corner.
 */
export function CategoryCard({ shelf }: { shelf: ShelfView }) {
  const count = countLine(shelf.count);
  return (
    <Link href={shelf.href} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl shadow-[var(--shadow-soft)] md:rounded-3xl">
      <span className="absolute inset-0 block transition-transform duration-700 group-hover:scale-[1.05]">
        <ArtOrPhoto image={shelf.image} motif={shelf.motif} tone={shelf.tone} sizes="(min-width: 768px) 24vw, 50vw" />
      </span>
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
      {count && (
        <span className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 text-[0.62rem] font-bold tracking-wide uppercase md:top-3.5 md:right-3.5 md:text-[0.7rem] ${shelf.count ? "bg-white/90 text-burgundy" : "bg-black/45 text-white"}`}>
          {count}
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 flex flex-col p-3 text-white md:p-5">
        <span className="text-[0.95rem] leading-tight font-bold [text-wrap:balance] md:text-[1.25rem]">{shelf.title}</span>
        <span className="mt-1 line-clamp-2 text-[0.72rem] leading-snug text-white/85 md:text-[0.88rem]">{shelf.blurb}</span>
        <span className="mt-2 inline-flex items-center gap-1 text-[0.72rem] font-bold text-gold-light md:mt-3 md:text-[0.85rem]">
          Shop now
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}

/** Full-bleed collection card with its title on the artwork. */
export function CollectionCard({ shelf }: { shelf: ShelfView }) {
  return (
    <Link href={shelf.href} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl">
      <span className="absolute inset-0 block transition-transform duration-700 group-hover:scale-[1.04]">
        <ArtOrPhoto image={shelf.image} motif={shelf.motif} tone={shelf.tone} sizes="(min-width: 1024px) 24vw, 66vw" />
      </span>
      <span className="absolute inset-x-0 bottom-0 block bg-gradient-to-t from-black/75 to-transparent px-4 pt-10 pb-3 text-white md:px-5 md:pb-4">
        <span className="block text-[1.1rem] leading-tight font-bold">{shelf.title}</span>
        <span className="block text-[0.82rem] text-white/85">{shelf.blurb}</span>
      </span>
    </Link>
  );
}

/** Wide card with a side image and an action: gemstones and styles. */
export function FeatureCard({ shelf, action }: { shelf: ShelfView; action: string }) {
  return (
    <Link href={shelf.href} className="group grid h-full grid-cols-[42%_minmax(0,1fr)] items-stretch overflow-hidden rounded-2xl border border-parchment bg-white transition-colors hover:border-gold">
      <span className="relative block min-h-52 overflow-hidden md:min-h-64">
        <span className="absolute inset-0 block transition-transform duration-700 group-hover:scale-[1.04]">
          <ArtOrPhoto image={shelf.image} motif={shelf.motif} tone={shelf.tone} sizes="(min-width: 768px) 20vw, 40vw" />
        </span>
      </span>
      <span className="flex min-w-0 flex-col justify-center p-5 md:p-7">
        <span className="block font-display text-[1.15rem] leading-tight text-charcoal md:text-[1.35rem]">{shelf.title}</span>
        <span className="mt-1.5 block text-[0.88rem] leading-relaxed text-ink-muted">{shelf.blurb}</span>
        <span className="mt-1 block text-[0.68rem] tracking-[0.16em] text-gold-deep uppercase">{countLine(shelf.count)}</span>
        <span className="mt-4 inline-flex items-center gap-2 text-[0.85rem] font-bold text-burgundy">
          {action}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}
