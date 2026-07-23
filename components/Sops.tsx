import { fontDisplay, ink, cardShadow, c3 } from "@/lib/theme";
import type { ViewModel } from "@/lib/data";

export default function Sops({ sops }: { sops: ViewModel["sops"] }) {
  return (
    <section>
      <h2
        style={{
          margin: "0 0 12px",
          fontFamily: fontDisplay,
          fontWeight: 600,
          fontSize: 18,
          color: ink.primary,
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: c3 }} />
        SOPs &amp; Templates
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {sops.map((doc) => (
          <div
            key={doc.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 13px",
              background: "#fff",
              border: "1px solid #00000010",
              borderRadius: 10,
              boxShadow: cardShadow,
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: doc.bg,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ width: 11, height: 13, borderRadius: 2, background: doc.color }} />
            </span>
            <span style={{ fontSize: 13, color: ink.body, fontWeight: 500 }}>{doc.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
