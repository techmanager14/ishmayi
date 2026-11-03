import Link from "next/link";
import { Badge, Card, Empty, GhlError, PageTitle, Stat, Tabs, btn, fmtDate, input } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listInvoices } from "@/lib/admin/data";
import { formatInr } from "@/lib/site";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; deleted?: string }> }) {
  await requireAdmin();
  const { status, q, deleted } = await searchParams;
  let all;
  try {
    all = await listInvoices();
  } catch (err) {
    return <GhlError error={err} />;
  }
  const query = (q ?? "").trim().toLowerCase();
  const rows = all
    .filter((i) => !status || i.status === status)
    .filter((i) => !query || `${i.number} ${i.name} ${i.contact.name} ${i.contact.email}`.toLowerCase().includes(query));
  const count = (s?: string) => all.filter((i) => !s || i.status === s).length;
  const tab = (s: string | undefined, l: string) => ({ href: s ? `/admin/invoices?status=${s}` : "/admin/invoices", label: l, active: (status ?? "") === (s ?? ""), count: count(s) });
  const outstanding = all.filter((i) => ["sent", "viewed", "partially_paid", "overdue"].includes(i.status)).reduce((s, i) => s + i.amountDue, 0);
  const paid = all.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);

  return (
    <>
      <PageTitle
        title="Invoices"
        sub="Created and emailed through GoHighLevel. Customers get a secure link to view and pay."
        actions={
          <>
            <a href="/admin/export/invoices" className={btn.outline}>
              ⬇ Export CSV
            </a>
            <Link href="/admin/invoices/new" className={btn.primary}>
              + New invoice
            </Link>
          </>
        }
      />
      {deleted && <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300">Draft deleted.</p>}
      <div className="mb-5 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-3">
        <Stat label="Outstanding" value={formatInr(outstanding)} sub="sent, not yet paid" tone="gold" icon="M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
        <Stat label="Paid" value={formatInr(paid)} sub={`${count("paid")} invoices`} tone="emerald" icon="m5 12 5 5 9-10" />
        <Stat label="Drafts" value={count("draft")} sub="not sent yet" tone="violet" icon="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Tabs items={[tab(undefined, "All"), tab("draft", "Drafts"), tab("sent", "Sent"), tab("paid", "Paid"), tab("overdue", "Overdue"), tab("void", "Void")]} />
        <form className="flex gap-2" action="/admin/invoices">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search number, customer" className={`${input} w-60 py-2`} aria-label="Search invoices" />
          <button className={btn.outline}>Search</button>
        </form>
      </div>
      <Card>
        {rows.length === 0 ? (
          <Empty>
            No invoices here.{" "}
            <Link href="/admin/invoices/new" className="font-bold text-[#ff8197]">
              Create one
            </Link>{" "}
            — or open an order and press “Create invoice”.
          </Empty>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-parchment text-xs tracking-wide text-ink-muted uppercase">
                <tr>
                  <th className="px-5 py-2.5">Invoice</th>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Issued</th>
                  <th className="px-3 py-2.5">Due</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                  <th className="px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment">
                {rows.map((i) => (
                  <tr key={i.id} className="hover:bg-ivory-deep/60">
                    <td className="px-5 py-3">
                      <Link href={`/admin/invoices/${i.id}`} className="font-bold text-[#ff8197] hover:underline">
                        {i.number}
                      </Link>
                      <span className="block max-w-[14rem] truncate text-xs text-ink-muted">{i.name}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="block font-semibold">{i.contact.name || "—"}</span>
                      <span className="block text-xs text-ink-muted">{i.contact.email}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink-muted">{fmtDate(i.issueDate, false)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink-muted">{fmtDate(i.dueDate, false)}</td>
                    <td className="px-3 py-3 text-right font-bold whitespace-nowrap">{formatInr(i.total)}</td>
                    <td className="px-5 py-3">
                      <Badge status={i.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
