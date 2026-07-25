"use client";

import { useState } from "react";
import { ink, cardShadow, c5 } from "@/lib/theme";
import SectionHeader from "./SectionHeader";

export default function Onboarding({
  steps,
}: {
  steps: { id: string; title: string; step: string }[];
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setDone((s) => ({ ...s, [id]: !s[id] }));

  return (
    <section>
      <SectionHeader title="Client Onboarding" dotColor={c5} right="Reusable template" />
      <div
        style={{
          background: "#fff",
          border: "1px solid #00000010",
          borderRadius: 14,
          padding: "4px 16px",
          boxShadow: cardShadow,
        }}
      >
        {steps.map((o, i) => {
          const d = !!done[o.id];
          return (
            <div
              key={o.id}
              onClick={() => toggle(o.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderBottom: `1px solid ${i === steps.length - 1 ? "transparent" : "#00000008"}`,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  border: `1.5px solid ${d ? c5 : "#cfc8bd"}`,
                  background: d ? c5 : "transparent",
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
                {o.title}
              </span>
              <span style={{ fontSize: 11.5, color: ink.faintest }}>{o.step}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
