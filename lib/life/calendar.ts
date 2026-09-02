import * as ical from "node-ical";
import type { CalEvent } from "./types";

// ─────────────────────────────────────────────────────────────
// Google Calendar, read-only, via each calendar's secret iCal address.
//
// Why ICS rather than the Calendar API: no OAuth dance, no token refresh,
// no write scope to worry about. Settings → (calendar) → "Secret address in
// iCal format". Treat that URL like a password — anyone holding it can read
// the calendar, which is why it only ever lives in a server env var and the
// browser never sees it.
//
// Configure as LIFE_ICS_URLS, comma-separated, each entry "Label|https://…".
// Missing or broken feeds degrade to an empty schedule rather than an error
// page — same defensive contract as lib/notion.ts.
// ─────────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 8000;

interface Feed { label: string; url: string }

function feeds(): Feed[] {
  const raw = process.env.LIFE_ICS_URLS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const bar = chunk.indexOf("|");
      if (bar === -1) return { label: "Calendar", url: chunk };
      return { label: chunk.slice(0, bar).trim(), url: chunk.slice(bar + 1).trim() };
    })
    .filter((f) => /^https?:\/\//.test(f.url));
}

export const calendarConfigured = (): boolean => feeds().length > 0;

async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Instances of one VEVENT that fall inside [from, to], recurrence expanded. */
/* eslint-disable @typescript-eslint/no-explicit-any */
function instances(ev: any, from: Date, to: Date, label: string): CalEvent[] {
  const start = ev.start instanceof Date ? ev.start : new Date(ev.start);
  const end = ev.end instanceof Date ? ev.end : new Date(ev.end ?? start);
  if (isNaN(+start)) return [];
  const durationMs = Math.max(0, +end - +start);
  const allDay = ev.datetype === "date";
  const title = String(ev.summary ?? "(no title)").trim();
  const base = String(ev.uid ?? title);

  const mk = (s: Date, id: string): CalEvent => ({
    id,
    title,
    start: s.toISOString(),
    end: new Date(+s + durationMs).toISOString(),
    allDay,
    calendar: label,
  });

  if (!ev.rrule) {
    return +end > +from && +start < +to ? [mk(start, base)] : [];
  }

  // Recurring: expand, then apply this calendar's exceptions and overrides.
  const out: CalEvent[] = [];
  let dates: Date[] = [];
  try {
    dates = ev.rrule.between(new Date(+from - durationMs), to, true);
  } catch {
    return [];
  }
  const excluded: Date[] = Object.values(ev.exdate ?? {}) as Date[];
  const overrides: Record<string, any> = ev.recurrences ?? {};

  for (const d of dates) {
    if (excluded.some((x) => sameDay(new Date(x), d))) continue;

    // A single moved/edited occurrence replaces the generated one.
    const key = Object.keys(overrides).find((k) => sameDay(new Date(k), d));
    if (key) {
      const o = overrides[key];
      const os = o.start instanceof Date ? o.start : new Date(o.start);
      const oe = o.end instanceof Date ? o.end : new Date(o.end ?? os);
      if (+oe > +from && +os < +to) {
        out.push({
          id: `${base}-${+os}`,
          title: String(o.summary ?? title).trim(),
          start: os.toISOString(),
          end: oe.toISOString(),
          allDay: o.datetype === "date",
          calendar: label,
        });
      }
      continue;
    }

    if (+d + durationMs > +from && +d < +to) out.push(mk(d, `${base}-${+d}`));
  }
  return out;
}

/** Events between now and `days` ahead, across every configured feed.
 *  Never throws: a feed that fails contributes an error string instead. */
export async function getEvents(days = 3): Promise<{ events: CalEvent[]; errors: string[] }> {
  const list = feeds();
  if (!list.length) return { events: [], errors: [] };

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(+from + days * 86_400_000);

  const errors: string[] = [];
  const events: CalEvent[] = [];

  await Promise.all(
    list.map(async (feed) => {
      try {
        const text = await fetchText(feed.url);
        const parsed = ical.sync.parseICS(text);
        for (const key of Object.keys(parsed)) {
          const ev: any = parsed[key];
          if (!ev || ev.type !== "VEVENT") continue;
          events.push(...instances(ev, from, to, feed.label));
        }
      } catch (e) {
        errors.push(`Calendar “${feed.label}” didn't load (${(e as Error).message}).`);
      }
    }),
  );

  events.sort((a, b) => a.start.localeCompare(b.start));
  return { events, errors };
}

/** Just today's, which is what the Focus view shows. */
export const todaysEvents = (events: CalEvent[]): CalEvent[] => {
  const now = new Date();
  return events.filter((e) => sameDay(new Date(e.start), now));
};
