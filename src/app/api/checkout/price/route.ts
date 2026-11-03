import { getCms } from "@/lib/cms";
import { NextResponse, type NextRequest } from "next/server";
import { checkoutAllowed } from "@/lib/catalog";
import { currentCustomer } from "@/lib/customer/session";
import { quoteOrder, razorpayConfigured } from "@/lib/payments";
import { site } from "@/lib/site";
import { clientIp, createRateLimiter, sameOrigin } from "@/lib/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limited = createRateLimiter(60, 10 * 60 * 1000);

/** Re-price the bag from the store (current prices, stock) before checkout. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 });
  if (limited(clientIp(req))) return NextResponse.json({ ok: false, code: "rate_limited", message: "Too many requests." }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { lines?: unknown; coupon?: unknown } | null;
  const me = await currentCustomer();
  const priced = await quoteOrder(body?.lines, body?.coupon, me?.contactId);
  return NextResponse.json(
    { ...priced, payments: (await checkoutAllowed()) && razorpayConfigured(), cod: (await checkoutAllowed()) && site.codEnabled && (await getCms()).store.codEnabled },
    { status: priced.ok ? 200 : 409, headers: { "Cache-Control": "no-store" } },
  );
}
