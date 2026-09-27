"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  Bus,
  CalendarDays,
  Compass,
  Leaf,
  MapPin,
  MoonStar,
  Plus,
  Recycle,
  TreePine,
  Trophy,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

import { useApp } from "@/components/travello/AppProvider";
import { cn } from "@/lib/format";

/**
 * Interest block: the journey the traveller is currently on and the eco
 * missions they have already started.
 *
 * Both cards read the same confirmed trips and challenge completions that Your
 * Trips and Challenges render, so the three screens agree by construction.
 */

function nightsBetween(startDate: string, endDate: string): number {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)));
}

function formatDateRange(startDate: string, endDate: string): string {
  const format = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  return `${format(startDate)} → ${format(endDate)}`;
}

export function ActiveTripCard() {
  const { trips, destinations } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips
    .filter((trip) => trip.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const trip =
    upcoming[0] ??
    [...trips].sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ??
    null;

  const destination =
    destinations.find(
      (item) =>
        trip &&
        (item.name.toLowerCase() === trip.toLocation.toLowerCase() ||
          trip.toLocation.toLowerCase().includes(item.name.toLowerCase())),
    ) ?? null;

  const image = destination?.heroImageUrl ?? destination?.image ?? null;

  const facts = trip
    ? [
        {
          label: "Nights",
          value: `${nightsBetween(trip.startDate, trip.endDate)} nights`,
          icon: MoonStar,
        },
        {
          label: "All-in cost",
          value: `₹${trip.totalCost.toLocaleString("en-IN")}`,
          icon: Wallet,
        },
        {
          label: "Estimated CO₂",
          value: `${trip.estimatedCo2} kg`,
          icon: Leaf,
        },
        {
          label: "Accessibility",
          value: `${trip.accessibilityScore}/100`,
          icon: Award,
        },
      ]
    : [];

  return (
    <section
      aria-labelledby="your-trips-heading"
      className="rounded-2xl border border-sand-200/80 bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="your-trips-heading"
          className="flex items-center gap-2 text-[0.95rem] font-bold text-forest-950"
        >
          <MapPin className="h-4 w-4 text-primary-600" />
          Your Trips
        </h2>
        <Link
          href="/trips"
          className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 transition-colors hover:text-forest-900"
        >
          View all trips <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {!trip ? (
        <div className="mt-5 rounded-xl border border-dashed border-sand-300 bg-sand-50/60 p-6 text-center">
          <Compass className="mx-auto h-6 w-6 text-forest-500" />
          <p className="mt-3 text-sm font-bold text-forest-950">
            No trips planned yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-sand-600">
            Answer a few quick questions and we&apos;ll build two itinerary
            options around your accessibility profile.
          </p>
          <Link
            href="/plan"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-forest-800 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-forest-900"
          >
            <Plus className="h-3.5 w-3.5" />
            Plan my trip
          </Link>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-5 sm:flex-row">
          <div className="relative w-full shrink-0 overflow-hidden rounded-xl sm:w-44">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                className="h-40 w-full object-cover transition-transform duration-700 ease-out hover:scale-105 sm:h-full sm:min-h-44"
              />
            ) : (
              <div className="grid h-40 w-full place-items-center bg-forest-50 text-forest-500 sm:h-full sm:min-h-44">
                <MapPin className="h-6 w-6" />
              </div>
            )}
            <span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black tracking-wide text-forest-800 uppercase">
              {upcoming.length > 0 ? "Active trip" : "Latest trip"}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-base font-black tracking-tight text-forest-950">
                {trip.title}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-sand-600">
                <MapPin className="h-3.5 w-3.5 text-sand-400" />
                {trip.toLocation}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-sand-600">
                <CalendarDays className="h-3.5 w-3.5 text-sand-400" />
                {formatDateRange(trip.startDate, trip.endDate)}
              </p>
              <p className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-primary-700">
                <Leaf className="h-3.5 w-3.5" />
                Estimated impact: {trip.estimatedCo2} kg CO₂ accounted for
              </p>
            </div>

            <Link
              href={`/trips/${trip.id}`}
              className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-forest-800 px-4 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:bg-forest-900"
            >
              View details
            </Link>
          </div>

          <dl className="grid shrink-0 grid-cols-2 gap-2.5 sm:w-48 sm:grid-cols-1">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-center gap-2.5 rounded-xl border border-sand-200/70 bg-sand-50/60 px-3 py-2.5"
              >
                <fact.icon className="h-4 w-4 shrink-0 text-forest-600" />
                <div className="min-w-0">
                  <dt className="truncate text-[10.5px] font-bold text-sand-500">
                    {fact.label}
                  </dt>
                  <dd className="truncate text-xs font-black text-forest-950">
                    {fact.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}

const CATEGORY_ICONS: Record<string, typeof Leaf> = {
  transport: Bus,
  environment: Recycle,
  conservation: TreePine,
  community: Users,
  waste: Recycle,
  infrastructure: Wrench,
};

export function MissionProgressCard() {
  const { challenges, completions } = useApp();

  const missions = completions
    .filter((completion) => completion.status === "in_progress")
    .map((completion) => ({
      completion,
      challenge: challenges.find((item) => item.id === completion.challengeId),
    }))
    .filter((row) => row.challenge);

  return (
    <section
      aria-labelledby="active-missions-heading"
      className="rounded-2xl border border-sand-200/80 bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="active-missions-heading"
          className="flex items-center gap-2 text-[0.95rem] font-bold text-forest-950"
        >
          <Trophy className="h-4 w-4 text-amber-500" />
          Active Missions
        </h2>
        <Link
          href="/challenges"
          className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 transition-colors hover:text-forest-900"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {missions.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-sand-300 bg-sand-50/60 px-4 py-5 text-xs text-sand-600">
          Nothing in progress.{" "}
          <Link href="/challenges" className="font-bold text-forest-700">
            Browse eco-challenges →
          </Link>
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {missions.slice(0, 4).map(({ completion, challenge }) => {
            const Icon = CATEGORY_ICONS[challenge!.category] ?? Leaf;
            const total = Math.max(challenge!.instructions.length, 1);
            const done = Math.min(completion.progress, total);
            const percent = Math.round((done / total) * 100);

            return (
              <li key={challenge!.id}>
                <Link
                  href={`/challenges/${challenge!.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-sand-200/70 bg-sand-50/50 px-3 py-3 transition-colors hover:border-forest-200 hover:bg-primary-50/60"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-primary-100 bg-white text-primary-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-forest-950">
                      {challenge!.title}
                    </span>
                    <span
                      className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-sand-200/80"
                      aria-hidden="true"
                    >
                      <span
                        className={cn(
                          "block h-full rounded-full bg-forest-500 transition-all duration-700 ease-out group-hover:bg-forest-600",
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-black text-forest-700">
                    {done}/{total}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
