import { ink, cardShadow, c4 } from "@/lib/theme";
import type { ViewModel } from "@/lib/data";
import SectionHeader from "./SectionHeader";

export default function ContentWeek({ content }: { content: ViewModel["content"] }) {
  return (
    <section>
      <SectionHeader title="Content This Week" dotColor={c4} right="Social Media →" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
        {content.map((d, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              border: "1px solid #00000010",
              borderRadius: 12,
              padding: "10px 8px",
              boxShadow: cardShadow,
            }}
          >
            <div style={{ fontSize: 11.5, color: ink.muted, textAlign: "center", fontWeight: 500 }}>{d.wd}</div>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 56,
                border: "1.5px dashed #00000012",
                borderRadius: 9,
                color: d.plusColor,
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              {d.mark}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
