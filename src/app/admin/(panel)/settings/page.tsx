import { SettingsEditor } from "@/components/admin/editors";
import { Card, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listCalendars, listPipelines, siteCollections } from "@/lib/admin/data";
import { ghlConfigured } from "@/lib/catalog/ghl";
import { getCmsFresh } from "@/lib/cms";
import { razorpayConfigured } from "@/lib/payments";

export const metadata = { title: "Settings" };

function Row({ ok, title, children }: { ok: boolean; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 py-3">
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ok ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{ok ? "✓" : "!"}</span>
      <span>
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-ink-muted">{children}</span>
      </span>
    </li>
  );
}

export default async function SettingsPage() {
  await requireAdmin();
  const [c, pipelines, calendars, cats] = await Promise.all([getCmsFresh(), listPipelines().catch(() => []), listCalendars().catch(() => []), siteCollections().catch(() => [])]);
  const missingCats = cats.filter((x) => !x.collection).map((x) => x.label);
  const orders = pipelines.some((p) => /order/i.test(p.name));
  const consult = pipelines.some((p) => /consult|booking|enquir/i.test(p.name));
  return (
    <>
      <PageTitle title="Settings" sub="Store, contact, invoices, SEO, social and home page sections. Passwords and API keys stay in the hosting settings, never here." />
      <SettingsEditor
        initial={{ store: c.store, business: c.business, seo: c.seo, social: c.social, sections: c.sections, contact: c.contact }}
        categories={c.categories.map((x) => ({ handle: x.handle, label: x.label }))}
      />
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card title="Connections">
          <ul className="divide-y divide-parchment">
            <Row ok={ghlConfigured()} title="GoHighLevel">Products, orders, invoices, enquiries, contacts, calendar and media.</Row>
            <Row ok={razorpayConfigured()} title="Online payments (Razorpay)">
              {razorpayConfigured() ? "Customers can pay by UPI, card or netbanking." : "Not connected — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to take online payments."}
            </Row>
            <Row ok={!!process.env.REVALIDATE_SECRET} title="Instant price updates from GHL">Products also refresh on their own every 15 minutes; admin edits show instantly.</Row>
          </ul>
        </Card>
        <Card title="GoHighLevel set-up">
          <ul className="divide-y divide-parchment">
            <Row ok={missingCats.length === 0} title="Category collections">
              {missingCats.length ? `Missing in GHL: ${missingCats.join(", ")} — saving Categories creates them.` : "Every category has its GHL collection."}
            </Row>
            <Row ok={orders} title="Orders pipeline">
              {orders ? "Orders go to your “Orders” pipeline." : `Tip: create a pipeline named “Website Orders” (New → Confirmed → Shipped → Delivered). Until then orders use “${pipelines[0]?.name ?? "the first pipeline"}”.`}
            </Row>
            <Row ok={consult} title="Consultations pipeline">
              {consult ? "Enquiries go to your consultations pipeline." : "Tip: create a pipeline named “Consultations” (New → Contacted → Booked → Done)."}
            </Row>
            <Row ok={calendars.length > 0} title="Calendar">{calendars.length ? calendars.map((x) => x.name).join(", ") : "Create a calendar in GHL to book appointments."}</Row>
          </ul>
        </Card>
      </div>
    </>
  );
}
