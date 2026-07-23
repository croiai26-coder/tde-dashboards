import { fontDisplay, ink, cardShadow } from "@/lib/theme";
import type { ViewModel } from "@/lib/data";

export default function KpiStrip({ kpis }: { kpis: ViewModel["kpis"] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
        gap: 12,
        marginTop: 34,
      }}
    >
      {kpis.map((k) => (
        <div
          key={k.label}
          style={{
            padding: "16px 16px 15px",
            background: "#fff",
            border: "1px solid #00000010",
            borderRadius: 14,
            boxShadow: cardShadow,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: ink.muted, fontSize: 13 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: k.dot }} />
            <span>{k.label}</span>
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 27,
              fontWeight: 600,
              color: ink.primary,
              letterSpacing: "-0.5px",
              fontFamily: fontDisplay,
            }}
          >
            {k.value}
          </div>
          <div style={{ marginTop: 3, color: ink.faint, fontSize: 12 }}>{k.sub}</div>
        </div>
      ))}
    </div>
  );
}
