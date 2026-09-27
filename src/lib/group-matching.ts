/**
 * Travel Together — group matching + carbon savings from grouping.
 *
 * The planner already asks for a destination, dates, travellers, needs and
 * priorities. This module turns those answers into:
 *
 *   1. `matchGroupTravelers()` — a ranked list of compatible travellers who are
 *      heading the same way, on overlapping dates, with the same needs. Everyone
 *      in a group shares the one confirmed itinerary.
 *   2. `groupCarbonSavings()` — the estimated CO₂ avoided when those travellers
 *      consolidate onto one plan instead of travelling separately.
 *
 * Client-safe and pure. The companion profiles are seeded demo data (clearly
 * labelled in the UI); the carbon model is transparent and documented below, and
 * reuses the same emission factors as the rest of the trip engine so the numbers
 * never contradict the itinerary.
 */

import {
  EMISSION_FACTORS,
  estimateDistanceKm,
  MODE_LABELS,
  type TransportMode,
} from "@/lib/trip-schema";

/* ------------------------------------------------------------------ */
/* Companion profiles (seed demo data)                                 */
/* ------------------------------------------------------------------ */

/**
 * A suggested travel companion. Dates are stored as offsets from "today" so the
 * demo always lines up with a freshly planned trip instead of going stale.
 */
export type GroupTraveler = {
  id: string;
  name: string;
  avatarUrl: string;
  homeCity: string;
  /** Destination city this traveller is heading to. */
  destination: string;
  /** Days from today the trip starts. */
  startOffsetDays: number;
  durationDays: number;
  adults: number;
  children: number;
  elderly: number;
  /** Slugs shared with the planner's needs/priorities vocabulary. */
  tags: string[];
  interests: string[];
  /** Preferred way of getting there — used to estimate shared emissions. */
  transport: TransportMode;
  bio: string;
};

export const GROUP_TRAVELERS: GroupTraveler[] = [
  {
    id: "gt-meera",
    name: "Meera Nair",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&auto=format",
    homeCity: "Mumbai",
    destination: "Mahabaleshwar",
    startOffsetDays: 20,
    durationDays: 4,
    adults: 1,
    children: 0,
    elderly: 0,
    tags: ["minimal_walking", "step_free_routes", "low_impact"],
    interests: ["Quiet nature trails", "Local food"],
    transport: "car",
    bio: "Slow traveller. Prefers shaded, low-walking trails and quiet viewpoints.",
  },
  {
    id: "gt-rohan",
    name: "Rohan & family",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&auto=format",
    homeCity: "Mumbai",
    destination: "Mahabaleshwar",
    startOffsetDays: 22,
    durationDays: 3,
    adults: 2,
    children: 0,
    elderly: 1,
    tags: ["rest_areas", "minimal_walking", "accessible_transport", "comfortable"],
    interests: ["Gentle walks", "Scenic drives"],
    transport: "ev",
    bio: "Travelling with a parent — route stays step-free with frequent rest stops.",
  },
  {
    id: "gt-ananya",
    name: "Ananya Rao",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&auto=format",
    homeCity: "Pune",
    destination: "Mahabaleshwar",
    startOffsetDays: 21,
    durationDays: 4,
    adults: 1,
    children: 0,
    elderly: 0,
    tags: ["low_impact", "budget", "experiences"],
    interests: ["Heritage", "Photography"],
    transport: "train",
    bio: "Travels by rail where possible and keeps costs light.",
  },
  {
    id: "gt-kabir",
    name: "Kabir Shah",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&auto=format",
    homeCity: "Mumbai",
    destination: "Goa",
    startOffsetDays: 19,
    durationDays: 5,
    adults: 2,
    children: 0,
    elderly: 0,
    tags: ["budget", "experiences"],
    interests: ["Beaches", "Local music"],
    transport: "bus",
    bio: "Weekend coast trips, always on the cheaper coach.",
  },
  {
    id: "gt-sneha",
    name: "Sneha & partner",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&auto=format",
    homeCity: "Mumbai",
    destination: "Mahabaleshwar",
    startOffsetDays: 19,
    durationDays: 3,
    adults: 2,
    children: 0,
    elderly: 0,
    tags: ["step_free_routes", "accessible_transport", "low_impact"],
    interests: ["Quiet places", "Farm stays"],
    transport: "car",
    bio: "Avoids crowds — happy to shift times to dodge the busiest hours.",
  },
];

/* ------------------------------------------------------------------ */
/* Group matching                                                      */
/* ------------------------------------------------------------------ */

export type GroupMatchRequest = {
  from: string;
  to: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  elderly: number;
  priorities?: string[];
  tripNeeds?: string[];
};

export type GroupMatch = {
  traveler: GroupTraveler;
  startDate: string;
  endDate: string;
  /** 0–100 compatibility score. */
  score: number;
  /** How many days the two windows overlap. */
  overlapDays: number;
  /** Needs both trips share, in slug form. */
  sharedTags: string[];
  /** Human-readable explanations, shown verbatim. */
  reasons: string[];
};

/** Maps a planner priority onto the needs/tags a companion might share. */
const PRIORITY_TO_TAGS: Record<string, string[]> = {
  accessible: ["step_free_routes", "minimal_walking"],
  low_impact: ["low_impact"],
  budget: ["budget"],
  faster: ["faster"],
  comfortable: ["comfortable", "rest_areas"],
  experiences: ["experiences"],
};

function addDays(isoDate: string, offset: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function overlapDays(aStart: string, aEnd: string, bStart: string, bEnd: string): number {
  const start = Math.max(
    new Date(`${aStart}T00:00:00`).getTime(),
    new Date(`${bStart}T00:00:00`).getTime(),
  );
  const end = Math.min(
    new Date(`${aEnd}T00:00:00`).getTime(),
    new Date(`${bEnd}T00:00:00`).getTime(),
  );
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function normalizePlace(value: string): string {
  return value.trim().toLowerCase();
}

export function travellerCount(traveler: {
  adults: number;
  children: number;
  elderly: number;
}): number {
  return traveler.adults + traveler.children + traveler.elderly;
}

/**
 * Finds travellers heading the same way on overlapping dates who share the
 * plan's needs. Returns an empty list when there is no genuine match — the UI
 * then says so rather than inventing companions.
 */
export function matchGroupTravelers(
  request: GroupMatchRequest,
  catalogue: GroupTraveler[] = GROUP_TRAVELERS,
): GroupMatch[] {
  const destination = normalizePlace(request.to);
  const origin = normalizePlace(request.from);
  if (!destination) return [];

  // The needs vocabulary for this trip: explicit trip needs + priority-derived.
  const requestTags = new Set<string>(request.tripNeeds ?? []);
  for (const priority of request.priorities ?? []) {
    for (const tag of PRIORITY_TO_TAGS[priority] ?? []) requestTags.add(tag);
  }

  const matches: GroupMatch[] = [];

  for (const traveler of catalogue) {
    const companionDestination = normalizePlace(traveler.destination);
    // Only suggest genuine co-travellers: same destination (either way round).
    if (
      !companionDestination.includes(destination) &&
      !destination.includes(companionDestination)
    ) {
      continue;
    }

    const startDate = addDays(todayIso(), traveler.startOffsetDays);
    const endDate = addDays(startDate, traveler.durationDays - 1);
    const overlap = overlapDays(
      request.startDate,
      request.endDate,
      startDate,
      endDate,
    );
    if (overlap <= 0) continue;

    const sharedTags = traveler.tags.filter((tag) => requestTags.has(tag));

    const reasons: string[] = [];
    let score = 50; // destination match is the entry ticket

    score += Math.min(30, overlap * 6);
    reasons.push(
      overlap === 1
        ? "Overlaps your trip by a day"
        : `Dates overlap by ${overlap} days`,
    );

    if (sharedTags.length > 0) {
      score += Math.min(12, sharedTags.length * 6);
      reasons.push("You both need the same kind of support");
    }

    if (normalizePlace(traveler.homeCity) === origin) {
      score += 8;
      reasons.push(`Starts from the same city (${traveler.homeCity})`);
    }

    matches.push({
      traveler,
      startDate,
      endDate,
      score: Math.max(0, Math.min(100, Math.round(score))),
      overlapDays: overlap,
      sharedTags,
      reasons,
    });
  }

  return matches.sort((a, b) => b.score - a.score);
}

/* ------------------------------------------------------------------ */
/* Carbon savings from grouping                                        */
/* ------------------------------------------------------------------ */

/**
 * The assumed average occupancy baked into the per-passenger emission factors.
 * Used only to model a shared private vehicle honestly.
 */
const ASSUMED_OCCUPANCY = 1.6;

/**
 * Small consolidation saving for mass transit / mixed modes — shared last-mile
 * transfers and coordinated departures rather than a change to the trunk leg.
 */
const SHARED_TRANSIT_SAVING: Record<TransportMode, number> = {
  train: 0.15,
  bus: 0.15,
  mixed: 0.3,
  walk: 0,
  car: 0,
  ev: 0,
};

export type GroupCarbon = {
  mode: TransportMode;
  modeLabel: string;
  groupSize: number;
  /** Whole-journey distance, both legs. */
  distanceKm: number;
  /** Estimated CO₂ if everyone travelled on their own plan. */
  separateKg: number;
  /** Estimated CO₂ when the group travels together. */
  togetherKg: number;
  /** separateKg − togetherKg, never negative. */
  savingsKg: number;
  savingsPerPersonKg: number;
  /** Rounded percentage of the separate total that grouping avoids. */
  savingsPercent: number;
  /** The transparent calculation, printed next to the number. */
  basis: string;
};

/**
 * Estimates the CO₂ avoided when a group of travellers consolidates onto one
 * journey.
 *
 * Private modes (car / EV) can genuinely share a single vehicle, so the group
 * pays one vehicle's emissions instead of one per person. Mass transit is
 * already shared, so we apply only a modest coordination saving. Never returns
 * a negative saving.
 */
export function groupCarbonSavings({
  from,
  to,
  mode,
  groupSize,
}: {
  from: string;
  to: string;
  mode: TransportMode;
  groupSize: number;
}): GroupCarbon {
  const size = Math.max(1, Math.round(groupSize));
  const distanceKm = Math.max(1, estimateDistanceKm(from, to)) * 2;
  const factor = EMISSION_FACTORS[mode];

  const separateKg = distanceKm * factor * size;

  let togetherKg: number;
  let basis: string;

  if (mode === "car" || mode === "ev") {
    // One shared vehicle regardless of group size.
    const perVehicleFactor = factor * ASSUMED_OCCUPANCY;
    togetherKg = distanceKm * perVehicleFactor;
    basis = `${distanceKm} km × ${factor} kg CO₂/km per person travelling separately, vs one shared ${MODE_LABELS[
      mode
    ].toLowerCase()} at ~${ASSUMED_OCCUPANCY} typical occupancy for ${size} travellers.`;
  } else {
    const saving = SHARED_TRANSIT_SAVING[mode] ?? 0;
    togetherKg = separateKg * (1 - saving);
    basis =
      saving > 0
        ? `${distanceKm} km × ${factor} kg CO₂/km × ${size} travellers, with a ${Math.round(
            saving * 100,
          )}% coordination saving from shared local transfers and departures.`
        : `${distanceKm} km × ${factor} kg CO₂/km × ${size} travellers — this mode is already shared.`;
  }

  const savingsKg = Math.max(0, Math.round((separateKg - togetherKg) * 10) / 10);
  const togetherRounded = Math.round(togetherKg * 10) / 10;
  const separateRounded = Math.round(separateKg * 10) / 10;
  const savingsPercent =
    separateRounded > 0 ? Math.round((savingsKg / separateRounded) * 100) : 0;

  return {
    mode,
    modeLabel: MODE_LABELS[mode],
    groupSize: size,
    distanceKm,
    separateKg: separateRounded,
    togetherKg: togetherRounded,
    savingsKg,
    savingsPerPersonKg: Math.round((savingsKg / size) * 10) / 10,
    savingsPercent,
    basis,
  };
}
