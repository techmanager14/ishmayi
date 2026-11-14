import { NextResponse, type NextRequest } from "next/server";
import { perfectMatches } from "@/lib/catalog/pairs";

/** Matches for the products in a customer's bag (?h=id1,id2). */
export async function GET(request: NextRequest) {
  const handles = (request.nextUrl.searchParams.get("h") ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter((h) => /^[\w-]{6,64}$/.test(h))
    .slice(0, 20);
  if (!handles.length) return NextResponse.json({ matches: [] });
  return NextResponse.json({ matches: await perfectMatches(handles) });
}
