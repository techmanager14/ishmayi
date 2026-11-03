"use client";

import { waLink } from "@/lib/cms-types";
import { useCms } from "./CmsProvider";
import { TrackedLink } from "./Tracking";

/** Comma-separated list of whichever direct contact channels are configured. */
export function ContactLinksInline({ location }: { location: string }) {
  const { phone, email, whatsapp } = useCms().contact;
  const wa = waLink(whatsapp, "Hello Ishmayi, I need help with my order.");
  const links = [
    wa && (
      <TrackedLink key="wa" href={wa} target="_blank" rel="noopener noreferrer" event="whatsapp_click" params={{ location }} className="link-underline">
        WhatsApp
      </TrackedLink>
    ),
    phone && (
      <a key="tel" href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="link-underline">
        call {phone}
      </a>
    ),
    email && (
      <a key="mail" href={`mailto:${email}`} className="link-underline">
        {email}
      </a>
    ),
  ].filter(Boolean);

  return (
    <>
      {links.map((link, i) => (
        <span key={i}>
          {i > 0 && (i === links.length - 1 ? " or " : ", ")}
          {link}
        </span>
      ))}
      .
    </>
  );
}
