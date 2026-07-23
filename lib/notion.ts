import { Client as NotionClient } from "@notionhq/client";
import type {
  Client,
  PipelineLead,
  Build,
  Subscription,
  Invoice,
  Task,
  Meeting,
  ContentItem,
  Service,
  Goal,
} from "./types";

// ─────────────────────────────────────────────────────────────
// Read-only Notion data layer.
//
// Every getter is defensive: if the token or the relevant database ID
// is missing, or the API call fails, it returns null. The caller then
// falls back to the seed/empty state, so the dashboard always renders —
// which is the expected launch state for a pre-revenue founder.
// ─────────────────────────────────────────────────────────────

const token = process.env.NOTION_TOKEN;

const notion = token ? new NotionClient({ auth: token }) : null;

// ── Raw property readers ──────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
type Props = Record<string, any>;

function readTitle(p: Props, key: string): string {
  const t = p?.[key]?.title;
  return Array.isArray(t) ? t.map((x: any) => x.plain_text).join("") : "";
}
function readRichText(p: Props, key: string): string {
  const t = p?.[key]?.rich_text;
  return Array.isArray(t) ? t.map((x: any) => x.plain_text).join("") : "";
}
function readNumber(p: Props, key: string): number {
  const n = p?.[key]?.number;
  return typeof n === "number" ? n : 0;
}
function readSelect(p: Props, key: string): string {
  return p?.[key]?.select?.name ?? "";
}
function readDate(p: Props, key: string): string | null {
  return p?.[key]?.date?.start ?? null;
}
function readCheckbox(p: Props, key: string): boolean {
  return !!p?.[key]?.checkbox;
}
function readEmail(p: Props, key: string): string {
  return p?.[key]?.email ?? "";
}
function readRelationFirst(p: Props, key: string): string | null {
  const r = p?.[key]?.relation;
  return Array.isArray(r) && r.length ? r[0].id : null;
}
function readPerson(p: Props, key: string): string {
  const people = p?.[key]?.people;
  if (Array.isArray(people) && people.length) return people[0]?.name ?? "";
  return readRichText(p, key);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Query helper (handles pagination) ─────────────────────────
async function queryAll(databaseId: string) {
  if (!notion) return [];
  const results: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  let cursor: string | undefined = undefined;
  do {
    const res: any = await notion.databases.query({ // eslint-disable-line @typescript-eslint/no-explicit-any
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...res.results);
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return results;
}

/** Runs a fetch+map, returning null if unconfigured or on any error. */
async function safe<T>(
  dbId: string | undefined,
  map: (rows: any[]) => T, // eslint-disable-line @typescript-eslint/no-explicit-any
  label: string,
): Promise<T | null> {
  if (!notion || !dbId) return null;
  try {
    const rows = await queryAll(dbId);
    return map(rows);
  } catch (err) {
    console.error(`[notion] ${label} query failed:`, (err as Error).message);
    return null;
  }
}

// ── Per-database getters ──────────────────────────────────────
export function getClients(): Promise<Client[] | null> {
  return safe(
    process.env.NOTION_DB_CLIENTS,
    (rows) =>
      rows.map((r): Client => {
        const p = r.properties;
        return {
          id: r.id,
          name: readTitle(p, "Name"),
          status: readSelect(p, "Status"),
          mrr: readNumber(p, "MRR"),
          health: readSelect(p, "Health"),
        };
      }),
    "clients",
  );
}

export function getPipeline(): Promise<PipelineLead[] | null> {
  return safe(
    process.env.NOTION_DB_PIPELINE,
    (rows) =>
      rows.map((r): PipelineLead => {
        const p = r.properties;
        return {
          id: r.id,
          name: readTitle(p, "Name"),
          status: readSelect(p, "Status"),
          value: readNumber(p, "Value"),
          contact: readEmail(p, "Contact") || readRichText(p, "Contact"),
          nextStep: readRichText(p, "Next step"),
        };
      }),
    "pipeline",
  );
}

export function getBuilds(): Promise<Build[] | null> {
  return safe(
    process.env.NOTION_DB_BUILDS,
    (rows) =>
      rows.map((r): Build => {
        const p = r.properties;
        return {
          id: r.id,
          name: readTitle(p, "Name"),
          status: readSelect(p, "Status"),
          clientId: readRelationFirst(p, "Client"),
          due: readDate(p, "Due date"),
        };
      }),
    "builds",
  );
}

export function getSubscriptions(): Promise<Subscription[] | null> {
  return safe(
    process.env.NOTION_DB_SUBSCRIPTIONS,
    (rows) =>
      rows.map((r): Subscription => {
        const p = r.properties;
        return {
          id: r.id,
          name: readTitle(p, "Name"),
          amount: readNumber(p, "Amount"),
          billingDate: readDate(p, "Billing date"),
          cadence: readSelect(p, "Cadence"),
        };
      }),
    "subscriptions",
  );
}

export function getInvoices(): Promise<Invoice[] | null> {
  return safe(
    process.env.NOTION_DB_INVOICES,
    (rows) =>
      rows.map((r): Invoice => {
        const p = r.properties;
        return {
          id: r.id,
          amount: readNumber(p, "Amount"),
          status: readSelect(p, "Status"),
          due: readDate(p, "Due date"),
        };
      }),
    "invoices",
  );
}

export function getTasks(): Promise<Task[] | null> {
  return safe(
    process.env.NOTION_DB_TASKS,
    (rows) =>
      rows.map((r): Task => {
        const p = r.properties;
        return {
          id: r.id,
          name: readTitle(p, "Name"),
          done: readCheckbox(p, "Done"),
          priority: readSelect(p, "Priority"),
        };
      }),
    "tasks",
  );
}

export function getMeetings(): Promise<Meeting[] | null> {
  return safe(
    process.env.NOTION_DB_MEETINGS,
    (rows) =>
      rows.map((r): Meeting => {
        const p = r.properties;
        return {
          id: r.id,
          name: readTitle(p, "Name"),
          date: readDate(p, "Date"),
          attendee: readPerson(p, "Attendee"),
        };
      }),
    "meetings",
  );
}

export function getContent(): Promise<ContentItem[] | null> {
  return safe(
    process.env.NOTION_DB_CONTENT,
    (rows) =>
      rows.map((r): ContentItem => {
        const p = r.properties;
        return {
          id: r.id,
          title: readTitle(p, "Title"),
          publishDate: readDate(p, "Publish date"),
          channel: readSelect(p, "Channel"),
          status: readSelect(p, "Status"),
        };
      }),
    "content",
  );
}

export function getServices(): Promise<Service[] | null> {
  return safe(
    process.env.NOTION_DB_SERVICES,
    (rows) =>
      rows.map((r): Service => {
        const p = r.properties;
        return {
          id: r.id,
          name: readTitle(p, "Service"),
          price: readNumber(p, "Price"),
          type: readSelect(p, "Type"),
        };
      }),
    "services",
  );
}

export function getGoals(): Promise<Goal[] | null> {
  return safe(
    process.env.NOTION_DB_GOALS,
    (rows) =>
      rows.map((r): Goal => {
        const p = r.properties;
        return {
          id: r.id,
          label: readTitle(p, "Goal"),
          current: readNumber(p, "Current"),
          target: readNumber(p, "Target"),
          by: readRichText(p, "By"),
        };
      }),
    "goals",
  );
}
