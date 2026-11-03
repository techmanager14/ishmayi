"use client";

import { useState } from "react";
import { loginAction } from "../actions";
import { ActionForm, Submit } from "@/components/admin/forms";
import { btn, input, label } from "@/components/admin/ui";

export function LoginForm() {
  // Controlled so the email stays filled in after a failed attempt (forms reset after each submit).
  const [email, setEmail] = useState("");
  return (
    <ActionForm action={loginAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className={label}>
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
      </div>
      <div>
        <label htmlFor="password" className={label}>
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      <Submit className={`${btn.primary} w-full py-3`} pendingText="Signing in…">
        Sign in
      </Submit>
    </ActionForm>
  );
}
