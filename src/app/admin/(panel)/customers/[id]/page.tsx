import Link from "next/link";
import { notFound } from "next/navigation";
import { addNoteAction } from "@/app/admin/actions";
import { ActionForm, Submit } from "@/components/admin/forms";
import { Badge, Card, Empty, PageTitle, fmtDate, input } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { contactNotes, getContact, listOpportunities } from "@/lib/admin/data";
import { formatInr } from "@/lib/site";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const contact = await getContact(id);
  if (!contact) notFound();
  const [notes, opps] = await Promise.all([contactNotes(id).catch(() => []), listOpportunities().catch(() => [])]);
  const theirs = opps.filter((o) => o.contact.id === id);
  const spent = theirs.filter((o) => o.kind === "order" && o.status !== "lost").reduce((s, o) => s + o.value, 0);

  return (
    <>
      <PageTitle
        title={contact.name || contact.email}
        sub={
          <Link href="/admin/customers" className="font-semibold text-[#ff8197] hover:underline">
            ← Customers
          </Link>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card title="Orders & consultations">
            {theirs.length === 0 ? (
              <Empty>Nothing yet.</Empty>
            ) : (
              <ul className="-mx-2">
                {theirs.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/${o.kind === "order" ? "orders" : "consultations"}/${o.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-ivory-deep">
                      <span>
                        <span className="block text-sm font-bold">{o.kind === "order" ? (o.reference ?? "Order") : o.detail}</span>
                        <span className="block text-xs text-ink-muted">{fmtDate(o.createdAt)}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-bold">{formatInr(o.value)}</span>
                        <Badge status={o.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Notes & messages">
            <ActionForm action={addNoteAction}>
              <input type="hidden" name="contactId" value={id} />
              <textarea name="body" rows={3} className={input} placeholder="Add a note…" aria-label="New note" />
              <Submit pendingText="Adding…">Add note</Submit>
            </ActionForm>
            <ul className="mt-5 space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-lg bg-ivory-deep px-4 py-3">
                  <p className="text-xs text-ink-muted">{fmtDate(n.dateAdded)}</p>
                  <pre className="mt-1 font-sans text-sm whitespace-pre-wrap">{n.body}</pre>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <Card title="Details">
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-ink-muted">Phone</dt>
              <dd className="font-semibold">
                {contact.phone ? (
                  <>
                    <a href={`tel:${contact.phone}`} className="text-[#ff8197] hover:underline">
                      {contact.phone}
                    </a>{" "}
                    ·{" "}
                    <a href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="text-[#ff8197] hover:underline">
                      WhatsApp
                    </a>
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Email</dt>
              <dd className="font-semibold">
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="text-[#ff8197] hover:underline">
                    {contact.email}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">City</dt>
              <dd className="font-semibold">{contact.city || "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Total spent</dt>
              <dd className="text-xl font-bold">{formatInr(spent)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Customer since</dt>
              <dd className="font-semibold">{fmtDate(contact.dateAdded, false)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}
