import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageTitle({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-charcoal md:text-2xl">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-ink-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = "", actions }: { title?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-parchment bg-panel p-4 shadow-[var(--shadow-soft)] ${className}`}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-bold text-charcoal">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-amber-500/15 text-amber-800 ring-amber-500/30" },
  won: { label: "Completed", cls: "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30" },
  lost: { label: "Cancelled", cls: "bg-rose-500/15 text-rose-800 ring-rose-500/30" },
  abandoned: { label: "Abandoned", cls: "bg-stone-100 text-stone-600 ring-stone-200" },
  confirmed: { label: "Confirmed", cls: "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30" },
  cancelled: { label: "Cancelled", cls: "bg-rose-500/15 text-rose-800 ring-rose-500/30" },
  "on-sale": { label: "On sale", cls: "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30" },
  hidden: { label: "Hidden", cls: "bg-stone-100 text-stone-600 ring-stone-200" },
  soon: { label: "Coming soon", cls: "bg-amber-500/15 text-amber-800 ring-amber-500/30" },
  live: { label: "Live", cls: "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30" },
  draft: { label: "Draft", cls: "bg-stone-100 text-stone-700 ring-stone-200" },
  sent: { label: "Sent", cls: "bg-sky-500/15 text-sky-800 ring-sky-500/30" },
  viewed: { label: "Viewed", cls: "bg-violet-500/15 text-violet-800 ring-violet-500/30" },
  paid: { label: "Paid", cls: "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30" },
  partially_paid: { label: "Part paid", cls: "bg-amber-500/15 text-amber-800 ring-amber-500/30" },
  overdue: { label: "Overdue", cls: "bg-rose-500/15 text-rose-800 ring-rose-500/30" },
  void: { label: "Void", cls: "bg-stone-100 text-stone-500 ring-stone-200" },
  payment_processing: { label: "Processing", cls: "bg-sky-500/15 text-sky-800 ring-sky-500/30" },
};

export function Badge({ status, label }: { status: string; label?: string }) {
  const s = STATUS[status] ?? { label: status, cls: "bg-stone-100 text-stone-700 ring-stone-200" };
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ring-1 ${s.cls}`}>{label ?? s.label}</span>;
}

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5e0f2c] to-[#420a1f] px-3.5 py-2 text-sm font-bold text-white shadow-lg shadow-[#5e0f2c]/20 transition hover:brightness-110 disabled:opacity-60",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-parchment bg-panel px-3.5 py-2 text-sm font-bold text-charcoal transition hover:border-[#5e0f2c] hover:text-burgundy disabled:opacity-60",
  danger: "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-sm font-bold text-rose-800 transition hover:bg-rose-500/20",
  ghost: "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink-muted transition hover:bg-ivory-deep hover:text-charcoal",
};

export const input =
  "w-full rounded-lg border border-parchment bg-ivory-deep px-3 py-2 text-[0.93rem] text-charcoal placeholder:text-ink-muted/70 focus:border-[#5e0f2c] focus:ring-2 focus:ring-[#5e0f2c]/25 focus:outline-none";
export const label = "mb-1 block text-sm font-semibold text-charcoal";

const TONES = {
  rose: "from-[#5e0f2c]/25 to-transparent text-burgundy",
  gold: "from-[#c39a55]/25 to-transparent text-gold-deep",
  violet: "from-violet-500/25 to-transparent text-violet-800",
  emerald: "from-emerald-500/25 to-transparent text-emerald-800",
  sky: "from-sky-500/25 to-transparent text-sky-800",
};

export function Stat({
  label: l,
  value,
  sub,
  href,
  tone = "rose",
  icon: StatIcon,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  href?: string;
  tone?: keyof typeof TONES;
  icon?: LucideIcon;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-muted">{l}</p>
        {StatIcon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${TONES[tone]}`}>
            <StatIcon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-1 text-xl font-bold text-charcoal md:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>}
    </>
  );
  const cls = "block rounded-2xl border border-parchment bg-panel p-4 shadow-[var(--shadow-soft)]";
  return href ? (
    <Link href={href} className={`${cls} transition hover:-translate-y-0.5 hover:border-[#5e0f2c]/50`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-parchment bg-ivory-deep/60 px-4 py-5 text-center text-sm text-ink-muted">{children}</div>;
}

export function Tabs({ items }: { items: { href: string; label: string; active: boolean; count?: number }[] }) {
  return (
    <nav className="mb-3 flex flex-wrap gap-1.5" aria-label="Filter">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
            t.active ? "bg-gradient-to-r from-[#5e0f2c] to-[#420a1f] text-white" : "bg-panel text-charcoal ring-1 ring-parchment hover:ring-[#5e0f2c]"
          }`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 opacity-70">{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export const fmtDate = (iso: string, withTime = true) =>
  iso
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
      }).format(new Date(iso))
    : "—";

export function GhlError({ error }: { error: unknown }) {
  return (
    <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800">
      <p className="font-bold">Couldn&apos;t load this from GoHighLevel.</p>
      <p className="mt-1">{error instanceof Error ? error.message.slice(0, 200) : "Please refresh in a moment."}</p>
    </div>
  );
}

/** Placeholder blocks shown while a page loads. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`admin-skeleton ${className}`} aria-hidden="true" />;
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      <div className="mt-6 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-72 xl:col-span-2" />
        <Skeleton className="h-72" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
