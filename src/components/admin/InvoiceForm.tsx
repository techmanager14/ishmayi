"use client";

import { useState } from "react";
import { createInvoiceAction } from "@/app/admin/actions";
import { formatInr } from "@/lib/site";
import { ActionForm, Submit } from "./forms";
import { btn, input, label } from "./ui";

interface Item {
  name: string;
  description: string;
  qty: number;
  amount: number;
}

export function InvoiceForm({
  customers,
  initial,
}: {
  customers: { id: string; name: string; email: string }[];
  initial: { contactId: string; name: string; items: Item[]; issueDate: string; dueDate: string; terms: string };
}) {
  const [items, setItems] = useState<Item[]>(initial.items.length ? initial.items : [{ name: "", description: "", qty: 1, amount: 0 }]);
  const upd = (i: number, p: Partial<Item>) => setItems(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const total = items.reduce((s, i) => s + (i.qty || 0) * (i.amount || 0), 0);

  return (
    <ActionForm action={createInvoiceAction} className="grid gap-4 xl:grid-cols-[1fr_22rem]">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <div className="space-y-4">
        <section className="rounded-2xl border border-parchment bg-panel p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className={label} htmlFor="contactId">
                Customer
              </label>
              <select id="contactId" name="contactId" defaultValue={initial.contactId} required className={input}>
                <option value="">Choose…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.email} {c.email && c.name ? `· ${c.email}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="name">
                Invoice name
              </label>
              <input id="name" name="name" defaultValue={initial.name} className={input} placeholder="e.g. Order TRV-ABC123" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-parchment bg-panel p-5">
          <h2 className="mb-3 text-base font-bold">Items</h2>
          <ul className="space-y-3">
            {items.map((it, i) => (
              <li key={i} className="grid gap-2 rounded-xl bg-ivory-deep p-3 sm:grid-cols-[1fr_5rem_8rem_auto] sm:items-end">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Item</label>
                  <input value={it.name} onChange={(e) => upd(i, { name: e.target.value })} className={input} placeholder="Product or service" />
                  <input value={it.description} onChange={(e) => upd(i, { description: e.target.value })} className={`${input} mt-2 py-2 text-xs`} placeholder="Description (optional)" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Qty</label>
                  <input inputMode="numeric" value={it.qty} onChange={(e) => upd(i, { qty: Number(e.target.value.replace(/\D/g, "")) || 1 })} className={input} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Price ₹ (each)</label>
                  <input inputMode="decimal" value={it.amount || ""} onChange={(e) => upd(i, { amount: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })} className={input} />
                </div>
                <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} disabled={items.length === 1} className={`${btn.ghost} text-rose-300 disabled:opacity-30`}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setItems([...items, { name: "", description: "", qty: 1, amount: 0 }])} className={`${btn.outline} mt-3`}>
            + Add item
          </button>
        </section>

        <section className="rounded-2xl border border-parchment bg-panel p-5">
          <label className={label} htmlFor="terms">
            Notes & terms
          </label>
          <textarea id="terms" name="terms" rows={4} defaultValue={initial.terms} className={input} />
          <p className="mt-1 text-xs text-ink-muted">Your GSTIN (Settings → Business) is added automatically.</p>
        </section>
      </div>

      <section className="space-y-4 self-start rounded-2xl border border-parchment bg-panel p-5 xl:sticky xl:top-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="issueDate">
              Invoice date
            </label>
            <input id="issueDate" name="issueDate" type="date" defaultValue={initial.issueDate} required className={input} />
          </div>
          <div>
            <label className={label} htmlFor="dueDate">
              Due date
            </label>
            <input id="dueDate" name="dueDate" type="date" defaultValue={initial.dueDate} required className={input} />
          </div>
        </div>
        <div className="rounded-xl bg-ivory-deep p-4">
          <p className="text-sm text-ink-muted">Total</p>
          <p className="text-3xl font-bold">{formatInr(total)}</p>
          <p className="mt-1 text-xs text-ink-muted">Enter prices without GST; add GST as its own line (3% jewellery, HSN 7117 · 18% consultation, SAC 999799).</p>
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="send" value="yes" defaultChecked className="h-5 w-5 accent-[#e3425c]" />
          Email it to the customer now
        </label>
        <Submit className={`${btn.primary} w-full py-3`} pendingText="Creating…">
          Create invoice
        </Submit>
        <p className="text-xs text-ink-muted">Created in GoHighLevel → Payments → Invoices. The email has a secure link to view and pay.</p>
      </section>
    </ActionForm>
  );
}
