"use client";

import { waLink } from "@/lib/cms-types";
import { site } from "@/lib/site";
import { useCms } from "./CmsProvider";
import { TrackedLink } from "./Tracking";

export function ContactList({
  tone = "light",
  location,
  className = "",
}: {
  tone?: "light" | "dark";
  location: string;
  className?: string;
}) {
  const { address } = site;
  const { contact } = useCms();
  const linkClass = tone === "dark" ? "hover:text-ivory" : "link-underline";
  const muted = tone === "dark" ? "text-ivory/80" : "text-ink-muted";
  const wa = waLink(contact.whatsapp);

  return (
    <ul className={`space-y-3 text-sm leading-relaxed ${muted} ${className}`}>
      <li>
        <span className={`block text-[0.7rem] font-bold tracking-wider uppercase ${tone === "dark" ? "text-ivory/60" : "text-ink-muted"}`}>
          Registered office
        </span>
        <address className="not-italic">
          {site.legalName}
          <br />
          {address.street},
          <br />
          {address.locality}, {address.city} – {address.postalCode}
        </address>
      </li>
      {contact.phone && (
        <li>
          Phone:{" "}
          <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className={linkClass}>
            {contact.phone}
          </a>
        </li>
      )}
      {wa && (
        <li>
          WhatsApp:{" "}
          <TrackedLink
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            event="whatsapp_click"
            params={{ location }}
            className={linkClass}
          >
            Chat with us
          </TrackedLink>
        </li>
      )}
      {contact.email && (
        <li>
          Email:{" "}
          <a href={`mailto:${contact.email}`} className={linkClass}>
            {contact.email}
          </a>
        </li>
      )}
    </ul>
  );
}
