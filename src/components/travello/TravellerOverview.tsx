"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Compass,
  Leaf,
  MapPin,
  Plus,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import { useApp } from "@/components/travello/AppProvider";
import { crowdAwarePicks, crowdStatus, crowdTone, type CrowdAwarePick } from "@/lib/recommend";
import { cn } from "@/lib/format";

/**
 * The traveller-facing half of the dashboard: greeting, real impact numbers,
 * confirmed trips, in-progress missions and matched destinations. Every value
 * comes from the server-loaded dataset, so it always agrees with Profile,
 * Impact, Challenges and Reports.
 */
export function TravellerOverview() {
  const { user, stats, trips, destinations, challenges, completions } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips
    .filter((trip) => trip.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = trips
    .filter((trip) => trip.endDate < today)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const activeMissions = completions
    .filter((completion) => completion.status === "in_progress")
    .map((completion) => ({
      completion,
      challenge: challenges.find((item) => item.id === completion.challengeId),
    }))
    .filter((row) => row.challenge);

  const recommended = [...destinations]
    .sort((a, b) => b.sustainabilityScore - a.sustainabilityScore)
    .slice(0, 3);

  const crowdPicks = crowdAwarePicks(destinations, 3);

  const kpis = [
    {
      label: "Impact Points",
      value: stats.points.toLocaleString("en-IN"),
      icon: Zap,
      tone: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      label: "Missions Completed",
      value: String(stats.challengesCompleted),
      icon: Trophy,
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      label: "Destinations",
      value: String(stats.destinationsVisited),
      icon: MapPin,
      tone: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      label: "Est. CO₂ Avoided",
      value: `${stats.co2Avoided} kg`,
      icon: Leaf,
      tone: "bg-green-50 text-green-700 border-green-200",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-800">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Signed in as {user.role === "creator" ? "Creator" : "Traveller"}
          </span>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-forest-950 sm:text-4xl">
            Welcome back, {user.displayName.split(" ")[0]}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-sand-700 sm:text-base">
            {upcoming.length > 0
              ? `Your next trip is ${upcoming[0].fromLocation} → ${upcoming[0].toLocation}. Here's how your impact is tracking.`
              : "Here's how your impact is tracking across Travello."}
          </p>
        </div>

        <Link
          href="/plan"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-forest-800 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-forest-900/20 transition-all hover:bg-forest-900"
        >
          <Sparkles className="h-4 w-4 text-emerald-300" />
          Plan a Trip
        </Link>
      </header>

      {/* KPIs — same numbers as Profile / Impact / Challenges */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="flex flex-col justify-between rounded-3xl border border-sand-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
          >
            <span
              className={cn(
                "mb-3 grid h-9 w-9 place-items-center rounded-xl border",
                kpi.tone,
              )}
            >
              <kpi.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-2xl font-black tracking-tight text-forest-950">
                {kpi.value}
              </p>
              <p className="mt-0.5 text-xs font-bold text-sand-600">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Your Trips */}
        <section
          aria-labelledby="your-trips-heading"
          className="rounded-3xl border border-sand-200/80 bg-white p-6 shadow-sm sm:p-7"
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              id="your-trips-heading"
              className="flex items-center gap-2 text-base font-bold text-forest-950"
            >
              <MapPin className="h-4 w-4 text-emerald-600" />
              Your Trips
            </h2>
            <Link
              href="/trips"
              className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:text-forest-900"
            >
              View all trips <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {trips.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-sand-300 bg-sand-50/60 p-6 text-center">
              <Compass className="mx-auto h-6 w-6 text-forest-500" />
              <p className="mt-3 text-sm font-bold text-forest-950">
                No trips planned yet
              </p>
              <p className="mt-1 text-xs text-sand-600">
                Answer a few quick questions and we&apos;ll build two itinerary
                options around your accessibility profile.
              </p>
              <Link
                href="/plan"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-forest-800 px-4 py-2.5 text-xs font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Plan My Trip
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <TripGroup
                label="Upcoming"
                trips={upcoming}
                emptyMessage="No upcoming trips yet."
              />
              <TripGroup
                label="Past"
                trips={past}
                emptyMessage="Your completed trips will appear here."
              />
            </div>
          )}
        </section>

        {/* Active missions + recommendations */}
        <div className="space-y-6">
          <section
            aria-labelledby="active-missions-heading"
            className="rounded-3xl border border-sand-200/80 bg-white p-6 shadow-sm"
          >
            <h2
              id="active-missions-heading"
              className="flex items-center gap-2 text-base font-bold text-forest-950"
            >
              <Trophy className="h-4 w-4 text-amber-500" />
              Active Missions
            </h2>

            {activeMissions.length === 0 ? (
              <p className="mt-3 text-xs text-sand-600">
                Nothing in progress.{" "}
                <Link href="/challenges" className="font-bold text-forest-700">
                  Browse eco-challenges →
                </Link>
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {activeMissions.slice(0, 3).map(({ challenge }) => (
                  <li key={challenge!.id}>
                    <Link
                      href={`/challenges/${challenge!.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-sand-200/70 bg-sand-50/60 p-3 transition-colors hover:bg-emerald-50/70"
                    >
                      <span className="text-xl">{challenge!.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-forest-950">
                          {challenge!.title}
                        </span>
                        <span className="block text-[11px] text-sand-600">
                          In progress · +{challenge!.points} pts
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-sand-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            aria-labelledby="recommended-heading"
            className="rounded-3xl border border-sand-200/80 bg-white p-6 shadow-sm"
          >
            <h2
              id="recommended-heading"
              className="flex items-center gap-2 text-base font-bold text-forest-950"
            >
              <Leaf className="h-4 w-4 text-emerald-600" />
              Recommended Destinations
            </h2>
            <ul className="mt-4 space-y-3">
              {recommended.map((destination) => (
                <li key={destination.id}>
                  <Link
                    href={`/explore/${destination.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-sand-200/70 p-3 transition-colors hover:border-forest-300"
                  >
                    {destination.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={destination.image}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-forest-950">
                        {destination.name}
                      </span>
                      <span className="block text-[11px] text-sand-600">
                        {destination.region} · eco score{" "}
                        {destination.sustainabilityScore}/100
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-sand-400" />
                  </Link>
                </li>
              ))}
              {recommended.length === 0 && (
                <li className="text-xs text-sand-600">
                  Destinations load with the catalogue.
                </li>
              )}
            </ul>
          </section>

          {/* Feature 2: crowd-aware recommendations */}
          <section
            aria-labelledby="crowd-aware-heading"
            className="rounded-3xl border border-sand-200/80 bg-white p-6 shadow-sm"
          >
            <h2
              id="crowd-aware-heading"
              className="flex items-center gap-2 text-base font-bold text-forest-950"
            >
              <Users className="h-4 w-4 text-amber-500" />
              Crowd-Aware Picks
            </h2>
            <p className="mt-1 text-[11px] text-sand-600">
              Ranked by how many people are there right now — with the calmest window.
            </p>
            <ul className="mt-4 space-y-3">
              {crowdPicks.map((pick) => (
                <CrowdPickRow key={pick.destination.id} pick={pick} />
              ))}
              {crowdPicks.length === 0 && (
                <li className="text-xs text-sand-600">
                  Destination crowd data loads with the catalogue.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function CrowdPickRow({ pick }: { pick: CrowdAwarePick }) {
  const { destination, status, bestWindow, reason } = pick;
  return (
    <li>
      <Link
        href={`/explore/${destination.id}`}
        className="block rounded-2xl border border-sand-200/70 p-3.5 transition-colors hover:border-forest-300"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-xs font-bold text-forest-950">
            {destination.name}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black",
              crowdTone(destination.crowdLevel),
            )}
          >
            {status} · {destination.crowdLevel}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-sand-600">{reason}</p>
        {crowdStatus(destination.crowdLevel) !== "Calm" ? (
          <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
            <Clock className="h-3.5 w-3.5" />
            Best window: {bestWindow}
          </p>
        ) : null}
      </Link>
    </li>
  );
}

function TripGroup({
  label,
  trips,
  emptyMessage,
}: {
  label: string;
  trips: {
    id: string;
    fromLocation: string;
    toLocation: string;
    startDate: string;
    endDate: string;
    totalCost: number;
    estimatedCo2: number;
    accessibilityScore: number;
    dataSource: string;
  }[];
  emptyMessage: string;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-black tracking-wider text-sand-500 uppercase">
        {label}
      </p>
      {trips.length === 0 ? (
        <p className="text-xs text-sand-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {trips.slice(0, 3).map((trip) => (
            <li key={trip.id}>
              <Link
                href={`/trips/${trip.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-sand-200/70 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-forest-300 hover:shadow-md"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="text-sm font-bold text-forest-950">
                    {trip.fromLocation} → {trip.toLocation}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                    {trip.dataSource === "prototype" ? "Prototype plan" : "AI plan"}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-sand-600">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-sand-400" />
                    {trip.startDate} → {trip.endDate}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Wallet className="h-3.5 w-3.5 text-sand-400" />₹
                    {trip.totalCost.toLocaleString("en-IN")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Leaf className="h-3.5 w-3.5 text-sand-400" />
                    {trip.estimatedCo2} kg est. CO₂
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
