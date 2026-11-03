import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminConfigured, currentAdmin } from "@/lib/admin/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <div className="admin-ui relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-[#e3425c]/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -bottom-40 h-[32rem] w-[32rem] rounded-full bg-[#d9b064]/10 blur-3xl" />
      <div className="relative w-full max-w-sm rounded-3xl border border-parchment bg-panel p-7 shadow-2xl">
        <div className="flex flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e3425c] to-[#7a1f33] text-white shadow-lg shadow-[#e3425c]/30">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3 21 9.5 12 21 3 9.5ZM3 9.5h18M8.5 9.5 12 21l3.5-11.5" />
            </svg>
          </span>
          <p className="mt-3 text-xl font-bold tracking-[0.25em] text-charcoal">ISHMAYI</p>
          <h1 className="text-xs font-semibold tracking-[0.3em] text-[#e3425c] uppercase">Admin panel</h1>
        </div>
        {adminConfigured() ? (
          <LoginForm />
        ) : (
          <p role="alert" className="mt-6 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-200">
            The admin login isn&apos;t set up yet. Add <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code> (12+ characters) and{" "}
            <code>ADMIN_SESSION_SECRET</code> (32+ random characters) to the server settings, then redeploy.
          </p>
        )}
      </div>
    </div>
  );
}
