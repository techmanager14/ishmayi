"use client";

import Link from "next/link";
import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";
import { checkOrderAction, submitClaimAction } from "@/app/(site)/report-damage/actions";

type Step = "verify" | "upload" | "sending" | "done";
const MAX_MB = 300;
const today = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

function StepDot({ n, label, state }: { n: number; label: string; state: "done" | "now" | "next" }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
          state === "done" ? "bg-burgundy text-white" : state === "now" ? "bg-gold-light text-burgundy-deep ring-2 ring-gold" : "bg-parchment text-ink-muted"
        }`}
      >
        {state === "done" ? "✓" : n}
      </span>
      <span className={`text-sm font-semibold ${state === "next" ? "text-ink-muted" : "text-charcoal"}`}>{label}</span>
    </li>
  );
}

/** Report a damaged parcel: verify the order → upload the unboxing video → done. */
export function DamageClaimForm() {
  const [step, setStep] = useState<Step>("verify");
  const [order, setOrder] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [ref, setRef] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [issue, setIssue] = useState("");
  const [deliveredOn, setDeliveredOn] = useState(today());
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const r = await checkOrderAction(order, phone).catch(() => ({ ok: false as const, message: "Please check your connection and try again." }));
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setPass(r.pass);
    setRef(r.ref);
    setItems(r.items);
    setStep("upload");
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!file) return setError("Please choose your unboxing video.");
    if (!file.type.startsWith("video/")) return setError("Please choose a video file.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`The video is larger than ${MAX_MB} MB. Please trim it or record at a lower quality.`);
    setStep("sending");
    setProgress(0);
    try {
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "mp4";
      const blob = await upload(`claims/${ref}-unboxing.${ext}`, file, {
        access: "public",
        handleUploadUrl: "/api/claims/upload",
        clientPayload: pass,
        multipart: file.size > 20 * 1024 * 1024,
        contentType: file.type,
        onUploadProgress: (p) => setProgress(Math.round(p.percentage)),
      });
      const r = await submitClaimAction({ pass, videoUrl: blob.url, issue, deliveredOn });
      if (!r.ok) {
        setStep("upload");
        return setError(r.message);
      }
      setStep("done");
    } catch (err) {
      setStep("upload");
      setError(err instanceof Error && /verify/i.test(err.message) ? "Your session expired. Please start again." : "The upload didn't finish. Please check your connection and try again.");
    }
  };

  const stepState = (s: number): "done" | "now" | "next" => {
    const at = step === "verify" ? 1 : step === "done" ? 4 : 2;
    return s < at ? "done" : s === at ? "now" : "next";
  };

  return (
    <div className="mx-auto max-w-2xl">
      <ol className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3" aria-label="Steps">
        <StepDot n={1} label="Your order" state={stepState(1)} />
        <StepDot n={2} label="Unboxing video" state={stepState(2)} />
        <StepDot n={3} label="Done" state={stepState(3)} />
      </ol>

      <div className="rounded-3xl border border-parchment bg-white p-6 shadow-[var(--shadow-soft)] md:p-8">
        {step === "verify" && (
          <form onSubmit={verify} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-charcoal">Find your order</h2>
              <p className="mt-1 text-sm text-ink-muted">Enter your order number (from your confirmation) and the phone number you ordered with.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dc-order" className="field-label">
                  Order number
                </label>
                <input id="dc-order" required value={order} onChange={(e) => setOrder(e.target.value)} placeholder="TRV-ABC123" autoComplete="off" className="field-input uppercase" />
              </div>
              <div>
                <label htmlFor="dc-phone" className="field-label">
                  Phone number
                </label>
                <input id="dc-phone" required type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" autoComplete="tel" className="field-input" />
              </div>
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn btn-primary btn-caps h-12 w-full">
              {busy ? "Checking…" : "Continue"}
            </button>
          </form>
        )}

        {(step === "upload" || step === "sending") && (
          <form onSubmit={send} className="space-y-5">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-gold-deep uppercase">Order {ref}</p>
              <h2 className="mt-1 text-xl font-bold text-charcoal">Upload your unboxing video</h2>
              {items.length > 0 && <p className="mt-1 text-sm text-ink-muted">{items.join(" · ")}</p>}
            </div>

            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={step === "sending"}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                file ? "border-burgundy bg-blush" : "border-parchment hover:border-gold"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-burgundy" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M15 10l4.5-2.5v9L15 14M4 6h11v12H4z" strokeLinejoin="round" />
              </svg>
              {file ? (
                <>
                  <span className="font-bold break-all text-charcoal">{file.name}</span>
                  <span className="text-xs text-ink-muted">{(file.size / 1024 / 1024).toFixed(1)} MB · tap to change</span>
                </>
              ) : (
                <>
                  <span className="font-bold text-charcoal">Tap to choose your video</span>
                  <span className="text-xs text-ink-muted">From your gallery or camera · up to {MAX_MB} MB</span>
                </>
              )}
            </button>
            <input ref={fileInput} type="file" accept="video/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

            <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
              <div>
                <label htmlFor="dc-date" className="field-label">
                  Delivered on
                </label>
                <input id="dc-date" type="date" max={today()} value={deliveredOn} onChange={(e) => setDeliveredOn(e.target.value)} className="field-input" />
              </div>
              <div>
                <label htmlFor="dc-issue" className="field-label">
                  What is damaged? <span className="font-normal text-ink-muted">(optional)</span>
                </label>
                <input id="dc-issue" value={issue} onChange={(e) => setIssue(e.target.value)} maxLength={500} placeholder="e.g. clasp broken on the necklace" className="field-input" />
              </div>
            </div>

            {step === "sending" && (
              <div aria-live="polite">
                <div className="h-2.5 overflow-hidden rounded-full bg-parchment">
                  <div className="h-full rounded-full bg-gradient-to-r from-gold to-burgundy transition-[width]" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1.5 text-center text-sm font-semibold text-charcoal">{progress >= 100 ? "Saving your claim… almost done" : `Uploading… ${progress}%`} — please keep this page open</p>
              </div>
            )}
            {error && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                {error}
              </p>
            )}
            <button type="submit" disabled={step === "sending"} className="btn btn-primary btn-caps h-12 w-full">
              {step === "sending" ? "Uploading…" : "Submit claim"}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="py-4 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-700">✓</span>
            <h2 className="mt-4 text-2xl font-bold text-charcoal">Claim received</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-muted">
              Thank you. Our team will review your unboxing video for order <strong className="text-charcoal">{ref}</strong> and contact you. If the piece arrived
              damaged, we will refund it to your original payment method.
            </p>
            <Link href="/" className="btn btn-outline btn-caps mt-6">
              Back to home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
