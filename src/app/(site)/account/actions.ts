"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { contactForEmail, sendCodeEmail, trackOrder, type CustomerOrder } from "@/lib/customer/data";
import { checkPassword, hashPassword, PASSWORD_MIN, passwordHashFor, savePasswordHash } from "@/lib/customer/password";
import { accountsEnabled, endCustomerSession, issueCode, startCustomerSession, verifyCode } from "@/lib/customer/session";
import { createRateLimiter } from "@/lib/webhook";

export interface AccountState {
  ok: boolean;
  message: string;
  email?: string;
  /** The email has no account yet. */
  noAccount?: boolean;
  /** The email belongs to a customer who hasn't set a password yet. */
  noPassword?: boolean;
  /** Create account was tried for an email that already has one. */
  hasAccount?: boolean;
}

const codeByIp = createRateLimiter(6, 15 * 60 * 1000);
const codeByEmail = createRateLimiter(4, 15 * 60 * 1000);
const verifyByIp = createRateLimiter(12, 15 * 60 * 1000);
const loginByIp = createRateLimiter(20, 15 * 60 * 1000);
const loginByEmail = createRateLimiter(8, 15 * 60 * 1000);
const trackByIp = createRateLimiter(20, 15 * 60 * 1000);

const ip = async () => {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
};
const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);

/** Where to go after signing in: back to checkout, or the account page. */
const nextPage = (f: FormData) => (f.get("next") === "/checkout" ? "/checkout" : "/account");

const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const errText = (err: unknown) => (err instanceof Error ? err.message.slice(0, 160) : "error");

/** Email + password sign-in. */
export async function loginAction(_: AccountState | undefined, form: FormData): Promise<AccountState> {
  if (!accountsEnabled()) return { ok: false, message: "Accounts are not available yet. Please contact us about your order." };
  const email = str(form, "email", 254).toLowerCase();
  const password = String(form.get("password") ?? "").slice(0, 200);
  if (!validEmail(email) || !password) return { ok: false, message: "Please enter your email and password.", email };
  if (loginByIp(await ip()) || loginByEmail(email)) return { ok: false, message: "Too many sign-in attempts. Please wait 15 minutes, or reset your password.", email };
  let contact: { id: string; name: string } | null;
  try {
    contact = await contactForEmail(email, "", false);
    const stored = contact ? await passwordHashFor(contact.id) : "";
    if (!contact) return { ok: false, noAccount: true, message: `There's no account for ${email} yet.`, email };
    if (!stored) return { ok: false, noPassword: true, message: "You haven't set a password yet. Set one with “Forgot password?” — we'll email you a code once.", email };
    if (!(await checkPassword(password, stored))) return { ok: false, message: "Incorrect email or password.", email };
  } catch (err) {
    console.warn(`[account] sign-in failed: ${errText(err)}`);
    return { ok: false, message: "We couldn't sign you in just now. Please try again in a minute.", email };
  }
  await startCustomerSession(contact.id, email, contact.name);
  redirect(nextPage(form));
}

/**
 * Create account ("signup") or reset password ("reset"): checks the details,
 * then emails a one-time code to prove the email. The password is saved once
 * the code is confirmed.
 */
export async function requestCodeAction(_: AccountState | undefined, form: FormData): Promise<AccountState> {
  if (!accountsEnabled()) return { ok: false, message: "Accounts are not available yet. Please contact us about your order." };
  const email = str(form, "email", 254).toLowerCase();
  const name = str(form, "name", 80);
  const password = String(form.get("password") ?? "").slice(0, 200);
  const signup = form.get("mode") === "signup";
  if (signup && name.length < 2) return { ok: false, message: "Please enter your name." };
  if (!validEmail(email)) return { ok: false, message: "Please enter a valid email address." };
  if (password.length < PASSWORD_MIN) return { ok: false, message: `Your password needs at least ${PASSWORD_MIN} characters.` };
  if (password !== String(form.get("confirm") ?? "")) return { ok: false, message: "The two passwords don't match." };
  if (str(form, "website", 100)) return { ok: true, message: "Code sent.", email }; // honeypot
  if (codeByIp(await ip()) || codeByEmail(email)) return { ok: false, message: "Too many codes requested. Please wait 15 minutes and try again." };
  try {
    const contact = signup ? await contactForEmail(email, name) : await contactForEmail(email, name, false);
    if (!contact) return { ok: false, noAccount: true, message: `There's no account for ${email} yet.`, email };
    if (signup && (await passwordHashFor(contact.id))) return { ok: false, hasAccount: true, message: `${email} already has an account.`, email };
    const code = await issueCode(email, contact.id, await hashPassword(password));
    await sendCodeEmail(contact.id, email, code);
  } catch (err) {
    console.warn(`[account] code not sent: ${errText(err)}`);
    return { ok: false, message: "We couldn't send the code just now. Please try again in a minute." };
  }
  return { ok: true, message: `We've emailed a 6-digit code to ${email}.`, email };
}

export async function verifyCodeAction(_: AccountState | undefined, form: FormData): Promise<AccountState> {
  if (verifyByIp(await ip())) return { ok: false, message: "Too many attempts. Please wait 15 minutes and request a new code." };
  const code = str(form, "code", 10).replace(/\D/g, "");
  const verified = await verifyCode(code);
  if (!verified) return { ok: false, message: "That code is incorrect or has expired. Check it, or request a new one." };
  try {
    if (verified.passwordHash) await savePasswordHash(verified.contactId, verified.passwordHash);
  } catch (err) {
    console.warn(`[account] password not saved: ${errText(err)}`);
    return { ok: false, message: "Your email is confirmed, but we couldn't save your password. Please try again in a minute." };
  }
  await startCustomerSession(verified.contactId, verified.email, str(form, "name", 80));
  redirect(nextPage(form));
}

export async function signOutAction() {
  await endCustomerSession();
  redirect("/account");
}

export async function trackAction(_: { order?: CustomerOrder; message?: string } | undefined, form: FormData): Promise<{ order?: CustomerOrder; message?: string }> {
  if (trackByIp(await ip())) return { message: "Too many lookups. Please wait a few minutes and try again." };
  const reference = str(form, "order", 20);
  const phone = str(form, "phone", 20);
  try {
    const order = await trackOrder(reference, phone);
    if (!order) return { message: "We couldn't find an order with that number and phone. Check both — the order number looks like TRV-ABC123." };
    return { order };
  } catch {
    return { message: "We couldn't look that up just now. Please try again in a minute." };
  }
}
