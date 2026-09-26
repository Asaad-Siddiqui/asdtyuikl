"use client";

import Link from "next/link";
import {
  CalendarDays,
  Leaf,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import { useApp } from "@/components/travello/AppProvider";

/** Your Trips — every confirmed itinerary for this account, from Neon. */
export function TripsPage() {
  const { trips } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips
    .filter((trip) => trip.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = trips
    .filter((trip) => trip.endDate < today)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-800">
            <MapPin className="h-3.5 w-3.5" />
            Saved itineraries
          </span>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-forest-950 sm:text-4xl">
            Your Trips
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-sand-700">
            Only you can see these. Every plan below was confirmed and saved to
            your account.
          </p>
        </div>
        <Link
          href="/plan"
          className="inline-flex items-center gap-2 rounded-2xl bg-forest-800 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-forest-900/20 transition-all hover:bg-forest-900"
        >
          <Plus className="h-4 w-4" /> Plan a Trip
        </Link>
      </header>

      {trips.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-sand-300 bg-white p-12 text-center shadow-sm">
          <Sparkles className="mx-auto h-8 w-8 text-forest-500" />
          <h2 className="mt-4 text-lg font-bold text-forest-900">
            No trips planned yet
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-sand-600">
            Answer a few quick questions and we&apos;ll build two itinerary
            options matched to your accessibility profile.
          </p>
          <Link
            href="/plan"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-forest-800 px-5 py-3 text-sm font-bold text-white"
          >
            <Sparkles className="h-4 w-4 text-emerald-300" /> Plan My Trip
          </Link>
        </div>
      ) : (
        <>
          <TripSection label="Upcoming" trips={upcoming} hint="Your next journeys" />
          <TripSection label="Past" trips={past} hint="Where you've already been" />
        </>
      )}
    </div>
  );
}

function TripSection({
  label,
  trips,
  hint,
}: {
  label: string;
  hint: string;
  trips: {
    id: string;
    fromLocation: string;
    toLocation: string;
    startDate: string;
    endDate: string;
    totalCost: number;
    estimatedCo2: number;
    accessibilityScore: number;
    sustainabilityScore: number;
    dataSource: string;
  }[];
}) {
  if (trips.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-black tracking-wider text-sand-500 uppercase">
          {label}
        </h2>
        <p className="mt-2 rounded-2xl border border-dashed border-sand-300 bg-white/60 p-5 text-sm text-sand-500">
          {hint} — nothing here yet.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-black tracking-wider text-sand-500 uppercase">
        {label}
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {trips.map((trip) => (
          <li key={trip.id}>
            <Link
              href={`/trips/${trip.id}`}
              className="flex h-full flex-col rounded-3xl border border-sand-200 bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-forest-300 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-black text-forest-950">
                  {trip.toLocation}
                </h3>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-800">
                  {trip.dataSource === "prototype" ? "Prototype plan" : "AI plan"}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-sand-500">
                {trip.fromLocation} → {trip.toLocation}
              </p>

              <div className="mt-4 space-y-1.5 text-[11px] font-semibold text-sand-600">
                <p className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-sand-400" />
                  {trip.startDate} → {trip.endDate}
                </p>
                <p className="flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-sand-400" />₹
                  {trip.totalCost.toLocaleString("en-IN")}
                </p>
                <p className="flex items-center gap-1.5">
                  <Leaf className="h-3.5 w-3.5 text-sand-400" />
                  {trip.estimatedCo2} kg estimated CO₂
                </p>
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-sand-400" />
                  Accessibility score {trip.accessibilityScore}/100
                </p>
              </div>

              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-forest-700">
                View full itinerary →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TripsPage;
