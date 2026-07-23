import { fontDisplay, ink, cardShadow, c4, soft, border40 } from "@/lib/theme";
import type { ViewModel } from "@/lib/data";
import SectionHeader from "./SectionHeader";

export default function Meetings({
  meetings,
  accent,
}: {
  meetings: ViewModel["meetings"];
  accent: string;
}) {
  return (
    <section>
      <SectionHeader title="Upcoming" dotColor={c4} right="Meetings →" small />
      {meetings.length === 0 ? (
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            background: "#fff",
            border: "1px solid #00000010",
            borderRadius: 12,
            boxShadow: cardShadow,
          }}
        >
          <div style={{ fontSize: 14, color: ink.secondary, fontWeight: 500 }}>Nothing scheduled</div>
          <div style={{ fontSize: 12.5, color: ink.faint, marginTop: 3 }}>Discovery calls and reviews land here.</div>
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1px solid #00000010",
            borderRadius: 12,
            padding: "4px 14px",
            boxShadow: cardShadow,
          }}
        >
          {meetings.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderBottom: `1px solid ${i === meetings.length - 1 ? "transparent" : "#00000008"}`,
              }}
            >
              <div
                style={{
                  width: 42,
                  textAlign: "center",
                  background: soft(accent),
                  border: `1px solid ${border40(accent)}`,
                  borderRadius: 9,
                  padding: "4px 0",
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: 10, color: accent, fontWeight: 600, textTransform: "uppercase" }}>{m.month}</div>
                <div style={{ fontSize: 16, color: ink.primary, fontWeight: 600, fontFamily: fontDisplay, lineHeight: 1.1 }}>
                  {m.day}
                </div>
              </div>
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
                  {m.title}
                </div>
                <div style={{ fontSize: 11.5, color: ink.faint }}>{m.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
