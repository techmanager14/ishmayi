import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// One admin account, set in the server environment:
//   ADMIN_EMAIL, ADMIN_PASSWORD (12+ characters), ADMIN_SESSION_SECRET (32+ random characters)
// The session is a signed, httpOnly cookie that expires after 12 hours.

const COOKIE = "trivana_admin";
const MAX_AGE = 12 * 60 * 60;
const env = (k: string) => process.env[k]?.trim() ?? "";
const secret = () => env("ADMIN_SESSION_SECRET");

export const adminConfigured = () => Boolean(env("ADMIN_EMAIL") && env("ADMIN_PASSWORD").length >= 12 && secret().length >= 32);

const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");
const digest = (s: string) => createHash("sha256").update(s).digest();
const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export function checkCredentials(email: string, password: string) {
  if (!adminConfigured()) return false;
  // Both compared in constant time so neither leaks through timing.
  const okEmail = same(email.trim().toLowerCase(), env("ADMIN_EMAIL").toLowerCase());
  const okPassword = same(password, env("ADMIN_PASSWORD"));
  return okEmail && okPassword;
}

export async function startSession(email: string) {
  const payload = Buffer.from(JSON.stringify({ e: email.toLowerCase(), x: Math.floor(Date.now() / 1000) + MAX_AGE })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in admin's email, or null. */
export async function currentAdmin(): Promise<string | null> {
  if (!adminConfigured()) return null;
  const raw = (await cookies()).get(COOKIE)?.value ?? "";
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const { e, x } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { e: string; x: number };
    if (typeof x !== "number" || x < Date.now() / 1000) return null;
    if (e !== env("ADMIN_EMAIL").toLowerCase()) return null; // email changed → old sessions end
    return e;
  } catch {
    return null;
  }
}

/** Use at the top of every admin page and action. */
export async function requireAdmin() {
  const who = await currentAdmin();
  if (!who) redirect("/admin/login");
  return who;
}
