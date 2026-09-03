import { cookies } from "next/headers";
import { buildViewModel } from "@/lib/data";
import { COOKIE, verifyToken, liveDataAllowed } from "@/lib/auth";
import { bg, fontSans, c4 } from "@/lib/theme";
import TopBar from "@/components/TopBar";
import Hero from "@/components/Hero";
import KpiStrip from "@/components/KpiStrip";
import GoalsStrip from "@/components/GoalsStrip";
import BusinessPlan from "@/components/BusinessPlan";
import SectionHeader from "@/components/SectionHeader";
import Board from "@/components/Board";
import BillsSubscriptions from "@/components/BillsSubscriptions";
import ClientsTable from "@/components/ClientsTable";
import Services from "@/components/Services";
import Onboarding from "@/components/Onboarding";
import ContentWeek from "@/components/ContentWeek";
import QuickNotes from "@/components/QuickNotes";
import Invoices from "@/components/Invoices";
import CompanyFinances from "@/components/CompanyFinances";
import Meetings from "@/components/Meetings";
import Tasks from "@/components/Tasks";
import JumpTo from "@/components/JumpTo";
import Sops from "@/components/Sops";

// Rendered per request: the dashboard only fetches real Notion data for an
// authenticated visitor, so it can't be cached or prerendered. Signed out (or
// with no site password configured) it renders the seed state instead — the
// same one the design prototype ships with.
export const dynamic = "force-dynamic";

export default async function Page() {
  const authed = await verifyToken(cookies().get(COOKIE)?.value);
  const vm = await buildViewModel(liveDataAllowed(authed));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        color: "#2f2b26",
        fontFamily: fontSans,
        fontSize: 16,
        lineHeight: 1.5,
        padding: "0 0 120px",
      }}
    >
      <TopBar accent={vm.accent} />

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 56px" }}>
        <Hero accent={vm.accent} greeting={vm.greeting} />
        <KpiStrip kpis={vm.kpis} />
        <GoalsStrip goals={vm.goals} />
        <BusinessPlan plan={vm.plan} accent={vm.accent} />

        {/* main grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.55fr 1fr",
            gap: 24,
            marginTop: 34,
            alignItems: "start",
          }}
        >
          {/* LEFT column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <section>
              <SectionHeader title="Pipeline" dotColor={c4} right="+ Add lead" />
              <Board columns={vm.pipeline} minHeight={150} emptyHeight={86} />
            </section>

            <section>
              <SectionHeader title="Builds & Delivery" dotColor={vm.accent} right="Open in Builds →" />
              <Board columns={vm.builds} minHeight={160} emptyHeight={96} />
            </section>

            <BillsSubscriptions calendar={vm.calendar} bills={vm.bills} />
            <ClientsTable clients={vm.clients} accent={vm.accent} />
            <Services services={vm.services} />
            <Onboarding steps={vm.onboarding} />
            <ContentWeek content={vm.content} />
          </div>

          {/* RIGHT column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <QuickNotes accent={vm.quickNotesAccent} />
            <Invoices invoiceStats={vm.invoiceStats} hint={vm.invoicesHint} />
            <CompanyFinances finances={vm.finances} />
            <Meetings meetings={vm.meetings} accent={vm.accent} />
            <Tasks tasks={vm.tasks} accent={vm.accent} />
            <JumpTo links={vm.links} />
            <Sops sops={vm.sops} />
          </div>
        </div>
      </div>
    </div>
  );
}
