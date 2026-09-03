import { NextResponse } from "next/server";
import { COOKIE, checkPassword, issueToken, cookieOptions, passwordSet } from "@/lib/life/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!passwordSet()) {
    return NextResponse.json({ ok: false, error: "No password is configured." }, { status: 400 });
  }
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  if (!(await checkPassword(password))) {
    // A deliberate pause: serverless rules out a reliable shared rate limit,
    // so make each guess cost something instead.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ ok: false, error: "That's not it." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await issueToken(), cookieOptions);
  return res;
}

/** Sign out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
