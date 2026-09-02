// Date helpers. Everything Life OS stores is a plain ISO calendar date
// (no time, no timezone) so that "due today" means the same thing whether
// you open the app in Dublin or on a laptop still set to New York.

export const DAY = 86_400_000;

export const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
export const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

export const startOfDay = (d: Date | number): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
export const today = (): Date => startOfDay(new Date());

export function iso(d: Date): string {
  const x = startOfDay(d);
  return (
    x.getFullYear() +
    "-" + String(x.getMonth() + 1).padStart(2, "0") +
    "-" + String(x.getDate()).padStart(2, "0")
  );
}
export function fromISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const daysUntil = (s: string): number => Math.round((+fromISO(s) - +today()) / DAY);
export const daysSince = (ts: number): number => Math.floor((Date.now() - ts) / DAY);

export function nextWeekday(target: number, includeToday: boolean): Date {
  const t = today();
  let delta = (target - t.getDay() + 7) % 7;
  if (delta === 0 && !includeToday) delta = 7;
  return addDays(t, delta);
}

/** A date written without a year: if it has only just passed it almost always
 *  means "this year, and it's overdue" — only roll it forward once it is far
 *  enough behind us to plausibly be next year's. */
export function resolveYear(month: number, day: number): Date {
  const t = today();
  let d = new Date(t.getFullYear(), month, day);
  if ((+t - +d) / DAY > 60) d = new Date(t.getFullYear() + 1, month, day);
  return d;
}

export function dueLabel(s: string): string {
  const n = daysUntil(s);
  if (n < -1) return Math.abs(n) + " days overdue";
  if (n === -1) return "yesterday";
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n < 7) {
    const w = WEEKDAYS[fromISO(s).getDay()].slice(0, 3);
    return w.charAt(0).toUpperCase() + w.slice(1);
  }
  if (n < 365) return fromISO(s).getDate() + " " + MONTHS[fromISO(s).getMonth()].slice(0, 3);
  return s;
}

export function dueClass(s: string): string {
  const n = daysUntil(s);
  return n < 0 ? "due-over" : n === 0 ? "due-today" : n <= 3 ? "due-soon" : "";
}

export function effortLabel(m: number): string {
  if (m < 60) return m + "m";
  return m % 60 === 0 ? m / 60 + "h" : (m / 60).toFixed(1) + "h";
}

/** "9:30" / "14:00" in the viewer's locale, for calendar rows. */
export function timeLabel(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
