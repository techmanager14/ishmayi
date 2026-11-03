"use client";

import { BadgeHelp, Compass, Droplets, Gift, Heart, Info, Mail, Menu, PackageSearch, Percent, ShieldAlert, Ticket, Truck, User, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ArtMotif, ArtTone } from "@/data/shelves";
import { site } from "@/lib/site";
import { useWishlist } from "@/lib/wishlist";
import { AccountMenu } from "./AccountMenu";
import { Art, ArtOrPhoto } from "./Art";
import { CartButton } from "./CartDrawer";
import { MenuReviews, type MenuReview } from "./MenuReviews";
import { SearchBar } from "./SearchBar";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span className={`text-[1.25rem] font-bold tracking-[0.14em] uppercase md:text-[1.6rem] ${light ? "text-white" : "text-burgundy"}`}>Ishmayi</span>
      <span className={`mt-0.5 text-[0.5rem] tracking-[0.01em] whitespace-nowrap md:mt-1 md:text-[0.66rem] md:tracking-[0.03em] ${light ? "text-gold-light" : "text-gold-deep"}`}>{site.tagline}</span>
    </span>
  );
}

const PRIMARY = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?collection=new-arrivals", label: "New Arrivals" },
  { href: "/offers", label: "Offers" },
  { href: "/explore", label: "Explore" },
];

/** A photo tile in the side menu; built on the server. */
export interface MenuTile {
  href: string;
  label: string;
  image?: string;
  motif: ArtMotif;
  tone: ArtTone;
}

const MENU_LINKS: { href: string; label: string; Icon: LucideIcon; dot?: boolean }[] = [
  { href: "/bulk-orders", label: "Bulk order queries", Icon: Truck, dot: true },
  { href: "/gift-sets", label: "Customised gift sets", Icon: Gift },
  { href: "/gifting", label: "Gifting", Icon: Gift },
  { href: "/jewellery-care", label: "Jewellery care", Icon: Droplets },
  { href: "/offers", label: "Offers", Icon: Percent },
  { href: "/promo-codes", label: "Promo codes", Icon: Ticket },
  { href: "/explore", label: "Explore gemstones & styles", Icon: Compass },
  { href: "/wishlist", label: "Wishlist", Icon: Heart },
  { href: "/account", label: "Login / My account", Icon: User },
  { href: "/track", label: "Track my order", Icon: PackageSearch },
  { href: "/report-damage", label: "Report a damaged parcel", Icon: ShieldAlert },
  { href: "/about", label: "About us", Icon: Info },
  { href: "/faqs", label: "FAQs", Icon: BadgeHelp },
  { href: "/contact", label: "Contact us", Icon: Mail },
];

const headerIcon = "relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 text-[0.62rem] text-charcoal transition-colors hover:text-burgundy lg:h-14 lg:w-[4.5rem] lg:text-[0.72rem] lg:tracking-wide lg:uppercase";

function WishlistLink() {
  const count = useWishlist().length;
  return (
    <Link href="/wishlist" className={headerIcon} aria-label={`Wishlist, ${count} ${count === 1 ? "item" : "items"}`}>
      <span className="relative">
        <Heart className="h-[22px] w-[22px]" strokeWidth={1.4} aria-hidden="true" />
        {count > 0 && <span className="absolute -top-1.5 -right-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-burgundy px-1 text-[0.62rem] text-white">{count}</span>}
      </span>
      Wishlist
    </Link>
  );
}

function Drawer({ tiles, reviews, onClose }: { tiles: MenuTile[]; reviews: MenuReview[]; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const lastFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      lastFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="flex w-[88%] max-w-sm flex-col overflow-y-auto overscroll-contain bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex h-[3.75rem] shrink-0 items-center justify-between border-b border-parchment bg-white px-4">
          <Logo />
          <button ref={closeRef} type="button" className="-mr-2 flex h-11 w-11 items-center justify-center text-charcoal" aria-label="Close menu" onClick={onClose}>
            <X className="h-7 w-7" strokeWidth={1.2} aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 pt-4">
          <Link href="/shop?collection=new-arrivals" onClick={onClose} className="relative flex h-24 items-center justify-center overflow-hidden rounded-xl bg-burgundy text-white">
            <Art motif="sparkle" tone="plum" className="absolute inset-y-0 left-0 h-full w-24 opacity-70" />
            <Art motif="sparkle" tone="plum" className="absolute inset-y-0 right-0 h-full w-24 opacity-70" />
            <span className="relative text-center">
              <span className="block text-[0.7rem] tracking-[0.2em] text-gold-light uppercase">Just in</span>
              <span className="block text-[1.15rem] font-bold tracking-wide uppercase">New Arrivals</span>
            </span>
          </Link>

          <ul className="mt-2.5 grid grid-cols-2 gap-2.5">
            {tiles.map((t) => (
              <li key={t.href}>
                <Link href={t.href} onClick={onClose} className="relative block aspect-square overflow-hidden rounded-xl">
                  <span className="absolute inset-0 block">
                    <ArtOrPhoto image={t.image} motif={t.motif} tone={t.tone} sizes="170px" />
                  </span>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-2 pt-10 pb-2.5 text-center text-[0.82rem] leading-tight font-bold tracking-wide text-white uppercase">{t.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <MenuReviews reviews={reviews} />

        <ul className="mt-3 px-4 pb-8">
          {MENU_LINKS.map(({ href, label, Icon, dot }) => (
            <li key={href}>
              <Link href={href} onClick={onClose} className="flex items-center gap-3.5 border-b border-parchment/60 py-3 text-[0.88rem] tracking-wide text-charcoal uppercase hover:text-burgundy">
                <Icon className="h-6 w-6 shrink-0" strokeWidth={1.2} aria-hidden="true" />
                {label}
                {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-burgundy-soft" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <button type="button" tabIndex={-1} aria-label="Close menu" className="flex-1 bg-black/50" onClick={onClose} />
    </div>
  );
}

export function Header({ tiles, reviews }: { tiles: MenuTile[]; reviews: MenuReview[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useRef(() => setOpen(false)).current;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-parchment bg-white">
        <div className="container-page flex h-[3.75rem] items-center gap-2 md:h-[4.5rem] lg:gap-6">
          <button type="button" className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center text-charcoal lg:hidden" aria-expanded={open} aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-7 w-7" strokeWidth={1.2} aria-hidden="true" />
          </button>
          <Link href="/" aria-label="Ishmayi, home" className="shrink-0">
            <Logo />
          </Link>
          <SearchBar className="hidden flex-1 lg:block" />
          <div className="-mr-2 ml-auto flex items-center lg:ml-0">
            <AccountMenu className={headerIcon} />
            <WishlistLink />
            <CartButton className={headerIcon} />
          </div>
        </div>
      </header>

      <div className="border-b border-parchment bg-white py-2.5 lg:hidden">
        <div className="container-page">
          <SearchBar />
        </div>
      </div>

      <nav aria-label="Main" className="hidden border-b border-parchment bg-white lg:block">
        <ul className="container-page flex flex-wrap items-center justify-center gap-x-9 py-2.5">
          {PRIMARY.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={pathname === l.href ? "page" : undefined} className="text-[0.95rem] text-ink-muted hover:text-burgundy aria-[current=page]:font-bold aria-[current=page]:text-burgundy">
                {l.label}
              </Link>
            </li>
          ))}
          {tiles.slice(0, 4).map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="text-[0.95rem] text-ink-muted hover:text-burgundy">
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {open && <Drawer tiles={tiles} reviews={reviews} onClose={close} />}
    </>
  );
}
