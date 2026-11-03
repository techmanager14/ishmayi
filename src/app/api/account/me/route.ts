import { NextResponse } from "next/server";
import { currentCustomer } from "@/lib/customer/session";

/** Who is signed in, for the account menu (pages are cached, so they can't know). */
export async function GET() {
  const customer = await currentCustomer().catch(() => null);
  return NextResponse.json({ name: customer ? customer.name || customer.email : null }, { headers: { "Cache-Control": "private, no-store" } });
}
