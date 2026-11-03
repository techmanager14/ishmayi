import Link from "next/link";
import { Card, Empty, GhlError, PageTitle, fmtDate } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { contactNotes, contactsWithTag } from "@/lib/admin/data";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  await requireAdmin();
  let contacts;
  try {
    contacts = (await contactsWithTag("website-contact")).slice(0, 40);
  } catch (err) {
    return <GhlError error={err} />;
  }
  // Each contact-form message is saved as a note starting with ✉️.
  const withNotes = await Promise.all(
    contacts.map(async (c) => ({ c, messages: (await contactNotes(c.id).catch(() => [])).filter((n) => n.body.startsWith("✉️")) })),
  );
  const messages = withNotes
    .flatMap(({ c, messages }) => messages.map((n) => ({ c, n })))
    .sort((a, b) => b.n.dateAdded.localeCompare(a.n.dateAdded));

  return (
    <>
      <PageTitle title="Messages" sub="Messages sent through the website's contact form (newest first)." />
      <Card>
        {messages.length === 0 ? (
          <Empty>No messages yet.</Empty>
        ) : (
          <ul className="space-y-3">
            {messages.map(({ c, n }) => {
              const [subject, , ...rest] = n.body.split("\n");
              return (
                <li key={n.id} className="rounded-xl border border-parchment p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link href={`/admin/customers/${c.id}`} className="font-bold text-[#ff8197] hover:underline">
                      {c.name || c.email}
                    </Link>
                    <span className="text-xs text-ink-muted">{fmtDate(n.dateAdded)}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold">{subject.replace(/^✉️\s*Website message — /, "")}</p>
                  <pre className="mt-2 font-sans text-sm whitespace-pre-wrap text-charcoal">{rest.join("\n")}</pre>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                    {c.email && (
                      <a href={`mailto:${c.email}?subject=${encodeURIComponent("Re: your message to Ishmayi")}`} className="text-[#ff8197] hover:underline">
                        Reply by email
                      </a>
                    )}
                    {c.phone && (
                      <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="text-[#ff8197] hover:underline">
                        WhatsApp
                      </a>
                    )}
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
