import {
  getClients,
  getPipeline,
  getBuilds,
  getSubscriptions,
  getInvoices,
  getTasks,
  getMeetings,
  getContent,
  getServices,
  getGoals,
} from "./notion";
import {
  BUSINESS_PLAN,
  ONBOARDING_STEPS,
  SEED_TASKS,
  SEED_SUBSCRIPTIONS,
  SEED_SERVICES,
  SEED_GOALS,
  PIPELINE_COLUMNS,
  BUILD_COLUMNS,
  JUMP_LINKS,
  SOPS,
  config,
  type ColorRole,
} from "./config";
import { c2, c3, c4, c5, soft } from "./theme";
import type { Client, Meeting } from "./types";

const PALETTE = [c2, c5, c3, c4]; // rotation used for live records lacking a colour

/** Resolve a colour role ("accent" → configured accent, else a literal hex). */
export function resolveColor(role: ColorRole, accent: string): string {
  return role === "accent" ? accent : role;
}

function euro(n: number): string {
  // Whole euros, thousands separated (matches the design's "€900", "€3,000").
  return "€" + Math.round(n).toLocaleString("en-IE");
}

function ordinal(d: number): string {
  const suffix = ["th", "st", "nd", "rd"][(d % 100 >> 3) ^ 1 && d % 10] || "th";
  return d + suffix;
}

function dayOfMonth(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getDate();
}

export interface ViewModel {
  accent: string;
  greeting: string;
  kpis: { dot: string; label: string; value: string; sub: string }[];
  goals: { label: string; now: string; target: string; by: string; color: string; pct: string }[];
  plan: { label: string; color: string; body: string }[];
  pipeline: {
    name: string;
    dot: string;
    count: number;
    empty: string;
    cards: { id: string; title: string; sub: string }[];
  }[];
  builds: {
    name: string;
    dot: string;
    count: number;
    empty: string;
    cards: { id: string; title: string; sub: string }[];
  }[];
  calendar: {
    monthLabel: string;
    monthTotal: string;
    weekdays: string[];
    cells: {
      label: string;
      cellBg: string;
      numColor: string;
      numWeight: number;
      hasBill: boolean;
      billColor: string;
    }[];
  };
  bills: { name: string; amount: string; due: string; cadence: string; color: string; last: boolean }[];
  clients: Client[];
  services: { name: string; price: string; note: string; color: string }[];
  onboarding: { id: string; title: string; step: string }[];
  content: { wd: string; mark: string; plusColor: string; filled: boolean }[];
  quickNotesAccent: string;
  invoiceStats: { value: string; label: string; bg: string; fg: string }[];
  invoicesHint: string;
  finances: {
    thisMonth: string;
    recurringOut: string;
    overdue: string;
    revBars: number[];
    barColor: string;
  };
  meetings: { id: string; month: string; day: string; title: string; time: string }[];
  tasks: { id: string; title: string; done: boolean }[];
  taskTotal: number;
  doneCount: number;
  links: { dot: string; label: string; href?: string }[];
  sops: { name: string; color: string; bg: string }[];
}

export async function buildViewModel(): Promise<ViewModel> {
  const accent = config.accent;

  const [
    clientsR,
    pipelineR,
    buildsR,
    subsR,
    invoicesR,
    tasksR,
    meetingsR,
    contentR,
    servicesR,
    goalsR,
  ] = await Promise.all([
    getClients(),
    getPipeline(),
    getBuilds(),
    getSubscriptions(),
    getInvoices(),
    getTasks(),
    getMeetings(),
    getContent(),
    getServices(),
    getGoals(),
  ]);

  const clients = clientsR ?? [];
  const pipeline = pipelineR ?? [];
  const builds = buildsR ?? [];
  const invoices = invoicesR ?? [];
  const meetings = meetingsR ?? [];
  const content = contentR ?? [];

  // ── Greeting ────────────────────────────────────────────────
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const greeting = config.founderName ? `${part}, ${config.founderName}.` : `${part}.`;

  // ── Bills (live subs or seed) ───────────────────────────────
  interface Bill {
    name: string;
    amount: number;
    day: number | null;
    cadence: string;
    color: string;
  }
  let bills: Bill[];
  if (subsR && subsR.length) {
    bills = subsR.map((s, i) => ({
      name: s.name,
      amount: s.amount,
      day: dayOfMonth(s.billingDate),
      cadence: s.cadence || "Monthly",
      color: PALETTE[i % PALETTE.length],
    }));
  } else {
    bills = SEED_SUBSCRIPTIONS.map((s) => ({
      name: s.name,
      amount: s.amount,
      day: s.day,
      cadence: s.cadence,
      color: resolveColor(s.color, accent),
    }));
  }
  const monthlyTotal = bills
    .filter((b) => b.cadence === "Monthly")
    .reduce((sum, b) => sum + b.amount, 0);

  // ── Calendar (current month, Monday-first) ──────────────────
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayN = now.getDate();
  const monthLabel = now.toLocaleDateString("en-IE", { month: "long", year: "numeric" });
  const monthName = monthLabel.split(" ")[0];
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const billByDay: Record<number, string> = {};
  bills.forEach((b) => {
    if (b.day) billByDay[b.day] = b.color;
  });

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const emptyCell = {
    label: "",
    cellBg: "transparent",
    numColor: "transparent",
    numWeight: 400,
    hasBill: false,
    billColor: "transparent",
  };
  const cells = [] as ViewModel["calendar"]["cells"];
  for (let i = 0; i < firstWeekday; i++) cells.push({ ...emptyCell });
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === todayN;
    const hasBill = !!billByDay[d];
    cells.push({
      label: String(d),
      cellBg: isToday ? soft(accent) : hasBill ? "#00000004" : "transparent",
      numColor: isToday ? accent : "#5f5b54",
      numWeight: isToday ? 700 : 400,
      hasBill,
      billColor: billByDay[d] || "transparent",
    });
  }
  while (cells.length % 7 !== 0) cells.push({ ...emptyCell });

  const billsView = bills.map((b, i) => ({
    name: b.name,
    amount: euro(b.amount),
    due: b.day ? `${monthName} ${ordinal(b.day)}` : b.cadence,
    cadence: b.cadence,
    color: b.color,
    last: i === bills.length - 1,
  }));

  // ── KPIs ────────────────────────────────────────────────────
  const activeClients = clients.filter((c) => c.status === "Active").length;
  const mrr = clients.filter((c) => c.status === "Active").reduce((s, c) => s + c.mrr, 0);
  const openBuilds = builds.filter((b) => b.status !== "Delivered").length;

  const in7 = new Date(now);
  in7.setDate(in7.getDate() + 7);
  const meetingsNext7 = meetings.filter((m) => {
    if (!m.date) return false;
    const d = new Date(m.date);
    return d >= now && d <= in7;
  }).length;

  const tasksLive = tasksR && tasksR.length;
  const tasks = tasksLive
    ? tasksR!.map((t) => ({ id: t.id, title: t.name, done: t.done }))
    : SEED_TASKS.map((t) => ({ id: t.id, title: t.title, done: t.done }));
  const openTasks = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.filter((t) => t.done).length;

  const kpis = [
    {
      dot: c2,
      label: "Active Clients",
      value: String(activeClients),
      sub: activeClients === 0 ? "add your first" : "currently active",
    },
    { dot: c5, label: "MRR", value: euro(mrr), sub: mrr === 0 ? "no retainers yet" : "recurring monthly" },
    {
      dot: accent,
      label: "Open Builds",
      value: String(openBuilds),
      sub: openBuilds === 0 ? "nothing in flight" : "in progress",
    },
    { dot: c3, label: "Recurring Out", value: euro(monthlyTotal), sub: "tools & subscriptions" },
    {
      dot: c4,
      label: "Meetings",
      value: String(meetingsNext7),
      sub: meetingsNext7 === 0 ? "none this week" : "next 7 days",
    },
    {
      dot: c2,
      label: "Open Tasks",
      value: String(openTasks),
      sub: tasksLive ? "to do" : "setup checklist",
    },
  ];

  // ── Goals ───────────────────────────────────────────────────
  const goals =
    goalsR && goalsR.length
      ? goalsR.map((g, i) => {
          const pct = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0;
          return {
            label: g.label,
            now: String(g.current),
            target: String(g.target),
            by: g.by,
            color: [c2, c5, accent][i % 3],
            pct: `${Math.max(0, Math.min(100, pct))}%`,
          };
        })
      : SEED_GOALS.map((g) => ({ ...g, color: resolveColor(g.color, accent) }));

  // ── Boards ──────────────────────────────────────────────────
  const pipelineView = PIPELINE_COLUMNS.map((col) => {
    const leads = pipeline.filter((l) => l.status === col.status);
    return {
      name: col.name,
      dot: resolveColor(col.dot, accent),
      count: leads.length,
      empty: col.empty,
      cards: leads.map((l) => ({
        id: l.id,
        title: l.name || "Untitled",
        sub: l.nextStep || (l.value ? euro(l.value) : l.contact),
      })),
    };
  });

  const clientById: Record<string, string> = {};
  clients.forEach((c) => (clientById[c.id] = c.name));
  const buildsView = BUILD_COLUMNS.map((col) => {
    const items = builds.filter((b) => b.status === col.status);
    return {
      name: col.name,
      dot: resolveColor(col.dot, accent),
      count: items.length,
      empty: col.empty,
      cards: items.map((b) => ({
        id: b.id,
        title: b.name || "Untitled",
        sub:
          (b.clientId && clientById[b.clientId]) ||
          (b.due ? new Date(b.due).toLocaleDateString("en-IE", { day: "numeric", month: "short" }) : ""),
      })),
    };
  });

  // ── Services ────────────────────────────────────────────────
  const services =
    servicesR && servicesR.length
      ? servicesR.map((s, i) => ({
          name: s.name,
          price: s.type === "monthly" ? `${euro(s.price)}/mo` : euro(s.price),
          note: s.type || "",
          color: PALETTE[i % PALETTE.length],
        }))
      : SEED_SERVICES.map((s) => ({ ...s, color: resolveColor(s.color, accent) }));

  // ── Onboarding (static template) ────────────────────────────
  const onboarding = ONBOARDING_STEPS.map((o, i) => ({
    id: o.id,
    title: o.title,
    step: `Step ${i + 1}`,
  }));

  // ── Content this week ───────────────────────────────────────
  // Compute the Monday→Sunday dates of the current week.
  const weekStart = new Date(now);
  const offsetToMonday = (now.getDay() + 6) % 7;
  weekStart.setDate(now.getDate() - offsetToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const contentView = weekdays.map((wd, i) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);
    const items = content.filter((c) => {
      if (!c.publishDate) return false;
      const d = new Date(c.publishDate);
      return (
        d.getFullYear() === dayDate.getFullYear() &&
        d.getMonth() === dayDate.getMonth() &&
        d.getDate() === dayDate.getDate()
      );
    });
    const filled = items.length > 0;
    return {
      wd,
      filled,
      mark: filled ? String(items.length) : "+",
      plusColor: filled ? accent : "#cfc8bd",
    };
  });

  // ── Invoices ────────────────────────────────────────────────
  const countBy = (status: string) => invoices.filter((iv) => iv.status === status).length;
  const invoiceStats = [
    { value: String(countBy("Sent")), label: "Sent", bg: "#00000004", fg: "#5f5b54" },
    { value: String(countBy("Paid")), label: "Paid", bg: soft(c5), fg: "#5f5b54" },
    { value: String(countBy("Overdue")), label: "Overdue", bg: soft(c3), fg: "#5f5b54" },
  ];
  const invoicesHint =
    invoices.length === 0
      ? "First invoice appears when you bill a client."
      : `${invoices.length} invoice${invoices.length === 1 ? "" : "s"} tracked.`;

  // ── Finances ────────────────────────────────────────────────
  const thisMonthPaid = invoices
    .filter((iv) => {
      if (iv.status !== "Paid" || !iv.due) return false;
      const d = new Date(iv.due);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((s, iv) => s + iv.amount, 0);
  const overdue = invoices
    .filter((iv) => iv.status === "Overdue")
    .reduce((s, iv) => s + iv.amount, 0);

  const finances = {
    thisMonth: euro(thisMonthPaid),
    recurringOut: euro(monthlyTotal),
    overdue: euro(overdue),
    revBars: [1, 2, 3, 4, 5, 6, 7, 8],
    barColor: soft(c3),
  };

  // ── Meetings (upcoming) ─────────────────────────────────────
  const upcoming = meetings
    .filter((m): m is Meeting & { date: string } => !!m.date && new Date(m.date) >= new Date(now.toDateString()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
    .map((m) => {
      const d = new Date(m.date);
      return {
        id: m.id,
        month: d.toLocaleDateString("en-IE", { month: "short" }),
        day: String(d.getDate()),
        title: m.name,
        time: d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" }),
      };
    });

  // ── Plan / links / sops (static, accent-resolved) ───────────
  const plan = BUSINESS_PLAN.map((p) => ({ ...p, color: resolveColor(p.color, accent) }));
  const links = JUMP_LINKS.map((l) => ({ ...l, dot: resolveColor(l.dot, accent) }));
  const sops = SOPS.map((s) => {
    const color = resolveColor(s.color, accent);
    return { name: s.name, color, bg: soft(color) };
  });

  return {
    accent,
    greeting,
    kpis,
    goals,
    plan,
    pipeline: pipelineView,
    builds: buildsView,
    calendar: { monthLabel, monthTotal: euro(monthlyTotal), weekdays, cells },
    bills: billsView,
    clients,
    services,
    onboarding,
    content: contentView,
    quickNotesAccent: accent,
    invoiceStats,
    invoicesHint,
    finances,
    meetings: upcoming,
    tasks,
    taskTotal: tasks.length,
    doneCount,
    links,
    sops,
  };
}
