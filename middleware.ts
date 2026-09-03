import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifyToken, passwordSet } from "@/lib/life/auth";

// Guards /life and its API routes. Runs on every matching request before the
// route does, so an unauthenticated caller never reaches the Notion layer.

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // The login page and the endpoint that logs you in must stay reachable.
  if (pathname === "/life/login" || pathname === "/api/life/auth") {
    return NextResponse.next();
  }

  // No password configured: the app stays open, but it runs local-only —
  // the API routes independently refuse to serve private data (see auth.ts).
  if (!passwordSet()) return NextResponse.next();

  if (await verifyToken(req.cookies.get(COOKIE)?.value)) return NextResponse.next();

  // API calls get a clean 401 rather than an HTML redirect the client can't read.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/life/login";
  url.search = pathname === "/life" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/life", "/life/:path*", "/api/life/:path*"],
};
