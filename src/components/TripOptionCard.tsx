"use client";

import Icon from "@/components/Icon";
import type { IconName } from "@/lib/icons";
import { formatCo2, formatINR } from "@/lib/trip-options";
import {
  ITINERARY_OPTION_IDS,
  type EnvironmentalImpact,
  type ItineraryOption,
  type TransportMode,
} from "@/lib/trip-schema";
import { cn } from "@/lib/format";

const MODE_ICONS: Record<TransportMode, IconName> = {
  train: "train",
  bus: "bus",
  car: "car",
  ev: "bolt",
  walk: "footsteps",
  mixed: "compass",
};

const LETTERS = ["A", "B", "C", "D"];

const IMPACT_TONE: Record<EnvironmentalImpact["band"], string> = {
  Low: "border-forest-200 bg-forest-50 text-forest-800",
  Moderate: "border-amber-200 bg-amber-50 text-amber-800",
};

export default function TripOptionCard({
  option,
  labels,
  onSelect,
  impact,
  recommended = false,
  ctaLabel = "Choose this plan",
  selected = false,
}: {
  option: ItineraryOption;
  labels: string[];
  onSelect: () => void;
  impact: EnvironmentalImpact;
  recommended?: boolean;
  ctaLabel?: string;
  selected?: boolean;
}) {
  const letter = LETTERS[ITINERARY_OPTION_IDS.indexOf(option.optionId)] ?? "A";

  return (
    <article
      className={cn(
        "card flex flex-col p-5 sm:p-6",
        selected && "border-forest-400 ring-1 ring-forest-300",
        !selected && recommended && "border-forest-300 ring-1 ring-forest-200",
      )}
      aria-label={`${option.title} itinerary option`}
    >
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-bold tracking-wide text-sand-500 uppercase">
            Option {letter}
          </p>
          {recommended && (
            <span className="inline-flex items-center gap-1 rounded-full bg-forest-700 px-2.5 py-1 text-[11px] font-bold text-white">
              <Icon name="sparkles" className="h-3 w-3 text-emerald-300" />
              Recommended
            </span>
          )}
        </div>

        <h3 className="mt-1.5 text-lg font-semibold">{option.title}</h3>
        {option.tagline && (
          <p className="mt-1 text-sm text-ink-500">{option.tagline}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold",
              IMPACT_TONE[impact.band],
            )}
          >
            <Icon name="leaf" className="h-3.5 w-3.5" />
            {impact.label}
          </span>
          {labels.map((label) => (
            <span
              key={label}
              className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700"
            >
              {label}
            </span>
          ))}
        </div>
      </header>

      <p className="mt-4 text-sm leading-relaxed text-ink-600">
        {option.description}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="Estimated cost" value={formatINR(option.summary.cost)} />
        <Stat label="Travel time" value={option.summary.duration} />
        <Stat label="Estimated CO₂" value={formatCo2(option.summary.co2Kg)} />
        <Stat
          label="Accessibility"
          value={`${option.summary.accessibilityScore}%`}
          hint="Estimated"
        />
        <Stat
          label="Sustainability"
          value={`${option.summary.sustainabilityScore}/100`}
          hint="Prototype"
        />
        <Stat
          label="Travel"
          value={option.transport.label}
          icon={MODE_ICONS[option.transport.mode]}
        />
      </dl>

      <div className="mt-5 space-y-4">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
            <Icon name="sofa" className="h-3.5 w-3.5" />
            Stay
          </p>
          <p className="mt-1 text-sm font-medium text-ink-800">
            {option.stay.name}
          </p>
          <p className="text-xs text-ink-500">
            {formatINR(option.stay.costPerNight)} / night ·{" "}
            {option.stay.nights} night{option.stay.nights === 1 ? "" : "s"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ScoreChip
              icon="accessibility"
              label="accessibility"
              value={option.stay.accessibilityScore}
            />
            <ScoreChip
              icon="leaf"
              label="sustainability"
              value={option.stay.sustainabilityScore}
            />
          </div>
        </div>

        {option.highlights.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
              <Icon name="sparkles" className="h-3.5 w-3.5" />
              Key highlights
            </p>
            <ul className="mt-2 space-y-1.5">
              {option.highlights.slice(0, 3).map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-start gap-2 text-sm text-ink-600"
                >
                  <Icon
                    name="check"
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600"
                    strokeWidth={2.6}
                  />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {option.experiences.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
              <Icon name="mapPin" className="h-3.5 w-3.5" />
              Experiences
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {option.experiences.slice(0, 4).map((experience) => (
                <li
                  key={experience.title}
                  className="rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700"
                >
                  {experience.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={onSelect}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:bg-brand-700 focus-visible:outline-offset-2 active:translate-y-0"
        >
          {ctaLabel}
          <Icon name="arrowRight" className="h-4.5 w-4.5" />
        </button>
        <p className="mt-2 text-center text-[11px] text-ink-400">
          Estimated CO₂ and all scores are prototype estimates, not verified
          measurements.
        </p>
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: IconName;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-canvas px-3.5 py-3">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
        {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-ink-900">
        {value}
        {hint && (
          <span className="ml-1 text-[10px] font-medium text-ink-400">
            ({hint})
          </span>
        )}
      </dd>
    </div>
  );
}

function ScoreChip({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-600">
      <Icon name={icon} className="h-3.5 w-3.5" />
      {label} {value}%
    </span>
  );
}
