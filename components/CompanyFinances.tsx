import { fontDisplay, ink, cardShadow, c3 } from "@/lib/theme";
import type { ViewModel } from "@/lib/data";

export default function CompanyFinances({ finances }: { finances: ViewModel["finances"] }) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #00000010",
        borderRadius: 16,
        padding: "18px 18px 20px",
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
          marginBottom: 16,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: c3 }} />
        Company Finances
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: ink.primary,
            letterSpacing: "-0.5px",
            fontFamily: fontDisplay,
          }}
        >
          {finances.thisMonth}
        </span>
        <span style={{ fontSize: 13, color: ink.faint, fontWeight: 500 }}>this month</span>
      </div>
      <div style={{ color: ink.faint, fontSize: 12.5, marginTop: 2 }}>
        Revenue charts here once invoices are paid
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 52, marginTop: 16 }}>
        {finances.revBars.map((_, i) => (
          <div key={i} style={{ flex: 1, borderRadius: "3px 3px 0 0", background: finances.barColor, height: "14%" }} />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid #00000010",
        }}
      >
        <div>
          <div style={{ color: ink.faint, fontSize: 12 }}>Recurring out</div>
          <div style={{ color: ink.secondary, fontSize: 16, fontWeight: 600, marginTop: 3, fontFamily: fontDisplay }}>
            {finances.recurringOut}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: ink.faint, fontSize: 12 }}>Overdue</div>
          <div style={{ color: ink.secondary, fontSize: 16, fontWeight: 600, marginTop: 3, fontFamily: fontDisplay }}>
            {finances.overdue}
          </div>
        </div>
      </div>
    </section>
  );
}
