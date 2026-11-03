"use server";

import { headers } from "next/headers";
import { claimPass, isOurVideo, moveVideoToGhl, readClaimPass, recordClaim } from "@/lib/claims";
import { findOrder } from "@/lib/customer/data";
import { createRateLimiter } from "@/lib/webhook";

const checkByIp = createRateLimiter(15, 15 * 60 * 1000);
const submitByIp = createRateLimiter(6, 60 * 60 * 1000);
const ip = async () => {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
};

export type CheckResult = { ok: true; pass: string; ref: string; items: string[] } | { ok: false; message: string };

/** Step 1: the order number + phone must match an order. */
export async function checkOrderAction(order: string, phone: string): Promise<CheckResult> {
  if (checkByIp(await ip())) return { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };
  try {
    const found = await findOrder(String(order).slice(0, 20), String(phone).slice(0, 20));
    if (!found) return { ok: false, message: "We couldn't find an order with that number and phone. Check both — the order number looks like TRV-ABC123." };
    return { ok: true, pass: claimPass(found.order.reference, found.contactId), ref: found.order.reference, items: found.order.items };
  } catch {
    return { ok: false, message: "We couldn't check your order just now. Please try again in a minute." };
  }
}

/** Step 3: after the video upload, record the claim for the team. */
export async function submitClaimAction(input: { pass: string; videoUrl: string; issue: string; deliveredOn: string }): Promise<{ ok: boolean; message: string }> {
  if (submitByIp(await ip())) return { ok: false, message: "Too many claims from this connection. Please contact us." };
  const pass = readClaimPass(input.pass);
  if (!pass) return { ok: false, message: "Your session expired. Please start again." };
  if (!isOurVideo(String(input.videoUrl))) return { ok: false, message: "The video upload didn't finish. Please try again." };
  const deliveredOn = /^\d{4}-\d{2}-\d{2}$/.test(input.deliveredOn) ? input.deliveredOn : "";
  try {
    const video = await moveVideoToGhl(input.videoUrl, pass.ref);
    await recordClaim({ ref: pass.ref, contactId: pass.contactId, videoUrl: video.url, issue: String(input.issue).trim().slice(0, 1000), deliveredOn });
    return { ok: true, message: "received" };
  } catch {
    return { ok: false, message: "We couldn't save your claim just now. Please try again in a minute — your video is already uploaded." };
  }
}
