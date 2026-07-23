"use client";

import { useEffect, useState } from "react";
import { fontSans, ink, cardShadow, soft, border40 } from "@/lib/theme";

const STORAGE_KEY = "tde_notes";

export default function QuickNotes({ accent }: { accent: string }) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try {
      const n = localStorage.getItem(STORAGE_KEY);
      if (n != null) setNotes(n);
    } catch {
      /* ignore */
    }
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setNotes(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  };

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #00000010",
        borderRadius: 16,
        padding: "16px 17px 17px",
        boxShadow: cardShadow,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          color: ink.secondary,
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent }} />
        Quick Notes
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "9px 12px",
          background: soft(accent),
          border: `1px solid ${border40(accent)}`,
          borderRadius: 10,
          marginBottom: 11,
        }}
      >
        <span style={{ color: accent, fontSize: 16, fontWeight: 600, lineHeight: 1 }}>+</span>
        <span style={{ fontSize: 13, color: ink.muted }}>Jot a lead, idea or to-do…</span>
      </div>
      <textarea
        value={notes}
        onChange={onChange}
        placeholder="Type here — saves automatically."
        style={{
          width: "100%",
          minHeight: 120,
          resize: "vertical",
          border: "1px solid #00000012",
          borderRadius: 10,
          padding: "11px 12px",
          fontFamily: fontSans,
          fontSize: 13.5,
          color: ink.primary,
          lineHeight: 1.55,
          background: "#fafaf7",
          outline: "none",
        }}
      />
    </section>
  );
}
