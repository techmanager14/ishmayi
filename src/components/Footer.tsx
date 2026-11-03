import Link from "next/link";
import type { CmsContent } from "@/lib/cms-types";
import { policyLinks, site } from "@/lib/site";
import { ContactList } from "./ContactList";
import { Logo } from "./Header";
import { CookieSettingsButton } from "./Tracking";

const SOCIAL = [
  { key: "instagram", label: "Instagram", d: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1.5h.01" },
  { key: "facebook", label: "Facebook", d: "M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v7h4v-7h3l1-4h-4V8Z" },
  { key: "youtube", label: "YouTube", d: "M22 12s0-3.5-.5-5a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.7.2A2.6 2.6 0 0 0 2.5 7C2 8.5 2 12 2 12s0 3.5.5 5a2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.7-.2a2.6 2.6 0 0 0 1.8-1.8c.5-1.5.5-5 .5-5ZM10 15V9l5 3-5 3Z" },
] as const;

const SHOP_LINKS = [
  { href: "/shop", label: "All products" },
  { href: "/offers", label: "Offers" },
  { href: "/promo-codes", label: "Promo codes" },
  { href: "/explore", label: "Explore" },
  { href: "/gifting", label: "Gifting" },
  { href: "/gift-sets", label: "Customised gift sets" },
  { href: "/bulk-orders", label: "Bulk orders" },
  { href: "/wishlist", label: "Wishlist" },
];

const HELP_LINKS = [
  { href: "/account", label: "Login / My account" },
  { href: "/track", label: "Track my order" },
  { href: "/jewellery-care", label: "Jewellery care" },
  { href: "/report-damage", label: "Report a damaged parcel" },
];

const link = "transition-colors hover:text-burgundy";
const heading = "font-sans text-[0.95rem] font-bold text-charcoal";

export function Footer({ social, nav, gstin, essence }: { social: CmsContent["social"]; nav: CmsContent["nav"]; gstin?: string; essence: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-parchment bg-ivory-deep text-ink-muted">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 py-10 md:py-14 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.4fr] lg:gap-10">
        <div className="col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">{essence}</p>
          {SOCIAL.some((x) => social[x.key]) && (
            <ul className="mt-5 flex gap-2">
              {SOCIAL.filter((x) => social[x.key]).map((x) => (
                <li key={x.key}>
                  <a href={social[x.key]} target="_blank" rel="noopener noreferrer" aria-label={x.label} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-burgundy ring-1 ring-parchment transition-colors hover:bg-burgundy hover:text-white">
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={x.d} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Shop">
          <h2 className={heading}>Shop</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {SHOP_LINKS.map((n) => (
              <li key={n.href}><Link href={n.href} prefetch={false} className={link}>{n.label}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help">
          <h2 className={heading}>Help</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {[...nav, ...HELP_LINKS].map((n) => (
              <li key={n.href}><Link href={n.href} prefetch={false} className={link}>{n.label}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Policies">
          <h2 className={heading}>Policies</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {policyLinks.map((p) => (
              <li key={p.href}><Link href={p.href} prefetch={false} className={link}>{p.label}</Link></li>
            ))}
            <li><CookieSettingsButton /></li>
          </ul>
        </nav>

        <div className="max-lg:col-span-2 max-lg:sm:col-span-1">
          <h2 className={heading}>Contact</h2>
          <ContactList location="footer" className="mt-3" />
        </div>
      </div>

      <div className="border-t border-parchment">
        <p className="container-page py-4 text-xs">
          © {year} {site.name}. Operated by {site.legalName}.{gstin ? <> GSTIN: <span className="text-charcoal">{gstin}</span></> : null}
        </p>
      </div>
    </footer>
  );
}
