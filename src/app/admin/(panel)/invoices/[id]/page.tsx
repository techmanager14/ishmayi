import Link from "next/link";
import { notFound } from "next/navigation";
import { invoiceAction } from "@/app/admin/actions";
import { ActionForm, Submit } from "@/components/admin/forms";
import { InvoiceSheet } from "@/components/InvoiceSheet";
import { Badge, Card, PageTitle, btn, input, label } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getInvoice } from "@/lib/admin/data";
import { getCmsFresh } from "@/lib/cms";

export const metadata = { title: "Invoice" };

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  const [inv, cms] = await Promise.all([getInvoice(id), getCmsFresh()]);
  if (!inv) notFound();
  const canSend = !["paid", "void"].includes(inv.status);
  const canPay = !["paid", "void", "draft"].includes(inv.status) || inv.status === "draft";
  const canVoid = ["sent", "viewed", "overdue", "draft"].includes(inv.status) && inv.amountPaid === 0;

  return (
    <>
      <PageTitle
        title={inv.number}
        sub={
          <>
            <Link href="/admin/invoices" className="font-semibold text-[#ff8197] hover:underline">
              ← Invoices
            </Link>{" "}
            · {inv.name}
          </>
        }
        actions={<Badge status={inv.status} />}
      />
      {created && <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300">Invoice created{inv.status !== "draft" ? " and emailed to the customer" : ""}.</p>}

      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <InvoiceSheet inv={inv} business={cms.business} />

        <div className="space-y-4">
          {canSend && (
            <Card title={inv.status === "draft" ? "Send to customer" : "Send again"}>
              <ActionForm action={invoiceAction}>
                <input type="hidden" name="id" value={inv.id} />
                <input type="hidden" name="op" value="send" />
                <p className="text-sm text-ink-muted">Emails {inv.contact.email || "the customer"} a secure link to view and pay.</p>
                <Submit className={`${btn.primary} w-full`} pendingText="Sending…">
                  ✉ Email invoice
                </Submit>
              </ActionForm>
            </Card>
          )}
          {canPay && inv.amountDue > 0 && (
            <Card title="Record a payment">
              <ActionForm action={invoiceAction}>
                <input type="hidden" name="id" value={inv.id} />
                <input type="hidden" name="op" value="pay" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={label} htmlFor="amount">
                      Amount ₹
                    </label>
                    <input id="amount" name="amount" inputMode="decimal" defaultValue={inv.amountDue} className={input} />
                  </div>
                  <div>
                    <label className={label} htmlFor="mode">
                      Method
                    </label>
                    <select id="mode" name="mode" className={input} defaultValue="cash">
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank / UPI</option>
                      <option value="cheque">Cheque</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <input name="notes" placeholder="Note (e.g. UPI ref no.)" aria-label="Payment note" className={input} />
                <Submit className={`${btn.outline} w-full`} pendingText="Saving…">
                  Mark as paid
                </Submit>
              </ActionForm>
            </Card>
          )}
          <Card title="More">
            <div className="space-y-2">
              {inv.contact.id && (
                <Link href={`/admin/customers/${inv.contact.id}`} className={`${btn.outline} w-full`}>
                  View customer
                </Link>
              )}
              {canVoid && inv.status !== "draft" && (
                <ActionForm action={invoiceAction} className="space-y-2">
                  <input type="hidden" name="id" value={inv.id} />
                  <input type="hidden" name="op" value="void" />
                  <Submit className={`${btn.danger} w-full`} pendingText="Voiding…">
                    Void invoice
                  </Submit>
                </ActionForm>
              )}
              {inv.status === "draft" && (
                <ActionForm action={invoiceAction} className="space-y-2">
                  <input type="hidden" name="id" value={inv.id} />
                  <input type="hidden" name="op" value="delete" />
                  <Submit className={`${btn.danger} w-full`} pendingText="Deleting…">
                    Delete draft
                  </Submit>
                </ActionForm>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
