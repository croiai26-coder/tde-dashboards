import { ink, cardShadow } from "@/lib/theme";
import type { ViewModel } from "@/lib/data";
import SectionHeader from "./SectionHeader";

export default function BusinessPlan({
  plan,
  accent,
}: {
  plan: ViewModel["plan"];
  accent: string;
}) {
  return (
    <section style={{ marginTop: 34 }}>
      <SectionHeader title="Business Plan" dotColor={accent} right="Open full plan →" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
        {plan.map((p) => (
          <div
            key={p.label}
            style={{
              background: "#fff",
              border: "1px solid #00000010",
              borderRadius: 14,
              padding: "16px 17px",
              boxShadow: cardShadow,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color }} />
              <span
                style={{
                  fontSize: 12,
                  color: ink.muted,
                  letterSpacing: "0.3px",
                  textTransform: "uppercase",
                }}
              >
                {p.label}
              </span>
            </div>
            <div style={{ fontSize: 14, color: ink.body, lineHeight: 1.5 }}>{p.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
