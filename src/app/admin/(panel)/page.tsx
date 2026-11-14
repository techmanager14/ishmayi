import { ReceiptText, ShoppingBag, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Badge, Card, Empty, GhlError, Skeleton, Stat, btn, fmtDate } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listInvoices, listOpportunities, type Opportunity } from "@/lib/admin/data";
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

// ---- Streamed blocks (each loads independently with its own skeleton) ----

async function InvoiceStat() {
  const invoices = await listInvoices().catch(() => []);
  const due = invoices.filter((i) => ["sent", "viewed", "partially_paid", "overdue"].includes(i.status)).reduce((x, i) => x + i.amountDue, 0);
  const products = await getCollection(ALL_HANDLE).catch(() => null);
  return <Stat label="Unpaid invoices" value={formatInr(due)} sub={`${products?.length ?? "—"} products on sale`} href="/admin/invoices" tone="gold" icon={ReceiptText} />;
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
  const monthOrders = orders.filter((o) => new Date(o.createdAt) >= monthStart && o.status !== "lost" && o.status !== "abandoned");
  const revenue = monthOrders.reduce((s, o) => s + o.value, 0);
  const openOrders = orders.filter((o) => o.status === "open");

  return (
    <>
      {/* Welcome banner */}
      <section className="rounded-2xl bg-burgundy p-4 md:p-5">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-gold-light uppercase">{fmtDate(new Date().toISOString(), false)}</p>
          <h1 className="mt-2 text-lg font-bold text-white md:text-xl">Welcome back to Ishmayi</h1>
          <p className="mt-2 text-sm text-white/70 md:text-base">
            {openOrders.length} order{openOrders.length === 1 ? "" : "s"} to process
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/admin/orders?status=open" className="inline-flex items-center justify-center rounded-lg bg-white px-3.5 py-2 text-sm font-bold text-burgundy transition hover:bg-gold-light">
              Process orders
            </Link>
            <Link href="/admin/products/new" className="inline-flex items-center rounded-lg border border-white/25 px-3.5 py-2 text-sm font-bold text-white hover:bg-white/10">
              + Add product
            </Link>
            <Link href="/admin/invoices/new" className="inline-flex items-center rounded-lg border border-white/25 px-3.5 py-2 text-sm font-bold text-white hover:bg-white/10">
              + New invoice
            </Link>
            <Link href="/" target="_blank" className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-bold text-white/80 hover:text-white">
              View website
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Revenue this month" value={formatInr(revenue)} sub={`${monthOrders.length} orders`} href="/admin/orders" tone="emerald" icon={TrendingUp} />
        <Stat label="Orders to process" value={openOrders.length} sub={`${orders.length} orders in total`} href="/admin/orders?status=open" tone="rose" icon={ShoppingBag} />
        <Suspense fallback={<Skeleton className="h-full min-h-28" />}>
          <InvoiceStat />
        </Suspense>
      </div>

      <div className="mt-3">
        <Card title="Latest orders" actions={<Link href="/admin/orders" className="text-sm font-bold text-burgundy">View all</Link>}>
          {orders.length ? <ul className="-mx-2">{orders.slice(0, 6).map((o) => <OppRow key={o.id} o={o} />)}</ul> : <Empty>No orders yet.</Empty>}
        </Card>
      </div>
    </>
  );
}
