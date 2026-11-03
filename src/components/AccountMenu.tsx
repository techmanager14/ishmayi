"use client";

import { ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "/account", label: "My orders & invoices" },
  { href: "/track", label: "Track my order" },
  { href: "/wishlist", label: "Wishlist" },
];

/** Account & login in the header: says who is signed in, or offers login. */
export function AccountMenu({ className }: { className: string }) {
  const pathname = usePathname();
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  // undefined: not known yet. null: signed out.
  const [name, setName] = useState<string | null | undefined>(undefined);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/account/me")
      .then((r) => r.json() as Promise<{ name: string | null }>)
      .then((d) => setName(d.name))
      .catch(() => setName(null));
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)} className={className}>
        <User className="h-[22px] w-[22px]" strokeWidth={1.4} aria-hidden="true" />
        <span>Account</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 z-50 mt-1 w-64 rounded-xl border border-parchment bg-white p-4 shadow-[var(--shadow-soft)]">
          {name === undefined ? (
            <div aria-busy="true" className="skeleton h-11 rounded-lg" />
          ) : name ? (
            <>
              <p className="text-sm text-ink-muted">Signed in as</p>
              <p className="truncate font-bold text-charcoal">{name}</p>
            </>
          ) : (
            <>
              <p className="font-bold text-charcoal">Welcome to Ishmayi</p>
              <p className="text-sm text-ink-muted">Login to track orders and see your invoices.</p>
              <Link href="/account" className="btn btn-primary mt-3 w-full">
                Login / Sign up
              </Link>
            </>
          )}
          <ul className="mt-3 border-t border-parchment pt-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex items-center justify-between py-2 text-[0.92rem] text-charcoal hover:text-burgundy">
                  {l.label}
                  <ChevronRight className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
