import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { del } from "@vercel/blob";
import { addNote, addTags } from "./crm";
import { ghlApi } from "./ghl-api";

// Damaged-parcel claims. The customer proves the order (order number + phone),
// uploads the unboxing video straight to Vercel Blob, and the claim is recorded
// as a note + tag on their GoHighLevel contact — the admin "Damage claims" page
// reads it back from there.

export const CLAIM_TAG = "damage-claim";
export const CLAIM_PREFIX = "📹 Damage claim";
export const CLAIM_UPDATE_PREFIX = "📹 Claim update";
export const MAX_VIDEO_BYTES = 300 * 1024 * 1024;

const secret = () => process.env.ADMIN_SESSION_SECRET?.trim() || process.env.REVALIDATE_SECRET?.trim() || "";
const mac = (s: string) => createHmac("sha256", `claim:${secret()}`).update(s).digest("base64url");

/** A short-lived pass proving this browser verified the order (used for the upload and the submit). */
export function claimPass(ref: string, contactId: string) {
  const body = Buffer.from(JSON.stringify({ r: ref, c: contactId, x: Date.now() + 2 * 3600e3 })).toString("base64url");
  return `${body}.${mac(body)}`;
}

export function readClaimPass(pass: unknown): { ref: string; contactId: string } | null {
  if (typeof pass !== "string" || pass.length > 600 || !secret()) return null;
  const [body, sig] = pass.split(".");
  if (!body || !sig) return null;
  const want = mac(body);
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as { r: string; c: string; x: number };
    return p.x > Date.now() ? { ref: p.r, contactId: p.c } : null;
  } catch {
    return null;
  }
}

/** Only videos uploaded to our own Vercel Blob store are accepted from the browser. */
export const isOurVideo = (url: string) => /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/claims\//i.test(url);

/**
 * Moves the uploaded video into the GoHighLevel media library (the browser can't
 * send large files through the site, so it lands in Vercel Blob first) and then
 * deletes the temporary Blob copy. Returns the GHL link — or the Blob link if
 * the move fails, so a claim is never lost.
 */
export async function moveVideoToGhl(blobUrl: string, ref: string): Promise<{ url: string; inGhl: boolean }> {
  try {
    const res = await fetch(blobUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`download ${res.status}`);
    const type = res.headers.get("content-type") || "video/mp4";
    const ext = blobUrl.split("?")[0].split(".").pop()?.slice(0, 5) || "mp4";
    const name = `damage-claim-${ref}-${new Date().toISOString().slice(0, 10)}.${ext}`;
    const form = new FormData();
    form.set("file", new Blob([await res.arrayBuffer()], { type }), name);
    form.set("name", name);
    const up = await ghlApi<{ url?: string }>("POST", "/medias/upload-file", { form });
    if (!up.url) throw new Error("no url");
    await del(blobUrl).catch(() => {}); // temporary copy no longer needed
    return { url: up.url, inGhl: true };
  } catch (err) {
    console.warn(`[claims] ${ref}: video kept in Blob (${err instanceof Error ? err.message : "error"})`);
    return { url: blobUrl, inGhl: false };
  }
}

export async function recordClaim(c: { ref: string; contactId: string; videoUrl: string; issue: string; deliveredOn: string }) {
  const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date());
  await addNote(
    c.contactId,
    [
      `${CLAIM_PREFIX} ${c.ref}`,
      `Submitted: ${when}`,
      `Delivered on: ${c.deliveredOn || "not given"}`,
      `Issue: ${c.issue || "—"}`,
      `Video: ${c.videoUrl}`,
      "Status: New — review the video, then mark the claim from the admin panel.",
    ].join("\n"),
  );
  await addTags(c.contactId, [CLAIM_TAG]);
}
