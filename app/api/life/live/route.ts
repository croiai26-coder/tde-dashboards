import { NextResponse } from "next/server";
import { getEvents } from "@/lib/life/calendar";
import { getSessions, getProjects } from "@/lib/life/notion-life";
import type { LiveData } from "@/lib/life/types";

// Everything the server contributes to /life, in one round trip: the calendar,
// the Claude session board and the live projects. Each source is independent —
// one failing never takes the others down, it just adds a line to `errors`.

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const [cal, sess, proj] = await Promise.all([
    getEvents(3),
    getSessions(),
    getProjects(),
  ]);

  const data: LiveData = {
    events: cal.events,
    sessions: sess.sessions,
    projects: proj.projects,
    errors: [...cal.errors, sess.error, proj.error].filter(Boolean) as string[],
  };

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
