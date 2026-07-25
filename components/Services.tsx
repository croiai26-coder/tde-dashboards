import { fontDisplay, ink, cardShadow, c5 } from "@/lib/theme";
import type { ViewModel } from "@/lib/data";
import SectionHeader from "./SectionHeader";

export default function Services({ services }: { services: ViewModel["services"] }) {
  return (
    <section>
      <SectionHeader title="Services & Pricing" dotColor={c5} right="Edit packages →" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
        {services.map((s) => (
          <div
            key={s.name}
            style={{
              background: "#fff",
              border: "1px solid #00000010",
              borderRadius: 13,
              padding: "15px 16px",
              boxShadow: cardShadow,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: 14.5, color: ink.primary, fontWeight: 600 }}>{s.name}</span>
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: 19, color: ink.primary, fontWeight: 600, fontFamily: fontDisplay }}>
                {s.price}
              </span>
              <span style={{ fontSize: 12, color: ink.faint }}>{s.note}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
