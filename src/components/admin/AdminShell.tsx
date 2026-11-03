"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { logoutAction } from "@/app/admin/actions";

const I = {
  dash: "M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 4v3h6V4z",
  orders: "M6 7h12l-1 13H7L6 7Zm3 0V5a3 3 0 0 1 6 0v2",
  invoice: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6M9 16h3",
  consult: "M12 3 21 9.5 12 21 3 9.5ZM3 9.5h18",
  calendar: "M4 7h16v13H4zM4 11h16M8 3v4M16 3v4",
  products: "M20 7 12 3 4 7v10l8 4 8-4V7ZM4 7l8 4 8-4M12 11v10",
  categories: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  customers: "M16 19a4 4 0 0 0-8 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19a3 3 0 0 0-3-3M4 19a3 3 0 0 1 3-3",
  messages: "M4 5h16v11H8l-4 4V5Z",
  claims: "M15 10l4.5-2.5v9L15 14M4 6h11v12H4z",
  banners: "M3 5h18v11H3zM7 20h10M9 9l3 3 2-2 3 3",
  videos: "M3 6h13v12H3zM16 10l5-3v10l-5-3",
  media: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01",
  reviews: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z",
  content: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5",
  coupon: "M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V7Zm6 0v12",
  pages: "M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6",
  menu: "M4 7h16M4 12h16M4 17h10",
  policy: "M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Zm-3 9 2 2 4-4",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12l2-1-2-4-2 .5-1.5-1L15 4h-4l-.5 2.5-1.5 1L7 7 5 11l2 1-2 1 2 4 2-.5 1.5 1L11 20h4l.5-2.5 1.5-1 2 .5 2-4-2-1Z",
};

const GROUPS: { title: string; items: { href: string; label: string; icon: string }[] }[] = [
  { title: "", items: [{ href: "/admin", label: "Dashboard", icon: I.dash }] },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: I.orders },
      { href: "/admin/invoices", label: "Invoices", icon: I.invoice },
      { href: "/admin/consultations", label: "Past consultations", icon: I.consult },
      { href: "/admin/calendar", label: "Calendar", icon: I.calendar },
      { href: "/admin/customers", label: "Customers", icon: I.customers },
      { href: "/admin/messages", label: "Messages", icon: I.messages },
      { href: "/admin/claims", label: "Damage claims", icon: I.claims },
    ],
  },
  {
    title: "Store",
    items: [
      { href: "/admin/products", label: "Products", icon: I.products },
      { href: "/admin/categories", label: "Categories", icon: I.categories },
      { href: "/admin/coupons", label: "Discount codes", icon: I.coupon },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/admin/banners", label: "Banners", icon: I.banners },
      { href: "/admin/media", label: "Media library", icon: I.media },
      { href: "/admin/content", label: "Content & FAQs", icon: I.content },
      { href: "/admin/reviews", label: "Reviews", icon: I.reviews },
      { href: "/admin/pages", label: "Pages & text", icon: I.pages },
      { href: "/admin/menu", label: "Menu", icon: I.menu },
      { href: "/admin/policies", label: "Policies", icon: I.policy },
    ],
  },
  { title: "System", items: [{ href: "/admin/settings", label: "Settings", icon: I.settings }] },
];

const Icon = ({ d, className = "h-5 w-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#e3425c] to-[#7a1f33] text-white shadow-lg shadow-[#e3425c]/20">
        <Icon d="M12 3 21 9.5 12 21 3 9.5ZM3 9.5h18M8.5 9.5 12 21l3.5-11.5" className="h-5 w-5" />
      </span>
      <span className="leading-none">
        <span className="block text-[1.05rem] font-bold tracking-[0.2em] text-white">ISHMAYI</span>
        <span className="block text-[0.6rem] font-semibold tracking-[0.3em] text-[#e3425c]">ADMIN</span>
      </span>
    </Link>
  );
}

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Admin" className="space-y-5">
      {GROUPS.map((g) => (
        <div key={g.title || "main"}>
          {g.title && <p className="mb-1.5 px-3 text-[0.65rem] font-bold tracking-[0.18em] text-white/35 uppercase">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  prefetch
                  aria-current={active(n.href) ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9rem] font-semibold transition-all ${
                    active(n.href)
                      ? "bg-gradient-to-r from-[#e3425c] to-[#b92e48] text-white shadow-lg shadow-[#e3425c]/25"
                      : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon d={n.icon} className={`h-[1.15rem] w-[1.15rem] ${active(n.href) ? "" : "text-white/45 group-hover:text-white"}`} />
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="mt-auto space-y-3 border-t border-white/10 pt-4 text-sm text-white/60">
      <Link href="/" target="_blank" className="flex items-center gap-2 rounded-lg px-1 hover:text-white">
        <Icon d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" className="h-4 w-4" /> View website
      </Link>
      <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] p-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e3425c]/20 text-xs font-bold text-[#ff8197] uppercase">
          {email.slice(0, 2)}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs" title={email}>
          {email}
        </span>
        <form action={logoutAction}>
          <button className="rounded-md px-2 py-1 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white" title="Sign out">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="admin-ui min-h-dvh">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-7 overflow-y-auto border-r border-white/[0.06] bg-[#110d14] p-5 lg:flex">
        <Brand />
        {nav}
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-[#110d14]/95 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-white hover:bg-white/10">
          <Icon d="M4 7h16M4 12h16M4 17h16" className="h-6 w-6" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-6 overflow-y-auto bg-[#110d14] p-5">
            <div className="flex items-center justify-between">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-md p-1 text-white hover:bg-white/10">
                <Icon d="M6 6l12 12M18 6 6 18" />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      )}

      <main className="px-4 py-6 md:px-8 md:py-8 lg:ml-64">{children}</main>
    </div>
  );
}
