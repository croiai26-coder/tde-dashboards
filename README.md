# The Digital Engine — HQ Dashboard

A single-page live operations dashboard for **The Digital Engine** (a solo digital
agency, thedigitalengine.ie). It recreates the design hand-off pixel-closely and
wires each section to the founder's **Notion** workspace: edit a record in Notion,
refresh the app, the numbers update.

Built with **Next.js (App Router) + React + TypeScript**, read-only
**@notionhq/client**, and deployed on **Vercel**. The API key stays server-side.

> **Pre-revenue by design.** With no Notion databases connected, the dashboard
> renders the exact pre-revenue seed/empty state from the prototype (0 clients,
> €0 MRR, €94 recurring out from tool subscriptions, the setup checklist, etc.).
> Each section becomes live the moment you point it at a Notion database.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — leave blank to see the seed state
npm run dev                  # http://localhost:3000
```

`npm run build && npm run start` runs the production build (static + ISR).

## Connecting Notion (optional, per-section)

1. Create an internal integration at <https://www.notion.so/my-integrations> and
   copy the secret into `NOTION_TOKEN`.
2. For each database you want live, open it in Notion → **•••  → Connections** →
   add the integration, then copy the 32-char database ID from its URL into the
   matching `NOTION_DB_*` env var (see `.env.example`).
3. Restart. Any section without a configured DB keeps showing its seed/empty
   state, so you can wire them up one at a time.

The Notion schema (database names + properties) is documented in
`design_handoff_tde_dashboard/DATA-MODEL.md` from the design bundle. Getters live
in `lib/notion.ts`; every one is defensive and falls back gracefully if a token or
database ID is missing or an API call fails.

## Configuration

Two "tweak" knobs from the prototype are exposed as public env vars:

| Var | Default | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_ACCENT` | `#5b8def` | One of the five design accents (blue/sage/lilac/peach/rose). Threads through every section. |
| `NEXT_PUBLIC_FOUNDER_NAME` | `Croíadh` | Used in the time-of-day greeting. |

Optional `NEXT_PUBLIC_LINK_*` vars point the "Jump to" chips at real Notion pages.

## Deploying to Vercel

Import the repo, add the same env vars in the Vercel project settings, and deploy.
Data is fetched server-side and cached with ISR (`revalidate = 60`), so numbers
refresh at most once a minute. The deployed URL can be `/embed`-ed back into a
Notion page.

## Project layout

```
app/
  layout.tsx        Fraunces + Instrument Sans fonts, metadata
  page.tsx          server component: builds the view model, lays out all sections
  globals.css       reset + scrollbar styling
lib/
  theme.ts          design tokens (colours, fonts, helpers) from the hand-off
  types.ts          normalised domain types
  config.ts         app config + static/seed content (business plan, subs, services…)
  notion.ts         read-only Notion data layer, one getter per database
  data.ts           buildViewModel(): merges Notion data + seeds → view models
components/          one component per dashboard section (see page.tsx)
```

## Notes on fidelity

The hand-off is high-fidelity: the design is authored with exact inline styles, so
the components reproduce those values directly (via `lib/theme.ts` tokens) rather
than approximating them with utility classes. Tailwind is configured with the same
tokens for any future extension. Three pieces are interactive client-side only, as
in the prototype: **Quick Notes** (autosaves to `localStorage`), and the
**Setup checklist** / **Client onboarding** checkboxes (local toggle state).

---

## Life OS

A personal capture-and-prioritise app. Dump anything into one bar without
thinking about where it goes; it works out what matters next and tells you why.

It ships in two forms:

| | Where | Data | Needs |
| --- | --- | --- | --- |
| **Hosted** | `/life` on the deployed site | localStorage + Notion sync | env vars below |
| **Standalone** | `life-os.html`, opened from disk | localStorage only | nothing |

The standalone file is the offline version — no build, no server, no account,
works on a plane. The hosted route is the same app plus everything that needs a
server: your calendar, your business projects, and the Claude session board.

### Capture syntax

Everything is optional — a bare line is a perfectly good item.

| You type | It picks up |
| --- | --- |
| `fri`, `tomorrow`, `12/09`, `sep 14`, `in 3 days`, `eow`, `next week` | a due date (day/month order) |
| `!` `!!` `!!!` | importance |
| `#work` `#health` | the area it belongs to |
| `~20m` `~2h` | how long it'll take |
| `@sarah` | who's involved |
| `idea: …` / `note: …` | files it away instead of as a task |
| `someday: …` | parks it for a month |

So `call the accountant fri !! ~20m #work` becomes a task due Friday, flagged
important, 20 minutes, filed under work. Hit **dump** to paste a whole brain
dump — one thought per line, all parsed at once.

A date written without a year that has *just* passed (`30/08` typed in early
September) reads as overdue, not as next year's. It only rolls forward once
it's more than 60 days behind.

### How it decides priority

`lib/life/score.ts` — five named components, so the ordering is always
explainable rather than a black box. Each card shows the reason that won:

- **Urgency** — overdue outranks everything and keeps climbing; today, tomorrow and this week step down from there.
- **Importance** — your `!` flags.
- **Staleness** — undated things you keep scrolling past slowly float up, so nothing rots quietly.
- **Effort** — sub-20-minute jobs get a nudge; 3-hour blocks get a small penalty, because they need scheduling rather than a nudge.
- **Fit** *(hosted only)* — with a calendar connected, work that fits the gap before your next meeting gets promoted, and anything longer than the time left in the day is demoted and marked *needs a block*.

Pinning (`★`) overrides the lot.

### Views

- **Focus** — today's schedule and what's left of the day, anything waiting on you, then the three to do now, overdue, quick wins, and the rest in order.
- **Business** — every Claude session working on TDE or The Once Over, and live Projects & Delivery rows.
- **Everything** — searchable, filterable by area.
- **Notes & ideas** — the stuff that isn't a task.
- **Review** — items carried 2+ weeks with no date ("do it, date it, or drop it"), where your open load sits by area, what's parked, and the week's numbers.
- **Done** — completed history.

### Configuration (hosted)

Every variable is optional and each one degrades on its own: with none set,
`/life` still runs fully as a local-only app. See `.env.example`.

| Var | Turns on |
| --- | --- |
| `NOTION_DB_LIFE_ITEMS` | Notion sync, so your phone and laptop agree |
| `NOTION_DB_SESSIONS` | the Claude session board |
| `NOTION_DB_PROJECTS` | live Projects & Delivery rows |
| `LIFE_ICS_URLS` | today's schedule and capacity-aware prioritising |

`LIFE_ICS_URLS` is a comma-separated list of `Label|https://…ics` entries,
using each calendar's **secret** iCal address (Google Calendar → Settings →
pick calendar → "Secret address in iCal format"). Treat those URLs like
passwords: they stay server-side and the browser never sees them.

### How the sync works

localStorage is the write path and the source of truth for *this* browser, so
capture never waits on the network. A background loop reconciles with Notion
every minute when there's anything queued, and on window focus.

Conflicts resolve per item on the `updated` timestamp — last write wins. That's
the right trade for a personal inbox: the failure mode is a stale edit losing to
a fresher one, never a lost item. Deletes are soft-marked so they propagate
instead of the item reappearing on the next pull. The footer always shows the
real state (`Synced`, `3 waiting to sync`, `Sync problem — saved locally`).

### The session board

`🤖 Claude Sessions — Status` in Notion is refreshed by a scheduled Claude
routine each morning, which reads every session's own status summary and writes
one row per session. So the panel is a **daily snapshot, not a live feed**, and
the summaries are auto-generated — a decent nudge, not gospel. Anything marked
*waiting on you* surfaces on the Focus tab with a one-click "add to my list".

That routine needs `NOTION_TOKEN` set on the Claude Code *environment* (not just
in Vercel), because it talks to the Notion REST API directly.

### Everything else

Keyboard-first (`?` for the full list): `/` to capture, `j`/`k` to move, `x` to
complete, `s` to snooze, `e` to edit, `1`–`3` for importance, `u` to undo — every
destructive action is undoable. Light/dark toggle. `↓` exports a JSON backup.

---

The repo also contains two earlier standalone HTML dashboards
(`tde-agency-dashboard.html`, `tde-client-dashboard.html`) from a previous design
round; they are independent of this app.
