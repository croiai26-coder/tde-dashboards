// The priority engine.
//
// Every open task gets a score. The weights are deliberately simple and the
// components are named, so `reason()` can always reproduce whichever one
// dominated — the ordering has to be arguable, not a black box.

import { daysUntil, daysSince, dueLabel, effortLabel, DAY } from "./dates";
import type { Item, CalEvent } from "./types";

/** How much of today is actually left, after the calendar takes its cut. */
export interface Capacity {
  /** Free minutes between now and the end of the working day. */
  freeToday: number;
  /** Minutes until the next event starts, or null if nothing is left today. */
  untilNext: number | null;
  nextEvent: CalEvent | null;
  busyToday: number;
  /** False when there is no calendar connected — scoring then ignores capacity. */
  known: boolean;
}

export const NO_CAPACITY: Capacity = {
  freeToday: 0, untilNext: null, nextEvent: null, busyToday: 0, known: false,
};

/** Treat the day as ending at 18:00 — past that, capacity stops being a useful
 *  signal and everything is "tomorrow's problem" anyway. */
const DAY_ENDS_HOUR = 18;

export function capacityFrom(events: CalEvent[], now = new Date()): Capacity {
  const dayEnd = new Date(now);
  dayEnd.setHours(DAY_ENDS_HOUR, 0, 0, 0);
  const remaining = Math.max(0, (+dayEnd - +now) / 60000);

  const todays = events
    .filter((e) => !e.allDay)
    .map((e) => ({ ...e, s: new Date(e.start), e2: new Date(e.end) }))
    .filter((e) => +e.e2 > +now && +e.s < +dayEnd)
    .sort((a, b) => +a.s - +b.s);

  // Minutes of the remaining window already spoken for (overlaps merged).
  let busy = 0;
  let cursor = +now;
  for (const ev of todays) {
    const s = Math.max(+ev.s, +now);
    const e = Math.min(+ev.e2, +dayEnd);
    if (e <= cursor) continue;
    busy += (e - Math.max(s, cursor)) / 60000;
    cursor = Math.max(cursor, e);
  }

  const upcoming = todays.find((e) => +e.s > +now) || null;
  return {
    freeToday: Math.max(0, Math.round(remaining - busy)),
    untilNext: upcoming ? Math.round((+new Date(upcoming.start) - +now) / 60000) : null,
    nextEvent: upcoming ? events.find((e) => e.id === upcoming.id) || null : null,
    busyToday: Math.round(busy),
    known: true,
  };
}

// ── Score components ──────────────────────────────────────────
export function urgency(it: Item): number {
  if (!it.due) return 0;
  const n = daysUntil(it.due);
  if (n < 0) return Math.min(140, 100 + Math.abs(n) * 5); // overdue, and worsening
  if (n === 0) return 92;
  if (n === 1) return 72;
  if (n <= 3) return 56;
  if (n <= 7) return 36;
  if (n <= 14) return 18;
  return 8;
}
export const importanceScore = (it: Item): number => [0, 20, 42, 68][it.importance] ?? 0;

/** Undated things you keep scrolling past slowly float up, so nothing rots. */
export const staleness = (it: Item): number =>
  it.due ? 0 : Math.min(24, daysSince(it.created) * 1.1);

export function quickWin(it: Item): number {
  if (it.effort == null) return 0;
  if (it.effort <= 10) return 14;
  if (it.effort <= 20) return 9;
  if (it.effort <= 45) return 3;
  if (it.effort >= 180) return -8; // big rocks need scheduling, not a nudge
  return 0;
}

/** Calendar-aware nudge: favour what actually fits the gap you have, and stop
 *  offering a four-hour job on a day that has ninety minutes left in it. */
export function fit(it: Item, cap: Capacity): number {
  if (!cap.known || it.effort == null) return 0;
  let s = 0;
  if (cap.untilNext != null && it.effort <= cap.untilNext - 5) s += 10;
  if (it.effort > cap.freeToday) s -= 25;
  return s;
}

/** True when the task simply cannot fit in what's left of today. */
export const needsBlock = (it: Item, cap: Capacity): boolean =>
  cap.known && it.effort != null && it.effort > cap.freeToday && daysUntil(it.due ?? "") !== 0;

export function score(it: Item, cap: Capacity = NO_CAPACITY): number {
  if (it.pinned) return 1000 + urgency(it) + importanceScore(it);
  return urgency(it) + importanceScore(it) + staleness(it) + quickWin(it) + fit(it, cap);
}

export function reason(it: Item, cap: Capacity = NO_CAPACITY): string {
  if (it.pinned) return "pinned to the top";
  const parts: string[] = [];
  if (it.due) {
    const n = daysUntil(it.due);
    if (n < 0) parts.push(Math.abs(n) === 1 ? "a day overdue" : Math.abs(n) + " days overdue");
    else if (n === 0) parts.push("due today");
    else if (n === 1) parts.push("due tomorrow");
    else parts.push("due " + dueLabel(it.due));
  }
  if (it.importance >= 2) parts.push("you flagged it important");
  else if (it.importance === 1) parts.push("flagged");
  if (!it.due && daysSince(it.created) >= 7) parts.push("sitting here " + daysSince(it.created) + " days");
  if (cap.known && it.effort != null && cap.untilNext != null && it.effort <= cap.untilNext - 5) {
    parts.push("fits before " + (cap.nextEvent?.title ?? "your next thing"));
  } else if (it.effort != null && it.effort <= 20) {
    parts.push("only " + effortLabel(it.effort));
  }
  if (!parts.length) parts.push("next in line");
  return parts.slice(0, 2).join(" · ");
}

// ── Selectors ─────────────────────────────────────────────────
export const isSnoozed = (it: Item): boolean =>
  !!it.snoozeUntil && daysUntil(it.snoozeUntil) > 0;
export const isNoteKind = (it: Item): boolean => it.kind === "note" || it.kind === "idea";
export const isActive = (it: Item): boolean =>
  !it.done && !it.deleted && it.kind === "task" && !isSnoozed(it);

export const activeTasks = (items: Item[], cap: Capacity = NO_CAPACITY): Item[] =>
  items.filter(isActive).sort((a, b) => score(b, cap) - score(a, cap));

export const overdue = (items: Item[], cap?: Capacity): Item[] =>
  activeTasks(items, cap).filter((i) => i.due && daysUntil(i.due) < 0);
export const dueToday = (items: Item[], cap?: Capacity): Item[] =>
  activeTasks(items, cap).filter((i) => i.due && daysUntil(i.due) === 0);
export const notes = (items: Item[]): Item[] =>
  items.filter((i) => !i.done && !i.deleted && isNoteKind(i)).sort((a, b) => b.created - a.created);
export const doneItems = (items: Item[]): Item[] =>
  items.filter((i) => i.done && !i.deleted).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
export const snoozedItems = (items: Item[]): Item[] =>
  items.filter((i) => !i.done && !i.deleted && isSnoozed(i))
    .sort((a, b) => (a.snoozeUntil! < b.snoozeUntil! ? -1 : 1));
export const doneThisWeek = (items: Item[]): Item[] => {
  const cut = Date.now() - 7 * DAY;
  return items.filter((i) => i.done && !i.deleted && (i.doneAt || 0) > cut);
};
/** Carried a fortnight with no date: do it, date it, or drop it. */
export const stale = (items: Item[], cap?: Capacity): Item[] =>
  activeTasks(items, cap).filter((i) => !i.due && daysSince(i.created) >= 14 && !i.pinned);
