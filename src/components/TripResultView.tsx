"use client";

import { useState } from "react";
import Link from "next/link";

import Icon from "@/components/Icon";
import TripDayAccordion from "@/components/TripDayAccordion";
import { buttonClasses } from "@/components/Button";
import {
  DIETARY_LABELS,
  HEARING_LABELS,
  MOBILITY_LABELS,
  TRAVELER_TYPE_LABELS,
  VISUAL_LABELS,
} from "@/lib/profile-options";
import {
  formatCo2,
  formatDateRange,
  formatINR,
  PRIORITY_LABELS,
} from "@/lib/trip-options";
import type { IconName } from "@/lib/icons";
import { MODE_LABELS, type SavedTripView } from "@/lib/trip-schema";

export default function TripResultView({ trip }: { trip: SavedTripView }) {
  const { itinerary, profileSnapshot } = trip;
  const travelers = trip.adults + trip.children + trip.elderly;

  const requirements = [
    {
      label: "Travelling with",
      values: profileSnapshot.travelerTypes?.map(
        (value) => TRAVELER_TYPE_LABELS[value] ?? value,
      ),
    },
    {
      label: "Mobility",
      values: profileSnapshot.mobility?.map(
        (value) => MOBILITY_LABELS[value] ?? value,
      ),
    },
    {
      label: "Visual",
      values: profileSnapshot.visual?.map(
        (value) => VISUAL_LABELS[value] ?? value,
      ),
    },
    {
      label: "Hearing",
      values: profileSnapshot.hearing?.map(
        (value) => HEARING_LABELS[value] ?? value,
      ),
    },
    {
      label: "Dietary",
      values: profileSnapshot.dietary?.map(
        (value) => DIETARY_LABELS[value] ?? value,
      ),
    },
  ].filter((row) => (row.values?.length ?? 0) > 0);

  return (
    <div className="space-y-6">
      {/* Header ---------------------------------------------------- */}
      <header className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-6 text-white sm:px-8">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-white/80">
            <Icon name="leaf" className="h-4 w-4" />
            Your trip is ready
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            {trip.fromLocation} → {trip.toLocation}
          </h1>
          <p className="mt-2 text-sm text-white/85">
            {formatDateRange(trip.startDate, trip.endDate)} ·{" "}
            {itinerary.summary.duration} travel time · {itinerary.title}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Pill icon="users">
              {travelers} traveller{travelers === 1 ? "" : "s"}
            </Pill>
            <Pill icon="wallet">Budget {formatINR(trip.budget)}</Pill>
            <Pill icon="check">{trip.status}</Pill>
            {trip.dataSource === "prototype" && (
              <Pill icon="sparkles">Prototype plan</Pill>
            )}
          </div>
        </div>

        <dl className="grid gap-px bg-ink-200 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStat
            icon="wallet"
            label="Total estimated cost"
            value={formatINR(itinerary.summary.cost)}
            hint={`Budget ${formatINR(trip.budget)}`}
          />
          <SummaryStat
            icon="leaf"
            label="Estimated CO₂"
            value={formatCo2(itinerary.summary.co2Kg)}
            hint="Estimate only"
          />
          <SummaryStat
            icon="accessibility"
            label="Accessibility"
            value={`${itinerary.summary.accessibilityScore}%`}
            hint="Estimated"
          />
          <SummaryStat
            icon="compass"
            label="Sustainability"
            value={`${itinerary.summary.sustainabilityScore}/100`}
            hint="Prototype score"
          />
        </dl>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <DownloadPdfButton tripId={trip.id} />
        <Link
          href="/dashboard#trips"
          className={buttonClasses({ variant: "secondary", size: "lg" })}
        >
          View all trips
          <Icon name="arrowRight" className="h-4.5 w-4.5" />
        </Link>
      </div>

      {/* Two balanced columns so the page needs almost no scrolling. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        {/* Left column — the day-by-day story ---------------------- */}
        <div className="space-y-5">
          <Section icon="calendar" title="Day-by-day itinerary">
            <p className="mb-4 flex items-center gap-2 text-xs text-ink-500">
              <Icon
                name="chevronLeft"
                className="h-4 w-4 -rotate-90 text-forest-600"
              />
              Day one is open. Tap any other day to see its full detail.
            </p>
            <TripDayAccordion option={itinerary} />
          </Section>

          {itinerary.experiences.length > 0 && (
            <Section icon="mapPin" title="Experiences">
              <ul className="grid gap-3 sm:grid-cols-2">
                {itinerary.experiences.map((experience) => (
                  <li
                    key={experience.title}
                    className="rounded-2xl border border-ink-200 bg-canvas p-4"
                  >
                    <p className="text-sm font-semibold text-ink-900">
                      {experience.title}
                    </p>
                    {experience.description && (
                      <p className="mt-1 text-xs leading-relaxed text-ink-500">
                        {experience.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-600">
                        <Icon name="accessibility" className="h-3.5 w-3.5" />
                        {experience.accessibilityScore}%
                      </span>
                      {experience.sustainabilityLabel && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
                          <Icon name="leaf" className="h-3.5 w-3.5" />
                          {experience.sustainabilityLabel}
                        </span>
                      )}
                      {experience.cost > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-600">
                          <Icon name="wallet" className="h-3.5 w-3.5" />
                          {formatINR(experience.cost)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* Right column — transport, stay, requirements ------------ */}
        <div className="space-y-5">
          <Section icon="train" title="Transport">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <p className="text-base font-semibold">
                {itinerary.transport.label ||
                  MODE_LABELS[itinerary.transport.mode]}
              </p>
              <span className="text-sm text-ink-500">
                {itinerary.transport.duration} · about{" "}
                {itinerary.transport.distanceKm} km each way
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <MiniStat
                label="Estimated cost"
                value={formatINR(itinerary.transport.cost)}
              />
              <MiniStat
                label="Estimated CO₂"
                value={`${formatCo2(itinerary.transport.co2Kg)}*`}
              />
              <MiniStat
                label="Accessibility"
                value={`${itinerary.summary.accessibilityScore}%`}
              />
              <MiniStat
                label="Impact"
                value={
                  itinerary.summary.co2Kg <= 30
                    ? "Lower"
                    : itinerary.summary.co2Kg <= 80
                      ? "Moderate"
                      : "Higher"
                }
              />
            </dl>
            {itinerary.transport.notes && (
              <p className="mt-3 text-sm leading-relaxed text-ink-600">
                {itinerary.transport.notes}
              </p>
            )}
          </Section>

          <Section icon="sofa" title="Stay">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <p className="text-base font-semibold">{itinerary.stay.name}</p>
              <span className="text-sm text-ink-500">
                {formatINR(itinerary.stay.costPerNight)} / night ·{" "}
                {itinerary.stay.nights} night
                {itinerary.stay.nights === 1 ? "" : "s"}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3">
              <MiniStat
                label="Sustainability"
                value={`${itinerary.stay.sustainabilityScore}/100`}
                hint="Prototype"
              />
              <MiniStat
                label="Accessibility"
                value={`${itinerary.stay.accessibilityScore}/100`}
                hint="Prototype"
              />
              <MiniStat
                label="Estimated total"
                value={formatINR(itinerary.stay.totalCost)}
              />
            </dl>
            {itinerary.stay.features.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {itinerary.stay.features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs leading-relaxed text-ink-400">
              {itinerary.stay.notes ||
                "Listing attributes are prototype planning suggestions — confirm directly with the property before booking."}
            </p>
          </Section>

          <Section icon="accessibility" title="Accessibility requirements">
            {requirements.length > 0 ? (
              <dl className="space-y-3">
                {requirements.map((row) => (
                  <div key={row.label} className="flex flex-wrap gap-2">
                    <dt className="w-32 shrink-0 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                      {row.label}
                    </dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {row.values?.map((value) => (
                        <span
                          key={value}
                          className="rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700"
                        >
                          {value}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-ink-500">
                No specific requirements were recorded in your profile.
              </p>
            )}

            {profileSnapshot.specialRequirement && (
              <div className="mt-4 rounded-2xl border border-sand-200 bg-sand-50 p-4">
                <p className="text-[11px] font-semibold tracking-wide text-sand-700 uppercase">
                  Special requirements
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
                  {profileSnapshot.specialRequirement}
                </p>
              </div>
            )}
          </Section>

          {(trip.priorities.length > 0 ||
            trip.additionalPreferences.trim()) && (
            <Section icon="compass" title="Your trip preferences">
              {trip.priorities.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {trip.priorities.map((priority) => (
                    <li
                      key={priority}
                      className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
                    >
                      {PRIORITY_LABELS[priority] ?? priority}
                    </li>
                  ))}
                </ul>
              )}
              {trip.additionalPreferences.trim() && (
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  {trip.additionalPreferences}
                </p>
              )}
            </Section>
          )}

          <Section icon="note" title="How estimates were calculated">
            {trip.assumptions.length > 0 ? (
              <ul className="space-y-2">
                {trip.assumptions.map((assumption) => (
                  <li
                    key={`${assumption.label}-${assumption.basis}`}
                    className="flex items-start gap-2 text-sm text-ink-600"
                  >
                    <Icon
                      name="leaf"
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                    />
                    <span>
                      <span className="font-medium text-ink-800">
                        {assumption.label}:
                      </span>{" "}
                      {assumption.basis}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-600">
                Estimated CO₂ = distance × estimated transport emission factor ×
                traveller count.
              </p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-ink-400">
              * Estimated CO₂ is a prototype calculation, not a verified
              environmental measurement.
            </p>
          </Section>

          <div className="rounded-[var(--radius-card)] border border-dashed border-ink-300 bg-canvas p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <Icon name="alert" className="h-4.5 w-4.5 text-sand-600" />
              Prototype data notice
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              This plan was generated for a prototype/demo. Costs, CO₂,
              accessibility and sustainability values are estimates from our own
              prototype dataset and are not verified real-world measurements.
              Details such as lifts, step-free access, certifications, schedules
              and opening hours are suggestions that must be confirmed directly
              with each provider before booking.
              {trip.dataSource === "prototype"
                ? " This plan was produced by Travello's own planning engine because our AI assistant was unavailable."
                : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function DownloadPdfButton({ tripId }: { tripId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function handleDownload() {
    setState("loading");
    try {
      const response = await fetch(`/api/trips/${tripId}/pdf`);
      if (!response.ok) throw new Error("pdf failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `wayfare-trip-${tripId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={state === "loading"}
        className={buttonClasses({ variant: "primary", size: "lg" })}
      >
        <Icon name="download" className="h-4.5 w-4.5" />
        {state === "loading" ? "Preparing your PDF…" : "Download PDF"}
      </button>
      {state === "error" && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          We couldn&apos;t build your PDF just now. Please try again.
        </p>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Icon name={icon} className="h-4.5 w-4.5" />
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  hint,
}: {
  icon: IconName;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-surface px-5 py-4">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
        <Icon name={icon} className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-ink-900">{value}</dd>
      {hint && <p className="mt-0.5 text-[11px] text-ink-400">{hint}</p>}
    </div>
  );
}

function MiniStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-canvas px-3.5 py-3">
      <dt className="text-[11px] font-medium text-ink-500">{label}</dt>
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

function Pill({
  icon,
  children,
}: {
  icon: IconName;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
      <Icon name={icon} className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}
