import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { MAX_VIDEO_BYTES, readClaimPass } from "@/lib/claims";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Issues a one-off token so the customer's browser can upload the unboxing video
 * straight to Vercel Blob (videos are too large to pass through the site). Only
 * someone who has just verified an order (claim pass) gets a token.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const pass = readClaimPass(clientPayload);
        if (!pass || !pathname.startsWith(`claims/${pass.ref}-`)) throw new Error("Please verify your order again.");
        return {
          allowedContentTypes: ["video/*"],
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 60 * 60 * 1000,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload not allowed" }, { status: 400 });
  }
}
