import { bg, ink } from "@/lib/theme";

export default function TopBar({ accent }: { accent: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "11px 26px",
        borderBottom: "1px solid #00000010",
        position: "sticky",
        top: 0,
        background: bg,
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, color: ink.muted, fontSize: 14 }}>
        <span style={{ width: 16, height: 16, borderRadius: 5, background: accent, display: "inline-block" }} />
        <span style={{ color: ink.secondary }}>The Digital Engine — HQ</span>
        <span style={{ color: "#c9c3ba" }}>·</span>
        <span style={{ color: ink.faint }}>Private</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, color: ink.faint, fontSize: 13 }}>
        <span>Edited just now</span>
        <span
          style={{
            padding: "6px 13px",
            border: "1px solid #00000012",
            borderRadius: 7,
            color: ink.secondary,
            background: "#fff",
          }}
        >
          Share
        </span>
      </div>
    </div>
  );
}
