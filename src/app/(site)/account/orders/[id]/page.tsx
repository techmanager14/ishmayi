import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrderCard } from "@/components/account/OrderCard";
import { customerInvoices, customerOrder } from "@/lib/customer/data";
import { currentCustomer } from "@/lib/customer/session";
import { formatInr, formatInrExact } from "@/lib/site";

export const metadata: Metadata = { title: "Order details", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const INVOICE_STATUS: Record<string, string> = { sent: "Unpaid", viewed: "Unpaid", overdue: "Overdue", paid: "Paid", partially_paid: "Part paid", void: "Void" };

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-parchment bg-white p-5">
      <h2 className="font-sans text-xs font-bold tracking-[0.14em] text-ink-muted uppercase">{title}</h2>
      <div className="mt-3 text-sm text-charcoal">{children}</div>
    </section>
  );
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await currentCustomer();
  if (!customer) redirect("/account");
  const { id } = await params;
  const [order, invoices] = await Promise.all([customerOrder(customer.contactId, id), customerInvoices(customer.contactId).catch(() => [])]);
  if (!order) notFound();
  const d = order.detail;
  const linked = order.reference ? invoices.filter((i) => i.name.includes(order.reference)) : [];

  return (
    <section className="container-page py-8 md:py-12">
      <Link href="/account" className="text-sm font-semibold text-burgundy hover:underline">
        ← My account
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <OrderCard o={order} />

          {d.totals.length > 0 && (
            <Box title="Price details">
              <dl className="space-y-1.5">
                {d.totals.map((t) => (
                  <div key={t.label} className={`flex justify-between gap-4 ${t.label === "Total" ? "border-t border-parchment pt-2 text-base font-bold" : ""}`}>
                    <dt className={t.label === "Total" ? "" : "text-ink-muted"}>{t.label}</dt>
                    <dd>{t.value}</dd>
                  </div>
                ))}
              </dl>
            </Box>
          )}

          {d.facts.length > 0 && (
            <Box title={order.kind === "order" ? "Gift details" : "Consultation details"}>
              <dl className="grid gap-3 sm:grid-cols-2">
                {d.facts.map((f) => (
                  <div key={f.label}>
                    <dt className="text-xs text-ink-muted">{f.label}</dt>
                    <dd className="font-semibold">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </Box>
          )}

          {d.refunds.length > 0 && (
            <Box title="Refunds">
              <ul className="space-y-1.5">
                {d.refunds.map((r, i) => (
                  <li key={i} className="flex justify-between gap-4">
                    <span className="text-ink-muted">{new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</span>
                    <span className="font-bold text-[#2e8b57]">{formatInrExact(r.amount)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-muted">Refunded to your original payment method. Your bank may take a few working days to show it.</p>
            </Box>
          )}

          {d.note && (
            <Box title="Your note">
              <p className="whitespace-pre-line">{d.note}</p>
            </Box>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-40 lg:self-start">
          {order.reference && (
            <Box title="Order number">
              <p className="text-lg font-bold tracking-wide">{order.reference}</p>
            </Box>
          )}
          {d.payment && (
            <Box title="Payment">
              <p>{d.payment}</p>
            </Box>
          )}
          {d.address.length > 0 && (
            <Box title="Delivery address">
              <address className="space-y-0.5 not-italic">
                {d.address.map((l, i) => (
                  <p key={i} className={i === 0 ? "font-semibold" : "text-ink-muted"}>
                    {l}
                  </p>
                ))}
              </address>
            </Box>
          )}
          {linked.length > 0 && (
            <Box title="Invoice">
              <ul className="space-y-2">
                {linked.map((i) => (
                  <li key={i.id}>
                    <Link href={`/account/invoices/${i.id}`} className="flex items-center justify-between gap-2 rounded-xl bg-ivory-deep px-3 py-2.5 hover:bg-blush">
                      <span>
                        <span className="block font-semibold">{i.number}</span>
                        <span className="text-xs text-ink-muted">{INVOICE_STATUS[i.status] ?? i.status}</span>
                      </span>
                      <span className="font-bold">{formatInr(i.total)} →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Box>
          )}
          {order.kind === "order" && (
            <div className="rounded-2xl border border-gold/40 bg-white p-5 text-sm">
              <p className="font-bold text-charcoal">Parcel arrived damaged?</p>
              <p className="mt-1 text-ink-muted">Upload your unboxing video within 24 hours of delivery and we will refund the damaged piece.</p>
              <Link href="/report-damage" className="btn btn-outline btn-caps mt-3">
                🎥 Report damage
              </Link>
            </div>
          )}
          <div className="rounded-2xl bg-blush p-5 text-sm">
            <p className="font-bold text-charcoal">Need help with this {order.kind === "order" ? "order" : "booking"}?</p>
            <p className="mt-1 text-ink-muted">Message us{order.reference ? ` with ${order.reference}` : ""} and we&apos;ll get back to you.</p>
            <Link href="/contact" className="btn btn-primary btn-caps mt-3">
              Contact us
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
