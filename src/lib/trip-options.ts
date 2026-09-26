/**
 * Single source of truth for the "Plan My Trip" conversational flow.
 * Values here are the slugs persisted in Postgres and validated server-side.
 *
 * This module is client-safe: it must never import server-only code or secrets.
 */

import type { IconName } from "@/lib/icons";

export type Option = {
  value: string;
  label: string;
  description?: string;
  icon?: IconName;
};

/* ------------------------------------------------------------------ */
/* Suggested places (free text is still allowed)                       */
/* ------------------------------------------------------------------ */

/**
 * The client-safe view of the stored accessibility profile. The server maps
 * `ProfileData` onto this before handing it to the planner component.
 */
export type PlannerProfile = {
  completed: boolean;
  travelerTypes: string[];
  mobility: string[];
  visual: string[];
  hearing: string[];
  dietary: string[];
  mobilityDetail: string;
  dietaryDetail: string;
  specialRequirement: string;
  priorities: Record<string, number>;
};

/** Maps a stored preference weight to the trip priority it implies. */
export const PREFERENCE_TO_PRIORITY: Record<string, string> = {
  sustainability: "low_impact",
  accessibility: "accessible",
  budget: "budget",
  time: "faster",
  comfort: "comfortable",
};

/**
 * Smart defaults: the traveller's strongest stored preferences seed their trip
 * priorities so they don't have to re-state what we already know.
 */
export function defaultPriorities(
  priorities: Record<string, number>,
): string[] {
  return Object.entries(priorities ?? {})
    .filter(([key]) => PREFERENCE_TO_PRIORITY[key])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => PREFERENCE_TO_PRIORITY[key])
    .filter((value, index, list) => list.indexOf(value) === index);
}

export const ORIGIN_SUGGESTIONS = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
];

export const DESTINATION_SUGGESTIONS = [
  "Mahabaleshwar",
  "Goa",
  "Jaipur",
  "Lonavala",
  "Alibaug",
  "Matheran",
  "Karjat",
  "Igatpuri",
  "Udaipur",
  "Coorg",
  "Rishikesh",
  "Alleppey",
];

/* ------------------------------------------------------------------ */
/* Trip questions                                                      */
/* ------------------------------------------------------------------ */

export const PRIORITY_OPTIONS: Option[] = [
  {
    value: "accessible",
    label: "Easy & Accessible",
    description: "Step-free routes, low walking, good support",
    icon: "accessibility",
  },
  {
    value: "low_impact",
    label: "Low-impact",
    description: "Lower estimated emissions and greener stays",
    icon: "leaf",
  },
  {
    value: "budget",
    label: "Budget-friendly",
    description: "Keep the total cost down",
    icon: "wallet",
  },
  {
    value: "faster",
    label: "Faster travel",
    description: "Fewer transfers, less time in transit",
    icon: "clock",
  },
  {
    value: "comfortable",
    label: "Comfortable",
    description: "Relaxed pace and comfortable stays",
    icon: "sofa",
  },
  {
    value: "experiences",
    label: "Experiences",
    description: "More to see, do and taste",
    icon: "sparkles",
  },
];

export const TRANSPORT_OPTIONS: Option[] = [
  {
    value: "public_transport",
    label: "Public transport",
    description: "Trains and metro where available",
    icon: "train",
  },
  { value: "bus", label: "Bus", description: "Intercity coach", icon: "bus" },
  {
    value: "private_vehicle",
    label: "Private vehicle",
    description: "Car or taxi door-to-door",
    icon: "car",
  },
  {
    value: "ev_shared",
    label: "EV / shared mobility",
    description: "Electric or shared rides",
    icon: "bolt",
  },
  {
    value: "walking",
    label: "Walking where practical",
    description: "Short, step-free local walks",
    icon: "footsteps",
  },
  {
    value: "lowest_impact",
    label: "Lowest-impact option",
    description: "Let us pick the greenest route",
    icon: "leaf",
  },
  {
    value: "surprise",
    label: "Surprise me",
    description: "Mix and match for the best fit",
    icon: "sparkles",
  },
];

export const BUDGET_OPTIONS: { value: number; label: string }[] = [
  { value: 5000, label: "₹5,000" },
  { value: 10000, label: "₹10,000" },
  { value: 15000, label: "₹15,000" },
  { value: 25000, label: "₹25,000+" },
];

export const BUDGET_MIN = 1000;
export const BUDGET_MAX = 500000;

/* ------------------------------------------------------------------ */
/* Adaptive questions — shown only when the trip/profile calls for it  */
/* ------------------------------------------------------------------ */

export const ELDERLY_PRIORITY_OPTIONS: Option[] = [
  {
    value: "minimal_walking",
    label: "Minimal walking",
    description: "Short distances between stops",
    icon: "footsteps",
  },
  {
    value: "frequent_rest_stops",
    label: "Frequent rest stops",
    description: "Plenty of places to sit",
    icon: "seat",
  },
  {
    value: "step_free_elevator",
    label: "Elevator / step-free access",
    description: "Lifts and level entrances",
    icon: "elevator",
  },
  {
    value: "ground_floor",
    label: "Ground-floor preference",
    description: "Avoid stairs where we can",
    icon: "ramp",
  },
  {
    value: "easy_transport",
    label: "Easy transportation",
    description: "Fewer changes and transfers",
    icon: "bus",
  },
  {
    value: "quiet_stay",
    label: "Quiet accommodation",
    description: "Calm, low-noise stays",
    icon: "sofa",
  },
];

export const MOBILITY_NEED_OPTIONS: Option[] = [
  {
    value: "step_free_routes",
    label: "Step-free routes",
    description: "Ramps and level paths",
    icon: "ramp",
  },
  {
    value: "accessible_transport",
    label: "Accessible transport",
    description: "Vehicles that can take a wheelchair",
    icon: "bus",
  },
  {
    value: "accessible_bathroom",
    label: "Accessible bathroom",
    description: "Wheelchair-accessible washrooms",
    icon: "bathroom",
  },
  {
    value: "minimal_walking",
    label: "Minimal walking",
    description: "Keep walking distances short",
    icon: "footsteps",
  },
  {
    value: "elevator",
    label: "Elevator",
    description: "Lifts at stays and venues",
    icon: "elevator",
  },
  {
    value: "rest_areas",
    label: "Rest areas",
    description: "Seating along the way",
    icon: "seat",
  },
];

export const CHILD_NEED_OPTIONS: Option[] = [
  {
    value: "short_activities",
    label: "Short activities",
    description: "Nothing too long or tiring",
    icon: "clock",
  },
  {
    value: "family_friendly",
    label: "Family-friendly places",
    description: "Welcoming to children",
    icon: "users",
  },
  {
    value: "restrooms",
    label: "Restrooms",
    description: "Frequent, easy access",
    icon: "bathroom",
  },
  {
    value: "child_safe",
    label: "Child-safe areas",
    description: "Safe, enclosed spaces",
    icon: "check",
  },
  {
    value: "stroller_friendly",
    label: "Stroller-friendly access",
    description: "Ramps and wide paths",
    icon: "ramp",
  },
];

/* ------------------------------------------------------------------ */
/* Label lookup                                                        */
/* ------------------------------------------------------------------ */

function toLabelMap(options: Option[]): Record<string, string> {
  return options.reduce<Record<string, string>>((acc, option) => {
    acc[option.value] = option.label;
    return acc;
  }, {});
}

export const PRIORITY_LABELS = toLabelMap(PRIORITY_OPTIONS);
export const TRANSPORT_LABELS = toLabelMap(TRANSPORT_OPTIONS);
export const ELDERLY_PRIORITY_LABELS = toLabelMap(ELDERLY_PRIORITY_OPTIONS);
export const MOBILITY_NEED_LABELS = toLabelMap(MOBILITY_NEED_OPTIONS);
export const CHILD_NEED_LABELS = toLabelMap(CHILD_NEED_OPTIONS);

/* ------------------------------------------------------------------ */
/* Validated slug sets (used by server-side validation)                */
/* ------------------------------------------------------------------ */

export const PRIORITY_SLUGS = PRIORITY_OPTIONS.map((option) => option.value);
export const TRANSPORT_SLUGS = TRANSPORT_OPTIONS.map((option) => option.value);
export const ELDERLY_PRIORITY_SLUGS = ELDERLY_PRIORITY_OPTIONS.map(
  (option) => option.value,
);
export const MOBILITY_NEED_SLUGS = MOBILITY_NEED_OPTIONS.map(
  (option) => option.value,
);
export const CHILD_NEED_SLUGS = CHILD_NEED_OPTIONS.map(
  (option) => option.value,
);

export const MAX_PRIORITIES = 3;

/** Institution-free date helper shared by the wizard and the summary UI. */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} → ${endDate}`;
  }
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();
  const month = (date: Date) =>
    date.toLocaleDateString("en-GB", { month: "short" });
  return sameMonth
    ? `${start.getDate()} ${month(start)} → ${end.getDate()} ${month(end)}`
    : `${start.getDate()} ${month(start)} → ${end.getDate()} ${month(end)}`;
}

export function nightsBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 1;
  const nights = Math.round((end - start) / 86_400_000);
  return Math.max(1, nights);
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Always rendered next to the words "Estimated CO₂" in the UI. */
export function formatCo2(kg: number): string {
  if (kg <= 0) return "0 kg";
  return kg >= 10 ? `${Math.round(kg)} kg` : `${kg.toFixed(1)} kg`;
}

export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 1;
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}
