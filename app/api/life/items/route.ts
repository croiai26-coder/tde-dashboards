import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pullItems, pushItems, syncConfigured } from "@/lib/life/notion-life";
import { COOKIE, verifyToken, privateDataAllowed, passwordSet } from "@/lib/life/auth";
import type { Item } from "@/lib/life/types";

// The hybrid sync endpoint. The browser stays the fast path — it writes to
// localStorage first and only then talks to this route — so a slow, locked or
// absent Notion never blocks capture.
//
// Like /live, this re-checks the gate itself. Sync is refused outright unless a
// password is configured AND this request is authenticated: on a public URL,
// an open sync endpoint would hand your whole inbox to anyone who found it.

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function gate() {
  const authed = await verifyToken(cookies().get(COOKIE)?.value);
  if (privateDataAllowed(authed)) return null;
  return NextResponse.json({
    configured: false,
    locked: true,
    items: [],
    written: [],
    error: passwordSet()
      ? "Session expired — reload to sign in again."
      : "Notion sync is off until LIFE_PASSWORD is set. Your items are saved in this browser.",
  });
}

export async function GET() {
  const blocked = await gate();
  if (blocked) return blocked;

  if (!syncConfigured()) return NextResponse.json({ configured: false, items: [] });
  const { items, error } = await pullItems();
  return NextResponse.json({ configured: true, items, error: error ?? null });
}

export async function POST(req: Request) {
  const blocked = await gate();
  if (blocked) return blocked;

  if (!syncConfigured()) {
    return NextResponse.json({ configured: false, written: [], error: "Notion sync isn't configured." });
  }
  let items: Item[] = [];
  try {
    const body = await req.json();
    items = Array.isArray(body?.items) ? body.items : [];
  } catch {
    return NextResponse.json({ written: [], error: "Malformed request body." }, { status: 400 });
  }
  // A runaway client shouldn't be able to hammer Notion; the queue drains
  // across several passes instead.
  const { written, error } = await pushItems(items.slice(0, 40));
  return NextResponse.json({ configured: true, written, error: error ?? null });
}
