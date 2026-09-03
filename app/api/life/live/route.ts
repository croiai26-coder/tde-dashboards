import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEvents } from "@/lib/life/calendar";
import { getSessions, getProjects } from "@/lib/life/notion-life";
import { COOKIE, verifyToken, privateDataAllowed, passwordSet } from "@/lib/life/auth";
import type { LiveData } from "@/lib/life/types";

// Everything the server contributes to /life, in one round trip: the calendar,
// the Claude session board and the live projects. Each source is independent —
// one failing never takes the others down, it just adds a line to `errors`.
//
// The gate is re-checked here rather than trusted from the middleware: this
// route is the only thing that can leak private data, so it does its own
// checking. With no LIFE_PASSWORD set it serves nothing at all, which is what
// stops a public deployment quietly handing your calendar to strangers.

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EMPTY: LiveData = { events: [], sessions: [], projects: [], errors: [] };

export async function GET() {
  const authed = await verifyToken(cookies().get(COOKIE)?.value);
  if (!privateDataAllowed(authed)) {
    return NextResponse.json(
      {
        ...EMPTY,
        locked: true,
        errors: passwordSet()
          ? ["Session expired — reload to sign in again."]
          : ["Calendar and business panels are off until LIFE_PASSWORD is set. This deployment is public, so the server won't serve private data unprotected."],
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  const [cal, sess, proj] = await Promise.all([getEvents(3), getSessions(), getProjects()]);

  const data: LiveData = {
    events: cal.events,
    sessions: sess.sessions,
    projects: proj.projects,
    errors: [...cal.errors, sess.error, proj.error].filter(Boolean) as string[],
  };

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
