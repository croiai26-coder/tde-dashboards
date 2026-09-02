import { Client as NotionClient } from "@notionhq/client";
import type { Item, SessionStatus, BizProject, Kind } from "./types";

// ─────────────────────────────────────────────────────────────
// Notion layer for Life OS. Three databases, all optional:
//
//   NOTION_DB_LIFE_ITEMS  🧠 Life OS — Inbox           read + write (sync target)
//   NOTION_DB_SESSIONS    🤖 Claude Sessions — Status  read only
//   NOTION_DB_PROJECTS    🗂️ Projects & Delivery       read only
//
// Same contract as lib/notion.ts: if the token or a database ID is missing,
// or a call fails, the getter returns null/empty and the app renders without
// that section rather than falling over.
// ─────────────────────────────────────────────────────────────

const token = process.env.NOTION_TOKEN;
const notion = token ? new NotionClient({ auth: token }) : null;

export const DB_ITEMS = process.env.NOTION_DB_LIFE_ITEMS;
export const DB_SESSIONS = process.env.NOTION_DB_SESSIONS;
export const DB_PROJECTS = process.env.NOTION_DB_PROJECTS;

export const syncConfigured = (): boolean => !!(notion && DB_ITEMS);

/* eslint-disable @typescript-eslint/no-explicit-any */
type Props = Record<string, any>;

const rTitle = (p: Props, k: string): string =>
  Array.isArray(p?.[k]?.title) ? p[k].title.map((x: any) => x.plain_text).join("") : "";
const rText = (p: Props, k: string): string =>
  Array.isArray(p?.[k]?.rich_text) ? p[k].rich_text.map((x: any) => x.plain_text).join("") : "";
const rNum = (p: Props, k: string): number | null =>
  typeof p?.[k]?.number === "number" ? p[k].number : null;
const rSelect = (p: Props, k: string): string => p?.[k]?.select?.name ?? "";
const rDate = (p: Props, k: string): string | null => p?.[k]?.date?.start ?? null;
const rCheck = (p: Props, k: string): boolean => !!p?.[k]?.checkbox;
const rUrl = (p: Props, k: string): string => p?.[k]?.url ?? "";

const wText = (s: string) => ({ rich_text: s ? [{ text: { content: s.slice(0, 1900) } }] : [] });
const wTitle = (s: string) => ({ title: [{ text: { content: (s || "(untitled)").slice(0, 1900) } }] });
const wDate = (s: string | null) => ({ date: s ? { start: s } : null });

async function queryAll(databaseId: string, filter?: any): Promise<any[]> {
  if (!notion) return [];
  const out: any[] = [];
  let cursor: string | undefined;
  do {
    const res: any = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
      ...(filter ? { filter } : {}),
    });
    out.push(...res.results);
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return out;
}

// ── Read: Claude session statuses ─────────────────────────────
export async function getSessions(): Promise<{ sessions: SessionStatus[]; error?: string }> {
  if (!notion || !DB_SESSIONS) return { sessions: [] };
  try {
    const rows = await queryAll(DB_SESSIONS);
    const sessions = rows.map((r): SessionStatus => {
      const p = r.properties;
      return {
        id: rText(p, "Session ID") || r.id,
        title: rTitle(p, "Name"),
        state: rSelect(p, "State") || "idle",
        workingOn: rText(p, "Working on"),
        needsFromMe: rText(p, "Needs from me"),
        business: rSelect(p, "Business"),
        branch: rText(p, "Branch"),
        lastActive: rDate(p, "Last active"),
        link: rUrl(p, "Link"),
        refreshed: rDate(p, "Refreshed"),
      };
    });
    // Blocked things first — that's the whole reason this panel exists.
    const rank: Record<string, number> = {
      "waiting on you": 0, "ready to review": 1, working: 2, idle: 3, done: 4,
    };
    sessions.sort(
      (a, b) =>
        (rank[a.state] ?? 9) - (rank[b.state] ?? 9) ||
        (b.lastActive ?? "").localeCompare(a.lastActive ?? ""),
    );
    return { sessions };
  } catch (e) {
    console.error("[life] sessions query failed:", (e as Error).message);
    return { sessions: [], error: "Couldn't read the Claude session board." };
  }
}

// ── Read: live business projects ──────────────────────────────
export async function getProjects(): Promise<{ projects: BizProject[]; error?: string }> {
  if (!notion || !DB_PROJECTS) return { projects: [] };
  try {
    const rows = await queryAll(DB_PROJECTS);
    const projects = rows
      .map((r): BizProject => {
        const p = r.properties;
        return {
          id: r.id,
          name: rTitle(p, "Project"),
          business: rSelect(p, "Business"),
          status: rSelect(p, "Status"),
          phase: rSelect(p, "Phase"),
          client: Array.isArray(p?.Client?.relation) && p.Client.relation.length
            ? "client linked" : "",
          deadline: rDate(p, "Deadline"),
          hardDeadline: rCheck(p, "Hard Deadline"),
          url: r.url ?? "",
        };
      })
      .filter((p) => p.name && p.status !== "Done");
    projects.sort((a, b) => {
      if (!!a.deadline !== !!b.deadline) return a.deadline ? -1 : 1;
      return (a.deadline ?? "").localeCompare(b.deadline ?? "");
    });
    return { projects };
  } catch (e) {
    console.error("[life] projects query failed:", (e as Error).message);
    return { projects: [], error: "Couldn't read Projects & Delivery." };
  }
}

// ── Read/write: the life inbox itself ─────────────────────────
function rowToItem(r: any): Item {
  const p = r.properties;
  const created = rDate(p, "Captured");
  const updated = rDate(p, "Updated");
  const kind = (rSelect(p, "Kind") || "task") as Kind;
  const text = rTitle(p, "Name");
  return {
    id: rText(p, "Local ID") || r.id,
    text,
    raw: text,
    kind,
    area: rText(p, "Area") || null,
    tags: rText(p, "Area") ? [rText(p, "Area")] : [],
    people: rText(p, "People") ? rText(p, "People").split(/[,\s]+/).filter(Boolean) : [],
    due: rDate(p, "Due"),
    effort: rNum(p, "Effort mins"),
    importance: rNum(p, "Importance") ?? 0,
    created: created ? +new Date(created) : +new Date(r.created_time),
    updated: updated ? +new Date(updated) : +new Date(r.last_edited_time),
    done: rCheck(p, "Done"),
    doneAt: rCheck(p, "Done") ? (updated ? +new Date(updated) : Date.now()) : null,
    snoozeUntil: rDate(p, "Snooze until"),
    pinned: rCheck(p, "Pinned"),
    source: "notion",
    pageId: r.id,
  };
}

function itemToProps(it: Item): Props {
  return {
    Name: wTitle(it.text),
    Kind: { select: { name: it.kind } },
    Done: { checkbox: !!it.done },
    Due: wDate(it.due),
    Area: wText(it.area ?? ""),
    Importance: { number: it.importance ?? 0 },
    "Effort mins": { number: it.effort ?? null },
    "Snooze until": wDate(it.snoozeUntil),
    Pinned: { checkbox: !!it.pinned },
    People: wText((it.people ?? []).join(" ")),
    "Local ID": wText(it.id),
    Captured: wDate(new Date(it.created).toISOString().slice(0, 10)),
    Updated: wDate(new Date(it.updated).toISOString().slice(0, 10)),
  };
}

export async function pullItems(): Promise<{ items: Item[]; error?: string }> {
  if (!notion || !DB_ITEMS) return { items: [] };
  try {
    const rows = await queryAll(DB_ITEMS);
    return { items: rows.map(rowToItem) };
  } catch (e) {
    console.error("[life] inbox pull failed:", (e as Error).message);
    return { items: [], error: "Couldn't read the Life OS inbox from Notion." };
  }
}

/** Upsert by Local ID. Returns the ids it actually wrote, so the client can
 *  clear exactly those from its pending queue and keep the rest. */
export async function pushItems(
  items: Item[],
): Promise<{ written: string[]; error?: string }> {
  if (!notion || !DB_ITEMS) return { written: [], error: "Notion sync isn't configured." };
  if (!items.length) return { written: [] };
  try {
    const existing = await queryAll(DB_ITEMS);
    const byLocalId = new Map<string, string>();
    for (const r of existing) {
      const lid = rText(r.properties, "Local ID");
      if (lid) byLocalId.set(lid, r.id);
    }

    const written: string[] = [];
    // Sequential on purpose: Notion rate-limits at ~3 req/s and a burst of
    // parallel writes from a brain dump would trip it.
    for (const it of items) {
      const pageId = byLocalId.get(it.id);
      if (it.deleted) {
        if (pageId) await notion.pages.update({ page_id: pageId, archived: true });
        written.push(it.id);
        continue;
      }
      if (pageId) {
        await notion.pages.update({ page_id: pageId, properties: itemToProps(it) as any });
      } else {
        await notion.pages.create({
          parent: { database_id: DB_ITEMS },
          properties: itemToProps(it) as any,
        });
      }
      written.push(it.id);
    }
    return { written };
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[life] inbox push failed:", msg);
    return { written: [], error: "Notion rejected the sync: " + msg };
  }
}
