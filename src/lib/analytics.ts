"use client";

export type AnalyticsEvent =
  | "view_embedded_store"
  | "click_external_store"
  | "whatsapp_click"
  | "contact_form_submit"
  | "contact_message_success"
  | "contact_message_error"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase"
  | "purchase_error";

// Allow-list of parameters. Personal data (DOB, phone, email, name, notes)
// can never be attached to an event because there is no key for it.
export interface AnalyticsParams {
  location?: string;
  collection?: string;
  product?: string;
  error_code?: string;
}

const CONSENT_KEY = "trivana-analytics-consent";

export type Consent = "granted" | "denied";

export function readConsent(): Consent | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(value: Consent) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage blocked — consent applies to this page view only */
  }
  window.dispatchEvent(new CustomEvent("trivana:consent", { detail: value }));
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: AnalyticsEvent, params: AnalyticsParams = {}) {
  if (typeof window === "undefined" || readConsent() !== "granted" || !window.gtag) return;
  const safe: Record<string, string> = {};
  for (const key of ["location", "collection", "product", "error_code"] as const) {
    const v = params[key];
    if (typeof v === "string" && v) safe[key] = v.slice(0, 100);
  }
  window.gtag("event", event, safe);
}
