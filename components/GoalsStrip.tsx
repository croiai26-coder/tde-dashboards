import { fontDisplay, ink, cardShadow } from "@/lib/theme";
import type { ViewModel } from "@/lib/data";

export default function GoalsStrip({ goals }: { goals: ViewModel["goals"] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
        gap: 12,
        marginTop: 12,
      }}
    >
      {goals.map((g) => (
        <div
          key={g.label}
          style={{
            padding: "16px 17px",
            background: "#fff",
            border: "1px solid #00000010",
            borderRadius: 14,
            boxShadow: cardShadow,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 13, color: ink.muted }}>{g.label}</span>
            <span style={{ fontSize: 12, color: ink.faintest }}>{g.by}</span>
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 600, color: ink.primary, fontFamily: fontDisplay }}>
              {g.now}
            </span>
            <span style={{ fontSize: 13, color: ink.faint }}>/ {g.target}</span>
          </div>
          <div
            style={{
              marginTop: 11,
              height: 7,
              borderRadius: 4,
              background: "#00000008",
              overflow: "hidden",
            }}
          >
            <div style={{ height: "100%", width: g.pct, borderRadius: 4, background: g.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
