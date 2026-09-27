import DashboardPage from "@/components/travello/pages/DashboardPage";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

/**
 * The dashboard renders its own page frame (full-height rail + top bar) rather
 * than the shared application header, so the route is a single component.
 * Every panel reads the signed-in traveller's data through the app provider.
 */
export default function Dashboard() {
  return <DashboardPage />;
}
