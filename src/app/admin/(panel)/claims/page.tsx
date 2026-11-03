import Link from "next/link";
import { claimStatusAction, refundAction } from "@/app/admin/actions";
import { ActionForm, Submit } from "@/components/admin/forms";
import { Card, Empty, GhlError, PageTitle, btn, fmtDate, input } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { CLAIM_STATUSES, listClaims, type Claim } from "@/lib/admin/claims";
import { formatInrExact } from "@/lib/site";

export const metadata = { title: "Damage claims" };

const TONE: Record<Claim["status"], string> = {
  New: "bg-amber-500/15 text-amber-300",
  "Refund approved": "bg-sky-500/15 text-sky-300",
  "Partially refunded": "bg-violet-500/15 text-violet-300",
  Refunded: "bg-emerald-500/15 text-emerald-300",
  Rejected: "bg-rose-500/15 text-rose-300",
};

export default async function ClaimsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireAdmin();
  const { show } = await searchParams;
  let claims: Claim[];
  try {
    claims = await listClaims();
  } catch (err) {
    return <GhlError error={err} />;
  }
  const open = claims.filter((c) => c.status === "New" || c.status === "Refund approved" || c.status === "Partially refunded");
  const rows = show === "all" ? claims : open;

  return (
    <>
      <PageTitle
        title="Damage claims"
        sub="Unboxing videos customers uploaded for damaged parcels. Watch the video, then mark the claim."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/claims" className={show === "all" ? btn.outline : btn.primary}>
              Open ({open.length})
            </Link>
            <Link href="/admin/claims?show=all" className={show === "all" ? btn.primary : btn.outline}>
              All ({claims.length})
            </Link>
          </div>
        }
      />
      {rows.length === 0 ? (
        <Empty>{show === "all" ? "No damage claims yet." : "No open claims. New ones appear here as soon as a customer uploads a video."}</Empty>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((c) => (
            <Card key={c.id} title={`${c.ref} · ${c.contact.name || "Customer"}`}>
              <div className="grid gap-4 sm:grid-cols-[11rem_1fr]">
                <video src={c.videoUrl} controls preload="metadata" playsInline className="aspect-[9/16] w-full rounded-xl bg-black object-contain" />
                <div className="min-w-0 space-y-3 text-sm">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${TONE[c.status]}`}>{c.status}</span>
                  <dl className="space-y-1.5">
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-ink-muted">Submitted</dt>
                      <dd>{fmtDate(c.submitted)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-ink-muted">Delivered</dt>
                      <dd>{c.deliveredOn || "—"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-ink-muted">Issue</dt>
                      <dd className="break-words">{c.issue || "—"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-ink-muted">Customer</dt>
                      <dd className="min-w-0">
                        {c.contact.phone && (
                          <a href={`https://wa.me/${c.contact.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="text-[#ff8197] hover:underline">
                            {c.contact.phone} · WhatsApp
                          </a>
                        )}
                        {c.contact.email && <span className="block truncate text-ink-muted">{c.contact.email}</span>}
                      </dd>
                    </div>
                    {c.statusNote && (
                      <div className="flex gap-2">
                        <dt className="w-24 shrink-0 text-ink-muted">Note</dt>
                        <dd>{c.statusNote}</dd>
                      </div>
                    )}
                  </dl>
                  <dl className="grid grid-cols-3 gap-2 rounded-xl bg-ivory-deep p-3 text-center">
                    <div>
                      <dt className="text-xs text-ink-muted">Order amount</dt>
                      <dd className="font-bold">{c.orderTotal ? formatInrExact(c.orderTotal) : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink-muted">Refunded</dt>
                      <dd className="font-bold">{formatInrExact(c.refunded)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink-muted">Left</dt>
                      <dd className="font-bold">{c.orderTotal ? formatInrExact(c.remaining) : "—"}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    <a href={c.videoUrl} target="_blank" rel="noopener" className={btn.outline}>
                      ⬇ Open video
                    </a>
                    <Link href={`/admin/customers/${c.contact.id}`} className={btn.outline}>
                      Customer & orders
                    </Link>
                  </div>
                  {c.status !== "Refunded" && c.status !== "Rejected" && (
                    <ActionForm action={refundAction} className="space-y-2 border-t border-parchment pt-3">
                      <input type="hidden" name="contactId" value={c.contact.id} />
                      <input type="hidden" name="ref" value={c.ref} />
                      <p className="font-bold">Refund</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input name="amount" inputMode="decimal" required placeholder="Amount ₹" defaultValue={c.remaining || undefined} aria-label="Refund amount in rupees" className={`${input} py-2`} />
                        <select name="method" aria-label="How to refund" defaultValue={c.paymentId ? "razorpay" : "manual"} className={`${input} py-2`}>
                          {c.paymentId && <option value="razorpay">Send via Razorpay</option>}
                          <option value="manual">Already refunded</option>
                        </select>
                      </div>
                      <input name="note" placeholder="Reason (optional, e.g. clasp broken)" aria-label="Refund reason" className={`${input} py-2`} />
                      <label className="flex items-start gap-2 text-xs text-ink-muted">
                        <input type="checkbox" name="confirm" value="yes" required className="mt-0.5" />
                        <span>I have checked the amount. Razorpay refunds send real money and can&apos;t be undone.</span>
                      </label>
                      <Submit className={btn.primary} pendingText="Refunding…">
                        ₹ Refund customer
                      </Submit>
                    </ActionForm>
                  )}
                  <form action={claimStatusAction} className="space-y-2 border-t border-parchment pt-3">
                    <input type="hidden" name="contactId" value={c.contact.id} />
                    <input type="hidden" name="ref" value={c.ref} />
                    <input name="note" placeholder="Note (optional, e.g. refund ref no.)" aria-label="Note" className={`${input} py-2`} />
                    <div className="flex flex-wrap gap-2">
                      {CLAIM_STATUSES.map((s) => (
                        <button key={s} name="status" value={s} className={s === "Rejected" ? btn.danger : btn.outline}>
                          {s === "Refund approved" ? "✓ Approve refund" : "✕ Reject"}
                        </button>
                      ))}
                    </div>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
