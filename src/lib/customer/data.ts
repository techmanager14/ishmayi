import "server-only";
import { getInvoice, listPipelines, type Invoice } from "../admin/data";
import { REFUND_PREFIX, parseRefundAmount } from "../refund-notes";
import { upsertContact } from "../crm";
import { ghlApi, locationId } from "../ghl-api";
import { site } from "../site";

// What a signed-in customer can see: their own orders and consultations
// (GoHighLevel opportunities for their contact), shipping updates the team
// added, and their invoices.

interface RawOpp {
  id: string;
  name?: string;
  monetaryValue?: number;
  status?: string;
  pipelineId?: string;
  pipelineStageId?: string;
  createdAt?: string;
}
interface RawNote {
  id: string;
  body: string;
  dateAdded: string;
}
interface RawInvoice {
  _id: string;
  invoiceNumber?: string;
  invoiceNumberPrefix?: string;
  name?: string;
  status?: string;
  invoiceTotal?: number;
  total?: number;
  amountDue?: number;
  issueDate?: string;
  contactDetails?: { id?: string };
}

export interface CustomerOrder {
  id: string;
  kind: "order" | "consultation";
  reference: string;
  title: string;
  date: string;
  value: number;
  /** Human status shown to the customer. */
  status: string;
  /** 0 placed · 1 confirmed · 2 shipped · 3 delivered (orders); -1 cancelled. */
  step: number;
  payment: string;
  items: string[];
  shipping: { text: string; link: string | null; date: string } | null;
  /** Full details for the order page. */
  detail: {
    /** e.g. "Paid online (Razorpay pay_…) — ₹2,999" */
    payment: string;
    /** Subtotal / discount / shipping / total rows. */
    totals: { label: string; value: string }[];
    /** Delivery address lines. */
    address: string[];
    /** Customer's own note at checkout. */
    note: string;
    /** Consultation details (name, birth details, appointment), or gift details on an order. */
    facts: { label: string; value: string }[];
    /** Refunds issued on this order. */
    refunds: { amount: number; date: string }[];
  };
}

export interface CustomerInvoice {
  id: string;
  number: string;
  /** e.g. "Order TRV-ABC123" when raised for a website order. */
  name: string;
  status: string;
  total: number;
  due: number;
  date: string;
}

/** Finds the customer's contact by email, creating one for new customers. */
export async function contactForEmail(email: string, name: string, create: false): Promise<{ id: string; name: string } | null>;
export async function contactForEmail(email: string, name: string, create?: true): Promise<{ id: string; name: string }>;
export async function contactForEmail(email: string, name: string, create = true): Promise<{ id: string; name: string } | null> {
  const res = await ghlApi<{ contacts?: { id: string; firstNameRaw?: string; lastNameRaw?: string; contactName?: string }[] }>("POST", "/contacts/search", {
    body: { locationId: locationId(), pageLimit: 1, filters: [{ field: "email", operator: "eq", value: email }] },
  });
  const c = res.contacts?.[0];
  if (c) return { id: c.id, name: [c.firstNameRaw, c.lastNameRaw].filter(Boolean).join(" ") || c.contactName || name };
  if (!create) return null;
  const id = await upsertContact({ fullName: name || email.split("@")[0], email, source: "Trivana website — account" });
  await ghlApi("POST", `/contacts/${id}/tags`, { body: { tags: ["website-account"] } }).catch(() => {});
  return { id, name };
}

/** Emails the verification code through GoHighLevel (Conversations). */
export async function sendCodeEmail(contactId: string, email: string, code: string) {
  const html = `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#282c3f">
  <p style="font-size:20px;font-weight:bold;letter-spacing:4px;color:#3d1a2c;margin:0">ISHMAYI</p>
  <p style="margin:24px 0 8px">Your verification code is:</p>
  <p style="font-size:34px;font-weight:bold;letter-spacing:8px;margin:0">${code}</p>
  <p style="margin:16px 0 0;color:#696e80;font-size:14px">It is valid for 10 minutes. If you didn't ask for it, you can ignore this email.</p>
  <p style="margin:24px 0 0;color:#696e80;font-size:12px">${site.legalName}</p>
</div>`;
  await ghlApi("POST", "/conversations/messages", {
    body: { type: "Email", contactId, emailTo: email, subject: `${code} is your Ishmayi verification code`, html },
  });
}

/** Any other customer email (confirmation, invoice, refund), in the same simple layout. */
export async function sendCustomerEmail(contactId: string, email: string, subject: string, bodyHtml: string) {
  const html = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#282c3f;line-height:1.5">
  <p style="font-size:20px;font-weight:bold;letter-spacing:4px;color:#3d1a2c;margin:0 0 20px">ISHMAYI</p>
  ${bodyHtml}
  <p style="margin:24px 0 0;color:#696e80;font-size:12px">${site.legalName}</p>
</div>`;
  await ghlApi("POST", "/conversations/messages", { body: { type: "Email", contactId, emailTo: email, subject, html } });
}

/** Saved customer details, to prefill checkout. */
export async function customerProfile(contactId: string) {
  const res = await ghlApi<{ contact?: { firstNameRaw?: string; lastNameRaw?: string; contactName?: string; phone?: string; address1?: string; city?: string; state?: string; postalCode?: string } }>(
    "GET",
    `/contacts/${encodeURIComponent(contactId)}`,
  );
  const c = res.contact ?? {};
  return {
    fullName: [c.firstNameRaw, c.lastNameRaw].filter(Boolean).join(" ") || c.contactName || "",
    phone: (c.phone ?? "").replace(/^\+91/, ""),
    address1: c.address1 ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    pincode: c.postalCode ?? "",
  };
}

const STEP_LABELS = ["Order placed", "Confirmed", "Shipped", "Delivered"];

function parseOrder(o: RawOpp, notes: RawNote[], stageName: string | null, ordersPipeline: boolean): CustomerOrder {
  const name = o.name ?? "";
  const kind: "order" | "consultation" = name.startsWith("🔮") ? "consultation" : "order";
  const reference = name.match(/TRV-[A-Z0-9]+/)?.[0] ?? "";
  // Orders: the note carrying the order number. Consultations: the enquiry note written closest to the card.
  const created = Date.parse(o.createdAt ?? "") || 0;
  const note = reference
    ? notes.find((n) => n.body.includes(reference) && n.body.includes("Website order"))
    : notes
        .filter((n) => n.body.startsWith("🔮"))
        .sort((a, b) => Math.abs(Date.parse(a.dateAdded) - created) - Math.abs(Date.parse(b.dateAdded) - created))[0];
  const items = (note?.body ?? "")
    .split("\n")
    .filter((l) => l.trim().startsWith("•"))
    .map((l) => l.replace(/^\s*•\s*/, ""));
  const ship = reference ? notes.find((n) => n.body.startsWith("📦") && n.body.includes(reference)) : undefined;
  const link = ship?.body.match(/https?:\/\/\S+/)?.[0] ?? null;

  let step = 0;
  let status = kind === "order" ? "Order placed" : /^Appointment:/m.test(note?.body ?? "") ? "Appointment booked" : "Enquiry received";
  if (o.status === "lost" || o.status === "abandoned") {
    step = -1;
    status = "Cancelled";
  } else if (o.status === "won") {
    step = 3;
    status = kind === "order" ? "Delivered" : "Completed";
  } else if (kind === "order") {
    if (ship) step = 2;
    else if (ordersPipeline && stageName) {
      const s = stageName.toLowerCase();
      step = /deliver/.test(s) ? 3 : /ship|dispatch|transit/.test(s) ? 2 : /confirm|pack|process/.test(s) ? 1 : 0;
    }
    status = ordersPipeline && stageName ? stageName : STEP_LABELS[step];
  } else if (stageName && ordersPipeline) status = stageName;

  return {
    id: o.id,
    kind,
    reference,
    title: kind === "order" ? `Order ${reference}` : name.replace(/^\S+\s/, "").split(" · ")[0],
    date: o.createdAt ?? "",
    value: o.monetaryValue ?? 0,
    status,
    step,
    payment: /PAID ONLINE/.test(note?.body ?? "") ? "Paid online" : kind === "order" ? "Cash on delivery" : "",
    items,
    shipping: ship ? { text: ship.body.replace(/^📦[^\n]*\n*/, "").trim(), link, date: ship.dateAdded } : null,
    detail: {
      ...noteDetail(note?.body ?? "", kind),
      refunds: reference
        ? notes
            .filter((n) => n.body.startsWith(`${REFUND_PREFIX} ${reference}:`))
            .map((n) => ({ amount: parseRefundAmount(n.body), date: n.dateAdded }))
        : [],
    },
  };
}

/** Pulls the customer-facing parts out of the order / enquiry note (see lib/orders.ts and the enquiry route). */
function noteDetail(body: string, kind: "order" | "consultation"): Omit<CustomerOrder["detail"], "refunds"> {
  const lines = body.split("\n").map((l) => l.trim());
  const pairs = (line: string) =>
    line.split(" · ").flatMap((part) => {
      const i = part.indexOf(": ");
      return i > 0 ? [{ label: part.slice(0, i), value: part.slice(i + 2) }] : [];
    });
  const pay = lines.find((l) => l.startsWith("Payment: "))?.slice(9) ?? "";
  const payment = pay.replace(/^CASH ON DELIVERY — collect/, "Cash on delivery — pay").replace(/^PAID ONLINE/, "Paid online");
  const totals = lines.filter((l) => /^(Subtotal|Total):/.test(l)).flatMap(pairs);
  // Address: the lines after "Deliver to:" up to the first blank line, minus private extras.
  const start = lines.indexOf("Deliver to:");
  const block = start < 0 ? [] : lines.slice(start + 1);
  const end = block.indexOf("");
  const address = (end < 0 ? block : block.slice(0, end)).filter((l) => !l.startsWith("Date of birth:"));  const note = lines.find((l) => l.startsWith("Customer note: "))?.slice(15) ?? "";
  const facts =
    kind === "consultation"
      ? lines.filter((l) => /^(Name|Date of birth|Birth time|Preferred time|Appointment):/.test(l)).flatMap(pairs)
      : lines.filter((l) => /^(Gift for|Gift message):/.test(l)).flatMap((l) => {
          const i = l.indexOf(": ");
          return [{ label: l.slice(0, i), value: l.slice(i + 2) }];
        });
  return { payment, totals, address, note, facts };
}

export async function customerOrders(contactId: string): Promise<CustomerOrder[]> {
  const [opps, notes, pipelines] = await Promise.all([
    ghlApi<{ opportunities?: RawOpp[] }>("GET", "/opportunities/search", { query: { location_id: locationId(), contact_id: contactId, limit: 100 } }),
    ghlApi<{ notes?: RawNote[] }>("GET", `/contacts/${encodeURIComponent(contactId)}/notes`),
    listPipelines().catch(() => []),
  ]);
  const allNotes = (notes.notes ?? []).sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  return (opps.opportunities ?? [])
    .filter((o) => /^(🛍|🔮)/.test(o.name ?? ""))
    .map((o) => {
      const p = pipelines.find((x) => x.id === o.pipelineId);
      const stage = p?.stages.find((s) => s.id === o.pipelineStageId)?.name ?? null;
      // Only stage names from a dedicated orders/consultations pipeline mean anything to customers.
      return parseOrder(o, allNotes, stage, !!p && /order|consult|booking/i.test(p.name));
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** One order or consultation, only if it belongs to this customer. */
export async function customerOrder(contactId: string, id: string): Promise<CustomerOrder | null> {
  return (await customerOrders(contactId)).find((o) => o.id === id) ?? null;
}

/** One invoice with its line items, only if it was issued to this customer. */
export async function customerInvoice(contactId: string, id: string): Promise<Invoice | null> {
  const inv = await getInvoice(id);
  return inv && inv.contact.id === contactId && inv.status !== "draft" ? inv : null;
}

export async function customerInvoices(contactId: string): Promise<CustomerInvoice[]> {
  const res = await ghlApi<{ invoices?: RawInvoice[] }>("GET", "/invoices/", { query: { altId: locationId(), altType: "location", limit: 100, offset: 0, contactId } });
  return (res.invoices ?? [])
    .filter((i) => i.contactDetails?.id === contactId && i.status !== "draft")
    .map((i) => ({
      id: i._id,
      number: `${i.invoiceNumberPrefix ?? "INV-"}${i.invoiceNumber ?? ""}`,
      name: i.name ?? "",
      status: i.status ?? "",
      total: i.invoiceTotal ?? i.total ?? 0,
      due: i.amountDue ?? 0,
      date: i.issueDate ?? "",
    }));
}

/** Order lookup without an account: order number + the phone used at checkout. */
export async function trackOrder(reference: string, phone: string): Promise<CustomerOrder | null> {
  return (await findOrder(reference, phone))?.order ?? null;
}

/** An order (and its customer) by order number + the phone used at checkout. */
export async function findOrder(reference: string, phone: string): Promise<{ order: CustomerOrder; contactId: string; name: string } | null> {
  const ref = reference.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^TRV-[A-Z0-9]{4,12}$/.test(ref)) return null;
  const res = await ghlApi<{ opportunities?: (RawOpp & { contactId?: string; contact?: { id?: string; phone?: string; name?: string } })[] }>("GET", "/opportunities/search", {
    query: { location_id: locationId(), q: ref, limit: 5 },
  });
  const o = (res.opportunities ?? []).find((x) => (x.name ?? "").includes(ref));
  const digits = (s: string) => s.replace(/\D/g, "").slice(-10);
  if (!o || !o.contact?.phone || digits(o.contact.phone) !== digits(phone) || digits(phone).length !== 10) return null;
  const contactId = o.contact.id ?? o.contactId ?? "";
  return { order: await orderWithNotes(o, contactId), contactId, name: o.contact.name ?? "" };
}

async function orderWithNotes(o: RawOpp, contactId: string): Promise<CustomerOrder> {
  const [notes, pipelines] = await Promise.all([
    ghlApi<{ notes?: RawNote[] }>("GET", `/contacts/${encodeURIComponent(contactId)}/notes`).catch(() => ({ notes: [] as RawNote[] })),
    listPipelines().catch(() => []),
  ]);
  const p = pipelines.find((x) => x.id === o.pipelineId);
  const stage = p?.stages.find((s) => s.id === o.pipelineStageId)?.name ?? null;
  return parseOrder(o, (notes.notes ?? []).sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)), stage, !!p && /order/i.test(p.name));
}
