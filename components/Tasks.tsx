"use client";

import { useState } from "react";
import { fontDisplay, ink, cardShadow } from "@/lib/theme";

export default function Tasks({
  tasks,
  accent,
}: {
  tasks: { id: string; title: string; done: boolean }[];
  accent: string;
}) {
  const [done, setDone] = useState<Record<string, boolean>>(
    Object.fromEntries(tasks.map((t) => [t.id, t.done])),
  );
  const toggle = (id: string) => setDone((s) => ({ ...s, [id]: !s[id] }));
  const doneCount = tasks.filter((t) => done[t.id]).length;

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: fontDisplay,
            fontWeight: 600,
            fontSize: 18,
            color: ink.primary,
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent }} />
          Setup checklist
        </h2>
        <span style={{ color: ink.faint, fontSize: 13 }}>
          {doneCount}/{tasks.length}
        </span>
      </div>
      <div
        style={{
          background: "#fff",
          border: "1px solid #00000010",
          borderRadius: 12,
          padding: "4px 14px",
          boxShadow: cardShadow,
        }}
      >
        {tasks.map((t, i) => {
          const d = !!done[t.id];
          return (
            <div
              key={t.id}
              onClick={() => toggle(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "11px 0",
                borderBottom: `1px solid ${i === tasks.length - 1 ? "transparent" : "#00000008"}`,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  border: `1.5px solid ${d ? accent : "#cfc8bd"}`,
                  background: d ? accent : "transparent",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {d ? "✓" : ""}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: d ? ink.faintest : ink.primary,
                  textDecoration: d ? "line-through" : "none",
                }}
              >
                {t.title}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
