import { fontDisplay, ink, cardShadow, c3 } from "@/lib/theme";
import type { ViewModel } from "@/lib/data";

export default function BillsSubscriptions({
  calendar,
  bills,
}: {
  calendar: ViewModel["calendar"];
  bills: ViewModel["bills"];
}) {
  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: fontDisplay,
            fontWeight: 600,
            fontSize: 22,
            color: ink.primary,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: c3 }} />
          Bills &amp; Subscriptions
        </h2>
        <span style={{ color: ink.secondary, fontSize: 13, fontWeight: 500 }}>
          {calendar.monthLabel} · <span style={{ color: ink.primary }}>{calendar.monthTotal}</span>/mo
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16, alignItems: "start" }}>
        {/* month grid */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #00000010",
            borderRadius: 14,
            padding: 16,
            boxShadow: cardShadow,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
            {calendar.weekdays.map((wd) => (
              <div key={wd} style={{ textAlign: "center", fontSize: 11, color: ink.faintest, letterSpacing: "0.4px" }}>
                {wd}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
            {calendar.cells.map((d, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: "1",
                  borderRadius: 8,
                  background: d.cellBg,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  position: "relative",
                }}
              >
                <span style={{ fontSize: 12.5, color: d.numColor, fontWeight: d.numWeight }}>{d.label}</span>
                {d.hasBill && (
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: d.billColor }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* bill list */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #00000010",
            borderRadius: 14,
            padding: "6px 15px",
            boxShadow: cardShadow,
          }}
        >
          {bills.map((b, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: `1px solid ${b.last ? "transparent" : "#00000008"}`,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: b.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    color: ink.primary,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {b.name}
                </div>
                <div style={{ fontSize: 11.5, color: ink.faint }}>
                  {b.due} · {b.cadence}
                </div>
              </div>
              <span style={{ fontSize: 13.5, color: ink.secondary, fontWeight: 600, fontFamily: fontDisplay }}>
                {b.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
