"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  CalendarDays,
  Leaf,
  MapPin,
  MoonStar,
  Plus,
  Sparkles,
  Wallet,
} from "lucide-react";

import { useApp } from "@/components/travello/AppProvider";
import {
  CalloutBar,
  EmptyNote,
  PageHero,
  SelectControl,
  Toolbar,
  heroArt,
} from "@/components/travello/ui/PageKit";
import { cn } from "@/lib/format";

/**
 * Your Trips — every confirmed itinerary for this account.
 *
 * The tabs, search and sort are presentation over the same list the dashboard
 * reads; nothing about how trips are loaded or stored changed here.
 */

const FALLBACK_ART =
  "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1600&h=600&fit=crop&auto=format";

type Trip = ReturnType<typeof useApp>["trips"][number];

export function TripsPage() {
  const { trips, destinations } = useApp();
  const [tab, setTab] = useState<"upcoming" | "past" | "all">("upcoming");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips.filter((trip) => trip.endDate >= today);
  const past = trips.filter((trip) => trip.endDate < today);

  const visible = useMemo(() => {
    const base = tab === "upcoming" ? upcoming : tab === "past" ? past : trips;
    const matched = base.filter((trip) =>
      `${trip.title} ${trip.fromLocation} ${trip.toLocation} ${trip.startDate}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    return [...matched].sort((a, b) =>
      sort === "newest"
        ? b.startDate.localeCompare(a.startDate)
        : a.startDate.localeCompare(b.startDate),
    );
  }, [tab, upcoming, past, trips, search, sort]);

  const heroImage = heroArt(destinations, ["goa", "munnar", "manali"], FALLBACK_ART);
  const heroPhotos = destinations
    .filter((destination) => destination.image && destination.image !== heroImage)
    .slice(0, 1)
    .map((destination) => destination.image);

  const tabs = [
    { key: "upcoming" as const, label: "Upcoming", count: upcoming.length },
    { key: "past" as const, label: "Past trips", count: past.length },
    { key: "all" as const, label: "All trips", count: trips.length },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHero
        eyebrow="Your adventures, our planet."
        eyebrowIcon={Leaf}
        title="Your Trips"
        subtitle="Every itinerary you confirm is kept here with its cost, its carbon estimate and how accessible it scored — so you can see the trade-offs before you travel."
        pills={[
          { icon: Leaf, label: "Lower-impact travel" },
          { icon: Sparkles, label: "Built around your needs" },
          { icon: Award, label: "Real impact tracked" },
        ]}
        image={heroImage}
        scriptLines={["Collect Moments", "Not Carbon"]}
        photos={heroPhotos}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-hide inline-flex items-center gap-1.5 overflow-x-auto rounded-xl border border-sand-200 bg-white p-1.5 shadow-xs">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              aria-pressed={tab === item.key}
              className={cn(
                "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all",
                tab === item.key
                  ? "bg-forest-800 text-white shadow-xs"
                  : "text-sand-600 hover:bg-sand-50 hover:text-forest-900",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px]",
                  tab === item.key ? "bg-white/20" : "bg-sand-100 text-sand-600",
                )}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        <Link
          href="/plan"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-forest-800 px-4 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-forest-900"
        >
          <Plus className="h-3.5 w-3.5 text-primary-300" />
          Plan a Trip
        </Link>
      </div>

      <Toolbar
        value={search}
        onChange={setSearch}
        placeholder="Search by destination, date or trip name…"
      >
        <SelectControl
          label="Sort trips"
          value={sort}
          onChange={setSort}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
          ]}
        />
      </Toolbar>

      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-12 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-forest-500" />
          <h2 className="mt-3 text-lg font-bold text-forest-950">
            No trips planned yet
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-sand-600">
            Answer a few quick questions and we&apos;ll build two itinerary
            options matched to your accessibility profile.
          </p>
          <Link
            href="/plan"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-forest-800 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-forest-900"
          >
            <Sparkles className="h-4 w-4 text-primary-300" />
            Plan my trip
          </Link>
        </div>
      ) : (
        <ul className="space-y-3.5">
          {visible.map((trip) => (
            <li key={trip.id}>
              <TripRow trip={trip} destinations={destinations} today={today} />
            </li>
          ))}
        </ul>
      )}

      {trips.length > 0 && visible.length === 0 && (
        <EmptyNote>
          Nothing matches that search in this tab. Try another destination or
          switch to “All trips”.
        </EmptyNote>
      )}

      <CalloutBar
        title="More trips. Greater impact."
        subtitle="Every confirmed itinerary records its own carbon estimate and accessibility score."
        action={{ href: "/plan", label: "Plan a Trip" }}
      />
    </div>
  );
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

function nightsBetween(startDate: string, endDate: string): number {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)));
}

function TripRow({
  trip,
  destinations,
  today,
}: {
  trip: Trip;
  destinations: ReturnType<typeof useApp>["destinations"];
  today: string;
}) {
  const destination =
    destinations.find(
      (item) =>
        item.name.toLowerCase() === trip.toLocation.toLowerCase() ||
        trip.toLocation.toLowerCase().includes(item.name.toLowerCase()),
    ) ?? null;

  const image = destination?.heroImageUrl || destination?.image || null;

  const status =
    trip.startDate <= today && trip.endDate >= today
      ? { label: "Active", tone: "bg-forest-800 text-white" }
      : trip.endDate < today
        ? { label: "Completed", tone: "bg-sand-200 text-sand-800" }
        : { label: "Upcoming", tone: "bg-primary-500 text-forest-950" };

  const facts = [
    { label: "Nights", value: `${nightsBetween(trip.startDate, trip.endDate)} nights`, icon: MoonStar },
    { label: "All-in cost", value: `₹${trip.totalCost.toLocaleString("en-IN")}`, icon: Wallet },
    { label: "Estimated CO₂", value: `${trip.estimatedCo2} kg`, icon: Leaf },
    { label: "Accessibility", value: `${trip.accessibilityScore}/100`, icon: Award },
  ];

  return (
    <article className="group flex flex-col gap-5 rounded-2xl border border-sand-200/80 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-md sm:flex-row sm:p-5">
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-sand-100 sm:h-auto sm:w-44">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 sm:min-h-40"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-forest-500 sm:min-h-40">
            <MapPin className="h-5 w-5" />
          </span>
        )}
        <span
          className={cn(
            "absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide uppercase",
            status.tone,
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-black tracking-tight text-forest-950">
              {trip.title}
            </h2>
            <span className="rounded-full border border-sand-200 bg-sand-50 px-2 py-0.5 text-[10px] font-bold text-sand-600">
              {trip.dataSource === "prototype" ? "Prototype plan" : "AI plan"}
            </span>
          </div>

          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-sand-600">
            <MapPin className="h-3.5 w-3.5 text-sand-400" />
            {trip.fromLocation} → {trip.toLocation}
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
          className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-forest-800 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-forest-900"
        >
          View details
        </Link>
      </div>

      <dl className="grid shrink-0 grid-cols-2 gap-2.5 sm:w-44 sm:grid-cols-1">
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
    </article>
  );
}

export default TripsPage;
