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

The repo also contains two earlier standalone HTML dashboards
(`tde-agency-dashboard.html`, `tde-client-dashboard.html`) from a previous design
round; they are independent of this app.
