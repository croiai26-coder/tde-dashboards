import { fontDisplay, ink, cardShadow, c5 } from "@/lib/theme";
import type { ViewModel } from "@/lib/data";

export default function Invoices({
  invoiceStats,
  hint,
}: {
  invoiceStats: ViewModel["invoiceStats"];
  hint: string;
}) {
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
          marginBottom: 14,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: c5 }} />
        Invoices
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>
        {invoiceStats.map((iv) => (
          <div key={iv.label} style={{ textAlign: "center", padding: "12px 6px", background: iv.bg, borderRadius: 11 }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: iv.fg, fontFamily: fontDisplay }}>{iv.value}</div>
            <div style={{ fontSize: 11.5, color: ink.faint, marginTop: 2 }}>{iv.label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 12.5, color: ink.faint, textAlign: "center" }}>{hint}</div>
    </section>
  );
}
