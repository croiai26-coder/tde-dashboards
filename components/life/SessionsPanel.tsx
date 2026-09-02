"use client";

import { daysSince } from "@/lib/life/dates";
import type { SessionStatus } from "@/lib/life/types";

const STATE_COLOUR: Record<string, string> = {
  "waiting on you": "var(--rose)",
  "ready to review": "var(--amber)",
  working: "var(--accent)",
  idle: "var(--faintest)",
  done: "var(--sage)",
};

/** What every Claude session working on your businesses is doing, and what
 *  each one is waiting on you for. Refreshed by a scheduled routine, so this
 *  is a daily snapshot rather than a live feed. */
export function SessionsPanel({
  sessions, onCapture,
}: {
  sessions: SessionStatus[];
  /** Turn "needs from me" straight into a task in the inbox. */
  onCapture: (text: string) => void;
}) {
  if (!sessions.length) return null;

  return (
    <div className="card">
      {sessions.map((s) => {
        const stale = s.lastActive ? daysSince(+new Date(s.lastActive)) : 0;
        const blocked = s.state === "waiting on you";
        return (
          <div className="sess-row" key={s.id}>
            <span
              className="sess-dot"
              style={{ background: STATE_COLOUR[s.state] ?? "var(--faintest)" }}
              title={s.state}
            />
            <div className="sess-main">
              <div className="sess-title">{s.title}</div>
              {s.workingOn && <div className="sess-work">{s.workingOn}</div>}
              {blocked && s.needsFromMe && (
                <div className="sess-need">
                  <b>Needs you:</b> {s.needsFromMe}
                </div>
              )}
              <div className="row-meta" style={{ marginTop: 7 }}>
                <span className="chip" style={{ color: STATE_COLOUR[s.state] }}>{s.state}</span>
                {s.business && <span className="chip">{s.business}</span>}
                {stale >= 7 && <span className="chip due-over">{stale}d untouched</span>}
              </div>
              <div className="sess-actions">
                {s.link && (
                  <a className="sess-open" href={s.link} target="_blank" rel="noreferrer">
                    Open session ↗
                  </a>
                )}
                {blocked && s.needsFromMe && (
                  <button
                    className="sess-open"
                    onClick={() => onCapture(s.needsFromMe + " !! #" + (s.business === "The Once Over" ? "too" : "tde"))}
                  >
                    + Add to my list
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
