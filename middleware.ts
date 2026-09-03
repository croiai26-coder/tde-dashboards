import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifyToken, passwordSet } from "@/lib/auth";

// Guards the whole site. Runs before any route does, so an unauthenticated
// caller never reaches the Notion layer.
//
// With no password configured the site stays open, but every page falls back to
// its offline/seed state and the data layers independently refuse to fetch
// anything real — so leaving this unset can't expose data, it only makes the
// site less useful.

/** Reachable while signed out: the login page and the endpoint that logs you in. */
const OPEN = ["/login", "/api/auth"];

/** Matches a whole path segment, so /login-history is NOT treated as /login.
 *  A bare `startsWith` would silently exempt any future route that merely
 *  begins with one of these names. */
const isOpen = (pathname: string): boolean =>
  OPEN.some((o) => pathname === o || pathname.startsWith(o + "/"));

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isOpen(pathname)) return NextResponse.next();
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
  // Everything but Next's own build output and the favicon. The segment-level
  // exclusions live in `isOpen` above, where they can be written correctly.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
