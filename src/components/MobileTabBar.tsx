"use client";

import { Compass, House, Percent, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartButton } from "./CartDrawer";

const tabs = [
  { href: "/", label: "Home", Icon: House },
  { href: "/shop", label: "Shop", Icon: Store },
  { href: "/offers", label: "Offers", Icon: Percent },
  { href: "/explore", label: "Explore", Icon: Compass },
];

/** App-style bottom navigation for phones (hidden from 1024px up). */
export function MobileTabBar() {
  const pathname = usePathname();
  const tab = "flex h-full flex-col items-center justify-center gap-1 text-[0.68rem]";
  return (
    <nav aria-label="Shortcuts" className="fixed inset-x-0 bottom-0 z-40 border-t border-parchment bg-ivory pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="mx-auto grid h-[3.75rem] max-w-lg grid-cols-5">
        {tabs.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={label}>
              <Link href={href} aria-current={active ? "page" : undefined} className={`${tab} ${active ? "text-burgundy" : "text-ink-muted"}`}>
                <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 1.8 : 1.4} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <CartButton className={`${tab} w-full ${pathname === "/cart" || pathname === "/checkout" ? "text-burgundy" : "text-ink-muted"}`} />
        </li>
      </ul>
    </nav>
  );
}
