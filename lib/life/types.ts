// Domain types for Life OS. The client-side app, the Notion sync layer and
// the API routes all speak these shapes; nothing else leaks between them.

export type Kind = "task" | "note" | "idea";

/** One captured thing. `id` is generated locally and is the sync key. */
export interface Item {
  id: string;
  text: string;
  raw: string;
  kind: Kind;
  area: string | null;
  tags: string[];
  people: string[];
  due: string | null;          // ISO date (no time)
  effort: number | null;       // minutes
  importance: number;          // 0–3
  created: number;             // epoch ms
  updated: number;             // epoch ms
  done: boolean;
  doneAt: number | null;
  snoozeUntil: string | null;  // ISO date
  pinned: boolean;
  /** Set on items that came from Notion rather than local capture. */
  source?: "local" | "notion";
  /** Notion page id, when this item has been synced. */
  pageId?: string;
  /** Soft-delete marker so a deletion propagates instead of resurrecting. */
  deleted?: boolean;
}

/** A calendar entry for today (or the next few days). */
export interface CalEvent {
  id: string;
  title: string;
  start: string;               // ISO datetime
  end: string;                 // ISO datetime
  allDay: boolean;
  calendar: string;            // which feed it came from
}

/** What one Claude session is doing, as written by the daily routine. */
export interface SessionStatus {
  id: string;
  title: string;
  state: string;               // waiting on you | ready to review | working | idle | done
  workingOn: string;
  needsFromMe: string;
  business: string;
  branch: string;
  lastActive: string | null;   // ISO date
  link: string;
  refreshed: string | null;    // ISO date
}

/** A live project from the Projects & Delivery database. */
export interface BizProject {
  id: string;
  name: string;
  business: string;            // The Digital Engine | The Once Over
  status: string;              // Not started | In progress | Waiting on client | At risk | Done
  phase: string;
  client: string;
  deadline: string | null;     // ISO date
  hardDeadline: boolean;
  url: string;
}

/** Everything the server contributes, fetched independently and defensively. */
export interface LiveData {
  events: CalEvent[];
  sessions: SessionStatus[];
  projects: BizProject[];
  /** Per-source problems, surfaced in the UI rather than swallowed. */
  errors: string[];
}
