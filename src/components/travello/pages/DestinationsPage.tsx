"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Accessibility,
  ArrowUpRight,
  Compass,
  Globe2,
  Leaf,
  Map,
  MapPin,
  Mountain,
  ShieldCheck,
  Sparkles,
  TreePine,
  Trophy,
  Users,
  Waves,
  Zap,
} from "lucide-react";

import { DestinationCard } from "@/components/travello/DestinationCard";
import { useApp } from "@/components/travello/AppProvider";
import { SeniorModeToggle, useSeniorMode } from "@/components/travello/SeniorModeToggle";
import { crowdRank, isSeniorFriendly, rankForSeniorMode } from "@/lib/recommend";
import {
  ChipRow,
  PageHero,
  SectionCard,
  Toolbar,
  heroArt,
} from "@/components/travello/ui/PageKit";
import { cn } from "@/lib/format";

/**
 * Explore — the destination catalogue.
 *
 * Ranking logic is untouched: Senior + Accessibility mode still re-orders the
 * grid through `rankForSeniorMode`, "least crowded first" still sorts by live
 * crowd level, and the chip filters still match on tags, accessibility and eco
 * score. Only the presentation changed, to the shared page kit.
 */

const FALLBACK_ART =
  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&h=600&fit=crop&auto=format";

export function DestinationsPage() {
  const { destinations, stats } = useApp();
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [leastCrowdedFirst, setLeastCrowdedFirst] = useState(false);
  const { seniorMode } = useSeniorMode();

  const filters = [
    { key: "all", label: "All destinations", icon: Globe2 },
    { key: "hill-station", label: "Hill stations", icon: TreePine },
    { key: "beach", label: "Coastal & beaches", icon: Waves },
    { key: "mountains", label: "Mountain hubs", icon: Mountain },
    { key: "accessible", label: "Step-free accessible", icon: Accessibility },
    { key: "eco", label: "High eco-score (75+)", icon: Leaf },
  ];

  const seniorFriendlyCount = useMemo(
    () => destinations.filter(isSeniorFriendly).length,
    [destinations],
  );

  const visibleDestinations = useMemo(() => {
    const matched = destinations.filter((destination) => {
      const matchesSearch =
        destination.name.toLowerCase().includes(search.toLowerCase()) ||
        destination.region.toLowerCase().includes(search.toLowerCase()) ||
        destination.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        selectedFilter === "all" ||
        destination.tags.some((tag) =>
          tag.toLowerCase().includes(selectedFilter.toLowerCase()),
        ) ||
        (selectedFilter === "accessible" &&
          (destination.accessibility.wheelchairAccessible ||
            isSeniorFriendly(destination))) ||
        (selectedFilter === "eco" && destination.sustainabilityScore >= 75);
      return matchesSearch && matchesFilter;
    });

    // Senior + Accessibility mode always wins: step-free and low-walking first.
    if (seniorMode) return rankForSeniorMode(matched);
    if (leastCrowdedFirst) {
      return [...matched].sort((a, b) => {
        const byCrowd = crowdRank(a.crowdLevel) - crowdRank(b.crowdLevel);
        if (byCrowd !== 0) return byCrowd;
        return b.sustainabilityScore - a.sustainabilityScore;
      });
    }
    return matched;
  }, [destinations, search, selectedFilter, seniorMode, leastCrowdedFirst]);

  const recommended = useMemo(() => {
    const ranked = seniorMode ? rankForSeniorMode(destinations) : [...destinations];
    return [...ranked]
      .sort((a, b) => b.sustainabilityScore - a.sustainabilityScore)
      .slice(0, 4);
  }, [destinations, seniorMode]);

  const heroImage = heroArt(destinations, ["goa", "munnar", "manali"], FALLBACK_ART);
  const photoArt = destinations
    .filter((destination) => destination.image && destination.image !== heroImage)
    .slice(0, 2)
    .map((destination) => destination.image);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20.5rem] xl:gap-5">
      <div className="min-w-0 space-y-4 sm:space-y-5">
        <PageHero
          eyebrow="Discover. Explore. Make an impact."
          eyebrowIcon={Compass}
          title="Explore Amazing Destinations"
          subtitle="From pristine beaches to majestic mountains — every hub here is graded on real visitor pressure, waste handling, water strain and accessibility."
          pills={[
            { icon: ShieldCheck, label: "Verified eco hubs" },
            { icon: Leaf, label: "Sustainable travel" },
            { icon: Users, label: "Local communities" },
          ]}
          image={heroImage}
          scriptLines={["Good Vibes", "Only"]}
          photos={photoArt.length === 2 ? [photoArt[0], photoArt[1]] : undefined}
        />

        <div className="space-y-3">
          <Toolbar
            value={search}
            onChange={setSearch}
            placeholder="Search by destination name, state, ecosystem…"
          >
            <div className="flex flex-wrap items-center gap-2">
              <SeniorModeToggle />
              <button
                type="button"
                onClick={() => setLeastCrowdedFirst((value) => !value)}
                aria-pressed={leastCrowdedFirst}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3.5 py-3 text-xs font-bold transition-all",
                  leastCrowdedFirst
                    ? "border-forest-800 bg-forest-800 text-white shadow-sm"
                    : "border-sand-200 bg-white text-sand-700 hover:bg-sand-50",
                )}
              >
                <Users className="h-3.5 w-3.5 shrink-0" />
                Least crowded first
              </button>
              <Link
                href="/twin"
                className="inline-flex items-center gap-2 rounded-xl border border-forest-800 bg-forest-800 px-3.5 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-forest-900"
              >
                <Map className="h-3.5 w-3.5 shrink-0" />
                Map view
              </Link>
            </div>
          </Toolbar>

          <ChipRow
            options={filters}
            value={selectedFilter}
            onChange={setSelectedFilter}
          />

          <p className="text-xs font-semibold text-sand-500">
            {seniorMode
              ? `Step-free, low-walking places first · ${seniorFriendlyCount} senior-friendly destinations`
              : `${seniorFriendlyCount} destinations rated senior-friendly`}
          </p>

          {seniorMode && (
            <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700">
                <Accessibility className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-sky-900">
                  Senior + Accessibility mode is on
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-sky-800">
                  Results are ranked by step-free routes, low walking distances,
                  accessible toilets and lifts. Turn the toggle off to return to
                  standard ranking.
                </p>
              </div>
            </div>
          )}
        </div>

        {visibleDestinations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleDestinations.map((destination, index) => (
              <div
                key={destination.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                <DestinationCard
                  destination={destination}
                  seniorFriendly={seniorMode && isSeniorFriendly(destination)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-12 text-center">
            <Compass className="mx-auto h-7 w-7 text-forest-500" />
            <h2 className="mt-3 text-lg font-bold text-forest-950">
              No destinations match your criteria
            </h2>
            <p className="mt-1 text-sm text-sand-600">
              Try a different keyword or clear the active filter.
            </p>
          </div>
        )}
      </div>

      <aside className="min-w-0 space-y-4 sm:space-y-5">
        <SectionCard title="Your Travel Impact" icon={Zap} action={{ href: "/impact", label: "Details" }}>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary-100 bg-primary-50 text-primary-700">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl leading-none font-black text-forest-950">
                {stats.destinationsVisited}+
              </p>
              <p className="mt-0.5 text-xs font-bold text-sand-600">
                Destinations explored
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-sand-500">
            {stats.co2Avoided} kg CO₂ avoided and{" "}
            {stats.points.toLocaleString("en-IN")} impact points tracked across
            your trips.
          </p>
        </SectionCard>

        <SectionCard
          title="Find Your Next Destination"
          icon={Sparkles}
          action={{ href: "/twin", label: "Open map" }}
        >
          <p className="mt-1.5 text-[11px] text-sand-500">
            Highest-scoring hubs for the month {seniorMode ? "for your access needs" : "right now"}.
          </p>
          <ul className="mt-3 space-y-2">
            {recommended.map((destination) => (
              <li key={destination.id}>
                <Link
                  href={`/explore/${destination.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-sand-200/70 px-3 py-2.5 transition-colors hover:border-forest-300 hover:bg-primary-50/50"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-sand-100">
                    {destination.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={destination.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <MapPin className="h-4 w-4 text-forest-500" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-forest-950">
                      {destination.name}
                    </span>
                    <span className="block truncate text-[11px] text-sand-500">
                      {destination.region} · eco {destination.sustainabilityScore}/100
                    </span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-sand-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-forest-600" />
                </Link>
              </li>
            ))}
            {recommended.length === 0 && (
              <li className="rounded-xl border border-dashed border-sand-300 bg-sand-50/60 px-3 py-5 text-center text-[11px] font-semibold text-sand-600">
                The catalogue loads with your account.
              </li>
            )}
          </ul>
        </SectionCard>

        <SectionCard title="Quick Access" icon={Compass}>
          <ul className="mt-3 space-y-2">
            {[
              { href: "/plan", label: "Plan a Trip", sub: "Turn your ideas into an itinerary", icon: Sparkles },
              { href: "/trips", label: "My Trips", sub: "Upcoming and past journeys", icon: MapPin },
              { href: "/challenges", label: "Challenges", sub: "Earn points and make a difference", icon: Trophy },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl border border-sand-200/70 px-3 py-2.5 transition-colors hover:border-forest-300 hover:bg-primary-50/50"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary-100 bg-primary-50 text-primary-700">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-forest-950">
                      {item.label}
                    </span>
                    <span className="block truncate text-[11px] text-sand-500">
                      {item.sub}
                    </span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-sand-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-forest-600" />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      </aside>
    </div>
  );
}

export default DestinationsPage;
