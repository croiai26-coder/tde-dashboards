"use client";

import { dueLabel, dueClass, effortLabel, daysSince } from "@/lib/life/dates";
import { isSnoozed, isNoteKind } from "@/lib/life/score";
import type { Item } from "@/lib/life/types";

const AREA_COLOURS = [
  "var(--accent)", "var(--sage)", "var(--peach)",
  "var(--lilac)", "var(--rose)", "var(--amber)",
];

/** Stable colour per area name, so #work is always the same colour. */
export function areaColour(area: string | null): string {
  if (!area) return "var(--faintest)";
  let n = 0;
  for (let i = 0; i < area.length; i++) n = (n * 31 + area.charCodeAt(i)) >>> 0;
  return AREA_COLOURS[n % AREA_COLOURS.length];
}

export function Chips({
  item, showAge, hideSnooze, needsBlock,
}: {
  item: Item; showAge?: boolean; hideSnooze?: boolean; needsBlock?: boolean;
}) {
  const c = areaColour(item.area);
  return (
    <>
      {item.due && (
        <span className={"chip " + dueClass(item.due)} title={item.due}>
          {dueLabel(item.due)}
        </span>
      )}
      {item.area && (
        <span
          className="chip area"
          style={{
            color: c,
            borderColor: `color-mix(in srgb, ${c} 30%, transparent)`,
            background: `color-mix(in srgb, ${c} 10%, transparent)`,
          }}
        >
          #{item.area}
        </span>
      )}
      {item.effort != null && <span className="chip">~{effortLabel(item.effort)}</span>}
      {item.importance > 0 && <span className="chip imp">{"!".repeat(item.importance)}</span>}
      {isNoteKind(item) && <span className="chip kind">{item.kind}</span>}
      {item.source === "notion" && <span className="chip" title="Came from Notion">notion</span>}
      {needsBlock && <span className="chip due-today">needs a block</span>}
      {isSnoozed(item) && !hideSnooze && (
        <span className="chip snoozed">back {dueLabel(item.snoozeUntil!)}</span>
      )}
      {showAge && !item.due && daysSince(item.created) >= 3 && (
        <span className="chip">{daysSince(item.created)}d old</span>
      )}
    </>
  );
}
