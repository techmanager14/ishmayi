"use client";

import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

/** Promo code with its conditions and a copy button. */
export function PromoCodeCard({ code, value, conditions }: { code: string; value: string; conditions: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the code stays visible to copy by hand */
    }
  };
  return (
    <li className="flex flex-col justify-between gap-4 rounded-2xl border border-dashed border-gold bg-white p-5">
      <div>
        <p className="font-display text-[1.3rem] leading-tight font-bold text-charcoal">{value}</p>
        <p className="mt-1 text-[0.85rem] text-ink-muted">{conditions}</p>
      </div>
      <button type="button" onClick={copy} aria-label={`Copy code ${code}`} className="flex items-center justify-between gap-3 rounded-lg border border-parchment bg-ivory-deep px-4 py-2.5 hover:border-burgundy">
        <span className="font-medium tracking-[0.18em] text-charcoal">{code}</span>
        <span className="flex items-center gap-1.5 text-[0.68rem] tracking-[0.14em] text-burgundy uppercase" role="status">
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </span>
      </button>
    </li>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

function useTimeLeft(endsAt?: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!endsAt) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);
  // null until the browser takes over, so the server and browser agree and nothing jumps.
  return endsAt && now !== null ? Date.parse(endsAt) - now : null;
}

/** Days, hours, minutes and seconds to the end of a sale. */
export function SaleCountdown({ endsAt, light = false, compact = false }: { endsAt: string; light?: boolean; compact?: boolean }) {
  const left = useTimeLeft(endsAt);
  if (left !== null && left <= 0) return <p className={`text-lg font-bold ${light ? "text-gold-light" : "text-burgundy"}`}>This sale has ended.</p>;
  const units: [string, number | null][] = [
    ["Days", left === null ? null : Math.floor(left / 86400000)],
    ["Hrs", left === null ? null : Math.floor(left / 3600000) % 24],
    ["Min", left === null ? null : Math.floor(left / 60000) % 60],
    ["Sec", left === null ? null : Math.floor(left / 1000) % 60],
  ];
  return (
    <div>
      <p className={`font-bold tracking-[0.1em] uppercase ${compact ? "text-[0.62rem]" : "text-[0.72rem]"} ${light ? "text-gold-light" : "text-burgundy"}`}>Ends in</p>
      {left !== null && <p className="sr-only">{`${units[0][1]} days and ${units[1][1]} hours left`}</p>}
      <dl className={`mt-1 grid grid-cols-4 text-center ${compact ? "max-w-[14rem] gap-1" : "max-w-[19rem] gap-2"}`} aria-hidden="true">
        {units.map(([k, v]) => (
          <div key={k} className={`flex flex-col-reverse px-0.5 ${compact ? "rounded-lg py-1" : "rounded-xl py-2"} ${light ? "bg-white text-burgundy" : "bg-burgundy text-white"}`}>
            <dt className={`tracking-[0.06em] uppercase ${compact ? "text-[0.5rem]" : "text-[0.58rem]"} ${light ? "text-burgundy/70" : "text-white/75"}`}>{k}</dt>
            <dd className={`leading-tight font-bold tabular-nums ${compact ? "text-[1rem]" : "text-[1.35rem] md:text-[1.5rem]"}`}>{v === null ? "--" : pad(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Time-limited offer; shows a countdown and disappears the moment the offer ends. */
export function LimitedOfferCard({ title, body, label, endsAt, href, art }: { title: string; body: string; label: string; endsAt?: string; href: string; art: ReactNode }) {
  const left = useTimeLeft(endsAt);
  if (left !== null && left <= 0) return null;

  return (
    <div className="group grid h-full grid-cols-[34%_minmax(0,1fr)] overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-soft)]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.05]">{art}</div>
      </div>
      <div className="flex min-w-0 flex-col items-start p-3.5 md:p-5">
        <p className="rounded-full bg-gold-light px-2.5 py-0.5 text-[0.62rem] font-bold tracking-wide text-burgundy-deep uppercase">{label}</p>
        <h3 className="mt-1.5 text-[1.15rem] leading-tight font-bold text-charcoal md:text-[1.4rem]">{title}</h3>
        <p className="mt-0.5 line-clamp-2 text-[0.8rem] leading-snug text-ink-muted md:text-[0.88rem]">{body}</p>
        {endsAt && (
          <div className="mt-2 w-full">
            <SaleCountdown endsAt={endsAt} compact />
          </div>
        )}
        <Link href={href} draggable={false} className="btn btn-primary mt-3 !min-h-9 !px-4 !py-1.5 !text-[0.8rem]">
          Explore offer
        </Link>
      </div>
    </div>
  );
}
