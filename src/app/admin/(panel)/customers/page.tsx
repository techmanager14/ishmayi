import Link from "next/link";
import { Card, Empty, GhlError, PageTitle, btn, fmtDate, input } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { contactsWithTag, type Contact } from "@/lib/admin/data";

export const metadata = { title: "Customers" };

const TAGS: Record<string, string> = { "website-order": "Ordered", "consultation-enquiry": "Consultation", "website-contact": "Message" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q } = await searchParams;
  let lists;
  try {
    lists = await Promise.all(Object.keys(TAGS).map((t) => contactsWithTag(t)));
  } catch (err) {
    return <GhlError error={err} />;
  }
  const byId = new Map<string, Contact>();
  for (const c of lists.flat()) byId.set(c.id, c);
  const query = (q ?? "").trim().toLowerCase();
  const rows = [...byId.values()]
    .filter((c) => !query || `${c.name} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(query))
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));

  return (
    <>
      <PageTitle
        title="Customers"
        sub="Everyone who ordered, enquired or messaged through the website."
        actions={
          <a href="/admin/export/customers" className={btn.outline}>
            ⬇ Export CSV
          </a>
        }
      />
      <form className="mb-4 flex gap-2" action="/admin/customers">
        <input name="q" defaultValue={q} placeholder="Search name, email, phone, city" className={`${input} w-72 py-2`} aria-label="Search customers" />
        <button className={btn.outline}>Search</button>
      </form>
      <Card>
        {rows.length === 0 ? (
          <Empty>No customers yet.</Empty>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-parchment text-xs tracking-wide text-ink-muted uppercase">
                <tr>
                  <th className="px-5 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Contact</th>
                  <th className="px-3 py-2.5">Activity</th>
                  <th className="px-5 py-2.5">Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-ivory-deep/60">
                    <td className="px-5 py-3">
                      <Link href={`/admin/customers/${c.id}`} className="font-bold text-[#ff8197] hover:underline">
                        {c.name || "—"}
                      </Link>
                      {c.city && <span className="block text-xs text-ink-muted">{c.city}</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="block">{c.phone}</span>
                      <span className="block text-xs text-ink-muted">{c.email}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex flex-wrap gap-1">
                        {c.tags
                          .filter((t) => TAGS[t])
                          .map((t) => (
                            <span key={t} className="rounded-full bg-ivory-deep px-2 py-0.5 text-xs font-semibold">
                              {TAGS[t]}
                            </span>
                          ))}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-ink-muted">{fmtDate(c.dateAdded, false)}</td>
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
