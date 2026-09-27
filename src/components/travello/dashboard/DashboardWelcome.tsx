"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Globe,
  Hand,
  Leaf,
  MapPin,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

import { useApp } from "@/components/travello/AppProvider";
import { cn } from "@/lib/format";

/**
 * Attention block: the welcome banner and the four impact tiles.
 *
 * Every number is the traveller's real row in Neon (`stats`), and each tile
 * states the actual movement over the last seven days rather than a decorative
 * percentage — so the dashboard can never disagree with Profile or Impact.
 */

function withinLastWeek(iso: string | undefined): boolean {
  if (!iso) return false;
  return Date.parse(iso) >= Date.now() - 7 * 24 * 60 * 60 * 1000;
}

/**
 * Mirrors `IMPACT_FACTORS` in `src/lib/travello-service.ts`, which is
 * server-only. The dashboard shows the very same CO₂ estimate the profile
 * stats row is built from, so the two screens always agree.
 */
const CO2_PER_TRANSPORT_CHALLENGE = 6.5;
const CO2_PER_OTHER_CHALLENGE = 1.5;

export function WelcomeBanner({
  heroImage,
  place,
}: {
  heroImage: string;
  place: string | null;
}) {
  const { user } = useApp();
  const firstName = user.displayName.split(" ")[0];

  return (
    <section
      aria-labelledby="welcome-heading"
      className="relative overflow-hidden rounded-2xl border border-sand-200/70 shadow-sm"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-forest-950/92 via-forest-950/70 to-forest-950/20" />

      <div className="relative flex flex-col justify-between gap-6 px-6 py-7 sm:px-8 sm:py-8 lg:flex-row lg:items-center">
        <div className="w-full max-w-[34rem]">
          <h1
            id="welcome-heading"
            className="font-sans-ui flex items-center gap-2.5 text-[clamp(1.75rem,3.2vw,2.6rem)] leading-[1.12] font-black tracking-tight text-white"
          >
            Welcome back, {firstName}!
            <Hand className="h-[clamp(1.5rem,2.4vw,2rem)] w-[clamp(1.5rem,2.4vw,2rem)] shrink-0 text-amber-300" />
          </h1>
          <p className="mt-2.5 max-w-md text-sm leading-relaxed font-medium text-white/80 sm:text-[0.95rem]">
            Here&apos;s how your impact is tracking across Travello
            {place ? `, starting with ${place}` : ""}.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary-300/40 bg-primary-400/15 px-3.5 py-1.5 text-xs font-bold text-primary-100 backdrop-blur-sm">
            <Leaf className="h-3.5 w-3.5" />
            You&apos;re making a difference
          </p>
        </div>

        <p className="hidden shrink-0 -rotate-3 font-serif text-2xl leading-tight font-semibold text-white/85 italic lg:block">
          Small choices
          <br />
          Big impact
        </p>
      </div>
    </section>
  );
}

type Tile = {
  label: string;
  value: string;
  delta: string;
  rising: boolean;
  icon: typeof Leaf;
  watermark?: typeof Leaf;
  href: string;
};

export function ImpactTiles() {
  const { stats, completions, challenges, savedDestinationIds } = useApp();

  const completedThisWeek = completions.filter(
    (completion) =>
      completion.status === "completed" && withinLastWeek(completion.completedAt),
  );
  const pointsThisWeek = completedThisWeek.reduce(
    (sum, completion) => sum + completion.pointsAwarded,
    0,
  );
  const co2ThisWeek = completedThisWeek.reduce((sum, completion) => {
    const challenge = challenges.find(
      (item) => item.id === completion.challengeId,
    );
    const transportCategory =
      challenge?.category === "transport" || challenge?.category === "environment";
    return (
      sum +
      (transportCategory
        ? CO2_PER_TRANSPORT_CHALLENGE
        : CO2_PER_OTHER_CHALLENGE)
    );
  }, 0);

  const tiles: Tile[] = [
    {
      label: "Impact Points",
      value: stats.points.toLocaleString("en-IN"),
      delta:
        pointsThisWeek > 0
          ? `+${pointsThisWeek} pts this week`
          : "Steady this week",
      rising: pointsThisWeek > 0,
      icon: Zap,
      watermark: Sparkles,
      href: "/impact",
    },
    {
      label: "Missions Completed",
      value: String(stats.challengesCompleted),
      delta:
        completedThisWeek.length > 0
          ? `+${completedThisWeek.length} this week`
          : `${stats.challengesInProgress} in progress`,
      rising: completedThisWeek.length > 0,
      icon: Trophy,
      href: "/challenges",
    },
    {
      label: "Destinations",
      value: String(stats.destinationsVisited),
      delta:
        savedDestinationIds.length > 0
          ? `${savedDestinationIds.length} saved`
          : "Explore the catalogue",
      rising: savedDestinationIds.length > 0,
      icon: MapPin,
      watermark: Globe,
      href: "/explore",
    },
    {
      label: "Est. CO₂ Avoided",
      value: `${stats.co2Avoided} kg`,
      delta:
        co2ThisWeek > 0
          ? `+${co2ThisWeek.toFixed(1)} kg this week`
          : `${stats.approvedReports} verified ${
              stats.approvedReports === 1 ? "report" : "reports"
            }`,
      rising: co2ThisWeek > 0,
      icon: Leaf,
      href: "/impact",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Link
          key={tile.label}
          href={tile.href}
          className="group relative overflow-hidden rounded-2xl border border-sand-200/80 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-md sm:p-5"
        >
          {tile.watermark && (
            <tile.watermark
              className="pointer-events-none absolute -right-4 -bottom-4 h-24 w-24 text-forest-900/5 transition-transform duration-500 group-hover:scale-110"
              aria-hidden="true"
            />
          )}

          <span className="relative grid h-9 w-9 place-items-center rounded-xl border border-primary-100 bg-primary-50 text-primary-700">
            <tile.icon className="h-4 w-4" />
          </span>

          <p className="relative mt-3.5 text-2xl leading-none font-black tracking-tight text-forest-950 sm:text-[1.75rem]">
            {tile.value}
          </p>
          <p className="relative mt-1.5 text-xs font-bold text-sand-600">
            {tile.label}
          </p>

          <p
            className={cn(
              "relative mt-2.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold",
              tile.rising
                ? "border-primary-100 bg-primary-50 text-primary-700"
                : "border-sand-200 bg-sand-50 text-sand-600",
            )}
          >
            {tile.rising ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <ArrowUpRight className="h-3 w-3" />
            )}
            {tile.delta}
          </p>
        </Link>
      ))}
    </div>
  );
}
