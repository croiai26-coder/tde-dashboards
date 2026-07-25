import { fontDisplay, ink, cardShadow, c2 } from "@/lib/theme";
import type { ViewModel } from "@/lib/data";

export default function JumpTo({ links }: { links: ViewModel["links"] }) {
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
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: c2 }} />
        Jump to
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {links.map((l) => {
          const inner = (
            <>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: l.dot }} />
              <span>{l.label}</span>
            </>
          );
          const style: React.CSSProperties = {
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 13px",
            background: "#fff",
            border: "1px solid #00000010",
            borderRadius: 10,
            fontSize: 13.5,
            color: ink.secondary,
            boxShadow: cardShadow,
          };
          return l.href ? (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={style}>
              {inner}
            </a>
          ) : (
            <div key={l.label} style={style}>
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
