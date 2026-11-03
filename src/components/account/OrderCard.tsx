import Link from "next/link";
import type { CustomerOrder } from "@/lib/customer/data";
import { formatInr } from "@/lib/site";

const STEPS = ["Placed", "Confirmed", "Shipped", "Delivered"];

const date = (iso: string) => (iso ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso)) : "");

/** One order (or consultation) with a progress tracker, items and shipping details. */
export function OrderCard({ o, href }: { o: CustomerOrder; href?: string }) {
  const cancelled = o.step < 0;
  return (
    <article className="rounded-2xl border border-parchment bg-white p-5 shadow-[var(--shadow-soft)] md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-charcoal">{o.title}</h3>
          <p className="text-sm text-ink-muted">
            {date(o.date)}
            {o.payment && ` · ${o.payment}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-charcoal">{formatInr(o.value)}</p>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
              cancelled ? "bg-rose-50 text-rose-700" : o.step >= 3 ? "bg-emerald-50 text-emerald-700" : "bg-blush text-burgundy"
            }`}
          >
            {o.status}
          </span>
        </div>
      </div>

      {o.kind === "order" && !cancelled && (
        <ol className="mt-5 grid grid-cols-4 gap-1" aria-label="Order progress">
          {STEPS.map((s, i) => {
            const done = i <= o.step;
            return (
              <li key={s} aria-current={i === o.step ? "step" : undefined}>
                <div className={`h-1.5 rounded-full ${done ? "bg-gradient-to-r from-gold to-burgundy" : "bg-parchment"}`} />
                <p className={`mt-1.5 text-[0.7rem] font-bold tracking-wide uppercase ${done ? "text-burgundy" : "text-ink-muted"}`}>{s}</p>
              </li>
            );
          })}
        </ol>
      )}

      {o.items.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-charcoal">
          {o.items.map((it, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden="true" className="text-gold">✦</span>
              {it}
            </li>
          ))}
        </ul>
      )}

      {o.shipping && (
        <div className="mt-4 rounded-xl bg-ivory-deep p-4 text-sm">
          <p className="font-bold text-charcoal">📦 Shipping update · {date(o.shipping.date)}</p>
          <p className="mt-1 whitespace-pre-line text-ink-muted">{o.shipping.text.replace(/https?:\/\/\S+/g, "").trim()}</p>
          {o.shipping.link && (
            <a href={o.shipping.link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-caps mt-3">
              Track parcel ↗
            </a>
          )}
        </div>
      )}

      {href && (
        <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-burgundy hover:underline">
          View full details →
        </Link>
      )}
    </article>
  );
}
