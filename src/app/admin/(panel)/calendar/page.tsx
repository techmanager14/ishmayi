import Link from "next/link";
import { cancelAppointmentAction, scheduleAction } from "@/app/admin/actions";
import { ActionForm, ConfirmButton, Submit } from "@/components/admin/forms";
import { Card, Empty, GhlError, PageTitle, btn, input, label } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listAppointments, listCalendars, listOpportunities } from "@/lib/admin/data";
import { formatInr } from "@/lib/site";

export const metadata = { title: "Calendar" };

const IST = 5.5 * 3600e3;
const dayKey = (iso: string) => new Date(new Date(iso).getTime() + IST).toISOString().slice(0, 10);
const timeIst = (iso: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

type Item = { key: string; time: string; label: string; href?: string; tone: "appt" | "order" | "consult"; apptId?: string };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string; d?: string }> }) {
  await requireAdmin();
  const { m, d } = await searchParams;
  const nowIst = new Date(Date.now() + IST);
  const [y, mo] = /^\d{4}-\d{2}$/.test(m ?? "") ? m!.split("-").map(Number) : [nowIst.getUTCFullYear(), nowIst.getUTCMonth() + 1];
  const first = new Date(Date.UTC(y, mo - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const from = new Date(first.getTime() - IST);
  const to = new Date(Date.UTC(y, mo, 1) - IST);

  const [appts, opps, calendars] = await Promise.allSettled([listAppointments(from, to), listOpportunities(), listCalendars()]);
  if (opps.status === "rejected") return <GhlError error={opps.reason} />;

  const items = new Map<string, Item[]>();
  const push = (k: string, it: Item) => items.set(k, [...(items.get(k) ?? []), it]);
  for (const a of appts.status === "fulfilled" ? appts.value : [])
    push(dayKey(a.start), { key: a.id, time: a.start, label: a.title, tone: "appt", apptId: a.id });
  for (const o of opps.value) {
    if (!o.createdAt) continue;
    const k = dayKey(o.createdAt);
    if (!k.startsWith(`${y}-${String(mo).padStart(2, "0")}`)) continue;
    push(k, {
      key: o.id,
      time: o.createdAt,
      label: o.kind === "order" ? `${o.reference ?? "Order"} · ${formatInr(o.value)}` : `Enquiry · ${o.contact.name}`,
      href: `/admin/${o.kind === "order" ? "orders" : "consultations"}/${o.id}`,
      tone: o.kind === "order" ? "order" : "consult",
    });
  }
  for (const list of items.values()) list.sort((a, b) => a.time.localeCompare(b.time));

  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(first);
  const prev = new Date(Date.UTC(y, mo - 2, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 7);
  const today = nowIst.toISOString().slice(0, 10);
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const selected = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  const toneCls = { appt: "bg-burgundy text-white", order: "bg-emerald-100 text-emerald-900", consult: "bg-amber-100 text-amber-900" };
  const consultContacts = opps.value.filter((o) => o.contact.id).reduce((acc, o) => (acc.some((x) => x.id === o.contact.id) ? acc : [...acc, o.contact]), [] as { id: string; name: string; email: string }[]);

  return (
    <>
      <PageTitle
        title="Calendar"
        sub="Appointments from your GoHighLevel calendar, plus website orders and enquiries by day."
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/admin/calendar?m=${prev}`} className={btn.outline} aria-label="Previous month">
              ←
            </Link>
            <span className="min-w-36 text-center font-bold">{monthLabel}</span>
            <Link href={`/admin/calendar?m=${next}`} className={btn.outline} aria-label="Next month">
              →
            </Link>
          </div>
        }
      />
      <div className="mb-3 flex flex-wrap gap-3 text-xs font-semibold">
        <span className="rounded bg-burgundy px-2 py-0.5 text-white">Appointment</span>
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-900">Order</span>
        <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900">Consultation enquiry</span>
      </div>
      {appts.status === "rejected" && <p className="mb-3 text-sm text-rose-700">Calendar appointments couldn&apos;t be loaded right now.</p>}

      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="overflow-hidden rounded-2xl border border-parchment bg-panel">
          <div className="grid grid-cols-7 border-b border-parchment bg-ivory-deep text-center text-xs font-bold text-ink-muted">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
              <div key={w} className="py-2">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={`b${i}`} className="min-h-20 border-r border-b border-parchment bg-ivory-deep/40 md:min-h-28" />;
              const k = `${y}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const list = items.get(k) ?? [];
              return (
                <Link
                  key={k}
                  href={`/admin/calendar?m=${k.slice(0, 7)}&d=${k}`}
                  className={`block min-h-20 border-r border-b border-parchment p-1.5 hover:bg-blush/50 md:min-h-28 ${selected === k ? "bg-blush" : ""}`}
                >
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${k === today ? "bg-burgundy text-white" : "text-charcoal"}`}>{day}</span>
                  <ul className="mt-1 space-y-0.5">
                    {list.slice(0, 3).map((it) => (
                      <li key={it.key} className={`truncate rounded px-1 py-0.5 text-[0.65rem] font-semibold md:text-[0.7rem] ${toneCls[it.tone]}`}>
                        {it.tone === "appt" ? `${timeIst(it.time)} ` : ""}
                        {it.label}
                      </li>
                    ))}
                    {list.length > 3 && <li className="text-[0.65rem] text-ink-muted">+{list.length - 3} more</li>}
                  </ul>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Card title={selected ? new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${selected}T00:00:00Z`)) : "Pick a day"}>
            {!selected ? (
              <p className="text-sm text-ink-muted">Tap a day to see everything on it.</p>
            ) : (items.get(selected) ?? []).length === 0 ? (
              <Empty>Nothing on this day.</Empty>
            ) : (
              <ul className="space-y-2">
                {(items.get(selected) ?? []).map((it) => (
                  <li key={it.key} className={`rounded-lg px-3 py-2 text-sm ${toneCls[it.tone]}`}>
                    <p className="font-bold">{timeIst(it.time)}</p>
                    {it.href ? (
                      <Link href={it.href} className="hover:underline">
                        {it.label}
                      </Link>
                    ) : (
                      <p>{it.label}</p>
                    )}
                    {it.apptId && (
                      <form action={cancelAppointmentAction} className="mt-2">
                        <input type="hidden" name="id" value={it.apptId} />
                        <ConfirmButton message="Cancel and delete this appointment from the calendar?" className="rounded bg-panel/20 px-2 py-1 text-xs font-bold hover:bg-panel/30">
                          Cancel appointment
                        </ConfirmButton>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Book an appointment">
            {calendars.status !== "fulfilled" || calendars.value.length === 0 ? (
              <Empty>No GoHighLevel calendar found.</Empty>
            ) : consultContacts.length === 0 ? (
              <Empty>Appointments are booked for website customers — none yet.</Empty>
            ) : (
              <ActionForm action={scheduleAction}>
                <div>
                  <label className={label} htmlFor="contactId">
                    Customer
                  </label>
                  <select id="contactId" name="contactId" className={input} required>
                    {consultContacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="title">
                    Title
                  </label>
                  <input id="title" name="title" className={input} defaultValue="Appointment" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={label} htmlFor="date">
                      Date
                    </label>
                    <input id="date" name="date" type="date" required className={input} defaultValue={selected ?? today} />
                  </div>
                  <div>
                    <label className={label} htmlFor="time">
                      Time (India)
                    </label>
                    <input id="time" name="time" type="time" required className={input} defaultValue="11:00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={label} htmlFor="minutes">
                      Duration
                    </label>
                    <select id="minutes" name="minutes" className={input} defaultValue="60">
                      {[30, 45, 60, 90, 120].map((n) => (
                        <option key={n} value={n}>
                          {n} min
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={label} htmlFor="calendarId">
                      Calendar
                    </label>
                    <select id="calendarId" name="calendarId" className={input}>
                      {calendars.value.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Submit pendingText="Booking…">Book appointment</Submit>
              </ActionForm>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
