import { ink, cardShadow } from "@/lib/theme";

interface Column {
  name: string;
  dot: string;
  count: number;
  empty: string;
  cards: { id: string; title: string; sub: string }[];
}

export default function Board({
  columns,
  minHeight,
  emptyHeight,
}: {
  columns: Column[];
  minHeight: number;
  emptyHeight: number;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
      {columns.map((col) => (
        <div
          key={col.name}
          style={{
            background: "#fff",
            border: "1px solid #00000010",
            borderRadius: 14,
            padding: "12px 11px",
            minHeight,
            boxShadow: cardShadow,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "2px 4px 12px",
              fontSize: 12.5,
              color: ink.muted,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.dot }} />
            <span style={{ fontWeight: 500, color: ink.secondary }}>{col.name}</span>
            <span style={{ marginLeft: "auto", color: ink.faintest }}>{col.count}</span>
          </div>

          {col.cards.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: emptyHeight,
                border: "1.5px dashed #00000012",
                borderRadius: 10,
                color: ink.faintest,
                fontSize: 12.5,
                textAlign: "center",
                padding: "0 6px",
              }}
            >
              {col.empty}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {col.cards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    background: "#fafaf7",
                    border: "1px solid #00000010",
                    borderRadius: 9,
                    padding: "9px 10px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12.5,
                      color: ink.primary,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {card.title}
                  </div>
                  {card.sub && (
                    <div
                      style={{
                        fontSize: 11,
                        color: ink.faint,
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {card.sub}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
