"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ItemRow, type RowActions } from "./ItemRow";
import { Chips, areaColour } from "./Chips";
import { TodayStrip } from "./TodayStrip";
import { SessionsPanel } from "./SessionsPanel";
import { ProjectsPanel } from "./ProjectsPanel";
import {
  loadStore, saveStore, makeItem, syncOnce, fetchLive,
  THEME_KEY, type Store, type SyncState,
} from "@/lib/life/store";
import { parse } from "@/lib/life/parse";
import {
  activeTasks, overdue, dueToday, notes, doneItems, snoozedItems,
  doneThisWeek, stale, isSnoozed, isNoteKind, score, reason,
  capacityFrom, needsBlock, NO_CAPACITY, type Capacity,
} from "@/lib/life/score";
import {
  today, iso, addDays, daysSince, daysUntil, dueLabel, effortLabel,
} from "@/lib/life/dates";
import type { Item, LiveData } from "@/lib/life/types";

const SYNC_EVERY = 60_000;
const LIVE_EVERY = 300_000;
const trunc = (s: string, n = 42) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const TABS = ["focus", "business", "all", "notes", "review", "done"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  focus: "Focus", business: "Business", all: "Everything",
  notes: "Notes & ideas", review: "Review", done: "Done",
};

export default function LifeApp({ name }: { name: string }) {
  const [store, setStore] = useState<Store>({ items: [], seq: 1, pending: [], lastSync: 0 });
  const [live, setLive] = useState<LiveData>({ events: [], sessions: [], projects: [], errors: [] });
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("off");
  const [syncNote, setSyncNote] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("focus");
  const [sel, setSel] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dumpMode, setDumpMode] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [draft, setDraft] = useState("");
  const [, setTick] = useState(0);

  const [toast, setToast] = useState<{ msg: string; action?: () => void; label?: string } | null>(null);
  const undoStack = useRef<{ label: string; items: Item[] }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const storeRef = useRef(store);
  storeRef.current = store;

  // ── Boot ────────────────────────────────────────────────────
  useEffect(() => {
    const s = loadStore();
    setStore(s);
    setReady(true);
    const saved = localStorage.getItem(THEME_KEY);
    const t = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", t);
    inputRef.current?.focus();
  }, []);

  // Persist on every change — this is the write path that must never fail.
  useEffect(() => {
    if (!ready) return;
    if (!saveStore(store)) {
      setSyncNote("Browser storage is full or blocked — changes may not survive a reload.");
    }
  }, [store, ready]);

  // Keep "today", overdue counts and the capacity bar honest as time passes.
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Live data (calendar / sessions / projects) ───────────────
  const refreshLive = useCallback(async () => {
    setLive(await fetchLive());
  }, []);
  useEffect(() => {
    refreshLive();
    const id = setInterval(refreshLive, LIVE_EVERY);
    const onFocus = () => refreshLive();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, [refreshLive]);

  // ── Background Notion sync ──────────────────────────────────
  const runSync = useCallback(async () => {
    const s = storeRef.current;
    setSyncState("syncing");
    const { items, pending, error } = await syncOnce(s);
    setStore((prev) => ({ ...prev, items, pending, lastSync: Date.now() }));
    setSyncState(error ? "error" : "idle");
    setSyncNote(error ?? null);
  }, []);
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/life/items").then((r) => r.json()).catch(() => null);
      if (cancelled) return;
      if (!res?.configured) { setSyncState("off"); return; }
      runSync();
    })();
    const id = setInterval(() => { if (storeRef.current.pending.length) runSync(); }, SYNC_EVERY);
    return () => { cancelled = true; clearInterval(id); };
  }, [ready, runSync]);

  // ── Mutation helpers ────────────────────────────────────────
  const mutate = useCallback(
    (label: string, fn: (items: Item[]) => Item[], touched?: string[]) => {
      setStore((prev) => {
        undoStack.current.push({ label, items: JSON.parse(JSON.stringify(prev.items)) });
        if (undoStack.current.length > 30) undoStack.current.shift();
        const items = fn(prev.items);
        const pending = touched
          ? [...new Set([...prev.pending, ...touched])]
          : prev.pending;
        return { ...prev, items, pending };
      });
    },
    [],
  );

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) { setToast({ msg: "Nothing left to undo." }); return; }
    setStore((s) => ({
      ...s,
      items: prev.items,
      pending: [...new Set([...s.pending, ...prev.items.map((i) => i.id)])],
    }));
    setToast({ msg: "Undid: " + prev.label });
  }, []);

  const patch = useCallback(
    (id: string, label: string, fn: (it: Item) => Item) =>
      mutate(label, (items) => items.map((i) => (i.id === id ? { ...fn(i), updated: Date.now() } : i)), [id]),
    [mutate],
  );

  const actions: RowActions = useMemo(() => ({
    toggleDone: (id) => {
      const it = storeRef.current.items.find((i) => i.id === id);
      if (!it) return;
      patch(id, (it.done ? "un-complete " : "complete ") + `“${trunc(it.text)}”`, (i) => ({
        ...i, done: !i.done, doneAt: !i.done ? Date.now() : null,
        snoozeUntil: !i.done ? null : i.snoozeUntil,
      }));
      if (!it.done) setToast({ msg: "Done: " + trunc(it.text), label: "Undo", action: undo });
    },
    remove: (id) => {
      const it = storeRef.current.items.find((i) => i.id === id);
      if (!it) return;
      // Soft delete so the removal reaches Notion instead of resurrecting.
      patch(id, `delete “${trunc(it.text)}”`, (i) => ({ ...i, deleted: true }));
      if (sel === id) setSel(null);
      setToast({ msg: "Deleted: " + trunc(it.text), label: "Undo", action: undo });
    },
    snooze: (id, days, label) => {
      const it = storeRef.current.items.find((i) => i.id === id);
      patch(id, `snooze “${trunc(it?.text ?? "")}”`, (i) => ({
        ...i, snoozeUntil: iso(addDays(today(), days)),
      }));
      setToast({ msg: `Snoozed ${label}: ${trunc(it?.text ?? "")}`, label: "Undo", action: undo });
    },
    wake: (id) => patch(id, "wake item", (i) => ({ ...i, snoozeUntil: null })),
    togglePin: (id) => patch(id, "pin/unpin", (i) => ({ ...i, pinned: !i.pinned })),
    setDue: (id, days) =>
      patch(id, "reschedule", (i) => ({
        ...i, due: days == null ? null : iso(addDays(today(), days)), snoozeUntil: null,
      })),
    commitEdit: (id, text) => {
      const t = text.trim();
      if (!t) return;
      // Re-parse, so you can add "!! fri #work" while editing and have it stick.
      const p = parse(t);
      patch(id, "edit item", (i) => (p ? {
        ...i,
        text: p.text,
        due: p.due ?? i.due,
        effort: p.effort ?? i.effort,
        importance: p.importance || i.importance,
        area: p.area ?? i.area,
        tags: p.tags.length ? p.tags : i.tags,
      } : { ...i, text: t }));
    },
    select: (id) => setSel(id),
  }), [patch, sel, undo]);

  // ── Capture ─────────────────────────────────────────────────
  const capture = useCallback((raw: string) => {
    const lines = raw.split("\n").map((s) => s.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);
    if (!lines.length) return;
    const fresh: Item[] = [];
    setStore((prev) => {
      undoStack.current.push({ label: "add items", items: JSON.parse(JSON.stringify(prev.items)) });
      let seq = prev.seq;
      for (const l of lines) {
        const it = makeItem(l, seq++);
        if (it) fresh.push(it);
      }
      return {
        ...prev,
        seq,
        items: [...fresh, ...prev.items],
        pending: [...new Set([...prev.pending, ...fresh.map((i) => i.id)])],
      };
    });
    setDraft("");
    if (tab === "done") setTab("focus");
    if (fresh.length) {
      setToast({
        msg: `Captured ${fresh.length} ${fresh.length === 1 ? "item" : "items"}.`,
        label: "Undo", action: undo,
      });
    }
  }, [tab, undo]);

  // ── Derived ─────────────────────────────────────────────────
  const items = store.items.filter((i) => !i.deleted);
  const capacity: Capacity = useMemo(() => {
    const todays = live.events.filter((e) => {
      const d = new Date(e.start); const n = new Date();
      return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
    });
    return live.events.length || live.sessions.length ? capacityFrom(todays) : NO_CAPACITY;
  }, [live]);

  const open = activeTasks(items, capacity);
  const od = overdue(items, capacity);
  const dt = dueToday(items, capacity);
  const week = doneThisWeek(items);
  const blockedSessions = live.sessions.filter((s) => s.state === "waiting on you");
  const todaysEvents = useMemo(() => {
    const n = new Date();
    return live.events.filter((e) => {
      const d = new Date(e.start);
      return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
    });
  }, [live.events]);

  const rowProps = (it: Item, showAge?: boolean) => ({
    item: it, actions, selected: sel === it.id, editing: editing === it.id,
    setEditing, showAge, needsBlock: needsBlock(it, capacity),
  });

  // ── Keyboard ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const typing = el && /^(INPUT|TEXTAREA)$/.test(el.tagName);
      if (typing) {
        if (e.key === "Enter" && el!.id?.startsWith("capture") && (!dumpMode || e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          capture(draft);
        }
        if (e.key === "Escape") el!.blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === "/" || k === "n") { e.preventDefault(); (dumpMode ? areaRef : inputRef).current?.focus(); return; }
      if (k === "?") { e.preventDefault(); setShowHelp(true); return; }
      if (k === "u") { e.preventDefault(); undo(); return; }
      if (k === "Escape") { setSel(null); setShowHelp(false); return; }
      if (k === "j" || k === "ArrowDown" || k === "k" || k === "ArrowUp") {
        e.preventDefault();
        const ids = [...document.querySelectorAll("[data-id]")].map((n) => n.getAttribute("data-id")!);
        if (!ids.length) return;
        const i = ids.indexOf(sel ?? "");
        const dir = k === "j" || k === "ArrowDown" ? 1 : -1;
        const next = ids[Math.max(0, Math.min(ids.length - 1, i < 0 ? 0 : i + dir))];
        setSel(next);
        document.querySelector(`[data-id="${next}"]`)?.scrollIntoView({ block: "nearest" });
        return;
      }
      if (!sel) {
        const n = parseInt(k, 10);
        if (n >= 1 && n <= TABS.length) setTab(TABS[n - 1]);
        return;
      }
      if (k === "x" || k === " ") { e.preventDefault(); actions.toggleDone(sel); }
      else if (k === "e") { e.preventDefault(); setEditing(sel); }
      else if (k === "s") actions.snooze(sel, 1, "till tomorrow");
      else if (k === "S") actions.snooze(sel, 7, "a week");
      else if (k === "p") actions.togglePin(sel);
      else if (k === "t") actions.setDue(sel, 0);
      else if (k === "w") actions.setDue(sel, 7);
      else if (k === "1" || k === "2" || k === "3") {
        const v = +k;
        patch(sel, "change priority", (i) => ({ ...i, importance: i.importance === v ? 0 : v }));
      } else if (k === "#" || k === "Delete" || k === "Backspace") { e.preventDefault(); actions.remove(sel); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sel, dumpMode, draft, capture, undo, actions, patch]);

  // ── Toast auto-hide ─────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(id);
  }, [toast]);

  if (!ready) return <div className="wrap" style={{ padding: 40, color: "var(--faint)" }}>Loading…</div>;

  const hr = new Date().getHours();
  const part = hr < 5 ? "Still up" : hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const line = od.length ? `${od.length} overdue — clear those first.`
    : blockedSessions.length ? `${blockedSessions.length} ${blockedSessions.length === 1 ? "session is" : "sessions are"} waiting on you.`
      : dt.length ? `${dt.length} due today. Nothing overdue.`
        : open.length ? `Nothing overdue. ${open.length} open.`
          : "Clear plate. Nothing needs you right now.";

  const preview = draft.trim() && !dumpMode ? parse(draft) : null;
  const dumpLines = dumpMode ? draft.split("\n").filter((s) => s.trim()).length : 0;

  return (
    <div className="wrap">
      <header>
        <div className="head-row">
          <div>
            <div className="greet">{part}, <em>{name}</em></div>
            <div className="subgreet">
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} · {line}
            </div>
          </div>
          <div className="head-tools">
            <button
              className="icon-btn"
              title="Light / dark"
              onClick={() => {
                const cur = document.documentElement.getAttribute("data-theme");
                const next = cur === "dark" ? "light" : "dark";
                document.documentElement.setAttribute("data-theme", next);
                localStorage.setItem(THEME_KEY, next);
                setTick((n) => n + 1);
              }}
            >
              {typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark" ? "☀" : "☾"}
            </button>
            <button className="icon-btn" title="Export a JSON backup" onClick={() => {
              const blob = new Blob([JSON.stringify({ app: "life-os", version: 1, ...store }, null, 2)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "life-os-" + iso(new Date()) + ".json";
              document.body.appendChild(a); a.click(); a.remove();
              setToast({ msg: "Backup downloaded." });
            }}>↓</button>
            <button className="icon-btn" title="Sync with Notion now" onClick={runSync}>⟳</button>
            <button className="icon-btn" title="Keyboard shortcuts & syntax" onClick={() => setShowHelp(true)}>?</button>
          </div>
        </div>

        <div className="stats">
          {([
            ["Open", open.length, ""],
            ["Due today", dt.length, dt.length ? "alert" : ""],
            ["Overdue", od.length, od.length ? "alert" : ""],
            ["Waiting on you", blockedSessions.length, blockedSessions.length ? "alert" : ""],
            ["Done / 7d", week.length, week.length ? "good" : ""],
          ] as const).map(([l, v, cls]) => (
            <div className={"stat " + cls} key={l}>
              <div className="stat-v">{v}</div>
              <div className="stat-l">{l}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="capture-wrap">
        <div className="capture">
          <span className="capture-dot" />
          {dumpMode ? (
            <textarea
              id="capture-area" ref={areaRef} value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="One thought per line — paste a whole brain dump here and hit ⌘/Ctrl + Enter."
            />
          ) : (
            <input
              id="capture-input" ref={inputRef} value={draft} autoComplete="off" spellCheck={false}
              onChange={(e) => setDraft(e.target.value)}
              placeholder='Dump anything… "call the accountant fri !! ~20m #work"'
            />
          )}
          <div className="capture-actions">
            <button
              className={"mini" + (dumpMode ? " on" : "")}
              onClick={() => { setDumpMode(!dumpMode); setDraft(""); }}
            >
              {dumpMode ? "single" : "dump"}
            </button>
            <button className="add-btn" onClick={() => capture(draft)}>Add</button>
          </div>
        </div>
        <div className="parse-preview">
          {dumpMode && dumpLines > 0 && <span>{dumpLines} {dumpLines === 1 ? "line" : "lines"} ready — ⌘/Ctrl + Enter to capture.</span>}
          {preview && (
            <>
              <span>→</span>
              <span style={{ color: "var(--body)" }}>{trunc(preview.text, 46)}</span>
              <Chips item={{ ...preview, id: "", raw: "", created: Date.now(), updated: Date.now(), done: false, doneAt: null, pinned: false } as Item} />
            </>
          )}
        </div>
      </div>

      <nav className="tabs">
        {TABS.map((t) => {
          const count =
            t === "focus" ? open.length :
            t === "business" ? blockedSessions.length || null :
            t === "all" ? items.filter((i) => !i.done).length :
            t === "notes" ? notes(items).length :
            t === "review" ? stale(items, capacity).length || null : null;
          return (
            <button
              key={t}
              className={"tab" + (tab === t ? " on" : "")}
              onClick={() => { setTab(t); setExpandAll(false); }}
            >
              {TAB_LABEL[t]}
              {count ? <span className="count">{count}</span> : null}
            </button>
          );
        })}
      </nav>

      <main>
        {syncNote && <div className="notice">{syncNote}</div>}
        {live.errors.map((e, i) => <div className="notice" key={i}>{e}</div>)}

        {tab === "focus" && (
          <FocusView
            items={items} open={open} od={od} capacity={capacity}
            events={todaysEvents} calendarOn={live.events.length > 0}
            blockedSessions={blockedSessions} onCapture={capture}
            rowProps={rowProps} actions={actions} expandAll={expandAll}
            setExpandAll={setExpandAll} sel={sel} setTab={setTab}
          />
        )}

        {tab === "business" && (
          <>
            {live.sessions.length === 0 && live.projects.length === 0 ? (
              <div className="card"><div className="empty">
                <strong>No business data connected yet.</strong>
                Set <code>NOTION_DB_SESSIONS</code> and <code>NOTION_DB_PROJECTS</code> to light this up.
              </div></div>
            ) : (
              <>
                {live.sessions.length > 0 && (
                  <section>
                    <div className="sec-head">
                      <div className="sec-title">Claude sessions</div>
                      <div className="sec-sub">
                        refreshed daily — a snapshot, not a live feed
                      </div>
                    </div>
                    <SessionsPanel sessions={live.sessions} onCapture={capture} />
                  </section>
                )}
                {live.projects.length > 0 && (
                  <section>
                    <div className="sec-head">
                      <div className="sec-title">Live projects</div>
                      <div className="sec-sub">{live.projects.length} open · edit in Notion</div>
                    </div>
                    <ProjectsPanel projects={live.projects} />
                  </section>
                )}
              </>
            )}
          </>
        )}

        {tab === "all" && (
          <AllView
            items={items} capacity={capacity} search={search} setSearch={setSearch}
            rowProps={rowProps}
          />
        )}

        {tab === "notes" && <NotesView items={items} rowProps={rowProps} />}

        {tab === "review" && (
          <ReviewView items={items} capacity={capacity} rowProps={rowProps} actions={actions} />
        )}

        {tab === "done" && <DoneView items={items} rowProps={rowProps} />}
      </main>

      <footer>
        <span className="sync">
          <span className={"sync-dot " + (syncState === "idle" ? "ok" : syncState === "syncing" ? "busy" : syncState === "error" ? "err" : "")} />
          {syncState === "off" ? "Local to this browser"
            : syncState === "syncing" ? "Syncing with Notion…"
              : syncState === "error" ? "Sync problem — saved locally"
                : store.pending.length ? `${store.pending.length} waiting to sync`
                  : "Synced with Notion"}
        </span>
        {" · "}{store.items.filter((i) => !i.deleted).length} items
      </footer>

      {toast && (
        <div className="toast show">
          <span>{toast.msg}</span>
          {toast.action && (
            <button onClick={() => { const a = toast.action!; setToast(null); a(); }}>
              {toast.label}
            </button>
          )}
        </div>
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Views
// ─────────────────────────────────────────────────────────────

type RowPropsFn = (it: Item, showAge?: boolean) => React.ComponentProps<typeof ItemRow>;

function Section({ title, sub, swatch, children }: {
  title: string; sub?: string | null; swatch?: string; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="sec-head">
        <div className="sec-title">
          {swatch && <span className="swatch" style={{ background: swatch }} />}
          {title}
        </div>
        {sub && <div className="sec-sub">{sub}</div>}
      </div>
      {children}
    </section>
  );
}

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="card">
      <div className="empty"><strong>{title}</strong>{sub}</div>
    </div>
  );
}

function List({ items, rowProps }: { items: Item[]; rowProps: RowPropsFn }) {
  if (!items.length) return null;
  return (
    <div className="card">
      {items.map((it) => <ItemRow key={it.id} {...rowProps(it)} />)}
    </div>
  );
}

function FocusView({
  items, open, od, capacity, events, calendarOn, blockedSessions,
  onCapture, rowProps, actions, expandAll, setExpandAll, sel, setTab,
}: {
  items: Item[]; open: Item[]; od: Item[]; capacity: Capacity;
  events: LiveData["events"]; calendarOn: boolean;
  blockedSessions: LiveData["sessions"]; onCapture: (t: string) => void;
  rowProps: RowPropsFn; actions: RowActions;
  expandAll: boolean; setExpandAll: (b: boolean) => void;
  sel: string | null; setTab: (t: Tab) => void;
}) {
  const woke = items.filter((i) => !i.done && i.snoozeUntil && daysUntil(i.snoozeUntil) === 0);
  const top = open.slice(0, 3);
  const quick = open.filter((i) => !top.includes(i) && !od.includes(i) && i.effort != null && i.effort <= 20).slice(0, 6);
  const rest = open.filter((i) => !top.includes(i) && !od.includes(i) && !quick.includes(i));
  const shown = expandAll ? rest : rest.slice(0, 8);

  return (
    <div>
      <TodayStrip events={events} capacity={capacity} configured={calendarOn} />

      {blockedSessions.length > 0 && (
        <Section
          title="Waiting on you"
          sub={`${blockedSessions.length} Claude ${blockedSessions.length === 1 ? "session" : "sessions"} stalled until you answer`}
          swatch="var(--rose)"
        >
          <SessionsPanel sessions={blockedSessions} onCapture={onCapture} />
        </Section>
      )}

      {woke.length > 0 && (
        <div className="banner">
          <div>
            <b>{woke.length} snoozed {woke.length === 1 ? "item is" : "items are"} back.</b>{" "}
            You parked {woke.length === 1 ? "it" : "them"} until today.
          </div>
        </div>
      )}

      {open.length === 0 ? (
        <Empty
          title={items.length ? "Nothing on your plate." : "Empty. Start dumping."}
          sub={items.length
            ? "Everything is done, snoozed or filed. Enjoy it."
            : "Type anything into the bar above and hit Enter — sort it out later."}
        />
      ) : (
        <Section title="Do these first" sub={`${top.length} of ${open.length} open`}>
          <div className="focus-grid">
            {top.map((it, n) => (
              <div
                className={"focus-card" + (sel === it.id ? " sel" : "")}
                data-id={it.id} key={it.id}
                onClick={() => actions.select(it.id)}
              >
                <div className="focus-rank">{["1st", "2nd", "3rd"][n]}</div>
                <div className="focus-text">{it.text}</div>
                <div className="focus-why">→ {reason(it, capacity)}</div>
                <div className="row-meta">
                  <Chips item={it} needsBlock={needsBlock(it, capacity)} />
                </div>
                <div className="focus-foot">
                  <button
                    className="focus-do"
                    onClick={(e) => { e.stopPropagation(); actions.toggleDone(it.id); }}
                  >
                    Mark done
                  </button>
                  <div className="row-actions" style={{ opacity: 1 }}>
                    <button className="act" title="Snooze to tomorrow"
                      onClick={(e) => { e.stopPropagation(); actions.snooze(it.id, 1, "till tomorrow"); }}>☾</button>
                    <button className={"act" + (it.pinned ? " pinned" : "")} title="Pin"
                      onClick={(e) => { e.stopPropagation(); actions.togglePin(it.id); }}>
                      {it.pinned ? "★" : "☆"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {od.filter((i) => !top.includes(i)).length > 0 && (
        <Section title="Overdue" sub="past their date — do, reschedule or drop" swatch="var(--rose)">
          <List items={od.filter((i) => !top.includes(i))} rowProps={rowProps} />
        </Section>
      )}

      {quick.length > 0 && (
        <Section title="Quick wins" sub="under 20 minutes each" swatch="var(--sage)">
          <List items={quick} rowProps={rowProps} />
        </Section>
      )}

      {rest.length > 0 && (
        <Section title="On deck" sub="in priority order" swatch="var(--faintest)">
          <div className="card">
            {shown.map((it) => <ItemRow key={it.id} {...rowProps(it, true)} />)}
          </div>
          {rest.length > 8 && (
            <button className="mini" style={{ marginTop: 8 }} onClick={() => setExpandAll(!expandAll)}>
              {expandAll ? "Show less" : `Show ${rest.length - 8} more`}
            </button>
          )}
        </Section>
      )}
    </div>
  );
}

function AllView({
  items, capacity, search, setSearch, rowProps,
}: {
  items: Item[]; capacity: Capacity; search: string;
  setSearch: (s: string) => void; rowProps: RowPropsFn;
}) {
  const q = search.trim().toLowerCase();
  let open = items.filter((i) => !i.done);
  if (q) {
    open = open.filter((i) =>
      (i.text + " " + (i.area ?? "") + " " + i.tags.join(" ")).toLowerCase().includes(q));
  }
  const areas = [...new Set(items.filter((i) => !i.done && i.area).map((i) => i.area!))].sort();
  const tasks = open.filter((i) => i.kind === "task" && !isSnoozed(i)).sort((a, b) => score(b, capacity) - score(a, capacity));
  const snz = open.filter(isSnoozed);
  const nts = open.filter(isNoteKind);

  return (
    <div>
      <div className="filter-bar">
        <input id="search" placeholder="Search everything…" value={search}
          onChange={(e) => setSearch(e.target.value)} />
        {areas.map((a) => (
          <button key={a} className={"chip btn" + (search === a ? " area" : "")}
            style={search === a ? { color: areaColour(a) } : undefined}
            onClick={() => setSearch(search === a ? "" : a)}>#{a}</button>
        ))}
      </div>
      {!open.length ? (
        <Empty title={q ? "No matches." : "Nothing open."} sub={q ? "Try a different word." : "Add something above."} />
      ) : (
        <>
          {tasks.length > 0 && (
            <Section title="Open tasks" sub={`${tasks.length} — highest priority first`}>
              <div className="card">{tasks.map((it) => <ItemRow key={it.id} {...rowProps(it, true)} />)}</div>
            </Section>
          )}
          {nts.length > 0 && (
            <Section title="Notes & ideas" sub={`${nts.length} filed`} swatch="var(--lilac)">
              <List items={nts} rowProps={rowProps} />
            </Section>
          )}
          {snz.length > 0 && (
            <Section title="Snoozed" sub="out of sight until their day" swatch="var(--faintest)">
              <List items={snz} rowProps={rowProps} />
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function NotesView({ items, rowProps }: { items: Item[]; rowProps: RowPropsFn }) {
  const n = notes(items);
  if (!n.length) {
    return <Empty title="No notes or ideas yet."
      sub="Start a line with “idea:” or “note:” to file it here instead of your task list." />;
  }
  const ideas = n.filter((i) => i.kind === "idea");
  const thoughts = n.filter((i) => i.kind === "note");
  return (
    <div>
      {ideas.length > 0 && (
        <Section title="Ideas" sub={`${ideas.length} parked`} swatch="var(--lilac)">
          <List items={ideas} rowProps={rowProps} />
        </Section>
      )}
      {thoughts.length > 0 && (
        <Section title="Notes" sub={`${thoughts.length} filed`} swatch="var(--faintest)">
          <List items={thoughts} rowProps={rowProps} />
        </Section>
      )}
    </div>
  );
}

function DoneView({ items, rowProps }: { items: Item[]; rowProps: RowPropsFn }) {
  const d = doneItems(items);
  if (!d.length) return <Empty title="Nothing completed yet." sub="Tick something off and it lands here." />;
  return (
    <Section title="Completed"
      sub={`${d.length} all time · ${doneThisWeek(items).length} in the last 7 days`} swatch="var(--sage)">
      <List items={d.slice(0, 60)} rowProps={rowProps} />
    </Section>
  );
}

function ReviewView({
  items, capacity, rowProps, actions,
}: {
  items: Item[]; capacity: Capacity; rowProps: RowPropsFn; actions: RowActions;
}) {
  const all = activeTasks(items, capacity);
  const st = stale(items, capacity);
  const sn = snoozedItems(items);
  const week = doneThisWeek(items);
  const oldest = all.length ? all.reduce((a, b) => (a.created < b.created ? a : b)) : null;

  const buckets: Record<string, Item[]> = {};
  all.forEach((i) => { (buckets[i.area ?? "unfiled"] ||= []).push(i); });
  const keys = Object.keys(buckets).sort((a, b) => buckets[b].length - buckets[a].length);
  const max = keys.length ? Math.max(...keys.map((k) => buckets[k].length)) : 1;

  return (
    <div>
      {st.length > 0 && (
        <Section title="Needs a decision"
          sub="carried for 2+ weeks with no date — do it, date it, or drop it" swatch="var(--amber)">
          <div className="card">
            {st.map((it) => (
              <ItemRow key={it.id} {...rowProps(it, true)}
                extraAction={{ label: "→", title: "Do it this week", onClick: () => actions.setDue(it.id, 5) }} />
            ))}
          </div>
        </Section>
      )}

      {keys.length > 0 && (
        <Section title="Where your load sits"
          sub="open items by area — the long bars are where your life is leaning">
          <div className="card">
            {keys.map((k) => (
              <div className="area-row" key={k}>
                <div className="area-name">
                  <span className="swatch" style={{
                    width: 8, height: 8, borderRadius: "50%", display: "inline-block",
                    background: areaColour(k === "unfiled" ? null : k),
                  }} />
                  {k}
                </div>
                <div className="area-track">
                  <div className="area-fill" style={{
                    width: (buckets[k].length / max) * 100 + "%",
                    background: areaColour(k === "unfiled" ? null : k),
                  }} />
                </div>
                <div className="area-n">{buckets[k].length} open</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {sn.length > 0 && (
        <Section title="Parked" sub={`${sn.length} snoozed — nothing is lost, it just isn't now`} swatch="var(--faintest)">
          <List items={sn} rowProps={rowProps} />
        </Section>
      )}

      <Section title="This week">
        <div className="card">
          <div className="empty" style={{ textAlign: "left", padding: 15 }}>
            <div style={{ color: "var(--body)", fontSize: 13.5, lineHeight: 1.9 }}>
              You closed <b>{week.length}</b> {week.length === 1 ? "item" : "items"} in the last 7 days.<br />
              <b>{all.length}</b> open · <b>{overdue(items, capacity).length}</b> overdue ·{" "}
              <b>{notes(items).length}</b> notes &amp; ideas parked.<br />
              {oldest && <>Oldest open item: “{trunc(oldest.text, 46)}” — {daysSince(oldest.created)} days.</>}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  const syntax: [string, string][] = [
    ["fri, tomorrow, 12/09, sep 14, in 3 days, eow", "sets a date"],
    ["!  !!  !!!", "importance"],
    ["#health  #work", "area"],
    ["~20m  ~2h", "how long it'll take"],
    ["@sarah", "who it involves"],
    ["idea: … / note: …", "files it away instead of as a task"],
    ["someday: …", "parks it for a month"],
  ];
  const keys: [string, string][] = [
    ["/", "jump to the capture bar"],
    ["Enter", "capture (⌘/Ctrl + Enter in dump mode)"],
    ["j / k", "move down / up the list"],
    ["x", "complete the selected item"],
    ["e", "edit it"], ["s", "snooze to tomorrow"], ["S", "snooze a week"],
    ["p", "pin to the top"], ["t", "due today"], ["w", "due in a week"],
    ["1 2 3", "set importance ! !! !!!"], ["#", "delete"], ["u", "undo"],
    ["1–6 (no selection)", "switch tab"], ["?", "this panel"],
  ];
  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h3>Capture syntax</h3>
        <div className="kb">
          {syntax.map(([k, v]) => (
            <Fragment key={k}><kbd>{k}</kbd><span>{v}</span></Fragment>
          ))}
        </div>
        <h3 style={{ marginTop: 22 }}>Keyboard</h3>
        <div className="kb">
          {keys.map(([k, v]) => (
            <Fragment key={k}><kbd>{k}</kbd><span>{v}</span></Fragment>
          ))}
        </div>
        <div className="modal-foot">
          <button className="add-btn" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
