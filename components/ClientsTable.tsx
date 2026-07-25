import { ink, cardShadow, c2, c3, c4, c5, soft } from "@/lib/theme";
import type { Client } from "@/lib/types";
import SectionHeader from "./SectionHeader";

const AVATAR_COLORS = [c2, c5, c4, c3];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function statusColor(status: string): string {
  switch (status) {
    case "Active":
      return c5;
    case "Proposal":
      return c4;
    case "At risk":
      return c3;
    default:
      return c2; // In build / other
  }
}

function healthDots(health: string): number {
  switch (health) {
    case "Good":
      return 4;
    case "OK":
      return 3;
    case "At risk":
      return 1;
    default:
      return 2;
  }
}

export default function ClientsTable({ clients, accent }: { clients: Client[]; accent: string }) {
  return (
    <section>
      <SectionHeader title="Clients & Money" dotColor={c2} right="All clients →" />
      <div
        style={{
          border: "1px solid #00000010",
          borderRadius: 14,
          overflow: "hidden",
          background: "#fff",
          boxShadow: cardShadow,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 0.9fr 0.9fr",
            padding: "12px 18px",
            background: "#00000004",
            fontSize: 12,
            color: ink.faint,
          }}
        >
          <span>Client</span>
          <span>Status</span>
          <span>MRR</span>
          <span style={{ textAlign: "right" }}>Health</span>
        </div>

        {clients.length === 0 ? (
          <div style={{ padding: "38px 20px", textAlign: "center" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: soft(c2),
                margin: "0 auto 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ width: 16, height: 16, borderRadius: 5, background: c2 }} />
            </div>
            <div style={{ fontSize: 15, color: ink.secondary, fontWeight: 500 }}>No clients yet</div>
            <div
              style={{
                fontSize: 13,
                color: ink.faint,
                marginTop: 4,
                maxWidth: 340,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Add your first client and their retainer, invoices and health will roll up here automatically.
            </div>
            <div
              style={{
                display: "inline-flex",
                marginTop: 16,
                padding: "8px 15px",
                background: c2,
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 8,
              }}
            >
              + Add client
            </div>
          </div>
        ) : (
          clients.map((c, i) => {
            const filled = healthDots(c.health);
            const sc = statusColor(c.status);
            return (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1fr 0.9fr 0.9fr",
                  alignItems: "center",
                  padding: "12px 18px",
                  borderTop: "1px solid #00000008",
                  fontSize: 13.5,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      background: soft(AVATAR_COLORS[i % AVATAR_COLORS.length]),
                      color: ink.secondary,
                      fontSize: 10.5,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {initials(c.name)}
                  </span>
                  <span
                    style={{
                      color: ink.primary,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.name}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 9px",
                      borderRadius: 20,
                      background: soft(sc),
                      color: ink.secondary,
                      fontSize: 11.5,
                      fontWeight: 500,
                    }}
                  >
                    {c.status || "—"}
                  </span>
                </div>
                <div style={{ color: ink.primary }}>€{Math.round(c.mrr).toLocaleString("en-IE")}</div>
                <div style={{ textAlign: "right", letterSpacing: 1, color: accent }}>
                  {"●".repeat(filled)}
                  <span style={{ color: ink.faintest }}>{"○".repeat(4 - filled)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
