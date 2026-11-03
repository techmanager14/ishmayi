import { ChevronRight, CreditCard, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { getCms } from "@/lib/cms";
import { shippingLabel } from "@/lib/cms-types";

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[0.8rem] text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="hover:text-charcoal">Home</Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            {item.href ? (
              <Link href={item.href} className="hover:text-charcoal">{item.label}</Link>
            ) : (
              <span aria-current="page" className="text-charcoal">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="bg-grain">
      <div className="container-page py-8 md:py-14">
        <Breadcrumbs items={[{ label: eyebrow }]} />
        <h1 className="mt-3 max-w-3xl font-display text-[1.75rem] leading-tight text-charcoal md:text-[2.4rem]">{title}</h1>
        {children && <div className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-ink-muted md:text-[1.05rem]">{children}</div>}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
  align = "center",
  id,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "center" | "left";
  id?: string;
  action?: ReactNode;
}) {
  const body = (
    <>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h2 id={id} className="section-title">
        {title}
      </h2>
      {children && <div className="section-sub leading-relaxed">{children}</div>}
    </>
  );
  if (action) {
    return (
      <div className="flex items-end justify-between gap-4">
        <div className="max-w-2xl">{body}</div>
        <div className="shrink-0">{action}</div>
      </div>
    );
  }
  return <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>{body}</div>;
}

/** Friendly panel for "nothing here yet" states. */
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl border border-parchment bg-ivory-deep/60 px-6 py-10 text-center md:py-14" role="status">
      <p className="font-display text-[1.35rem] leading-tight text-charcoal">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-[0.92rem] leading-relaxed text-ink-muted">{children}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export async function TrustBadges() {
  const { store } = await getCms();
  const items = [
    { Icon: Truck, title: shippingLabel(store), body: "Delivered across India" },
    { Icon: PackageCheck, title: `${store.deliveryDays} day delivery`, body: "From order confirmation" },
    { Icon: CreditCard, title: "Secure payment", body: "UPI, card or netbanking" },
    { Icon: ShieldCheck, title: "Damage cover", body: "Refunds with an unboxing video" },
  ];
  return (
    <section aria-label="Why shop with Ishmayi">
      <ul className="container-page grid grid-cols-2 gap-2.5 py-5 md:grid-cols-4 md:gap-4 md:py-8">
        {items.map(({ Icon, title, body }) => (
          <li key={title} className="flex items-center gap-3 rounded-xl bg-blush px-3 py-3 md:px-4">
            <Icon className="h-6 w-6 shrink-0 text-burgundy" strokeWidth={1.4} aria-hidden="true" />
            <span>
              <span className="block text-[0.88rem] leading-snug font-bold text-charcoal">{title}</span>
              <span className="block text-xs leading-relaxed text-ink-muted">{body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
