"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState, type ComponentProps } from "react";
import { readConsent, track, writeConsent, type AnalyticsEvent, type AnalyticsParams, type Consent } from "@/lib/analytics";
import { waLink } from "@/lib/cms-types";
import { site } from "@/lib/site";
import { useCms } from "./CmsProvider";

/** External link that records a non-sensitive analytics event on click. */
export function TrackedLink({
  event,
  params,
  onClick,
  ...props
}: ComponentProps<"a"> & { event: AnalyticsEvent; params?: AnalyticsParams }) {
  return (
    <a
      {...props}
      onClick={(e) => {
        track(event, params);
        onClick?.(e);
      }}
    />
  );
}

/** Fires a single analytics event when the page mounts. */
export function TrackView({ event, params }: { event: AnalyticsEvent; params?: AnalyticsParams }) {
  useEffect(() => {
    track(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** Loads GA4 only after consent; renders the consent banner while undecided. */
export function AnalyticsConsent() {
  const [consent, setConsent] = useState<Consent | null | "unknown">("unknown");

  useEffect(() => {
    setConsent(readConsent());
    const onChange = (e: Event) => setConsent((e as CustomEvent<Consent>).detail);
    window.addEventListener("trivana:consent", onChange);
    return () => window.removeEventListener("trivana:consent", onChange);
  }, []);

  if (!site.gaId) return null;

  return (
    <>
      {consent === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${site.gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${site.gaId}',{allow_google_signals:false,allow_ad_personalization_signals:false});`}
          </Script>
        </>
      )}
      {consent === null && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Analytics cookies"
          className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 lg:bottom-5 mx-auto max-w-xl rounded-2xl border border-parchment bg-[#fffdf8] p-5 shadow-[var(--shadow-soft)]"
        >
          <p className="text-sm leading-relaxed text-ink-muted">
            We&apos;d like to use analytics cookies to understand which pages are helpful. We never send your
            contact information to analytics.{" "}
            <a href="/policies/privacy#analytics" className="link-underline">
              Learn more
            </a>
          </p>
          <div className="mt-4 flex gap-3">
            <button type="button" className="btn btn-primary !min-h-10 !py-2" onClick={() => writeConsent("granted")}>
              Accept
            </button>
            <button type="button" className="btn btn-outline !min-h-10 !py-2" onClick={() => writeConsent("denied")}>
              Decline
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function CookieSettingsButton() {
  if (!site.gaId) return null;
  return (
    <button
      type="button"
      className="transition-colors hover:text-white"
      onClick={() => {
        try {
          window.localStorage.removeItem("trivana-analytics-consent");
        } catch {
          /* ignore */
        }
        window.dispatchEvent(new CustomEvent("trivana:consent", { detail: null }));
      }}
    >
      Cookie settings
    </button>
  );
}

export function WhatsAppFloat() {
  const pathname = usePathname();
  const { contact, store } = useCms();
  const href = waLink(contact.whatsapp, store.whatsappMessage);
  if (!href || !store.whatsappButton) return null;
  const lift = "bottom-[calc(5rem+env(safe-area-inset-bottom))]";
  return (
    <TrackedLink
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      event="whatsapp_click"
      params={{ location: "floating_button" }}
      aria-label="Chat with us on WhatsApp (opens in a new tab)"
      className={`fixed right-4 ${lift} z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1f7a4d] text-white shadow-lg transition-transform hover:scale-105 lg:right-6 lg:bottom-6`}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
      </svg>
    </TrackedLink>
  );
}
