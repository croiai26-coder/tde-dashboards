"use client";

import { timeLabel, effortLabel } from "@/lib/life/dates";
import type { Capacity } from "@/lib/life/score";
import type { CalEvent } from "@/lib/life/types";

/** Today's schedule alongside what's actually left of the day. The second half
 *  is the point: the priority engine uses it, so you can see why it chose. */
export function TodayStrip({
  events, capacity, configured,
}: {
  events: CalEvent[]; capacity: Capacity; configured: boolean;
}) {
  if (!configured) return null;

  const now = Date.now();
  const timed = events.filter((e) => !e.allDay);
  const allDay = events.filter((e) => e.allDay);

  const free = capacity.freeToday;
  const busy = capacity.busyToday;
  const total = Math.max(1, free + busy);

  const headline =
    free <= 0 ? "Day's gone"
      : free < 45 ? effortLabel(free) + " left"
        : effortLabel(free) + " free";

  const sub =
    free <= 0
      ? "Nothing much left today — anything you start now is really tomorrow's."
      : capacity.nextEvent
        ? `${effortLabel(Math.max(0, capacity.untilNext ?? 0))} until ${capacity.nextEvent.title}.`
        : busy > 0
          ? "Clear from here to the end of the day."
          : "Nothing in the calendar today.";

  return (
    <div className="today-strip">
      <div className="card">
        <div className="cal-list">
          {events.length === 0 && (
            <div className="empty" style={{ padding: "18px 15px" }}>
              Nothing in the calendar today.
            </div>
          )}
          {allDay.map((e) => (
            <div className="cal-row" key={e.id}>
              <span className="cal-time">all day</span>
              <span className="cal-title">{e.title}</span>
              <span className="cal-cal">{e.calendar}</span>
            </div>
          ))}
          {timed.map((e) => {
            const s = +new Date(e.start);
            const en = +new Date(e.end);
            const cls = en < now ? "past" : s <= now && en >= now ? "now" : "";
            return (
              <div className={"cal-row " + cls} key={e.id}>
                <span className="cal-time">
                  {timeLabel(e.start)}–{timeLabel(e.end)}
                </span>
                <span className="cal-title">{e.title}</span>
                <span className="cal-cal">{e.calendar}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card capacity">
        <div className="capacity-big">{headline}</div>
        <div className="capacity-sub">{sub}</div>
        <div className="capacity-bar" title={`${busy}m booked · ${free}m free`}>
          <div
            className="capacity-seg"
            style={{ width: (busy / total) * 100 + "%", background: "var(--peach)" }}
          />
          <div
            className="capacity-seg"
            style={{ width: (free / total) * 100 + "%", background: "var(--sage)" }}
          />
        </div>
        <div className="capacity-sub" style={{ marginTop: 8 }}>
          Tasks longer than what&rsquo;s left get pushed down the list and marked{" "}
          <em>needs a block</em>.
        </div>
      </div>
    </div>
  );
}
