"use client";

import { useEffect, useRef, useState } from "react";
import { Chips } from "./Chips";
import { isSnoozed, isNoteKind } from "@/lib/life/score";
import type { Item } from "@/lib/life/types";

export interface RowActions {
  toggleDone: (id: string) => void;
  remove: (id: string) => void;
  snooze: (id: string, days: number, label: string) => void;
  wake: (id: string) => void;
  togglePin: (id: string) => void;
  commitEdit: (id: string, text: string) => void;
  setDue: (id: string, days: number | null) => void;
  select: (id: string) => void;
}

export function ItemRow({
  item, actions, selected, editing, setEditing, showAge, needsBlock, extraAction,
}: {
  item: Item;
  actions: RowActions;
  selected: boolean;
  editing: boolean;
  setEditing: (id: string | null) => void;
  showAge?: boolean;
  needsBlock?: boolean;
  /** Optional leading button, e.g. "do it this week" in the review view. */
  extraAction?: { label: string; title: string; onClick: () => void };
}) {
  const [draft, setDraft] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(item.text);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, item.text]);

  const commit = () => {
    actions.commitEdit(item.id, draft);
    setEditing(null);
  };

  return (
    <div
      className={"row" + (item.done ? " done" : "") + (selected ? " sel" : "")}
      data-id={item.id}
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (!t.closest("button") && !t.closest("input")) actions.select(item.id);
      }}
    >
      <button
        className="check"
        title="Complete"
        onClick={(e) => { e.stopPropagation(); actions.toggleDone(item.id); }}
      >
        ✓
      </button>

      <div className="row-main">
        {editing ? (
          <input
            ref={inputRef}
            className="row-edit"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(null);
            }}
          />
        ) : (
          <>
            <div className={isNoteKind(item) ? "row-text row-note" : "row-text"}>
              {item.text.split(/(@[\w\-']+)/g).map((part, i) =>
                part.startsWith("@")
                  ? <span key={i} className="mention">{part}</span>
                  : <span key={i}>{part}</span>,
              )}
            </div>
            <div className="row-meta">
              <Chips item={item} showAge={showAge} needsBlock={needsBlock} />
            </div>
          </>
        )}
      </div>

      <div className="row-actions">
        {extraAction && (
          <button className="act" title={extraAction.title} onClick={extraAction.onClick}>
            {extraAction.label}
          </button>
        )}
        <button
          className={"act" + (item.pinned ? " pinned" : "")}
          title="Pin to top"
          onClick={() => actions.togglePin(item.id)}
        >
          {item.pinned ? "★" : "☆"}
        </button>
        {isSnoozed(item) ? (
          <button className="act" title="Bring back now" onClick={() => actions.wake(item.id)}>↺</button>
        ) : (
          <button
            className="act"
            title="Snooze to tomorrow (shift-click: next week)"
            onClick={(e) =>
              e.shiftKey
                ? actions.snooze(item.id, 7, "a week")
                : actions.snooze(item.id, 1, "till tomorrow")
            }
          >
            ☾
          </button>
        )}
        <button className="act" title="Edit" onClick={() => setEditing(item.id)}>✎</button>
        <button className="act" title="Delete" onClick={() => actions.remove(item.id)}>×</button>
      </div>
    </div>
  );
}
