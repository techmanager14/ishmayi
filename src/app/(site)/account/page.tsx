import type { Metadata } from "next";
import Link from "next/link";
import { OrderCard } from "@/components/account/OrderCard";
import { SignIn } from "@/components/account/SignIn";
import { PageHero } from "@/components/Sections";
import { customerInvoices, customerOrders } from "@/lib/customer/data";
import { accountsEnabled, currentCustomer, pendingEmail } from "@/lib/customer/session";
import { formatInr } from "@/lib/site";
import { signOutAction } from "./actions";

export const metadata: Metadata = { title: "My account", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const INVOICE_STATUS: Record<string, string> = { sent: "Unpaid", viewed: "Unpaid", overdue: "Overdue", paid: "Paid", partially_paid: "Part paid", void: "Void" };

export default async function AccountPage() {
  const customer = await currentCustomer();

  if (!customer) {
    return (
      <>
        <PageHero eyebrow="My account" title="Your orders, in one place">
          <p>Sign in, or create a free account, to see your orders, their delivery status and your invoices.</p>
        </PageHero>
        <section className="container-page py-10 md:py-16">
          {accountsEnabled() ? (
            <SignIn pending={await pendingEmail()} />
          ) : (
            <p className="mx-auto max-w-md rounded-2xl bg-ivory-deep p-6 text-center text-sm text-ink-muted">
              Accounts are coming soon. Meanwhile, <Link href="/track" className="font-semibold text-burgundy">track an order</Link> or{" "}
              <Link href="/contact" className="font-semibold text-burgundy">contact us</Link>.
            </p>
          )}
        </section>
      </>
    );
  }

  const [orders, invoices] = await Promise.all([customerOrders(customer.contactId).catch(() => null), customerInvoices(customer.contactId).catch(() => [])]);
  const shop = orders?.filter((o) => o.kind === "order") ?? [];
  const consultations = orders?.filter((o) => o.kind === "consultation") ?? [];

  return (
    <>
      <PageHero eyebrow="My account" title={`Hello${customer.name ? `, ${customer.name.split(" ")[0]}` : ""}`}>
        <p>
          Signed in as <strong className="text-charcoal">{customer.email}</strong>.
        </p>
        <form action={signOutAction} className="mt-4">
          <button className="btn btn-outline btn-caps">Sign out</button>
        </form>
      </PageHero>

      <section className="container-page grid gap-10 py-10 md:py-14 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          <div>
            <h2 className="text-xl font-bold text-charcoal md:text-2xl">My orders</h2>
            {orders === null ? (
              <p className="mt-4 rounded-xl bg-ivory-deep p-5 text-sm text-ink-muted">We couldn&apos;t load your orders just now. Please refresh in a minute.</p>
            ) : shop.length === 0 ? (
              <p className="mt-4 rounded-xl bg-ivory-deep p-5 text-sm text-ink-muted">
                No orders yet.{" "}
                <Link href="/shop" className="font-semibold text-burgundy">
                  Start shopping
                </Link>
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {shop.map((o) => (
                  <OrderCard key={o.id} o={o} href={`/account/orders/${o.id}`} />
                ))}
              </div>
            )}
          </div>

          {consultations.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-charcoal md:text-2xl">My consultations</h2>
              <div className="mt-4 space-y-4">
                {consultations.map((o) => (
                  <OrderCard key={o.id} o={o} href={`/account/orders/${o.id}`} />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-40 lg:self-start">
          <div className="rounded-2xl border border-parchment bg-white p-5">
            <h2 className="font-bold text-charcoal">Invoices</h2>
            {invoices.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">No invoices yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-parchment text-sm">
                {invoices.map((i) => (
                  <li key={i.id}>
                    <Link href={`/account/invoices/${i.id}`} className="-mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-2.5 hover:bg-ivory-deep">
                      <span>
                        <span className="block font-semibold text-charcoal">{i.number}</span>
                        <span className="text-xs text-ink-muted">
                          {INVOICE_STATUS[i.status] ?? i.status}
                          {i.name ? ` · ${i.name}` : ""}
                        </span>
                      </span>
                      <span className="font-bold">
                        {formatInr(i.total)} <span className="text-burgundy">→</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {invoices.some((i) => i.due > 0) && <p className="mt-2 text-xs text-ink-muted">Tap an invoice to view, print or save it as PDF. To pay, use the link in the invoice email.</p>}
          </div>
          <div className="rounded-2xl bg-blush p-5 text-sm">
            <p className="font-bold text-charcoal">Need help with an order?</p>
            <p className="mt-1 text-ink-muted">Message us with your order number and we&apos;ll get back to you.</p>
            <Link href="/contact" className="btn btn-primary btn-caps mt-3">
              Contact us
            </Link>
          </div>
        </aside>
      </section>
    </>
  );
}
