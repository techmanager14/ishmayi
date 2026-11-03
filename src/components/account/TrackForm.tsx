"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { trackAction } from "@/app/(site)/account/actions";
import { OrderCard } from "./OrderCard";

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary btn-caps h-12 w-full">
      {pending ? "Checking…" : "Track order"}
    </button>
  );
}

export function TrackForm() {
  const [state, action] = useActionState(trackAction, undefined);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <form action={action} className="grid gap-4 rounded-3xl border border-parchment bg-white p-6 shadow-[var(--shadow-soft)] sm:grid-cols-2 md:p-8">
        <div>
          <label htmlFor="trk-order" className="field-label">
            Order number
          </label>
          <input id="trk-order" name="order" required placeholder="TRV-ABC123" autoComplete="off" className="field-input uppercase" />
        </div>
        <div>
          <label htmlFor="trk-phone" className="field-label">
            Phone number
          </label>
          <input id="trk-phone" name="phone" type="tel" inputMode="tel" required placeholder="98765 43210" autoComplete="tel" className="field-input" />
        </div>
        <div className="sm:col-span-2">
          <Btn />
        </div>
        {state?.message && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 sm:col-span-2">
            {state.message}
          </p>
        )}
      </form>
      {state?.order && <OrderCard o={state.order} />}
      {!state?.order && (
        <ol className="grid gap-3 text-sm text-ink-muted sm:grid-cols-3">
          {["Find your order number in the confirmation email or WhatsApp", "Enter the phone number you ordered with", "See live status and shipping updates"].map((t, i) => (
            <li key={t} className="flex gap-3 rounded-2xl border border-parchment bg-white/60 p-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-burgundy text-xs font-bold text-white">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      )}
      <p className="text-center text-sm text-ink-muted">
        Parcel arrived damaged?{" "}
        <Link href="/report-damage" className="font-semibold text-burgundy hover:underline">
          Upload your unboxing video
        </Link>
        <span className="mx-2 text-parchment">|</span>
        Want to see all your orders?{" "}
        <Link href="/account" className="font-semibold text-burgundy hover:underline">
          Sign in to your account
        </Link>
      </p>
    </div>
  );
}
