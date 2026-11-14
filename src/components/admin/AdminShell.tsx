"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ExternalLink,
  FileText,
  GalleryHorizontal,
  Gem,
  Images,
  LayoutDashboard,
  LayoutGrid,
  ListTree,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  PanelsTopLeft,
  ReceiptText,
  Settings,
  ShieldAlert,
  Sparkles,
  PartyPopper,
  Inbox,
  ShieldCheck,
  ShoppingBag,
  Star,
  TicketPercent,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { logoutAction } from "@/app/admin/actions";

const I = {
  dash: LayoutDashboard,
  orders: ShoppingBag,
  invoice: ReceiptText,
  products: Package,
  categories: LayoutGrid,
  customers: Users,
  messages: MessageSquare,
  claims: ShieldAlert,
  banners: GalleryHorizontal,
  media: Images,
  reviews: Star,
  content: FileText,
  coupon: TicketPercent,
  pages: PanelsTopLeft,
  menu: ListTree,
  policy: ShieldCheck,
  settings: Settings,
  matches: Sparkles,
  occasions: PartyPopper,
  requests: Inbox,
};

// Everyday work first; pages that are rarely changed sit under "More" (closed unless one is open).
const GROUPS: { title: string; more?: boolean; items: { href: string; label: string; icon: LucideIcon }[] }[] = [
  {
    title: "",
    items: [
      { href: "/admin", label: "Dashboard", icon: I.dash },
      { href: "/admin/orders", label: "Orders", icon: I.orders },
      { href: "/admin/requests", label: "Requests", icon: I.requests },
      { href: "/admin/products", label: "Products", icon: I.products },
      { href: "/admin/customers", label: "Customers", icon: I.customers },
    ],
  },
  {
    title: "Shop",
    items: [
      { href: "/admin/categories", label: "Categories", icon: I.categories },
      { href: "/admin/occasions", label: "Shop by Occasion", icon: I.occasions },
      { href: "/admin/matches", label: "Perfect match", icon: I.matches },
      { href: "/admin/coupons", label: "Discount codes", icon: I.coupon },
      { href: "/admin/invoices", label: "Invoices", icon: I.invoice },
      { href: "/admin/claims", label: "Damage claims", icon: I.claims },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/admin/banners", label: "Banners", icon: I.banners },
      { href: "/admin/content", label: "Content & FAQs", icon: I.content },
      { href: "/admin/media", label: "Media library", icon: I.media },
    ],
  },
  {
    title: "More",
    more: true,
    items: [
      { href: "/admin/pages", label: "Pages & text", icon: I.pages },
      { href: "/admin/reviews", label: "Reviews", icon: I.reviews },
      { href: "/admin/menu", label: "Menu", icon: I.menu },
      { href: "/admin/policies", label: "Policies", icon: I.policy },
      { href: "/admin/settings", label: "Settings", icon: I.settings },
    ],
  },
];

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-burgundy shadow-lg shadow-black/10">
        <Gem className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="leading-none">
        <span className="block text-[1.05rem] font-bold tracking-[0.2em] text-white">ISHMAYI</span>
        <span className="block text-[0.6rem] font-semibold tracking-[0.3em] text-gold-light">ADMIN</span>
      </span>
    </Link>
  );
}

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const link = (n: (typeof GROUPS)[number]["items"][number]) => (
    <li key={n.href}>
      <Link
        href={n.href}
        prefetch
        aria-current={active(n.href) ? "page" : undefined}
        className={`group flex items-center gap-3 rounded-lg px-3 py-1.5 text-[0.88rem] font-semibold transition-colors ${
          active(n.href) ? "bg-white text-burgundy shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"
        }`}
      >
        <n.icon className={`h-[1.1rem] w-[1.1rem] ${active(n.href) ? "" : "text-white/60 group-hover:text-white"}`} strokeWidth={1.8} aria-hidden="true" />
        {n.label}
      </Link>
    </li>
  );

  const nav = (
    <nav aria-label="Admin" className="space-y-3">
      {GROUPS.map((g) =>
        g.more ? (
          <details key={g.title} open={g.items.some((n) => active(n.href))} className="group/more">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-1.5 text-[0.62rem] font-bold tracking-[0.18em] text-white/55 uppercase hover:text-white [&::-webkit-details-marker]:hidden">
              {g.title}
              <ChevronDown className="h-4 w-4 transition-transform group-open/more:rotate-180" aria-hidden="true" />
            </summary>
            <ul className="mt-1 space-y-0.5">{g.items.map(link)}</ul>
          </details>
        ) : (
        <div key={g.title || "main"}>
          {g.title && <p className="mb-1 px-3 text-[0.62rem] font-bold tracking-[0.18em] text-white/55 uppercase">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map(link)}
          </ul>
        </div>
        ),
      )}
    </nav>
  );

  const footer = (
    <div className="mt-auto space-y-2 border-t border-white/10 pt-3 text-sm text-white/60">
      <Link href="/" target="_blank" className="flex items-center gap-2 rounded-lg px-1 hover:text-white">
        <ExternalLink className="h-4 w-4" aria-hidden="true" /> View website
      </Link>
      <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] p-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-gold-light uppercase">
          {email.slice(0, 2)}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs" title={email}>
          {email}
        </span>
        <form action={logoutAction}>
          <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white" title="Sign out">
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="admin-ui min-h-dvh">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-5 overflow-y-auto border-r border-white/[0.06] bg-burgundy p-4 lg:flex">
        <Brand />
        {nav}
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-burgundy/95 px-3 py-2 backdrop-blur lg:hidden">
        <Brand />
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-white hover:bg-white/10">
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-4 overflow-y-auto bg-burgundy p-4">
            <div className="flex items-center justify-between">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-md p-1 text-white hover:bg-white/10">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      )}

      <main className="px-3 py-4 md:px-6 md:py-5 lg:ml-60">{children}</main>
    </div>
  );
}
