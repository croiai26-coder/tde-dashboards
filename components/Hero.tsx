import { fontDisplay, ink, soft, border40 } from "@/lib/theme";

export default function Hero({ accent, greeting }: { accent: string; greeting: string }) {
  return (
    <div style={{ padding: "52px 0 8px" }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: soft(accent),
          border: `1px solid ${border40(accent)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ width: 22, height: 22, borderRadius: 7, background: accent, display: "block" }} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
          marginTop: 22,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: fontDisplay,
              fontWeight: 600,
              fontSize: 40,
              letterSpacing: "-0.5px",
              color: ink.primary,
            }}
          >
            The Digital Engine — HQ
          </h1>
          <p style={{ margin: "12px 0 0", color: ink.muted, fontSize: 16 }}>
            {greeting} You&apos;re setting up — this fills in as you land clients and start builds.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 15px",
              background: accent,
              borderRadius: 9,
              fontSize: 14,
              color: "#fff",
              fontWeight: 500,
            }}
          >
            Add first client
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 15px",
              background: "#fff",
              border: "1px solid #00000012",
              borderRadius: 9,
              fontSize: 14,
              color: ink.secondary,
              fontWeight: 500,
            }}
          >
            New build
          </span>
        </div>
      </div>
    </div>
  );
}
