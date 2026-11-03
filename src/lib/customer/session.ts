import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Customer accounts without a database: the customer is a GoHighLevel contact.
// Customers sign in with email + password; a 6-digit emailed code proves the
// email once, when the account is created or the password is reset. The
// pending code and the session live in signed, httpOnly cookies.

const OTP_COOKIE = "trv_code";
const SESSION_COOKIE = "trv_account";
const OTP_TTL = 10 * 60; // seconds
const SESSION_TTL = 30 * 24 * 60 * 60;

const env = (k: string) => process.env[k]?.trim() ?? "";
const secret = () => env("CUSTOMER_SESSION_SECRET") || env("ADMIN_SESSION_SECRET");
export const accountsEnabled = () => secret().length >= 32;

const mac = (data: string) => createHmac("sha256", `customer:${secret()}`).update(data).digest("base64url");
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

function seal(payload: object) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${mac(body)}`;
}
function unseal<T>(raw: string | undefined): T | null {
  const [body, sig] = (raw ?? "").split(".");
  if (!body || !sig || !same(sig, mac(body))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as T & { x: number };
    return data.x > Date.now() / 1000 ? data : null;
  } catch {
    return null;
  }
}

const cookieOpts = (maxAge: number) => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge });

/**
 * Creates a code for this email and remembers it (hashed) in a cookie, along
 * with the new password's hash to save once the code is confirmed.
 */
export async function issueCode(email: string, contactId: string, passwordHash: string) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const x = Math.floor(Date.now() / 1000) + OTP_TTL;
  (await cookies()).set(OTP_COOKIE, seal({ e: email, c: contactId, p: passwordHash, h: mac(`${email}|${code}|${x}`), x }), cookieOpts(OTP_TTL));
  return code;
}

/** The email a code was sent to (for the "enter your code" step). */
export async function pendingEmail() {
  return unseal<{ e: string }>((await cookies()).get(OTP_COOKIE)?.value)?.e ?? null;
}

/** Checks the code. On success returns who it was for and the password hash to save. */
export async function verifyCode(code: string): Promise<{ contactId: string; email: string; passwordHash: string } | null> {
  const jar = await cookies();
  const pending = unseal<{ e: string; c: string; p: string; h: string; x: number }>(jar.get(OTP_COOKIE)?.value);
  if (!pending || !/^\d{6}$/.test(code) || !same(pending.h, mac(`${pending.e}|${code}|${pending.x}`))) return null;
  jar.delete(OTP_COOKIE);
  return { contactId: pending.c, email: pending.e, passwordHash: pending.p };
}

/** Starts a 30-day session. */
export async function startCustomerSession(contactId: string, email: string, name: string) {
  (await cookies()).set(SESSION_COOKIE, seal({ c: contactId, e: email, n: name.slice(0, 80), x: Math.floor(Date.now() / 1000) + SESSION_TTL }), cookieOpts(SESSION_TTL));
}

export interface Customer {
  contactId: string;
  email: string;
  name: string;
}

export async function currentCustomer(): Promise<Customer | null> {
  if (!accountsEnabled()) return null;
  const s = unseal<{ c: string; e: string; n: string }>((await cookies()).get(SESSION_COOKIE)?.value);
  return s ? { contactId: s.c, email: s.e, name: s.n } : null;
}

export async function endCustomerSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(OTP_COOKIE);
}
