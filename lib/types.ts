// Normalised domain types. The Notion data layer maps raw API pages into
// these; the rest of the app never touches the Notion SDK shapes directly.

export interface Client {
  id: string;
  name: string;
  status: string; // Active | In build | Proposal | At risk
  mrr: number;
  health: string; // Good | OK | At risk
}

export interface PipelineLead {
  id: string;
  name: string;
  status: string; // Prospect | Contacted | Proposal | Won
  value: number;
  contact: string;
  nextStep: string;
}

export interface Build {
  id: string;
  name: string;
  status: string; // Backlog | In Progress | Review | Delivered
  clientId: string | null;
  due: string | null; // ISO date
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingDate: string | null; // ISO date; day-of-month drives calendar dot
  cadence: string; // Monthly | Yearly
}

export interface Invoice {
  id: string;
  amount: number;
  status: string; // Sent | Paid | Overdue
  due: string | null;
}

export interface Task {
  id: string;
  name: string;
  done: boolean;
  priority: string; // High | Med | Low
}

export interface Meeting {
  id: string;
  name: string;
  date: string | null; // ISO
  attendee: string;
}

export interface ContentItem {
  id: string;
  title: string;
  publishDate: string | null; // ISO
  channel: string;
  status: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  type: string; // one-off | monthly | project
}

export interface Goal {
  id: string;
  label: string;
  current: number;
  target: number;
  by: string;
}

export interface DashboardData {
  clients: Client[];
  pipeline: PipelineLead[];
  builds: Build[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  tasks: Task[];
  meetings: Meeting[];
  content: ContentItem[];
  services: Service[];
  goals: Goal[];
  /** Which sections are backed by a live Notion DB (vs seed/empty). */
  live: Record<string, boolean>;
}
