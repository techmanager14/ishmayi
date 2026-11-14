"use client";

import { ChevronDown } from "lucide-react";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { saveCmsAction } from "@/app/admin/actions";
import { btn, input, label as labelCls } from "./ui";

function SaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btn.primary}>
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> Saving…
        </>
      ) : dirty ? (
        "Save & publish"
      ) : (
        "Saved"
      )}
    </button>
  );
}

/**
 * Wraps an editor for part of the website content. `patch` is what gets saved
 * (e.g. { banners: [...] }); the sticky bar shows unsaved changes and results.
 */
export function CmsForm({ patch, children }: { patch: Record<string, unknown>; children: ReactNode }) {
  const [state, action] = useActionState(saveCmsAction, undefined);
  const json = JSON.stringify(patch);
  const saved = useRef(json);
  const [dirty, setDirty] = useState(false);
  useEffect(() => setDirty(json !== saved.current), [json]);
  useEffect(() => {
    if (state?.ok) {
      saved.current = json;
      setDirty(false);
    }
    // only when a save completes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <form action={action} className="space-y-4 pb-4">
      <input type="hidden" name="patch" value={json} />
      {children}
      <div className="sticky bottom-0 z-20 -mx-3 flex flex-wrap items-center gap-3 border-t border-parchment bg-panel/95 px-3 py-2.5 backdrop-blur md:-mx-6 md:px-6">
        <SaveButton dirty={dirty} />
        {dirty && <span className="text-sm font-semibold text-amber-800">You have unsaved changes</span>}
        {state?.message && !dirty && (
          <span role={state.ok ? "status" : "alert"} className={`text-sm font-semibold ${state.ok ? "text-emerald-800" : "text-rose-800"}`}>
            {state.ok ? "✓ " : "⚠ "}
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}

/**
 * One editor section. Closed by default so long pages read as a short list of headings;
 * click a heading to open it. Pass open for sections people change most.
 */
export function Panel({ title, sub, children, actions, open = false }: { title: string; sub?: string; children: ReactNode; actions?: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group/panel rounded-2xl border border-parchment bg-panel shadow-[var(--shadow-soft)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 hover:bg-ivory-deep/60 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-[0.95rem] font-bold">{title}</span>
          {sub && <span className="mt-0.5 block text-xs text-ink-muted">{sub}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {/* Buttons in the heading work without opening or closing the section. */}
          {actions && <span onClick={(e) => e.preventDefault()}>{actions}</span>}
          <ChevronDown className="h-5 w-5 text-ink-muted transition-transform group-open/panel:rotate-180" aria-hidden="true" />
        </span>
      </summary>
      <div className="space-y-3 border-t border-parchment px-4 pt-3 pb-4">{children}</div>
    </details>
  );
}

export function Text({
  id,
  label,
  value,
  onChange,
  area = false,
  hint,
  placeholder,
  rows = 3,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  hint?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {area ? (
        <textarea id={id} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={input} />
      ) : (
        <input id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={input} />
      )}
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-parchment transition peer-checked:bg-[#5e0f2c] peer-focus-visible:ring-2 peer-focus-visible:ring-[#5e0f2c]/50" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-charcoal">{label}</span>
        {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
      </span>
    </label>
  );
}

/** Up / down / delete buttons for an item in an editable list. */
export function ListControls({ index, length, onMove, onRemove, removeLabel = "Remove" }: { index: number; length: number; onMove: (to: number) => void; onRemove: () => void; removeLabel?: string }) {
  return (
    <div className="flex gap-1">
      <button type="button" disabled={index === 0} onClick={() => onMove(index - 1)} className={`${btn.ghost} disabled:opacity-30`} aria-label="Move up">
        ↑
      </button>
      <button type="button" disabled={index === length - 1} onClick={() => onMove(index + 1)} className={`${btn.ghost} disabled:opacity-30`} aria-label="Move down">
        ↓
      </button>
      <button
        type="button"
        onClick={() => {
          if (window.confirm("Remove this item?")) onRemove();
        }}
        className={`${btn.ghost} text-rose-800 hover:text-rose-800`}
      >
        {removeLabel}
      </button>
    </div>
  );
}

export const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
};

export const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
