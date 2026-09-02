import { NextResponse } from "next/server";
import { pullItems, pushItems, syncConfigured } from "@/lib/life/notion-life";
import type { Item } from "@/lib/life/types";

// The hybrid sync endpoint. The browser stays the fast path — it writes to
// localStorage first and only then talks to this route — so a slow or absent
// Notion never blocks capture.

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!syncConfigured()) {
    return NextResponse.json({ configured: false, items: [] });
  }
  const { items, error } = await pullItems();
  return NextResponse.json({ configured: true, items, error: error ?? null });
}

export async function POST(req: Request) {
  if (!syncConfigured()) {
    return NextResponse.json(
      { configured: false, written: [], error: "Notion sync isn't configured." },
      { status: 200 },
    );
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
  const batch = items.slice(0, 40);
  const { written, error } = await pushItems(batch);
  return NextResponse.json({ configured: true, written, error: error ?? null });
}
