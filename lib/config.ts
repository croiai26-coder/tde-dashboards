import { c2, c3, c4, c5, DEFAULT_ACCENT, ACCENT_OPTIONS } from "./theme";

// ─────────────────────────────────────────────────────────────
// App configuration + static/seed content.
//
// Colours are stored as a "role": either a fixed pastel hex, or the
// literal string "accent" which is resolved to the configured accent
// at render time (see resolveColor in lib/data.ts). This lets the two
// tweakable knobs from the prototype — accent colour and founder name —
// flow through every section.
// ─────────────────────────────────────────────────────────────

export type ColorRole = string; // a hex, or "accent"

function pickAccent(raw: string | undefined): string {
  if (raw && ACCENT_OPTIONS.includes(raw)) return raw;
  return DEFAULT_ACCENT;
}

export const config = {
  accent: pickAccent(process.env.NEXT_PUBLIC_ACCENT),
  founderName: process.env.NEXT_PUBLIC_FOUNDER_NAME ?? "Croíadh",
};

// ── Business Plan (static copy) ───────────────────────────────
export const BUSINESS_PLAN: { label: string; color: ColorRole; body: string }[] = [
  {
    label: "Mission",
    color: "accent",
    body: "Build websites & automations that win small Irish businesses more customers — done fast, priced fair.",
  },
  {
    label: "Target market",
    color: c2,
    body: "Local service SMBs in Ireland: trades, clinics, hospitality and professional services.",
  },
  {
    label: "Core offer",
    color: c4,
    body: "Launch sites, growth retainers and n8n automations, each with a client portal.",
  },
  {
    label: "Revenue model",
    color: c5,
    body: "One-off builds plus monthly care & growth retainers for recurring MRR.",
  },
  {
    label: "90-day focus",
    color: c3,
    body: "Land the first 3 clients, ship 2 case studies, reach €3k MRR.",
  },
  {
    label: "Edge",
    color: "accent",
    body: "Automation-first delivery — faster turnarounds and lower overhead than typical agencies.",
  },
];

// ── Client onboarding (reusable template, local UI state) ──────
export const ONBOARDING_STEPS: { id: string; title: string }[] = [
  { id: "o1", title: "Send contract & scope of work" },
  { id: "o2", title: "Raise deposit invoice" },
  { id: "o3", title: "Create client portal from template" },
  { id: "o4", title: "Collect brand assets & logins" },
  { id: "o5", title: "Schedule kickoff call" },
  { id: "o6", title: "Add to Clients database" },
];

// ── Setup checklist (seed for the Tasks section) ──────────────
// Used when no Tasks DB is connected. s1 & s2 start done (matches prototype).
export const SEED_TASKS: { id: string; title: string; done: boolean }[] = [
  { id: "s1", title: "Set up client + finance databases", done: true },
  { id: "s2", title: "Add tools & subscriptions to calendar", done: true },
  { id: "s3", title: "Build first client portal from template", done: false },
  { id: "s4", title: "Draft outreach / lead list", done: false },
  { id: "s5", title: "Publish first case study to Knowledge Base", done: false },
];

// ── Subscriptions seed (tools & subscriptions) ────────────────
// Mirrors the /notion-export seed data. Monthly total = €94.
export const SEED_SUBSCRIPTIONS: {
  name: string;
  amount: number;
  day: number;
  cadence: string;
  color: ColorRole;
}[] = [
  { name: "Notion", amount: 9, day: 3, cadence: "Monthly", color: "accent" },
  { name: "n8n Cloud", amount: 20, day: 7, cadence: "Monthly", color: c5 },
  { name: "Google Workspace", amount: 12, day: 12, cadence: "Monthly", color: c3 },
  { name: "Figma", amount: 15, day: 15, cadence: "Monthly", color: c4 },
  { name: "Claude Pro", amount: 18, day: 20, cadence: "Monthly", color: c2 },
  { name: "Vercel", amount: 20, day: 24, cadence: "Monthly", color: "accent" },
  { name: ".ie domain", amount: 19, day: 28, cadence: "Yearly", color: c3 },
];

// ── Services & pricing seed ───────────────────────────────────
export const SEED_SERVICES: {
  name: string;
  price: string;
  note: string;
  color: ColorRole;
}[] = [
  { name: "Launch site", price: "€900", note: "one-off", color: "accent" },
  { name: "Growth retainer", price: "€750/mo", note: "ongoing", color: c5 },
  { name: "Automation build", price: "from €1,200", note: "project", color: c4 },
  { name: "Care plan", price: "€120/mo", note: "maintenance", color: c3 },
];

// ── Goals seed (view models: pre-formatted to match prototype) ─
export const SEED_GOALS: {
  label: string;
  now: string;
  target: string;
  by: string;
  color: ColorRole;
  pct: string;
}[] = [
  { label: "Clients signed", now: "0", target: "3", by: "by Sept", color: c2, pct: "3%" },
  { label: "Monthly recurring revenue", now: "€0", target: "€3k", by: "by Q4", color: c5, pct: "2%" },
  { label: "Builds shipped", now: "0", target: "5", by: "this year", color: "accent", pct: "2%" },
];

// ── Board column definitions ──────────────────────────────────
export const PIPELINE_COLUMNS: {
  name: string;
  status: string;
  dot: ColorRole;
  empty: string;
}[] = [
  { name: "Prospect", status: "Prospect", dot: "#b8b2a8", empty: "Names to reach out to" },
  { name: "Contacted", status: "Contacted", dot: c2, empty: "Conversation started" },
  { name: "Proposal", status: "Proposal", dot: c4, empty: "Quote sent" },
  { name: "Won", status: "Won", dot: c5, empty: "Becomes a client" },
];

export const BUILD_COLUMNS: {
  name: string;
  status: string;
  dot: ColorRole;
  empty: string;
}[] = [
  { name: "Backlog", status: "Backlog", dot: "#b8b2a8", empty: "Ideas & scoped work" },
  { name: "In Progress", status: "In Progress", dot: "accent", empty: "Active builds" },
  { name: "Review", status: "Review", dot: c3, empty: "Awaiting sign-off" },
  { name: "Delivered", status: "Delivered", dot: c5, empty: "Shipped" },
];

// ── "Jump to" quick links ─────────────────────────────────────
export const JUMP_LINKS: { dot: ColorRole; label: string; href?: string }[] = [
  { dot: c2, label: "Clients Hub", href: process.env.NEXT_PUBLIC_LINK_CLIENTS_HUB },
  { dot: "accent", label: "Projects", href: process.env.NEXT_PUBLIC_LINK_PROJECTS },
  { dot: c3, label: "Client Finances", href: process.env.NEXT_PUBLIC_LINK_CLIENT_FINANCES },
  { dot: c5, label: "Knowledge Base", href: process.env.NEXT_PUBLIC_LINK_KNOWLEDGE_BASE },
  { dot: c4, label: "Social Media", href: process.env.NEXT_PUBLIC_LINK_SOCIAL_MEDIA },
  { dot: c2, label: "Docs", href: process.env.NEXT_PUBLIC_LINK_DOCS },
];

// ── SOPs & templates ──────────────────────────────────────────
export const SOPS: { name: string; color: ColorRole }[] = [
  { name: "Proposal", color: "accent" },
  { name: "Contract / SOW", color: c2 },
  { name: "Invoice", color: c5 },
  { name: "Welcome email", color: c4 },
  { name: "Kickoff agenda", color: c3 },
  { name: "Case study", color: "accent" },
];
