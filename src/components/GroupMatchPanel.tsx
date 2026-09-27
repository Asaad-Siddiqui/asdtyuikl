"use client";

import { useMemo, useState } from "react";

import Icon from "@/components/Icon";
import { formatDateRange, formatCo2 } from "@/lib/trip-options";
import {
  groupCarbonSavings,
  matchGroupTravelers,
  travellerCount,
  type GroupMatchRequest,
} from "@/lib/group-matching";
import type { ItineraryOption } from "@/lib/trip-schema";

/**
 * Travel Together.
 *
 * Matches the traveller with compatible companions heading the same way on
 * overlapping dates, and shows the estimated CO₂ avoided when the group travels
 * as one plan instead of separately.
 *
 * The companion list is seeded prototype data — stated in the UI — and the
 * carbon model is the shared, transparent one from `group-matching.ts`, so the
 * savings here always agree with the itinerary's own CO₂ figures.
 */
export default function GroupMatchPanel({
  request,
  option,
}: {
  request: GroupMatchRequest;
  option: ItineraryOption;
}) {
  const matches = useMemo(() => matchGroupTravelers(request), [request]);
  const suggestions = matches.slice(0, 3);
  const [requestedId, setRequestedId] = useState<string | null>(null);

  const soloTravellers = travellerCount(request);
  const groupSize =
    soloTravellers +
    suggestions.reduce((sum, match) => sum + travellerCount(match.traveler), 0);

  const carbon = useMemo(
    () =>
      groupCarbonSavings({
        from: request.from,
        to: request.to,
        mode: option.transport.mode,
        groupSize,
      }),
    [request.from, request.to, option.transport.mode, groupSize],
  );

  return (
    <section aria-label="Travel together" className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Icon name="users" className="h-4.5 w-4.5" />
            </span>
            Travel Together
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">
            Travellers heading the same way on overlapping dates. Group up and you
            share <strong className="font-semibold text-ink-800">this exact
            itinerary</strong> — and the journey&apos;s emissions.
          </p>
        </div>
        <span className="rounded-full border border-sand-200 bg-sand-50 px-2.5 py-1 text-[10px] font-semibold text-sand-700">
          Prototype companions
        </span>
      </div>

      {/* Carbon savings from grouping ------------------------------ */}
      <div className="mt-5 grid gap-4 rounded-2xl border border-forest-200 bg-forest-50/70 p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-forest-700 text-white">
            <Icon name="leaf" className="h-6 w-6 text-emerald-200" />
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-forest-700 uppercase">
              Carbon saved by grouping
            </p>
            <p className="text-2xl font-bold text-forest-900">
              {formatCo2(carbon.savingsKg)}{" "}
              <span className="text-sm font-semibold text-forest-700">
                CO₂ ({carbon.savingsPercent}%)
              </span>
            </p>
          </div>
        </div>
        <div className="text-sm text-forest-900">
          <p>
            <strong className="font-semibold">{carbon.groupSize} travellers</strong>{" "}
            on one {carbon.modeLabel.toLowerCase()} plan instead of {carbon.groupSize}{" "}
            separate ones: {formatCo2(carbon.separateKg)} →{" "}
            {formatCo2(carbon.togetherKg)} estimated CO₂.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-forest-700/90">
            {carbon.basis}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-400">
        Estimated CO₂ is a prototype calculation, not a verified environmental
        measurement. Everyone in a group travels the same confirmed itinerary.
      </p>

      {/* Companion matches ----------------------------------------- */}
      {suggestions.length > 0 ? (
        <ul className="mt-5 grid gap-4 lg:grid-cols-3">
          {suggestions.map((match) => {
            const { traveler } = match;
            const requested = requestedId === traveler.id;
            return (
              <li
                key={traveler.id}
                className="flex flex-col rounded-2xl border border-ink-200 bg-canvas p-4"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={traveler.avatarUrl}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {traveler.name}
                    </p>
                    <p className="text-[11px] font-medium text-ink-500">
                      {traveler.homeCity} → {traveler.destination}
                    </p>
                  </div>
                  <span className="ml-auto shrink-0 rounded-full bg-forest-700 px-2 py-0.5 text-[10px] font-bold text-white">
                    {match.score}% match
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-ink-600">
                  {traveler.bio}
                </p>

                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
                  <Icon name="calendar" className="h-3.5 w-3.5" />
                  {formatDateRange(match.startDate, match.endDate)} ·{" "}
                  {travellerCount(traveler)} traveller
                  {travellerCount(traveler) === 1 ? "" : "s"}
                </p>

                <ul className="mt-3 space-y-1.5">
                  {match.reasons.slice(0, 2).map((reason) => (
                    <li
                      key={reason}
                      className="flex items-start gap-1.5 text-[11px] font-medium text-forest-800"
                    >
                      <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" />
                      {reason}
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {traveler.interests.slice(0, 2).map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-ink-200 bg-surface px-2 py-0.5 text-[10px] font-medium text-ink-600"
                    >
                      {interest}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => setRequestedId(requested ? null : traveler.id)}
                    disabled={requested}
                    className={
                      requested
                        ? "w-full rounded-xl border border-forest-200 bg-forest-50 px-4 py-2.5 text-xs font-bold text-forest-800"
                        : "w-full rounded-xl bg-forest-800 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-forest-900"
                    }
                  >
                    {requested ? "Request sent ✓" : "Request to travel together"}
                  </button>
                  {requested && (
                    <p className="mt-2 text-center text-[10px] leading-relaxed text-ink-400">
                      Demo only — no real traveller was contacted.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-sand-300 bg-canvas p-4 text-sm text-ink-500">
          No compatible co-travellers found for these dates yet. Adjust the dates
          and a match may appear — every match must share your destination and
          overlap your travel window.
        </p>
      )}
    </section>
  );
}
