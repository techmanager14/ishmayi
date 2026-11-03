import "server-only";
import { createInvoice, recordInvoicePayment, type InvoiceItem } from "./admin/data";
import { getCmsFresh } from "./cms";
import { sendCustomerEmail } from "./customer/data";
import { formatInrExact, site } from "./site";

// Automatic invoices, kept in GoHighLevel (and so on the admin Invoices page).
// Everything is paid by the time it is invoiced. GoHighLevel refuses to send a paid
// invoice, so the customer gets our own email linking to the invoice in their account.

const today = (plusDays = 0) => new Date(Date.now() + 5.5 * 3600e3 + plusDays * 86400e3).toISOString().slice(0, 10);

interface InvoiceContact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

async function create(contact: InvoiceContact, name: string, items: InvoiceItem[], discount: number, dueDays: number | null) {
  const { business } = await getCmsFresh();
  return createInvoice({
    contact,
    name,
    items,
    discount,
    issueDate: today(),
    dueDate: today(dueDays ?? business.dueDays),
    terms: [business.gstin ? `GSTIN: ${business.gstin}` : "", business.invoiceTerms, business.invoiceNotes].filter(Boolean).join("\n"),
    business: { name: business.name, phone: business.phone, address: business.address },
  });
}

/** Paid order: invoice marked as paid, then emailed to the customer. */
export async function invoiceOrder(o: {
  contact: InvoiceContact;
  ref: string;
  lines: { title: string; variantTitle: string | null; qty: number; unitPrice: number }[];
  discount: number;
  gst: number;
  gstRate: number;
  shipping: number;
  total: number;
  paymentId: string;
  hsn: string;
}) {
  const code = o.hsn ? `HSN ${o.hsn}` : "";
  const items: InvoiceItem[] = [
    ...o.lines.map((l) => ({ name: l.variantTitle ? `${l.title} (${l.variantTitle})` : l.title, description: code, qty: l.qty, amount: l.unitPrice })),
    ...(o.gst ? [{ name: `GST @ ${o.gstRate}%`, description: code, qty: 1, amount: o.gst }] : []),
    ...(o.shipping ? [{ name: "Shipping", description: "", qty: 1, amount: o.shipping }] : []),
  ];
  const id = await create(o.contact, `Order ${o.ref}`, items, o.discount, 0);
  await recordInvoicePayment(id, o.total, "other", `Razorpay ${o.paymentId}`);
  const rows = [
    ...o.lines.map((l) => `<tr><td style="padding:6px 0">${l.qty} × ${esc(l.title)}${l.variantTitle ? ` (${esc(l.variantTitle)})` : ""}</td><td align="right">${formatInrExact(l.unitPrice * l.qty)}</td></tr>`),
    ...(o.discount ? [`<tr><td style="padding:6px 0">Discount</td><td align="right">−${formatInrExact(o.discount)}</td></tr>`] : []),
    ...(o.gst ? [`<tr><td style="padding:6px 0">GST @ ${o.gstRate}%</td><td align="right">${formatInrExact(o.gst)}</td></tr>`] : []),
    `<tr><td style="padding:6px 0">Shipping</td><td align="right">${o.shipping ? formatInrExact(o.shipping) : "Free"}</td></tr>`,
    `<tr><td style="padding:10px 0;border-top:1px solid #ddd"><b>Total paid</b></td><td align="right" style="border-top:1px solid #ddd"><b>${formatInrExact(o.total)}</b></td></tr>`,
  ].join("");
  await sendCustomerEmail(
    o.contact.id,
    o.contact.email,
    `Invoice for your Ishmayi order ${o.ref} (paid)`,
    `<p>Hello ${esc(o.contact.name.split(" ")[0] || "there")},</p><p>Thank you for your order <b>${o.ref}</b>. Your invoice is below.</p><table width="100%" cellspacing="0" style="font-size:14px">${rows}</table><p>Payment ID: ${esc(o.paymentId)}</p><p><a href="${site.url}/account/invoices/${id}" style="color:#0b5d4b;font-weight:bold">View or download your full invoice</a></p>`,
  );
  return id;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
