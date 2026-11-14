import { Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { Card, Empty, GhlError, PageTitle, Tabs, fmtDate } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { contactNotes, contactsWithTag, type Contact, type Note } from "@/lib/admin/data";
import { CONTACT_TOPICS } from "@/lib/contact";

export const metadata = { title: "Requests" };

const TYPES = {
  bulk: { label: "Bulk orders", empty: "No bulk order requests yet. They come from the Bulk Orders page.", reply: "Your bulk order enquiry" },
  gift: { label: "Customised gifts", empty: "No customised gift requests yet. They come from the Customised Gift Sets page.", reply: "Your customised gift set" },
} as const;
type RequestType = keyof typeof TYPES;

const PREFIX = "✉️ Website message — ";
const topicLabel = (t: RequestType) => CONTACT_TOPICS.find((x) => x.value === t)!.label;

interface Request {
  c: Contact;
  n: Note;
  type: RequestType;
  message: string;
}

/**
 * Bulk order and gift-set requests are sent through the website's request forms and saved
 * in GoHighLevel as a note on the customer's contact. This reads them back.
 */
async function loadRequests(): Promise<Request[]> {
  const contacts = (await contactsWithTag("website-contact")).slice(0, 60);
  const rows = await Promise.all(contacts.map(async (c) => ({ c, notes: await contactNotes(c.id).catch(() => [] as Note[]) })));
  return rows
    .flatMap(({ c, notes }) =>
      notes.flatMap((n) => {
        if (!n.body.startsWith(PREFIX)) return [];
        const [subject, , ...rest] = n.body.split("\n");
        const type = (Object.keys(TYPES) as RequestType[]).find((t) => subject === PREFIX + topicLabel(t));
        if (!type) return [];
        const message = rest.filter((l) => !l.startsWith("Reply to:")).join("\n").trim();
        return [{ c, n, type, message }];
      }),
    )
    .sort((a, b) => b.n.dateAdded.localeCompare(a.n.dateAdded));
}

const action = "inline-flex items-center gap-1.5 rounded-lg border border-parchment px-2.5 py-1.5 text-xs font-bold text-burgundy hover:border-burgundy";

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireAdmin();
  const { type: raw } = await searchParams;
  const type: RequestType = raw === "gift" ? "gift" : "bulk";
  let all: Request[];
  try {
    all = await loadRequests();
  } catch (err) {
    return <GhlError error={err} />;
  }
  const list = all.filter((r) => r.type === type);
  const count = (t: RequestType) => all.filter((r) => r.type === t).length;

  return (
    <>
      <PageTitle title="Requests" sub="Bulk orders and customised gifts, newest first." />
      <Tabs items={(Object.keys(TYPES) as RequestType[]).map((t) => ({ href: `/admin/requests?type=${t}`, label: TYPES[t].label, active: t === type, count: count(t) }))} />
      <Card>
        {list.length === 0 ? (
          <Empty>{TYPES[type].empty}</Empty>
        ) : (
          <ul className="divide-y divide-parchment">
            {list.map(({ c, n, message }) => {
              const phone = c.phone.replace(/\D/g, "");
              return (
                <li key={n.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className="font-bold text-charcoal">{c.name || c.email}</p>
                    <span className="text-xs text-ink-muted">{fmtDate(n.dateAdded)}</span>
                  </div>
                  <p className="text-xs text-ink-muted">{[c.email, c.phone, c.city].filter(Boolean).join(" · ")}</p>
                  <p className="mt-2 rounded-xl bg-ivory-deep px-3 py-2.5 text-sm whitespace-pre-wrap text-charcoal">{message}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {c.email && (
                      <a href={`mailto:${c.email}?subject=${encodeURIComponent(`${TYPES[type].reply} — Ishmayi`)}`} className={action}>
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Email
                      </a>
                    )}
                    {phone && (
                      <>
                        <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className={action}>
                          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> WhatsApp
                        </a>
                        <a href={`tel:+${phone}`} className={action}>
                          <Phone className="h-3.5 w-3.5" aria-hidden="true" /> Call
                        </a>
                      </>
                    )}
                    <Link href={`/admin/customers/${c.id}`} className={action}>
                      <UserRound className="h-3.5 w-3.5" aria-hidden="true" /> Customer
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
