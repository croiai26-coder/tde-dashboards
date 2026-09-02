// Natural-language capture parser.
//
// One raw line in, one structured item out. Every marker is optional — a bare
// line is a perfectly valid item, which is the whole point: you should never
// have to think about syntax to get something out of your head and into here.

import {
  today, iso, addDays, nextWeekday, resolveYear, daysUntil, dueLabel,
  effortLabel, MONTHS,
} from "./dates";
import type { Kind } from "./types";

export interface Parsed {
  text: string;
  kind: Kind;
  area: string | null;
  tags: string[];
  people: string[];
  due: string | null;
  effort: number | null;
  importance: number;
  snoozeUntil: string | null;
  /** Human-readable list of what was recognised, for the live preview. */
  matched: string[];
}

const MON3 = MONTHS.map((m) => m.slice(0, 3)).join("|");

type Rule = [RegExp, (m: RegExpMatchArray) => Date];

const DATE_RULES: Rule[] = [
  [/(^|\s)(today|tonight|tod)(?=\s|$)/i, () => today()],
  [/(^|\s)(tomorrow|tmrw|tmr|tom)(?=\s|$)/i, () => addDays(today(), 1)],
  [/(^|\s)(next week)(?=\s|$)/i, () => addDays(today(), 7)],
  [/(^|\s)(next month)(?=\s|$)/i, () => addDays(today(), 30)],
  [/(^|\s)(eow|end of week)(?=\s|$)/i, () => nextWeekday(5, true)],
  [/(^|\s)(eom|end of month)(?=\s|$)/i, () => {
    const t = today();
    return new Date(t.getFullYear(), t.getMonth() + 1, 0);
  }],
  [/(^|\s)in (\d+) ?(d|day|days)(?=\s|$)/i, (m) => addDays(today(), +m[2])],
  [/(^|\s)in (\d+) ?(w|week|weeks)(?=\s|$)/i, (m) => addDays(today(), +m[2] * 7)],
  [
    /(^|\s)(next )?(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(day|nesday|rsday|urday)?(?=\s|$)/i,
    (m) => {
      const stub = m[3].toLowerCase().slice(0, 3);
      const idx = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(stub);
      const d = nextWeekday(idx, false);
      // "next fri" when Friday is already this week means the one after.
      return m[2] && daysUntil(iso(d)) < 7 ? addDays(d, 7) : d;
    },
  ],
  // dd/mm — Irish/UK order, not US.
  [
    /(^|\s)(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?(?=\s|$)/,
    (m) => {
      const d = +m[2];
      const mo = +m[3] - 1;
      if (m[4]) return new Date(+m[4] < 100 ? 2000 + +m[4] : +m[4], mo, d);
      return resolveYear(mo, d);
    },
  ],
  [
    new RegExp(`(^|\\s)(${MON3})[a-z]* (\\d{1,2})(?:st|nd|rd|th)?(?=\\s|$)`, "i"),
    (m) => resolveYear(MONTHS.findIndex((x) => x.startsWith(m[2].toLowerCase())), +m[3]),
  ],
  [
    new RegExp(`(^|\\s)(\\d{1,2})(?:st|nd|rd|th)? (${MON3})[a-z]*(?=\\s|$)`, "i"),
    (m) => resolveYear(MONTHS.findIndex((x) => x.startsWith(m[3].toLowerCase())), +m[2]),
  ],
];

export function parse(raw: string): Parsed | null {
  let text = raw.trim();
  if (!text) return null;

  const out: Parsed = {
    text: "", kind: "task", area: null, tags: [], people: [],
    due: null, effort: null, importance: 0, snoozeUntil: null, matched: [],
  };

  // Kind prefix: note: / idea: / someday:
  const kindM = text.match(/^(note|idea|thought|someday|maybe)\s*[:\-]\s*/i);
  let someday = false;
  if (kindM) {
    const k = kindM[1].toLowerCase();
    if (k === "note" || k === "thought") out.kind = "note";
    else if (k === "idea") out.kind = "idea";
    else someday = true;
    text = text.slice(kindM[0].length);
    out.matched.push(someday ? "someday" : out.kind);
  }

  // Importance: free-standing ! / !! / !!!
  const impM = text.match(/(^|\s)(!{1,3})(?=\s|$)/);
  if (impM) {
    out.importance = Math.min(3, impM[2].length);
    text = text.replace(impM[0], " ");
    out.matched.push("!".repeat(out.importance));
  }

  // Areas: #work — first one becomes the area, all are kept as tags.
  text = text.replace(/(^|\s)#([\w\-/]+)/g, (_m, sp: string, tag: string) => {
    out.tags.push(tag.toLowerCase());
    return sp;
  });
  if (out.tags.length) {
    out.area = out.tags[0];
    out.matched.push("#" + out.area);
  }

  // People: @sarah — kept in the text so it reads naturally, highlighted in the UI.
  text = text.replace(/(^|\s)@([\w\-']+)/g, (_m, sp: string, who: string) => {
    out.people.push(who);
    return sp + "@" + who;
  });

  // Effort: ~30m / ~2h, or a bare "30 mins" / "2 hrs".
  const effM =
    text.match(/(^|\s)~\s*(\d+(?:\.\d+)?)\s*(m|min|mins|minutes|h|hr|hrs|hours)?(?=\s|$)/i) ||
    text.match(/(^|\s)(\d+(?:\.\d+)?)\s*(min|mins|minutes|hr|hrs|hours)(?=\s|$)/i);
  if (effM) {
    const n = parseFloat(effM[2]);
    const unit = (effM[3] || "m").toLowerCase();
    out.effort = Math.round(unit.startsWith("h") ? n * 60 : n);
    text = text.replace(effM[0], " ");
    out.matched.push("~" + effortLabel(out.effort));
  }

  // Dates — first rule that matches wins.
  for (const [re, fn] of DATE_RULES) {
    const m = text.match(re);
    if (!m) continue;
    const d = fn(m);
    if (d && !isNaN(+d)) {
      out.due = iso(d);
      text = text.replace(m[0], " ");
      out.matched.push(dueLabel(out.due));
      break;
    }
  }

  out.text = text.replace(/\s{2,}/g, " ").trim();
  if (!out.text) return null;
  if (someday) out.snoozeUntil = iso(addDays(today(), 30));
  return out;
}
