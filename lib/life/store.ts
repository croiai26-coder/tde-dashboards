"use client";

import type { Item, LiveData } from "./types";
import { parse } from "./parse";

// ─────────────────────────────────────────────────────────────
// Hybrid store.
//
// localStorage is the write path and the source of truth for *this* browser:
// capture never waits on the network. A background loop then reconciles with
// Notion, so a second device converges within a minute or so.
//
// Conflicts resolve on `updated` — last write wins, per item. That is the
// right trade for a personal inbox: the failure mode is a stale edit losing
// to a fresher one, not data loss, and both sides keep every item.
// ─────────────────────────────────────────────────────────────

export const STORE_KEY = "life_os_v1";
export const THEME_KEY = "life_os_theme";

export interface Store {
  items: Item[];
  seq: number;
  /** Local ids waiting to be pushed to Notion. */
  pending: string[];
  lastSync: number;
}

export type SyncState = "off" | "idle" | "syncing" | "error";

export const emptyStore = (): Store => ({ items: [], seq: 1, pending: [], lastSync: 0 });

export function loadStore(): Store {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const p = JSON.parse(raw);
    if (!p || !Array.isArray(p.items)) return emptyStore();
    return {
      items: p.items,
      seq: p.seq ?? p.items.length + 1,
      pending: Array.isArray(p.pending) ? p.pending : [],
      lastSync: p.lastSync ?? 0,
    };
  } catch {
    return emptyStore();
  }
}

export function saveStore(s: Store): boolean {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false; // quota or a browser blocking storage — the caller warns
  }
}

/** Build a fresh item from one raw captured line. */
export function makeItem(raw: string, seq: number): Item | null {
  const p = parse(raw);
  if (!p) return null;
  const now = Date.now();
  return {
    id: "i" + seq + "_" + now.toString(36) + Math.random().toString(36).slice(2, 6),
    text: p.text,
    raw: raw.trim(),
    kind: p.kind,
    area: p.area,
    tags: p.tags,
    people: p.people,
    due: p.due,
    effort: p.effort,
    importance: p.importance,
    created: now,
    updated: now,
    done: false,
    doneAt: null,
    snoozeUntil: p.snoozeUntil,
    pinned: false,
    source: "local",
  };
}

/** Merge a Notion snapshot into local items. Newer `updated` wins per item;
 *  anything only one side has is kept. Never drops data. */
export function merge(local: Item[], remote: Item[]): Item[] {
  const byId = new Map<string, Item>();
  for (const it of local) byId.set(it.id, it);
  for (const r of remote) {
    const l = byId.get(r.id);
    if (!l) {
      byId.set(r.id, r);
      continue;
    }
    if (l.deleted) continue;               // a local delete still needs pushing
    if (r.updated > l.updated) byId.set(r.id, { ...r, source: l.source ?? "local" });
  }
  return [...byId.values()];
}

/** One sync pass: push what's queued, then pull and merge.
 *  Returns the new item list plus whatever is still pending. */
export async function syncOnce(
  store: Store,
): Promise<{ items: Item[]; pending: string[]; error?: string }> {
  const queued = store.items.filter((i) => store.pending.includes(i.id));

  let stillPending = [...store.pending];
  let error: string | undefined;

  if (queued.length) {
    try {
      const res = await fetch("/api/life/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: queued }),
      });
      const json = await res.json();
      if (json?.error) error = json.error;
      const written: string[] = json?.written ?? [];
      stillPending = stillPending.filter((id) => !written.includes(id));
    } catch (e) {
      error = "Couldn't reach the sync service — your items are safe locally.";
    }
  }

  let items = store.items;
  try {
    const res = await fetch("/api/life/items");
    const json = await res.json();
    if (json?.configured && Array.isArray(json.items)) {
      items = merge(store.items, json.items as Item[]);
    }
    if (json?.error && !error) error = json.error;
  } catch {
    if (!error) error = "Couldn't reach the sync service — your items are safe locally.";
  }

  // Anything soft-deleted and successfully pushed can now leave for good.
  items = items.filter((i) => !(i.deleted && !stillPending.includes(i.id)));
  return { items, pending: stillPending, error };
}

export async function fetchLive(): Promise<LiveData> {
  try {
    const res = await fetch("/api/life/live");
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as LiveData;
  } catch {
    return { events: [], sessions: [], projects: [], errors: [] };
  }
}
