"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import Icon from "@/components/Icon";
import { Button } from "@/components/Button";
import { formatCo2, formatINR } from "@/lib/trip-options";
import {
  ITINERARY_OPTION_IDS,
  type EnvironmentalImpact,
  type ItineraryOption,
  type TripDay,
} from "@/lib/trip-schema";

const LETTERS = ["A", "B", "C", "D"];

/** A bright, even-handed palette so each stop reads as its own beat. */
const STOP_COLORS = [
  "#2d7a3e",
  "#5aa46b",
  "#d9a441",
  "#c9764a",
  "#4a7fb5",
  "#8a6fb0",
  "#3f9c8c",
  "#b5525f",
];

const IMPACT_TONE: Record<EnvironmentalImpact["band"], string> = {
  Low: "border-forest-200 bg-forest-50 text-forest-800",
  Moderate: "border-amber-200 bg-amber-50 text-amber-800",
};

function dayLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function TripExperienceView({
  option,
  options,
  impact,
  recommended,
  travelers,
  onBack,
  onContinue,
}: {
  option: ItineraryOption;
  options: ItineraryOption[];
  impact: EnvironmentalImpact;
  recommended: boolean;
  travelers: number;
  onBack: () => void;
  onContinue: () => void;
}) {
  const totalStops = option.days.reduce(
    (sum, day) => sum + day.activities.length,
    0,
  );

  const comparison = options.map((item) => {
    const index = ITINERARY_OPTION_IDS.indexOf(item.optionId);
    return {
      name: `Option ${LETTERS[index] ?? "?"}`,
      kg: item.summary.co2Kg,
      selected: item.optionId === option.optionId,
    };
  });

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition-colors hover:text-brand-700"
      >
        <Icon name="chevronLeft" className="h-4.5 w-4.5" />
        Back to all four options
      </button>

      <header className="card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-sand-100 bg-gradient-to-br from-forest-50 to-warm-100 px-5 py-6 sm:px-7">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-forest-700 uppercase">
              <Icon name="sparkles" className="h-4 w-4" />
              Comfort &amp; experience
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold sm:text-3xl">
              {option.title}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-ink-600">
              {option.tagline || option.description}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2">
            {recommended && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-700 px-3 py-1.5 text-xs font-bold text-white">
                <Icon name="check" className="h-3.5 w-3.5 text-emerald-300" />
                Our recommended plan
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${IMPACT_TONE[impact.band]}`}
            >
              <Icon name="leaf" className="h-3.5 w-3.5" />
              {impact.label}
            </span>
          </div>
        </div>

        <dl className="grid gap-px bg-sand-200 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi icon="wallet" label="Estimated cost" value={formatINR(option.summary.cost)} />
          <Kpi icon="clock" label="Travel time" value={option.summary.duration} />
          <Kpi
            icon="leaf"
            label="Estimated CO₂"
            value={formatCo2(option.summary.co2Kg)}
            hint="Estimate"
          />
          <Kpi
            icon="accessibility"
            label="Accessibility"
            value={`${option.summary.accessibilityScore}%`}
            hint="Estimated"
          />
          <Kpi
            icon="compass"
            label="Sustainability"
            value={`${option.summary.sustainabilityScore}/100`}
            hint="Prototype"
          />
        </dl>
      </header>

      {/* The itinerary graph — the heart of this page ------------------ */}
      <section className="card p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-forest-50 text-forest-700">
                <Icon name="mapPin" className="h-4 w-4" />
              </span>
              Your trip at a glance
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {option.days.length} day
              {option.days.length === 1 ? "" : "s"} · {totalStops} planned stop
              {totalStops === 1 ? "" : "s"} · {travelers} traveller
              {travelers === 1 ? "" : "s"}. Each colour is one stop, in order.
            </p>
          </div>
          <p className="rounded-full border border-forest-200 bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700">
            {option.summary.duration} travel time
          </p>
        </div>

        <div className="mt-5 space-y-5">
          {option.days.map((day) => (
            <DayGraph key={day.day} day={day} />
          ))}
        </div>

        <p className="mt-5 text-xs leading-relaxed text-ink-400">
          Stops are shown in the order we planned them. Times are prototype
          suggestions and can be adjusted when you modify the itinerary.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Four-option comparison -------------------------------------- */}
        <section className="card p-5 sm:p-7">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-warm-100 text-warm-800">
              <Icon name="compass" className="h-4 w-4" />
            </span>
            How your four options compare
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Estimated CO₂ for the whole journey. Your choice is highlighted.
          </p>

          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#84725c" }}
                />
                <Tooltip
                  formatter={(value) =>
                    [`${value} kg`, "Estimated CO₂"] as [string, string]
                  }
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e1d5",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="kg" radius={[10, 10, 4, 4]} maxBarSize={64}>
                  {comparison.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.selected ? "#1f6330" : "#b1d1b7"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* What you are choosing on ------------------------------------ */}
        <section className="card flex flex-col p-5 sm:p-7">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-forest-50 text-forest-700">
              <Icon name="leaf" className="h-4 w-4" />
            </span>
            What you&apos;re choosing on
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            Every plan keeps a{" "}
            <strong className="font-semibold text-forest-800">
              low or moderate environmental impact
            </strong>
            . That is the constant. Cost, accessibility, sustainability and time
            are the trade-offs you weigh between the four.
          </p>

          <dl className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-2">
            <TradeOff
              icon="wallet"
              label="Cost"
              value={formatINR(option.summary.cost)}
            />
            <TradeOff
              icon="accessibility"
              label="Accessibility"
              value={`${option.summary.accessibilityScore}%`}
            />
            <TradeOff
              icon="compass"
              label="Sustainability"
              value={`${option.summary.sustainabilityScore}/100`}
            />
            <TradeOff
              icon="clock"
              label="Travel time"
              value={option.summary.duration}
            />
          </dl>

          <div className="mt-auto pt-5">
            <Button onClick={onContinue}>
              Continue to the full itinerary
              <Icon name="arrowRight" className="h-4.5 w-4.5" />
            </Button>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          Compare the other options
        </Button>
      </div>
    </div>
  );
}

/** One day drawn as a proportional strip of coloured stops. */
function DayGraph({ day }: { day: TripDay }) {
  const dayCost = day.activities.reduce((sum, a) => sum + a.cost, 0);
  const dayCo2 = day.activities.reduce((sum, a) => sum + a.co2Kg, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest-700 text-xs font-bold text-white">
            D{day.day}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">
              {day.title || `Day ${day.day}`}
            </p>
            <p className="text-xs text-ink-500">
              {dayLabel(day.date)} · {day.activities.length} stop
              {day.activities.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <p className="font-semibold text-ink-800">{formatINR(dayCost)}</p>
          {dayCo2 > 0 && (
            <p className="text-ink-400">{formatCo2(dayCo2)} CO₂</p>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
        {day.activities.map((activity, index) => (
          <div
            key={`${day.day}-${index}-${activity.title}`}
            className="min-w-[8rem] flex-1 rounded-xl px-3 py-2.5 text-white shadow-soft"
            style={{
              backgroundColor: STOP_COLORS[index % STOP_COLORS.length],
            }}
            title={`${activity.time} · ${activity.title}`}
          >
            <p className="text-[10px] font-bold tracking-wide text-white/85">
              {activity.time || `Stop ${index + 1}`}
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold">
              {activity.title}
            </p>
          </div>
        ))}
        {day.activities.length === 0 && (
          <div className="flex-1 rounded-xl border border-dashed border-sand-300 px-3 py-2.5 text-xs text-ink-400">
            A free day — no fixed stops.
          </div>
        )}
      </div>
    </div>
  );
}

function TradeOff({
  icon,
  label,
  value,
}: {
  icon: "wallet" | "accessibility" | "compass" | "clock";
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-canvas px-3.5 py-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface text-ink-500">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div>
        <dt className="text-[11px] font-medium text-ink-500">{label}</dt>
        <dd className="text-sm font-semibold text-ink-900">{value}</dd>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: "wallet" | "clock" | "leaf" | "accessibility" | "compass";
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-surface px-5 py-4">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
        <Icon name={icon} className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-ink-900">
        {value}
        {hint && (
          <span className="ml-1.5 text-[10px] font-medium text-ink-400">
            ({hint})
          </span>
        )}
      </dd>
    </div>
  );
}
