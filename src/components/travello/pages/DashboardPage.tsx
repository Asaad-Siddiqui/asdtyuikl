"use client";

import { useState } from "react";

import { useApp } from "@/components/travello/AppProvider";
import {
  IncidentTrendCard,
  RecentIncidentsCard,
  TelemetryBar,
} from "@/components/travello/dashboard/DashboardIncidents";
import {
  AiInsightsRail,
  CrowdAwareRailCard,
  ImpactGlanceCard,
  ResponsibleTravelCard,
} from "@/components/travello/dashboard/DashboardInsightsRail";
import {
  ActiveTripCard,
  MissionProgressCard,
} from "@/components/travello/dashboard/DashboardTrip";
import {
  ImpactTiles,
  WelcomeBanner,
} from "@/components/travello/dashboard/DashboardWelcome";

/**
 * The dashboard.
 *
 * The application frame (rail, top bar, page padding) comes from `AppShell`, so
 * this file is only the dashboard's own content: the welcome banner, the impact
 * tiles, the trip and mission cards, the incident panels and the insight rail.
 *
 * The destination chosen in the telemetry bar drives both the banner artwork and
 * which AI insights the rail shows — one control, two live regions.
 */

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&h=600&fit=crop&auto=format";

export function DashboardPage() {
  const { destinations } = useApp();
  const [selectedDestinationId, setSelectedDestinationId] = useState(() => {
    const preferred = destinations.find((item) => item.id === "goa");
    return preferred?.id ?? destinations[0]?.id ?? "";
  });

  const destination =
    destinations.find((item) => item.id === selectedDestinationId) ??
    destinations[0] ??
    null;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20.5rem] xl:gap-5">
      <div className="min-w-0 space-y-4 sm:space-y-5">
        <WelcomeBanner
          heroImage={destination?.heroImageUrl || FALLBACK_HERO}
          place={destination?.name ?? null}
        />
        <ImpactTiles />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-5">
          <ActiveTripCard />
          <MissionProgressCard />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-5">
          <IncidentTrendCard />
          <RecentIncidentsCard />
        </div>

        <TelemetryBar
          destinations={destinations}
          selectedId={selectedDestinationId}
          onSelect={setSelectedDestinationId}
        />
      </div>

      <aside className="min-w-0 space-y-4 sm:space-y-5">
        <AiInsightsRail destinationId={selectedDestinationId} />
        <ImpactGlanceCard />
        <CrowdAwareRailCard />
        <ResponsibleTravelCard />
      </aside>
    </div>
  );
}

export default DashboardPage;
