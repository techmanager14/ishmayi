import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin/auth";
import { contactsWithTag, listInvoices, listOpportunities } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  // Quote everything; neutralise spreadsheet formulas.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};
const csv = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");

/** CSV downloads for the admin panel: /admin/export/orders | consultations | customers | invoices */
export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  if (!(await currentAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  const { type } = await params;
  let rows: unknown[][];
  if (type === "orders" || type === "consultations") {
    const kind = type === "orders" ? "order" : "consultation";
    const opps = (await listOpportunities()).filter((o) => o.kind === kind);
    rows = [
      ["Date", kind === "order" ? "Order" : "Consultancy", "Customer", "Email", "Phone", "Value (INR)", "Status", "Details"],
      ...opps.map((o) => [o.createdAt.slice(0, 10), o.reference ?? o.detail, o.contact.name, o.contact.email, o.contact.phone, o.value, o.status, o.name]),
    ];
  } else if (type === "customers") {
    const lists = await Promise.all(["website-order", "consultation-enquiry", "website-contact"].map((t) => contactsWithTag(t)));
    const byId = new Map(lists.flat().map((c) => [c.id, c]));
    rows = [["Name", "Email", "Phone", "City", "Tags", "Since"], ...[...byId.values()].map((c) => [c.name, c.email, c.phone, c.city, c.tags.join(" "), c.dateAdded.slice(0, 10)])];
  } else if (type === "invoices") {
    const inv = await listInvoices();
    rows = [
      ["Number", "Name", "Customer", "Email", "Issued", "Due", "Total (INR)", "Paid", "Due amount", "Status"],
      ...inv.map((i) => [i.number, i.name, i.contact.name, i.contact.email, i.issueDate.slice(0, 10), i.dueDate.slice(0, 10), i.total, i.amountPaid, i.amountDue, i.status]),
    ];
  } else return NextResponse.json({ ok: false }, { status: 404 });
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trivana-${type}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
