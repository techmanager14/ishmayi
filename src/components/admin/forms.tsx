"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/admin/actions";
import { btn } from "./ui";

export function Submit({ children, className = btn.primary, pendingText = "Saving…" }: { children: ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}

export function Feedback({ state }: { state: ActionState | undefined }) {
  if (!state?.message) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm font-semibold ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
      {state.message}
    </p>
  );
}

/** A form bound to a server action that reports success or failure inline. */
export function ActionForm({
  action,
  children,
  className = "space-y-3",
  encType,
}: {
  action: (s: ActionState | undefined, f: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  encType?: "multipart/form-data";
}) {
  const [state, formAction] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className} encType={encType}>
      {children}
      <Feedback state={state} />
    </form>
  );
}

/** Button that asks for confirmation before submitting its form. */
export function ConfirmButton({ children, message, className = btn.danger }: { children: ReactNode; message: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}

/** Select that submits its form as soon as the value changes. */
export function AutoSubmitSelect({ name, defaultValue, options, label }: { name: string; defaultValue: string; options: { value: string; label: string }[]; label: string }) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      aria-label={label}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded-lg border border-parchment bg-panel px-3 py-2 text-sm font-semibold text-charcoal focus:border-burgundy focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
