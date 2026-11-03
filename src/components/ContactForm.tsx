"use client";

import Link from "next/link";
import { useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { track } from "@/lib/analytics";
import { CONTACT_TOPICS, MESSAGE_MAX, emptyContact, validateContact, type ContactErrors, type ContactInput } from "@/lib/contact";
import type { EnquiryResponse } from "@/lib/enquiry";

type Status = "idle" | "submitting" | "success" | "error";

const ORDER: (keyof ContactInput)[] = ["name", "email", "phone", "topic", "message", "privacyNoticeAccepted"];

const Icon = ({ d, className = "h-5 w-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export function ContactForm({ initialTopic }: { initialTopic?: string }) {
  const uid = useId();
  const fid = (n: string) => `${uid}-${n}`;
  const [values, setValues] = useState<ContactInput>({ ...emptyContact, topic: CONTACT_TOPICS.some((t) => t.value === initialTopic) ? initialTopic! : emptyContact.topic });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submissionId = useRef<string | null>(null);
  const inFlight = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitting";

  function onChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, type } = e.target;
    const value = type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name as keyof ContactInput]) setErrors((x) => ({ ...x, [name]: undefined }));
  }

  function focusFirst(errs: ContactErrors) {
    const first = ORDER.find((f) => errs[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (inFlight.current || status === "success") return;
    setSubmitError(null);
    const result = validateContact(values);
    if (!result.ok) {
      setErrors(result.errors);
      focusFirst(result.errors);
      return;
    }
    setErrors({});
    inFlight.current = true;
    submissionId.current ??= crypto.randomUUID();
    setStatus("submitting");
    track("contact_form_submit", { location: "contact_page" });
    const honeypot = (formRef.current?.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, submissionId: submissionId.current, website: honeypot }),
        signal: AbortSignal.timeout(20_000),
      });
      const body = (await res.json().catch(() => null)) as EnquiryResponse | null;
      if (res.ok && body?.success) {
        setStatus("success");
        track("contact_message_success", { location: "contact_page" });
        requestAnimationFrame(() => doneRef.current?.focus());
        return;
      }
      if (body && !body.success && body.fieldErrors) {
        setErrors(body.fieldErrors as ContactErrors);
        setStatus("idle");
        focusFirst(body.fieldErrors as ContactErrors);
        return;
      }
      const code = body && !body.success ? body.code : `http_${res.status}`;
      setSubmitError(body && !body.success ? body.message : "We couldn't confirm your message was received. Please try again.");
      setStatus("error");
      track("contact_message_error", { location: "contact_page", error_code: code });
    } catch (err) {
      const timedOut = err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError");
      setSubmitError(timedOut ? "This is taking longer than expected. Please try again — it won't be sent twice." : "We couldn't connect. Please check your internet connection and try again.");
      setStatus("error");
      track("contact_message_error", { location: "contact_page", error_code: timedOut ? "client_timeout" : "network" });
    } finally {
      inFlight.current = false;
    }
  }

  if (status === "success") {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="flex min-h-[26rem] flex-col items-center justify-center text-center outline-none">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold to-burgundy text-white shadow-lg">
          <Icon d="m5 12 5 5 9-10" className="h-8 w-8" />
        </span>
        <h3 className="mt-5 text-2xl font-bold text-charcoal">Message sent — thank you, {values.name.split(" ")[0]}!</h3>
        <p className="mt-2 max-w-sm text-ink-muted">We&apos;ve received your message and will get back to you at {values.email} as soon as we can.</p>
        <button
          type="button"
          onClick={() => {
            setValues(emptyContact);
            submissionId.current = null;
            setStatus("idle");
          }}
          className="btn btn-outline mt-6"
        >
          Send another message
        </button>
      </div>
    );
  }

  const field = (name: keyof ContactInput) => ({
    id: fid(name),
    name,
    disabled: busy,
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby": errors[name] ? fid(`${name}-error`) : undefined,
  });
  const err = (name: keyof ContactInput) =>
    errors[name] ? (
      <p id={fid(`${name}-error`)} className="field-error">
        {errors[name]}
      </p>
    ) : null;
  const req = <span aria-hidden="true" className="text-burgundy">*</span>;

  return (
    <form ref={formRef} onSubmit={onSubmit} method="post" action="/api/contact" noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={fid("name")} className="field-label">Your name {req}</label>
          <input {...field("name")} className="field-input" autoComplete="name" placeholder="Full name" value={values.name} onChange={onChange} />
          {err("name")}
        </div>
        <div>
          <label htmlFor={fid("email")} className="field-label">Email {req}</label>
          <input {...field("email")} type="email" inputMode="email" className="field-input" autoComplete="email" placeholder="you@example.com" value={values.email} onChange={onChange} />
          {err("email")}
        </div>
        <div>
          <label htmlFor={fid("phone")} className="field-label">
            Mobile <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <input {...field("phone")} type="tel" inputMode="tel" className="field-input" autoComplete="tel" placeholder="98765 43210" value={values.phone} onChange={onChange} />
          {err("phone")}
        </div>
        <div>
          <label htmlFor={fid("topic")} className="field-label">Topic {req}</label>
          <select {...field("topic")} className="field-input" value={values.topic} onChange={onChange}>
            {CONTACT_TOPICS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {err("topic")}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={fid("message")} className="field-label">Message {req}</label>
          <span className={`text-xs ${values.message.length > MESSAGE_MAX - 50 ? "text-[#b0233a]" : "text-ink-muted"}`} aria-live="polite">
            {values.message.length}/{MESSAGE_MAX}
          </span>
        </div>
        <textarea
          {...field("message")}
          rows={5}
          maxLength={MESSAGE_MAX}
          className="field-input min-h-32 resize-y"
          placeholder="How can we help? For bulk orders, tell us the pieces and quantities you have in mind."
          value={values.message}
          onChange={onChange}
        />
        {err("message")}
      </div>

      <div>
        <label className="flex items-start gap-3 text-[0.85rem] leading-relaxed text-charcoal">
          <input {...field("privacyNoticeAccepted")} type="checkbox" className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-burgundy" checked={values.privacyNoticeAccepted} onChange={onChange} />
          <span>
            I have read the{" "}
            <Link href="/policies/privacy" target="_blank" className="link-underline">privacy notice</Link>{" "}
            and agree to Ishmayi using my details to reply to this message. {req}
          </span>
        </label>
        {err("privacyNoticeAccepted")}
      </div>

      {/* Honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={fid("website")}>Website</label>
        <input id={fid("website")} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      {status === "error" && submitError && (
        <div role="alert" className="rounded-xl border border-[#a3283b]/30 bg-[#a3283b]/5 p-4 text-sm">
          <p className="font-bold text-[#7d1c2c]">Your message wasn&apos;t sent</p>
          <p className="mt-1 text-charcoal">{submitError} Your message is still here — just press <strong>Try again</strong>.</p>
        </div>
      )}

      <button type="submit" className="btn btn-primary w-full sm:w-auto sm:min-w-48" disabled={busy}>
        {busy ? (
          <>
            <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Sending…
          </>
        ) : status === "error" ? (
          "Try again"
        ) : (
          <>
            Send message
            <Icon d="M4 12h16M14 6l6 6-6 6" className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
