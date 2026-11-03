import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { GHL_TAG, resetGhlListing } from "@/lib/catalog/ghl";
import { CMS_TAG } from "@/lib/cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Rebuilding the listing reads ~1 GHL request per product.
export const maxDuration = 60;

/**
 * Refresh the shop immediately after a change in GoHighLevel.
 * In GHL: Automation → Workflow → trigger "Product updated"/"Price updated" (or
 * any trigger) → action "Webhook" → POST https://<site>/api/revalidate?secret=<REVALIDATE_SECRET>
 * Without this, listings still refresh on their own every 15 minutes.
 */
async function handle(req: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET?.trim() ?? "";
  const given = req.nextUrl.searchParams.get("secret") ?? req.headers.get("x-revalidate-secret") ?? "";
  const ok = expected.length >= 16 && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });

  // Expire the cached GHL responses first, so the rebuild below fetches fresh data.
  revalidateTag(GHL_TAG, { expire: 0 });
  revalidateTag(CMS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  // Wait for the fresh listing: on serverless hosting, work left running after the
  // response is cut off, so a background rebuild would never finish.
  await resetGhlListing();
  console.info("[revalidate] GHL catalogue refreshed");
  return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}

export const POST = handle;
export const GET = handle;
