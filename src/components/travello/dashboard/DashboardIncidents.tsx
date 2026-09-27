"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Accessibility,
  Activity,
  AlertTriangle,
  ChevronRight,
  Recycle,
  Satellite,
  TrendingUp,
  Users,
  Wrench,
  Droplets,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useApp } from "@/components/travello/AppProvider";
import type { Destination } from "@/types";
import { cn } from "@/lib/format";

/**
 * Desire block: what the destination network is telling us this week.
 *
 * The chart is bucketed from the traveller's own reports; when the window holds
 * too few rows to draw an honest line the card says so and falls back to the
 * documented prototype series instead of pretending to have telemetry.
 */

const PROTOTYPE_TREND = [
  { reports: 4, resolved: 3 },
  { reports: 6, resolved: 5 },
  { reports: 3, resolved: 4 },
  { reports: 8, resolved: 6 },
  { reports: 5, resolved: 5 },
  { reports: 12, resolved: 8 },
  { reports: 9, resolved: 9 },
];

type TrendPoint = { day: string; reports: number; resolved: number };

function buildWeeklyTrend(
  reports: { createdAt: string; status: string }[],
): { series: TrendPoint[]; live: boolean } {
  const series: TrendPoint[] = [];
  const today = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const key = day.toISOString().slice(0, 10);
    const rows = reports.filter(
      (report) => report.createdAt.slice(0, 10) === key,
    );
    series.push({
      day: day.toLocaleDateString("en-IN", { weekday: "short" }),
      reports: rows.length,
      resolved: rows.filter((report) => report.status === "resolved").length,
    });
  }

  const total = series.reduce((sum, point) => sum + point.reports, 0);
  if (total >= 3) return { series, live: true };

  return {
    series: series.map((point, index) => ({
      day: point.day,
      reports: PROTOTYPE_TREND[index].reports,
      resolved: PROTOTYPE_TREND[index].resolved,
    })),
    live: false,
  };
}

export function IncidentTrendCard() {
  const { reports } = useApp();
  const { series, live } = buildWeeklyTrend(reports);

  const logged = series.reduce((sum, point) => sum + point.reports, 0);
  const actioned = series.reduce((sum, point) => sum + point.resolved, 0);
  const delta = Math.round((actioned / Math.max(logged, 1)) * 100);

  return (
    <section
      aria-labelledby="weekly-trend-heading"
      className="rounded-2xl border border-sand-200/80 bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg border border-primary-100 bg-primary-50 text-primary-700">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <h2
              id="weekly-trend-heading"
              className="text-[0.95rem] font-bold text-forest-950"
            >
              Weekly Incident vs Resolution
            </h2>
            <p className="mt-0.5 text-[11px] text-sand-500">
              Daily telemetry trends
            </p>
          </div>
        </div>

        <span
          className={cn(
            "rounded-lg border px-2.5 py-1 text-[11px] font-bold",
            live
              ? "border-primary-100 bg-primary-50 text-primary-700"
              : "border-sand-200 bg-sand-100 text-sand-600",
          )}
        >
          {live ? `${delta}% actioned` : "Prototype series"}
        </span>
      </div>

      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={series}
            margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
          >
            <defs>
              <linearGradient id="dashboardReports" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dashboardResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f2f0ea" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "#9d8a6e", fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9d8a6e", fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e1d5",
                fontSize: "12px",
                fontWeight: 600,
                boxShadow: "0 12px 30px -12px rgba(15,19,17,0.25)",
              }}
            />
            <Area
              type="monotone"
              dataKey="reports"
              name="Reports logged"
              stroke="#f43f5e"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#dashboardReports)"
            />
            <Area
              type="monotone"
              dataKey="resolved"
              name="Ranger action taken"
              stroke="#22c55e"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#dashboardResolved)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-sand-100 pt-3 text-[11px] font-bold">
        <span className="inline-flex items-center gap-1.5 text-rose-600">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          Reports logged
        </span>
        <span className="inline-flex items-center gap-1.5 text-primary-700">
          <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />
          Ranger action taken
        </span>
      </div>
    </section>
  );
}

const CATEGORY_META: Record<
  string,
  { icon: typeof Recycle; label: string; tone: string }
> = {
  waste: {
    icon: Recycle,
    label: "Waste accumulation",
    tone: "border-amber-100 bg-amber-50 text-amber-700",
  },
  overcrowding: {
    icon: Users,
    label: "Overcrowding",
    tone: "border-orange-100 bg-orange-50 text-orange-700",
  },
  infrastructure: {
    icon: Wrench,
    label: "Infrastructure issue",
    tone: "border-violet-100 bg-violet-50 text-violet-700",
  },
  accessibility: {
    icon: Accessibility,
    label: "Accessibility",
    tone: "border-sky-100 bg-sky-50 text-sky-700",
  },
  water: {
    icon: Droplets,
    label: "Water issue",
    tone: "border-cyan-100 bg-cyan-50 text-cyan-700",
  },
  environmental_damage: {
    icon: AlertTriangle,
    label: "Environmental damage",
    tone: "border-rose-100 bg-rose-50 text-rose-700",
  },
};

const STATUS_META: Record<string, { label: string; tone: string }> = {
  submitted: { label: "Open", tone: "border-amber-200 bg-amber-50 text-amber-800" },
  under_review: { label: "In review", tone: "border-sky-200 bg-sky-50 text-sky-800" },
  confirmed: { label: "Confirmed", tone: "border-orange-200 bg-orange-50 text-orange-800" },
  in_progress: { label: "In progress", tone: "border-orange-200 bg-orange-50 text-orange-800" },
  resolved: { label: "Resolved", tone: "border-primary-200 bg-primary-50 text-primary-800" },
};

export function RecentIncidentsCard() {
  const { reports } = useApp();
  const [filter, setFilter] = useState("all");

  const categories = Array.from(new Set(reports.map((report) => report.category)));
  const visible =
    filter === "all"
      ? reports
      : reports.filter((report) => report.category === filter);

  return (
    <section
      aria-labelledby="recent-incidents-heading"
      className="rounded-2xl border border-sand-200/80 bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg border border-amber-100 bg-amber-50 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <h2
              id="recent-incidents-heading"
              className="text-[0.95rem] font-bold text-forest-950"
            >
              Recent Incident Reports
            </h2>
            <p className="mt-0.5 text-[11px] text-sand-500">
              Crowdsourced traveller signals
            </p>
          </div>
        </div>
        <Link
          href="/reports"
          className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 transition-colors hover:text-forest-900"
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {["all", ...categories].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition-colors",
              filter === category
                ? "bg-forest-800 text-white"
                : "bg-sand-100 text-sand-600 hover:bg-sand-200",
            )}
          >
            {category === "all" ? "All" : category.replace("_", " ")}
          </button>
        ))}
      </div>

      <ul className="mt-3.5 space-y-1.5">
        {visible.slice(0, 5).map((report) => {
          const meta =
            CATEGORY_META[report.category] ?? {
              icon: AlertTriangle,
              label: report.category.replace("_", " "),
              tone: "border-sand-200 bg-sand-50 text-sand-700",
            };
          const status =
            STATUS_META[report.status] ?? {
              label: report.status.replace("_", " "),
              tone: "border-sand-200 bg-sand-50 text-sand-600",
            };
          const Icon = meta.icon;

          return (
            <li key={report.id}>
              <Link
                href="/reports"
                className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-sand-50"
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl border",
                    meta.tone,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-forest-950 capitalize">
                    {meta.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-sand-500">
                    {report.destinationName ?? "Unassigned"} ·{" "}
                    {formatDistanceToNow(new Date(report.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-lg border px-2.5 py-1 text-[10.5px] font-bold whitespace-nowrap",
                    status.tone,
                  )}
                >
                  {status.label}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-sand-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-forest-600" />
              </Link>
            </li>
          );
        })}

        {visible.length === 0 && (
          <li className="rounded-xl border border-dashed border-sand-300 bg-sand-50/60 px-4 py-8 text-center text-xs font-semibold text-sand-600">
            No reports in this category yet.
          </li>
        )}
      </ul>
    </section>
  );
}

export function TelemetryBar({
  destinations,
  selectedId,
  onSelect,
}: {
  destinations: Destination[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-sand-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary-100 bg-primary-50 text-primary-700">
          <Satellite className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-[0.95rem] font-bold text-forest-950">
            Destination Health &amp; Incident Telemetry
          </h2>
          <p className="mt-0.5 text-[11px] text-sand-500">
            Live pressure, accessibility and incident signals for every eco-hub —
            including the reports you file.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <label className="relative block">
          <span className="sr-only">Destination</span>
          <select
            value={selectedId}
            onChange={(event) => onSelect(event.target.value)}
            className="min-w-32 cursor-pointer appearance-none rounded-xl border border-sand-200 bg-sand-50/70 py-2.5 pr-9 pl-3.5 text-xs font-bold text-forest-900 transition-colors hover:border-sand-300 focus:border-forest-500 focus:outline-none"
          >
            {destinations.map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destination.name}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 rotate-90 text-sand-500" />
        </label>

        <Link
          href={selectedId ? `/explore/${selectedId}` : "/explore"}
          className="inline-flex items-center gap-1.5 rounded-xl bg-forest-800 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-forest-900"
        >
          <TrendingUp className="h-3.5 w-3.5 text-primary-300" />
          View telemetry
        </Link>
      </div>
    </section>
  );
}
