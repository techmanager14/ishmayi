"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, requestCodeAction, verifyCodeAction, type AccountState } from "@/app/(site)/account/actions";

type Mode = "login" | "signup" | "reset";

function Btn({ children, pending: pendingText }: { children: string; pending: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary btn-caps h-12 w-full">
      {pending ? pendingText : children}
    </button>
  );
}

function Alert({ state }: { state: AccountState | undefined }) {
  if (!state?.message) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm font-semibold ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
      {state.message}
    </p>
  );
}

/** A problem the customer can fix by switching to another form. */
function Suggest({ message, action, onClick }: { message: string; action: string; onClick: () => void }) {
  return (
    <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
      {message}{" "}
      <button type="button" onClick={onClick} className="font-bold underline">
        {action}
      </button>
    </p>
  );
}

function PasswordField({ id, name, label, autoComplete, hint }: { id: string; name: string; label: string; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="relative">
        <input id={id} name={name} type={show ? "text" : "password"} autoComplete={autoComplete} required className="field-input pr-16" />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-0 px-4 text-xs font-bold text-burgundy uppercase"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

const COPY: Record<Mode, { title: string; sub: string; button: string; busy: string }> = {
  login: { title: "Welcome back", sub: "Sign in with your email and password.", button: "Sign in", busy: "Signing in…" },
  signup: {
    title: "Create your account",
    sub: "Choose a password. We'll email you a code once to confirm your email — after that, just sign in with your password.",
    button: "Create account",
    busy: "Sending code…",
  },
  reset: {
    title: "Reset your password",
    sub: "Enter your email and a new password. We'll email you a code to confirm it's you. Also use this if you've ordered before but never set a password.",
    button: "Email me a code",
    busy: "Sending code…",
  },
};

/** Sign in with a password; creating an account or resetting the password confirms the email with a one-time code. */
export function SignIn({ pending, next }: { pending: string | null; next?: string }) {
  const [loggedIn, login] = useActionState(loginAction, undefined);
  const [sent, send] = useActionState(requestCodeAction, pending ? { ok: true, message: `Enter the code we emailed to ${pending}.`, email: pending } : undefined);
  const [checked, check] = useActionState(verifyCodeAction, undefined);
  const [email, setEmail] = useState(pending ?? "");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  // The code step closes when the customer goes back; a new code reopens it.
  const [dismissed, setDismissed] = useState<AccountState | undefined>();
  const [loginSeen, setLoginSeen] = useState<AccountState | undefined>();
  const codeStep = sent?.ok && sent.email && sent !== dismissed;
  const copy = COPY[mode];
  // Only show a message from the form currently on screen.
  const loginMsg = loggedIn !== loginSeen ? loggedIn : undefined;
  const sentMsg = sent !== dismissed ? sent : undefined;
  const go = (m: Mode) => {
    setMode(m);
    setDismissed(sent);
    setLoginSeen(loggedIn);
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl overflow-hidden rounded-3xl border border-parchment bg-white shadow-[var(--shadow-soft)] md:grid-cols-[1fr_1.1fr]">
      <aside className="bg-burgundy-glow hidden flex-col justify-between p-8 text-white md:flex">
        <div>
          <p className="text-[0.7rem] font-bold tracking-[0.18em] text-gold-light uppercase">Your Ishmayi account</p>
          <p className="mt-3 font-display text-2xl leading-snug font-bold">Everything about your orders, in one place.</p>
          <ul className="mt-6 space-y-3 text-sm text-white/85">
            {["Live status of every order", "Shipping updates & tracking", "Invoices & payments"].map((t) => (
              <li key={t} className="flex gap-2.5">
                <span className="text-gold-light" aria-hidden="true">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-8 text-xs text-white/60">Already ordered with us? Create an account with the same email to see those orders too.</p>
      </aside>
      <div className="p-6 md:p-8">
        {codeStep ? (
          <form action={check} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-charcoal">Check your email</h2>
              <p className="mt-1 text-sm text-ink-muted">{sent.message} It&apos;s valid for 10 minutes — check spam if you don&apos;t see it.</p>
            </div>
            <input type="hidden" name="name" value={name} />
            {next && <input type="hidden" name="next" value={next} />}
            <div>
              <label htmlFor="acc-code" className="field-label">
                6-digit code
              </label>
              <input
                id="acc-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="\d{6}"
                required
                autoFocus
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  e.target.value = v;
                  if (v.length === 6) e.target.form?.requestSubmit();
                }}
                className="field-input text-center text-2xl font-bold tracking-[0.5em]"
              />
            </div>
            <Alert state={checked} />
            <Btn pending="Checking…">Confirm</Btn>
            <button type="button" onClick={() => setDismissed(sent)} className="w-full text-sm font-semibold text-burgundy hover:underline">
              Go back / send a new code
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {mode !== "reset" && (
              <div role="tablist" aria-label="Account" className="grid grid-cols-2 rounded-full bg-ivory-deep p-1 text-sm font-bold">
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => go(m)}
                    className={`rounded-full py-2.5 transition-colors ${mode === m ? "bg-white text-burgundy shadow-sm" : "text-ink-muted hover:text-charcoal"}`}
                  >
                    {m === "login" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-charcoal">{copy.title}</h2>
              <p className="mt-1 text-sm text-ink-muted">{copy.sub}</p>
            </div>

            {/* key: a fresh form (and empty password fields) per mode */}
            <form key={mode} action={mode === "login" ? login : send} className="space-y-4">
              <input type="hidden" name="mode" value={mode} />
              {next && <input type="hidden" name="next" value={next} />}
              {mode === "signup" && (
                <div>
                  <label htmlFor="acc-name" className="field-label">
                    Your name
                  </label>
                  <input id="acc-name" name="name" autoComplete="name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className="field-input" />
                </div>
              )}
              <div>
                <label htmlFor="acc-email" className="field-label">
                  Email
                </label>
                <input id="acc-email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" placeholder="you@example.com" />
              </div>
              {mode === "login" ? (
                <div>
                  <PasswordField id="acc-pass" name="password" label="Password" autoComplete="current-password" />
                  <button type="button" onClick={() => go("reset")} className="mt-2 text-sm font-semibold text-burgundy hover:underline">
                    Forgot password?
                  </button>
                </div>
              ) : (
                <>
                  <PasswordField id="acc-new" name="password" label={mode === "reset" ? "New password" : "Password"} autoComplete="new-password" hint="At least 8 characters." />
                  <PasswordField id="acc-confirm" name="confirm" label="Confirm password" autoComplete="new-password" />
                </>
              )}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

              {mode === "login" ? (
                loginMsg?.noAccount ? (
                  <Suggest message={loginMsg.message} action="Create an account" onClick={() => go("signup")} />
                ) : loginMsg?.noPassword ? (
                  <Suggest message={loginMsg.message} action="Set a password" onClick={() => go("reset")} />
                ) : (
                  <Alert state={loginMsg} />
                )
              ) : sentMsg?.ok ? null : sentMsg?.noAccount ? (
                <Suggest message={sentMsg.message} action="Create an account" onClick={() => go("signup")} />
              ) : sentMsg?.hasAccount ? (
                <Suggest message={sentMsg.message} action="Sign in" onClick={() => go("login")} />
              ) : (
                <Alert state={sentMsg} />
              )}

              <Btn pending={copy.busy}>{copy.button}</Btn>
            </form>

            {mode === "reset" && (
              <button type="button" onClick={() => go("login")} className="w-full text-sm font-semibold text-burgundy hover:underline">
                ← Back to sign in
              </button>
            )}
          </div>
        )}
        <p className="mt-6 border-t border-parchment pt-4 text-center text-sm text-ink-muted">
          Just checking one order?{" "}
          <Link href="/track" className="font-semibold text-burgundy hover:underline">
            Track it with your order number
          </Link>
        </p>
      </div>
    </div>
  );
}
