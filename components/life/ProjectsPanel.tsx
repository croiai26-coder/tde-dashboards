"use client";

import { dueLabel, dueClass } from "@/lib/life/dates";
import type { BizProject } from "@/lib/life/types";

const STATUS_COLOUR: Record<string, string> = {
  "At risk": "var(--rose)",
  "Waiting on client": "var(--amber)",
  "In progress": "var(--accent)",
  "Not started": "var(--faintest)",
};

/** Live work from Projects & Delivery — read-only here; Notion stays the
 *  place you actually edit it. */
export function ProjectsPanel({ projects }: { projects: BizProject[] }) {
  if (!projects.length) return null;
  return (
    <div className="card">
      {projects.map((p) => (
        <div className="proj-row" key={p.id}>
          <span
            className="sess-dot"
            style={{ marginTop: 0, background: STATUS_COLOUR[p.status] ?? "var(--faintest)" }}
            title={p.status}
          />
          <span className="proj-name">
            {p.url ? <a href={p.url} target="_blank" rel="noreferrer">{p.name}</a> : p.name}
          </span>
          {p.business && (
            <span className="chip" style={{ flexShrink: 0 }}>
              {p.business === "The Digital Engine" ? "TDE" : p.business === "The Once Over" ? "TOO" : p.business}
            </span>
          )}
          {p.phase && <span className="chip" style={{ flexShrink: 0 }}>{p.phase}</span>}
          <span className="chip" style={{ color: STATUS_COLOUR[p.status], flexShrink: 0 }}>
            {p.status}
          </span>
          {p.deadline && (
            <span className={"chip " + dueClass(p.deadline)} style={{ flexShrink: 0 }}>
              {p.hardDeadline ? "hard · " : ""}{dueLabel(p.deadline)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
