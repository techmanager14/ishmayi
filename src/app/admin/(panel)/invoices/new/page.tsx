import Link from "next/link";
import { InvoiceForm } from "@/components/admin/InvoiceForm";
import { GhlError, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { contactNotes, contactsWithTag, getContact, getOpportunity } from "@/lib/admin/data";
import { getCmsFresh } from "@/lib/cms";

export const metadata = { title: "New invoice" };

const ist = (d: Date) => new Date(d.getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);

/** "• 2 × Rose Quartz Necklace — ₹1,998" lines in an order note → invoice items. */
function itemsFromNote(body: string) {
  return body
    .split("\n")
    .map((l) => l.match(/^\s*•\s*(\d+)\s*×\s*(.+?)\s+—\s+₹([\d,]+(?:\.\d+)?)\s*$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => {
      const qty = Number(m[1]) || 1;
      const lineTotal = Number(m[3].replace(/,/g, ""));
      return { name: m[2].trim(), description: "", qty, amount: Math.round((lineTotal / qty) * 100) / 100 };
    });
}

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ order?: string; contact?: string }> }) {
  await requireAdmin();
  const { order, contact } = await searchParams;
  let lists, cms;
  try {
    [lists, cms] = await Promise.all([Promise.all(["website-order", "consultation-enquiry", "website-contact"].map((t) => contactsWithTag(t))), getCmsFresh()]);
  } catch (err) {
    return <GhlError error={err} />;
  }
  const byId = new Map(lists.flat().map((c) => [c.id, c]));

  let contactId = contact ?? "";
  let name = "";
  let items: { name: string; description: string; qty: number; amount: number }[] = [];
  if (order) {
    const opp = await getOpportunity(order);
    if (opp) {
      contactId = opp.contact.id;
      name = opp.reference ? `Order ${opp.reference}` : opp.name.replace(/^\S+\s/, "");
      const notes = await contactNotes(opp.contact.id).catch(() => []);
      const note = notes.find((n) => (opp.reference ? n.body.includes(opp.reference) : n.body.startsWith("🔮")));
      items = note ? itemsFromNote(note.body) : [];
      if (!items.length) items = [{ name: opp.detail || name || "Item", description: "", qty: 1, amount: opp.value }];
    }
  }
  if (contactId && !byId.has(contactId)) {
    const c = await getContact(contactId);
    if (c) byId.set(c.id, c);
  }
  const today = new Date();

  return (
    <>
      <PageTitle
        title="New invoice"
        sub={
          <Link href="/admin/invoices" className="font-semibold text-[#ff8197] hover:underline">
            ← Invoices
          </Link>
        }
      />
      <InvoiceForm
        customers={[...byId.values()].map((c) => ({ id: c.id, name: c.name, email: c.email }))}
        initial={{
          contactId,
          name,
          items,
          issueDate: ist(today),
          dueDate: ist(new Date(today.getTime() + cms.business.dueDays * 864e5)),
          terms: [cms.business.invoiceNotes, cms.business.invoiceTerms].filter(Boolean).join("\n"),
        }}
      />
    </>
  );
}
