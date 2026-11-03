import type { Invoice } from "@/lib/admin/data";
import type { CmsContent } from "@/lib/cms-types";
import { formatInrExact } from "@/lib/site";

const plain = (html: string) =>
  html
    .replace(/<\/p>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

const day = (iso: string) => (iso ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso)) : "—");

const STATUS: Record<string, { label: string; tone: string }> = {
  paid: { label: "Paid", tone: "bg-emerald-50 text-emerald-700" },
  partially_paid: { label: "Part paid", tone: "bg-amber-50 text-amber-800" },
  overdue: { label: "Overdue", tone: "bg-rose-50 text-rose-700" },
  void: { label: "Void", tone: "bg-[#f1ede8] text-[#696e80]" },
  draft: { label: "Draft", tone: "bg-[#f1ede8] text-[#696e80]" },
};

/**
 * The invoice as a printable white sheet (always light, also inside the dark
 * admin panel). Add the `print-area` class to print only this sheet.
 */
export function InvoiceSheet({ inv, business, className = "" }: { inv: Invoice; business: CmsContent["business"]; className?: string }) {
  const status = STATUS[inv.status] ?? { label: "Unpaid", tone: "bg-amber-50 text-amber-800" };
  const subtotal = inv.items.reduce((s, it) => s + it.amount * it.qty, 0);
  return (
    <article className={`rounded-2xl bg-white p-6 text-[#282c3f] shadow-[var(--shadow-soft)] md:p-9 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#ebe6df] pb-5">
        <div>
          <p className="text-2xl font-bold tracking-[0.2em] text-[#3d1a2c]">ISHMAYI</p>
          <p className="mt-1 text-sm font-semibold">{business.name}</p>
          <p className="max-w-xs text-xs whitespace-pre-line text-[#696e80]">{business.address}</p>
          {business.gstin && <p className="text-xs text-[#696e80]">GSTIN: {business.gstin}</p>}
        </div>
        <div className="w-full text-sm sm:w-auto sm:text-right">
          <p className="text-xl font-bold">{inv.title || "INVOICE"}</p>
          <p className="font-semibold">{inv.number}</p>
          <p className="text-[#696e80]">Issued {day(inv.issueDate)}</p>
          <p className="text-[#696e80]">Due {day(inv.dueDate)}</p>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${status.tone}`}>{status.label}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-between gap-4 text-sm">
        <div>
          <p className="text-xs font-bold tracking-wider text-[#696e80] uppercase">Bill to</p>
          <p className="font-semibold">{inv.contact.name}</p>
          {inv.contact.email && <p className="text-[#696e80]">{inv.contact.email}</p>}
          {inv.contact.phone && <p className="text-[#696e80]">{inv.contact.phone}</p>}
        </div>
        {inv.name && (
          <div className="sm:text-right">
            <p className="text-xs font-bold tracking-wider text-[#696e80] uppercase">For</p>
            <p className="font-semibold">{inv.name}</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#ebe6df] text-xs text-[#696e80] uppercase">
            <tr>
              <th className="py-2">Item</th>
              <th className="hidden py-2 text-right sm:table-cell">Qty</th>
              <th className="hidden py-2 text-right sm:table-cell">Price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1ede8]">
            {inv.items.map((it, i) => (
              <tr key={i}>
                <td className="py-2.5 pr-3">
                  <span className="font-semibold">{it.name}</span>
                  {it.description && <span className="block text-xs text-[#696e80]">{it.description}</span>}
                  {/* Phones: quantity × price under the item instead of their own columns. */}
                  <span className="block text-xs text-[#696e80] sm:hidden">
                    {it.qty} × {formatInrExact(it.amount)}
                  </span>
                </td>
                <td className="hidden py-2.5 text-right sm:table-cell">{it.qty}</td>
                <td className="hidden py-2.5 text-right sm:table-cell">{formatInrExact(it.amount)}</td>
                <td className="py-2.5 text-right font-semibold">{formatInrExact(it.amount * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
        {Math.abs(subtotal - inv.total) >= 0.01 && (
          <div className="flex justify-between text-[#696e80]">
            <dt>Subtotal</dt>
            <dd>{formatInrExact(subtotal)}</dd>
          </div>
        )}
        {inv.discount > 0 && (
          <div className="flex justify-between text-[#2e8b57]">
            <dt>Discount</dt>
            <dd>−{formatInrExact(inv.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-[#ebe6df] pt-2 text-base font-bold">
          <dt>Total</dt>
          <dd>{formatInrExact(inv.total)}</dd>
        </div>
        <div className="flex justify-between text-[#696e80]">
          <dt>Paid</dt>
          <dd>{formatInrExact(inv.amountPaid)}</dd>
        </div>
        <div className="flex justify-between font-semibold">
          <dt>Amount due</dt>
          <dd>{formatInrExact(inv.amountDue)}</dd>
        </div>
      </dl>
      {inv.terms && <p className="mt-6 border-t border-[#ebe6df] pt-4 text-xs whitespace-pre-line text-[#696e80]">{plain(inv.terms)}</p>}
      <p className="mt-6 text-center text-[0.7rem] text-[#9a9eab]">
        {business.name}
        {business.email ? ` · ${business.email}` : ""}
        {business.phone ? ` · ${business.phone}` : ""}
      </p>
    </article>
  );
}
