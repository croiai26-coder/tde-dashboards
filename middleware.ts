import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifyToken, passwordSet } from "@/lib/auth";

// Guards the whole site. Runs before any route does, so an unauthenticated
// caller never reaches the Notion layer.
//
// With no password configured the site stays open, but every page falls back to
// its offline/seed state and the data layers independently refuse to fetch
// anything real — so leaving this unset can't expose data, it only makes the
// site less useful.

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (!passwordSet()) return NextResponse.next();
  if (await verifyToken(req.cookies.get(COOKIE)?.value)) return NextResponse.next();

  // API calls get a clean 401 rather than an HTML redirect the client can't read.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next's own assets, the login page, and the endpoint that
  // logs you in — those three have to stay reachable while signed out.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)"],
};
