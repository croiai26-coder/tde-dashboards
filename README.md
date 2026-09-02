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

## Life OS (`life-os.html`)

A personal capture-and-prioritise app, separate from the agency dashboard. Open
`life-os.html` in any browser — no build step, no server, no account. Everything
is stored in that browser's `localStorage`; nothing leaves the machine.

**The idea:** dump anything into the bar at the top without thinking about where
it goes. The app works out what matters and shows you three things to do next,
with the reason it picked them.

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

### How it decides priority

Each open task scores on four things, and the top three are surfaced with the
reason attached (`3 days overdue · you flagged it important`):

- **Urgency** — overdue outranks everything and keeps climbing; today, tomorrow and this week step down from there.
- **Importance** — your `!` flags.
- **Staleness** — undated things you keep scrolling past slowly float up, so nothing rots quietly.
- **Effort** — sub-20-minute jobs get a nudge; 3-hour blocks get a small penalty, because they need scheduling rather than a nudge.

Pinning (`★`) overrides the lot.

### Views

- **Focus** — the three to do now, then overdue, quick wins, and the rest in order.
- **Everything** — searchable, filterable by area.
- **Notes & ideas** — the stuff that isn't a task.
- **Review** — items carried 2+ weeks with no date ("do it, date it, or drop it"), where your open load sits by area, what's parked, and the week's numbers.
- **Done** — completed history.

### Everything else

Keyboard-first (`?` for the full list): `/` to capture, `j`/`k` to move, `x` to
complete, `s` to snooze, `e` to edit, `1`–`3` for importance, `u` to undo — every
destructive action is undoable. Light/dark toggle. `↓`/`↑` in the header export
and re-import a JSON backup, which is also how you move your data to another
browser or machine.

---

The repo also contains two earlier standalone HTML dashboards
(`tde-agency-dashboard.html`, `tde-client-dashboard.html`) from a previous design
round; they are independent of this app.
