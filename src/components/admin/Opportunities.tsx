import Link from "next/link";
import { notFound } from "next/navigation";
import { addNoteAction, grantBenefitAction, scheduleAction, setStageAction, setStatusAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin/auth";
import { contactNotes, getOpportunity, listCalendars, listOpportunities, listPipelines, type OppKind } from "@/lib/admin/data";
import { formatInr } from "@/lib/site";
import { ActionForm, AutoSubmitSelect, Submit } from "./forms";
import { Badge, Card, Empty, GhlError, PageTitle, Tabs, btn, fmtDate, input, label } from "./ui";

const META: Record<Exclude<OppKind, "other">, { title: string; base: string; noun: string }> = {
  order: { title: "Orders", base: "/admin/orders", noun: "order" },
  consultation: { title: "Consultations", base: "/admin/consultations", noun: "enquiry" },
};

export async function OpportunityList({ kind, status, q }: { kind: "order" | "consultation"; status?: string; q?: string }) {
  await requireAdmin();
  const m = META[kind];
  let all;
  try {
    all = (await listOpportunities()).filter((o) => o.kind === kind);
  } catch (err) {
    return <GhlError error={err} />;
  }
  const query = (q ?? "").trim().toLowerCase();
  const rows = all
    .filter((o) => !status || o.status === status)
    .filter((o) => !query || `${o.name} ${o.contact.name} ${o.contact.email} ${o.contact.phone}`.toLowerCase().includes(query));
  const count = (s?: string) => all.filter((o) => !s || o.status === s).length;
  const tab = (s: string | undefined, l: string) => ({ href: s ? `${m.base}?status=${s}` : m.base, label: l, active: (status ?? "") === (s ?? ""), count: count(s) });

  return (
    <>
      <PageTitle
        title={m.title}
        sub={kind === "order" ? "Every website order. 🎁 marks a gift." : "Consultations booked on the website."}
        actions={
          <a href={`/admin/export/${kind === "order" ? "orders" : "consultations"}`} className={btn.outline}>
            ⬇ Export CSV
          </a>
        }
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Tabs items={[tab(undefined, "All"), tab("open", "Open"), tab("won", "Completed"), tab("lost", "Cancelled")]} />
        <form className="flex gap-2" action={m.base}>
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search name, email, phone, TRV-…" className={`${input} w-64 py-2`} aria-label="Search" />
          <button className={btn.outline}>Search</button>
        </form>
      </div>
      <Card>
        {rows.length === 0 ? (
          <Empty>No {m.noun}s match.</Empty>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-parchment text-xs tracking-wide text-ink-muted uppercase">
                <tr>
                  <th className="px-5 py-2.5">{kind === "order" ? "Order" : "Consultancy"}</th>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5 text-right">Value</th>
                  <th className="px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment">
                {rows.map((o) => (
                  <tr key={o.id} className="hover:bg-ivory-deep/60">
                    <td className="px-5 py-3">
                      <Link href={`${m.base}/${o.id}`} className="font-bold text-[#ff8197] hover:underline">
                        {kind === "order" ? (o.reference ?? "Order") : o.detail || "Consultation"}
                      </Link>
                      {kind === "order" && <span className="ml-2 text-xs text-ink-muted">{o.detail}</span>}
                      {kind === "consultation" && <span className="block text-xs text-ink-muted">{o.name.split(" · ").slice(3).join(" · ")}</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="block font-semibold">{o.contact.name || "—"}</span>
                      <span className="block text-xs text-ink-muted">{o.contact.phone || o.contact.email}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink-muted">{fmtDate(o.createdAt)}</td>
                    <td className="px-3 py-3 text-right font-bold whitespace-nowrap">{formatInr(o.value)}</td>
                    <td className="px-5 py-3">
                      <Badge status={o.status} />
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

export async function OpportunityDetail({ kind, id }: { kind: "order" | "consultation"; id: string }) {
  await requireAdmin();
  const m = META[kind];
  const o = await getOpportunity(id);
  if (!o || o.kind !== kind) notFound();
  const [notes, pipelines, calendars] = await Promise.all([
    o.contact.id ? contactNotes(o.contact.id).catch(() => []) : Promise.resolve([]),
    listPipelines().catch(() => []),
    kind === "consultation" ? listCalendars().catch(() => []) : Promise.resolve([]),
  ]);
  const pipeline = pipelines.find((p) => p.id === o.pipelineId);
  // The note written by the website for this card (order lines, address, birth details…).
  const main =
    notes.find((n) => (o.reference ? n.body.includes(o.reference) : n.body.startsWith("🔮"))) ?? null;
  const others = notes.filter((n) => n !== main);
  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

  return (
    <>
      <PageTitle
        title={kind === "order" ? (o.reference ?? "Order") : o.detail || "Consultation"}
        sub={
          <>
            <Link href={m.base} className="font-semibold text-[#ff8197] hover:underline">
              ← {m.title}
            </Link>{" "}
            · created {fmtDate(o.createdAt)}
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            {o.name.includes("🎁") && <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">🎁 Gift order</span>}
            <Badge status={o.status} />
          </div>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card title={kind === "order" ? "Order details" : "Enquiry details"}>
            {main ? (
              <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap text-charcoal">{main.body}</pre>
            ) : (
              <p className="text-sm text-ink-muted">{o.name}</p>
            )}
          </Card>

          {kind === "consultation" && (
            <Card title="Schedule the consultation">
              {calendars.length === 0 ? (
                <Empty>No calendar found in GoHighLevel. Create one under Calendars to book appointments from here.</Empty>
              ) : (
                <ActionForm action={scheduleAction} className="grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="contactId" value={o.contact.id} />
                  <div className="sm:col-span-2">
                    <label className={label} htmlFor="title">
                      Title
                    </label>
                    <input id="title" name="title" className={input} defaultValue={`${o.detail || "Consultation"} — ${o.contact.name}`} />
                  </div>
                  <div>
                    <label className={label} htmlFor="date">
                      Date
                    </label>
                    <input id="date" name="date" type="date" min={today} required className={input} />
                  </div>
                  <div>
                    <label className={label} htmlFor="time">
                      Time (India)
                    </label>
                    <input id="time" name="time" type="time" required className={input} defaultValue="11:00" />
                  </div>
                  <div>
                    <label className={label} htmlFor="minutes">
                      Duration
                    </label>
                    <select id="minutes" name="minutes" className={input} defaultValue="60">
                      {[30, 45, 60, 90, 120].map((n) => (
                        <option key={n} value={n}>
                          {n} minutes
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={label} htmlFor="calendarId">
                      Calendar
                    </label>
                    <select id="calendarId" name="calendarId" className={input}>
                      {calendars.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Submit pendingText="Booking…">Book appointment</Submit>
                  </div>
                </ActionForm>
              )}
            </Card>
          )}

          <Card title="Notes & history">
            <ActionForm action={addNoteAction}>
              <input type="hidden" name="contactId" value={o.contact.id} />
              <textarea name="body" rows={3} className={input} placeholder="Add a note (e.g. courier & tracking number, call summary)…" aria-label="New note" />
              <Submit pendingText="Adding…">Add note</Submit>
            </ActionForm>
            {others.length > 0 && (
              <ul className="mt-5 space-y-3">
                {others.map((n) => (
                  <li key={n.id} className="rounded-lg bg-ivory-deep px-4 py-3">
                    <p className="text-xs text-ink-muted">{fmtDate(n.dateAdded)}</p>
                    <pre className="mt-1 font-sans text-sm whitespace-pre-wrap">{n.body}</pre>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Customer">
            <p className="font-bold">{o.contact.name || "—"}</p>
            {o.contact.phone && (
              <p className="mt-1 text-sm">
                <a href={`tel:${o.contact.phone}`} className="text-[#ff8197] hover:underline">
                  {o.contact.phone}
                </a>{" "}
                ·{" "}
                <a href={`https://wa.me/${o.contact.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="text-[#ff8197] hover:underline">
                  WhatsApp
                </a>
              </p>
            )}
            {o.contact.email && (
              <p className="mt-1 text-sm">
                <a href={`mailto:${o.contact.email}`} className="text-[#ff8197] hover:underline">
                  {o.contact.email}
                </a>
              </p>
            )}
            <p className="mt-3 text-2xl font-bold">{formatInr(o.value)}</p>
            <Link href={`/admin/invoices/new?order=${o.id}`} className={`${btn.primary} mt-4 w-full`}>
              🧾 Create invoice
            </Link>
          </Card>

          {kind === "consultation" && /gemstone/i.test(o.name) && o.contact.id && (
            <Card title="Gemstone benefit">
              <ActionForm action={grantBenefitAction}>
                <input type="hidden" name="contactId" value={o.contact.id} />
                <p className="text-sm text-ink-muted">
                  After the consultation, give {o.contact.name || "the customer"} ₹500 off jewellery bought in the next 24 hours. It applies
                  automatically at checkout when they use the same email or phone.
                </p>
                <Submit className={`${btn.outline} w-full`} pendingText="Saving…">
                  🎁 Start 24-hour benefit
                </Submit>
              </ActionForm>
            </Card>
          )}

          <Card title="Progress">
            {pipeline && pipeline.stages.length > 0 && (
              <form action={setStageAction} className="mb-4">
                <input type="hidden" name="id" value={o.id} />
                <label className={label}>Stage ({pipeline.name})</label>
                <AutoSubmitSelect name="stageId" label="Stage" defaultValue={o.stageId} options={pipeline.stages.map((s) => ({ value: s.id, label: s.name }))} />
              </form>
            )}
            <p className={label}>Status</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["open", "Open"],
                  ["won", kind === "order" ? "Delivered / completed" : "Completed"],
                  ["lost", "Cancelled"],
                ] as const
              ).map(([s, l]) => (
                <form key={s} action={setStatusAction}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="status" value={s} />
                  <button disabled={o.status === s} className={o.status === s ? `${btn.primary} cursor-default` : btn.outline}>
                    {l}
                  </button>
                </form>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-muted">Changes are saved to the same card in GoHighLevel.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
