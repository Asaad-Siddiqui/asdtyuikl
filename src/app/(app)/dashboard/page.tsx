import DashboardPanels from "@/components/travello/pages/DashboardPage";
import { TravellerOverview } from "@/components/travello/TravellerOverview";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

/**
 * Dashboard = the traveller's own numbers (from Neon) on top of the ZIP 2
 * destination-health / incident-telemetry panels. The panels read the signed-in
 * user's reports and completed challenges through the app provider.
 */
export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <TravellerOverview />

      <section aria-labelledby="telemetry-heading" className="space-y-6">
        <div>
          <h2
            id="telemetry-heading"
            className="font-serif text-2xl font-bold tracking-tight text-forest-950"
          >
            Destination Health &amp; Incident Telemetry
          </h2>
          <p className="mt-1 text-sm text-sand-600">
            Live pressure, accessibility and incident signals for every eco-hub —
            including the reports you file.
          </p>
        </div>
        <DashboardPanels />
      </section>
    </div>
  );
}
