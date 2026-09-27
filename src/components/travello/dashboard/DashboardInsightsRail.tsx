"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Bus,
  Clock,
  Flame,
  HeartHandshake,
  Leaf,
  Lightbulb,
  Recycle,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { useApp } from "@/components/travello/AppProvider";
import { crowdAwarePicks, crowdStatus, crowdTone } from "@/lib/recommend";
import type { AIInsight } from "@/types";
import { cn } from "@/lib/format";

/**
 * Action block: the pattern-recognition rail.
 *
 * Insights follow the destination chosen in the telemetry bar; when that hub
 * has none of its own we fall back to the whole network so the rail is never an
 * empty column.
 */

const TYPE_META: Record<
  AIInsight["type"],
  { label: string; icon: typeof Flame; tone: string }
> = {
  hotspot: {
    label: "Hotspot",
    icon: Flame,
    tone: "border-amber-200 bg-amber-100 text-amber-800",
  },
  trend: {
    label: "Trend",
    icon: TrendingUp,
    tone: "border-orange-200 bg-orange-100 text-orange-800",
  },
  recommendation: {
    label: "Opportunity",
    icon: Lightbulb,
    tone: "border-sky-200 bg-sky-100 text-sky-800",
  },
  alert: {
    label: "Alert",
    icon: AlertTriangle,
    tone: "border-rose-200 bg-rose-100 text-rose-800",
  },
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "border-rose-200/80 bg-rose-50/60",
  high: "border-amber-200/80 bg-amber-50/60",
  medium: "border-sky-200/70 bg-sky-50/50",
  low: "border-sand-200 bg-sand-50/60",
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function AiInsightsRail({ destinationId }: { destinationId: string }) {
  const { aiInsights } = useApp();

  const scoped = aiInsights.filter(
    (insight) => insight.destinationId === destinationId,
  );
  const insights = (scoped.length > 0 ? scoped : aiInsights).slice(0, 3);

  return (
    <section
      aria-labelledby="ai-insights-heading"
      className="rounded-2xl border border-sand-200/80 bg-white p-5 shadow-xs"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="ai-insights-heading"
          className="flex items-center gap-2 text-[0.95rem] font-bold text-forest-950"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-primary-100 bg-primary-50 text-primary-700">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          AI Insights
        </h2>
        <Link
          href="/twin"
          className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 transition-colors hover:text-forest-900"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="mt-4 space-y-3">
        {insights.map((insight) => {
          const meta = TYPE_META[insight.type] ?? TYPE_META.trend;
          const Icon = meta.icon;

          return (
            <li
              key={insight.id}
              className={cn(
                "rounded-xl border p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm",
                SEVERITY_STYLES[insight.severity] ?? SEVERITY_STYLES.low,
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-black tracking-wide uppercase",
                    meta.tone,
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </span>
                <span className="text-[10.5px] font-bold text-sand-500">
                  {insight.reportCount
                    ? `${insight.reportCount} reports`
                    : SEVERITY_LABEL[insight.severity]}
                </span>
              </div>

              <h3 className="mt-2.5 text-[0.82rem] leading-snug font-bold text-forest-950">
                {insight.title}
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-sand-600">
                {insight.description}
              </p>

              {insight.trend && (
                <p className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-bold text-sand-600">
                  <TrendingUp className="h-3 w-3 text-forest-600" />
                  Trend: {insight.trend}
                </p>
              )}

              <div className="mt-2.5 rounded-lg border border-primary-100 bg-white/90 px-3 py-2">
                <p className="flex items-center gap-1.5 text-[10.5px] font-black text-forest-800">
                  <Leaf className="h-3 w-3 text-primary-600" />
                  Recommended action
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed font-medium text-forest-700">
                  {insight.recommendation}
                </p>
              </div>
            </li>
          );
        })}

        {insights.length === 0 && (
          <li className="rounded-xl border border-dashed border-sand-300 bg-sand-50/60 px-4 py-6 text-center text-[11px] font-semibold text-sand-600">
            All systems normal. No active anomalies.
          </li>
        )}
      </ul>
    </section>
  );
}

const GLANCE_ITEMS = [
  { label: "Cleaner Destinations", icon: Recycle, tone: "text-primary-700 bg-primary-50 border-primary-100" },
  { label: "Happier Communities", icon: HeartHandshake, tone: "text-sky-700 bg-sky-50 border-sky-100" },
  { label: "Smarter Travel", icon: Bus, tone: "text-violet-700 bg-violet-50 border-violet-100" },
  { label: "Greener Future", icon: Leaf, tone: "text-amber-700 bg-amber-50 border-amber-100" },
];

export function ImpactGlanceCard() {
  return (
    <section
      aria-labelledby="impact-glance-heading"
      className="rounded-2xl border border-sand-200/80 bg-white p-5 shadow-xs"
    >
      <h2
        id="impact-glance-heading"
        className="text-[0.95rem] font-bold text-forest-950"
      >
        Impact at a Glance
      </h2>

      <ul className="mt-4 grid grid-cols-2 gap-2.5">
        {GLANCE_ITEMS.map((item) => (
          <li
            key={item.label}
            className="group flex flex-col gap-2 rounded-xl border border-sand-200/70 bg-sand-50/50 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-forest-200 hover:bg-white"
          >
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg border",
                item.tone,
              )}
            >
              <item.icon className="h-4 w-4" />
            </span>
            <span className="text-[11px] leading-tight font-bold text-forest-900">
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Crowd-aware picks.
 *
 * Keeps the traveller-facing recommendation surface on the dashboard: each row
 * states how busy the place is right now and the calmest window to visit.
 */
export function CrowdAwareRailCard() {
  const { destinations } = useApp();
  const picks = crowdAwarePicks(destinations, 3);

  return (
    <section
      aria-labelledby="crowd-aware-heading"
      className="rounded-2xl border border-sand-200/80 bg-white p-5 shadow-xs"
    >
      <h2
        id="crowd-aware-heading"
        className="flex items-center gap-2 text-[0.95rem] font-bold text-forest-950"
      >
        <Users className="h-4 w-4 text-amber-500" />
        Crowd-Aware Picks
      </h2>
      <p className="mt-1 text-[11px] text-sand-500">
        Ranked by how many people are there right now — with the calmest window.
      </p>

      <ul className="mt-3.5 space-y-2.5">
        {picks.map((pick) => (
          <li key={pick.destination.id}>
            <Link
              href={`/explore/${pick.destination.id}`}
              className="block rounded-xl border border-sand-200/70 px-3.5 py-3 transition-colors hover:border-forest-300 hover:bg-primary-50/50"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-bold text-forest-950">
                  {pick.destination.name}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black",
                    crowdTone(pick.destination.crowdLevel),
                  )}
                >
                  {pick.status}
                </span>
              </span>
              <span className="mt-1.5 block text-[11px] leading-relaxed text-sand-600">
                {pick.reason}
              </span>
              {crowdStatus(pick.destination.crowdLevel) !== "Calm" && (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700">
                  <Clock className="h-3.5 w-3.5" />
                  Best window: {pick.bestWindow}
                </span>
              )}
            </Link>
          </li>
        ))}

        {picks.length === 0 && (
          <li className="rounded-xl border border-dashed border-sand-300 bg-sand-50/60 px-4 py-5 text-center text-[11px] font-semibold text-sand-600">
            Destination crowd data loads with the catalogue.
          </li>
        )}
      </ul>
    </section>
  );
}

export function ResponsibleTravelCard() {
  const { destinations } = useApp();
  const image =
    destinations.find((destination) => destination.id === "goa")?.image ??
    destinations[0]?.image ??
    "";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-sand-200/80 shadow-xs">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="h-44 w-full object-cover transition-transform duration-700 ease-out hover:scale-105"
        />
      ) : (
        <div className="h-44 w-full bg-forest-100" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/25 to-transparent" />
      <p className="absolute right-4 bottom-4 font-serif text-xl leading-tight font-semibold text-white/95 italic">
        Travel
        <br />
        Responsibly
      </p>
    </section>
  );
}
