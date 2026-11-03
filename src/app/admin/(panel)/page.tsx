import Link from "next/link";
import { Suspense } from "react";
import { Badge, Card, Empty, GhlError, Skeleton, Stat, btn, fmtDate } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { contactsWithTag, listAppointments, listInvoices, listOpportunities, type Opportunity } from "@/lib/admin/data";
import { getCollection } from "@/lib/catalog";
import { ALL_HANDLE } from "@/lib/catalog/config";
import { formatInr } from "@/lib/site";

export const metadata = { title: "Dashboard" };

const startOfMonthIst = () => {
  const now = new Date(Date.now() + 5.5 * 3600e3);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 5.5 * 3600e3);
};

function OppRow({ o }: { o: Opportunity }) {
  return (
    <li>
      <Link href={`/admin/${o.kind === "order" ? "orders" : "consultations"}/${o.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-ivory-deep">
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-charcoal">{o.kind === "order" ? (o.reference ?? "Order") : o.detail}</span>
          <span className="block truncate text-xs text-ink-muted">
            {o.contact.name || o.contact.email} · {fmtDate(o.createdAt)}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-bold">{formatInr(o.value)}</span>
          <Badge status={o.status} />
        </span>
      </Link>
    </li>
  );
}

const QUICK = [
  { href: "/admin/products/new", t: "Add product", s: "Photos, price, category", c: "from-[#e3425c] to-[#8f1d34]", d: "M12 5v14M5 12h14" },
  { href: "/admin/invoices/new", t: "New invoice", s: "Create & email", c: "from-[#2563eb] to-[#1e3a8a]", d: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6" },
  { href: "/admin/calendar", t: "Schedule", s: "Book a consultation", c: "from-[#7c3aed] to-[#4c1d95]", d: "M4 7h16v13H4zM4 11h16M8 3v4M16 3v4" },
  { href: "/admin/banners", t: "Banners", s: "Home page slides", c: "from-[#d97706] to-[#92400e]", d: "M3 5h18v11H3zM9 9l3 3 2-2 3 3" },
  { href: "/admin/media", t: "Media", s: "Upload photos & videos", c: "from-[#059669] to-[#065f46]", d: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5" },
  { href: "/admin/reviews", t: "Reviews", s: "Video & written", c: "from-[#db2777] to-[#831843]", d: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" },
];

// ---- Streamed blocks (each loads independently with its own skeleton) ----

async function InvoiceStat() {
  const invoices = await listInvoices().catch(() => []);
  const due = invoices.filter((i) => ["sent", "viewed", "partially_paid", "overdue"].includes(i.status)).reduce((x, i) => x + i.amountDue, 0);
  const products = await getCollection(ALL_HANDLE).catch(() => null);
  return <Stat label="Unpaid invoices" value={formatInr(due)} sub={`${products?.length ?? "—"} products on sale`} href="/admin/invoices" tone="gold" icon="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />;
}

async function Appointments() {
  const upcoming = await listAppointments(new Date(), new Date(Date.now() + 14 * 864e5)).catch(() => null);
  if (!upcoming) return <Empty>Couldn&apos;t load the calendar right now.</Empty>;
  return upcoming.length ? (
    <ul className="space-y-2">
      {upcoming.slice(0, 6).map((a) => (
        <li key={a.id} className="rounded-lg bg-ivory-deep px-3 py-2.5">
          <p className="text-sm font-bold">{a.title}</p>
          <p className="text-xs text-ink-muted">{fmtDate(a.start)}</p>
        </li>
      ))}
    </ul>
  ) : (
    <Empty>Nothing booked in the next 14 days.</Empty>
  );
}

async function Messages() {
  const messages = await contactsWithTag("website-contact").catch(() => null);
  if (!messages?.length) return <Empty>No messages yet.</Empty>;
  return (
    <ul className="divide-y divide-parchment">
      {messages.slice(0, 5).map((c) => (
        <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
          <Link href={`/admin/customers/${c.id}`} className="font-semibold hover:text-[#ff8197]">
            {c.name || c.email}
          </Link>
          <span className="text-ink-muted">{fmtDate(c.dateAdded)}</span>
        </li>
      ))}
    </ul>
  );
}

const ListSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 4 }, (_, i) => (
      <Skeleton key={i} className="h-12" />
    ))}
  </div>
);

export default async function Dashboard() {
  await requireAdmin();
  let all: Opportunity[];
  try {
    all = await listOpportunities();
  } catch (err) {
    return <GhlError error={err} />;
  }
  const monthStart = startOfMonthIst();
  const orders = all.filter((o) => o.kind === "order");
  const consults = all.filter((o) => o.kind === "consultation");
  const monthOrders = orders.filter((o) => new Date(o.createdAt) >= monthStart && o.status !== "lost" && o.status !== "abandoned");
  const revenue = monthOrders.reduce((s, o) => s + o.value, 0);
  const openOrders = orders.filter((o) => o.status === "open");
  const openConsults = consults.filter((o) => o.status === "open");

  return (
    <>
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl border border-parchment bg-gradient-to-br from-[#2a0f18] via-[#1a1020] to-[#0f0c12] p-6 md:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-10 h-72 w-72 rounded-full bg-[#e3425c]/25 blur-3xl" />
        <div className="relative max-w-xl">
          <p className="text-xs font-bold tracking-[0.2em] text-[#ff8197] uppercase">{fmtDate(new Date().toISOString(), false)}</p>
          <h1 className="mt-2 text-2xl font-bold text-white md:text-[2rem]">Welcome back to Ishmayi</h1>
          <p className="mt-2 text-sm text-white/70 md:text-base">
            {openOrders.length} order{openOrders.length === 1 ? "" : "s"} to process · {openConsults.length} open enquir{openConsults.length === 1 ? "y" : "ies"}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/admin/orders?status=open" className={btn.primary}>
              Process orders
            </Link>
            <Link href="/" target="_blank" className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10">
              View website ↗
            </Link>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {QUICK.map((q) => (
          <li key={q.href}>
            <Link href={q.href} className={`group flex h-full flex-col justify-between gap-6 rounded-2xl bg-gradient-to-br ${q.c} p-4 text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={q.d} />
                </svg>
              </span>
              <span>
                <span className="block font-bold">{q.t}</span>
                <span className="block text-xs text-white/75">{q.s}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Stat label="Revenue this month" value={formatInr(revenue)} sub={`${monthOrders.length} orders`} href="/admin/orders" tone="emerald" icon="M3 17l6-6 4 4 8-8M15 7h6v6" />
        <Stat label="Orders to process" value={openOrders.length} sub={`${orders.length} orders in total`} href="/admin/orders?status=open" tone="rose" icon="M6 7h12l-1 13H7L6 7Zm3 0V5a3 3 0 0 1 6 0v2" />
        <Stat label="Open enquiries" value={openConsults.length} sub="consultations awaiting follow-up" href="/admin/consultations?status=open" tone="violet" icon="M12 3 21 9.5 12 21 3 9.5ZM3 9.5h18" />
        <Suspense fallback={<Skeleton className="h-full min-h-28" />}>
          <InvoiceStat />
        </Suspense>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card title="Latest orders" actions={<Link href="/admin/orders" className="text-sm font-bold text-[#ff8197]">View all</Link>}>
          {orders.length ? <ul className="-mx-2">{orders.slice(0, 6).map((o) => <OppRow key={o.id} o={o} />)}</ul> : <Empty>No orders yet.</Empty>}
        </Card>
        <Card title="Latest consultation enquiries" actions={<Link href="/admin/consultations" className="text-sm font-bold text-[#ff8197]">View all</Link>}>
          {consults.length ? <ul className="-mx-2">{consults.slice(0, 6).map((o) => <OppRow key={o.id} o={o} />)}</ul> : <Empty>No enquiries yet.</Empty>}
        </Card>
        <Card title="Upcoming appointments" actions={<Link href="/admin/calendar" className="text-sm font-bold text-[#ff8197]">Calendar</Link>}>
          <Suspense fallback={<ListSkeleton />}>
            <Appointments />
          </Suspense>
        </Card>
      </div>

      <Card title="Recent messages" className="mt-4" actions={<Link href="/admin/messages" className="text-sm font-bold text-[#ff8197]">All messages</Link>}>
        <Suspense fallback={<ListSkeleton />}>
          <Messages />
        </Suspense>
      </Card>
    </>
  );
}
