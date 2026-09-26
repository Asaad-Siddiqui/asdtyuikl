/**
 * Internal itinerary schema + the normalization pipeline.
 *
 * Hard rule: the raw AI/OpenRouter response NEVER reaches the UI. Everything
 * the frontend renders is produced by this module — parsed, validated against
 * a strict zod schema, repaired where sensible, and re-calculated by the
 * application. The AI only supplies narrative content and a transport choice;
 * the application owns numbers, totals, emissions, dates and structure.
 *
 * This module is client-safe (it only imports zod) so components can consume
 * the exported types with `import type`.
 */

import { z } from "zod";

import { daysBetween, nightsBetween } from "@/lib/trip-options";

/* ------------------------------------------------------------------ */
/* Resilient primitives                                                */
/*                                                                     */
/* Every field is coerced rather than rejected: the spec requires us to */
/* "reject/repair invalid fields where appropriate" instead of showing  */
/* the user a parse error.                                             */
/* ------------------------------------------------------------------ */

function text(max: number, fallback = ""): z.ZodType<string, unknown> {
  return z.preprocess(
    (value) => {
      if (value === null || value === undefined) return fallback;
      return String(value).replace(/\s+/g, " ").trim().slice(0, max);
    },
    z.string(),
  ) as unknown as z.ZodType<string, unknown>;
}

function int(min: number, max: number, fallback = 0): z.ZodType<number, unknown> {
  return z.preprocess(
    (value) => {
      const numeric = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(numeric)) return fallback;
      return Math.max(min, Math.min(max, Math.round(numeric)));
    },
    z.number(),
  ) as unknown as z.ZodType<number, unknown>;
}

function decimal(
  min: number,
  max: number,
  fallback = 0,
): z.ZodType<number, unknown> {
  return z.preprocess(
    (value) => {
      const numeric = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(numeric)) return fallback;
      const clamped = Math.max(min, Math.min(max, numeric));
      return Math.round(clamped * 10) / 10;
    },
    z.number(),
  ) as unknown as z.ZodType<number, unknown>;
}

function stringList(
  maxItems: number,
  itemMax = 120,
): z.ZodType<string[], unknown> {
  return z.preprocess(
    (value) => {
      if (!Array.isArray(value)) return [];
      return value
        .filter((item) => item !== null && item !== undefined)
        .slice(0, maxItems)
        .map((item) => String(item).replace(/\s+/g, " ").trim().slice(0, itemMax))
        .filter((item) => item.length > 0);
    },
    z.array(z.string()),
  ) as unknown as z.ZodType<string[], unknown>;
}

/* ------------------------------------------------------------------ */
/* AI response schema (lenient — repaired, not rejected)               */
/* ------------------------------------------------------------------ */

const aiActivitySchema = z.object({
  time: text(24, "09:00").catch("09:00"),
  title: text(160).catch(""),
  location: text(160).catch(""),
  transport: text(160).catch(""),
  cost: int(0, 1_000_000, 0).catch(0),
  accessibility: text(300).catch(""),
  sustainability: text(300).catch(""),
  co2Kg: decimal(0, 5_000, 0).catch(0),
});

const aiDaySchema = z.object({
  day: int(1, 60, 1).catch(1),
  title: text(120).catch(""),
  summary: text(400).catch(""),
  activities: z.array(aiActivitySchema).max(12).catch([]),
});

const aiExperienceSchema = z.object({
  title: text(140).catch(""),
  description: text(400).catch(""),
  accessibilityScore: int(0, 100, 80).catch(80),
  sustainabilityLabel: text(80).catch(""),
  cost: int(0, 100_000, 0).catch(0),
});

const aiStaySchema = z.object({
  name: text(140).catch(""),
  type: text(80).catch(""),
  costPerNight: int(0, 500_000, 0).catch(0),
  accessibilityScore: int(0, 100, 80).catch(80),
  sustainabilityScore: int(0, 100, 70).catch(70),
  features: stringList(8, 70).catch([]),
  notes: text(400).catch(""),
});

const aiTransportSchema = z.object({
  mode: text(60).catch(""),
  label: text(120).catch(""),
  notes: text(400).catch(""),
  cost: int(0, 500_000, 0).catch(0),
});

const aiOptionSchema = z.object({
  optionId: text(24).catch(""),
  title: text(90).catch(""),
  tagline: text(150).catch(""),
  description: text(700).catch(""),
  focus: stringList(6, 120).catch([]),
  highlights: stringList(6, 140).catch([]),
  safetyNotes: text(300).catch(""),
  transport: aiTransportSchema.catch({
    mode: "",
    label: "",
    notes: "",
    cost: 0,
  }),
  stay: aiStaySchema.catch({
    name: "",
    type: "",
    costPerNight: 0,
    accessibilityScore: 80,
    sustainabilityScore: 70,
    features: [],
    notes: "",
  }),
  experiences: z.array(aiExperienceSchema).max(8).catch([]),
  accessibilityScore: int(0, 100, 80).catch(80),
  sustainabilityScore: int(0, 100, 70).catch(70),
  days: z.array(aiDaySchema).max(40).catch([]),
});

export type AiOption = z.infer<typeof aiOptionSchema>;

/**
 * Accepts whatever the model returned and pulls the option list out of it as
 * safely as possible. Never throws.
 */
export function extractAiOptions(raw: unknown): AiOption[] {
  if (Array.isArray(raw)) {
    return raw
      .slice(0, 2)
      .map((item) => aiOptionSchema.safeParse(item))
      .filter((result) => result.success)
      .map((result) => result.data);
  }

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    const candidate =
      record.options ?? record.itineraries ?? record.data ?? record.plans;
    if (Array.isArray(candidate)) return extractAiOptions(candidate);
    // Some models key options as { option_a: {...}, option_b: {...} }.
    const keyed = ["option_a", "option_b", "optionA", "optionB"]
      .filter((key) => key in record)
      .map((key) => record[key]);
    if (keyed.length > 0) return extractAiOptions(keyed);
  }

  return [];
}

/* ------------------------------------------------------------------ */
/* Internal (application-owned) types                                  */
/* ------------------------------------------------------------------ */

export type TransportMode =
  | "train"
  | "bus"
  | "car"
  | "ev"
  | "walk"
  | "mixed";

export type TripRequestSummary = {
  from: string;
  to: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  elderly: number;
  mobilitySupport: number;
  budget: number;
  transportPreference: string;
  priorities: string[];
  additionalPreferences: string;
  tripNeeds: string[];
  nights: number;
  days: number;
  travelers: number;
};

export type Co2Assumption = {
  label: string;
  distanceKm: number;
  mode: TransportMode;
  factor: number;
  travelers: number;
  co2Kg: number;
  basis: string;
};

export type TripActivity = {
  time: string;
  title: string;
  location: string;
  transport: string;
  cost: number;
  accessibility: string;
  sustainability: string;
  co2Kg: number;
};

export type TripDay = {
  day: number;
  date: string;
  title: string;
  summary: string;
  activities: TripActivity[];
};

export type TripTransport = {
  mode: TransportMode;
  label: string;
  notes: string;
  cost: number;
  duration: string;
  distanceKm: number;
  co2Kg: number;
  accessibility: string;
};

export type TripStay = {
  name: string;
  type: string;
  costPerNight: number;
  nights: number;
  totalCost: number;
  accessibilityScore: number;
  sustainabilityScore: number;
  features: string[];
  notes: string;
};

export type TripExperience = {
  title: string;
  description: string;
  accessibilityScore: number;
  sustainabilityLabel: string;
  cost: number;
};

export type ItineraryOption = {
  optionId: "option_a" | "option_b";
  title: string;
  tagline: string;
  description: string;
  focus: string[];
  highlights: string[];
  safetyNotes: string;
  summary: {
    cost: number;
    duration: string;
    co2Kg: number;
    accessibilityScore: number;
    sustainabilityScore: number;
  };
  transport: TripTransport;
  stay: TripStay;
  experiences: TripExperience[];
  days: TripDay[];
  /** Provenance so the UI can label prototype data honestly. */
  dataSource: "ai" | "prototype";
};

export type TripPlan = {
  options: ItineraryOption[];
  request: TripRequestSummary;
  assumptions: Co2Assumption[];
  /** Descriptive comparison labels — never a universal "best". */
  comparisons: Record<string, string[]>;
  generatedAt: string;
  engine: "ai" | "prototype";
};

/* ------------------------------------------------------------------ */
/* Emission model + distance estimation (prototype, clearly labelled)  */
/* ------------------------------------------------------------------ */

/**
 * Approximate per-passenger emission factors in kg CO₂e per km.
 * Prototype values derived from typical occupancy — not verified real-world
 * measurements, and surfaced in the UI as "Estimated CO₂".
 */
export const EMISSION_FACTORS: Record<TransportMode, number> = {
  train: 0.035,
  ev: 0.045,
  bus: 0.055,
  mixed: 0.075,
  car: 0.1,
  walk: 0,
};

export const MODE_LABELS: Record<TransportMode, string> = {
  train: "Train",
  bus: "Bus",
  car: "Private vehicle",
  ev: "Electric / shared",
  walk: "Walk",
  mixed: "Mixed modes",
};

const AVERAGE_SPEED_KMH: Record<TransportMode, number> = {
  train: 55,
  bus: 45,
  car: 50,
  ev: 50,
  walk: 4,
  mixed: 45,
};

/** A tiny known-distance table for the demo geography; symmetric. */
const KNOWN_DISTANCES: Record<string, number> = {
  "mumbai|mahabaleshwar": 260,
  "mumbai|lonavala": 95,
  "mumbai|alibaug": 95,
  "mumbai|matheran": 90,
  "mumbai|karjat": 100,
  "mumbai|igatpuri": 130,
  "mumbai|goa": 590,
  "mumbai|pune": 150,
  "mumbai|jaipur": 1150,
  "mumbai|udaipur": 750,
  "pune|mahabaleshwar": 120,
  "delhi|jaipur": 280,
  "delhi|rishikesh": 230,
  "delhi|goa": 1900,
  "bengaluru|coorg": 265,
  "bengaluru|alleppey": 540,
  "bengaluru|goa": 560,
  "jaipur|udaipur": 400,
  "goa|coorg": 470,
};

const DEFAULT_DISTANCE_KM = 300;

export function resolveMode(raw: string): TransportMode {
  const value = raw.toLowerCase();
  if (/(train|rail|metro|sleeper)/.test(value)) return "train";
  if (/(bus|coach)/.test(value)) return "bus";
  if (/(\bev\b|electric|shared|shuttle)/.test(value)) return "ev";
  if (/(walk|foot|pedestrian)/.test(value)) return "walk";
  if (/(car|taxi|cab|private|suv|sedan)/.test(value)) return "car";
  return "mixed";
}

export function estimateDistanceKm(from: string, to: string): number {
  const a = from.trim().toLowerCase();
  const b = to.trim().toLowerCase();
  if (!a || !b) return DEFAULT_DISTANCE_KM;
  return (
    KNOWN_DISTANCES[`${a}|${b}`] ??
    KNOWN_DISTANCES[`${b}|${a}`] ??
    DEFAULT_DISTANCE_KM
  );
}

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.max(5, Math.round(hours * 60))}m`;
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return minutes > 0 ? `${whole}h ${minutes}m` : `${whole}h`;
}

export function estimateDuration(distanceKm: number, mode: TransportMode): string {
  return formatDuration(distanceKm / AVERAGE_SPEED_KMH[mode]);
}

/** Per-km prototype fares. Personal modes price per traveller; a private
 * vehicle (car / EV) is charged per vehicle, not per seat. */
export function estimateTransportCost(
  distanceKm: number,
  mode: TransportMode,
  travelers: number,
): number {
  const perKm: Record<TransportMode, number> = {
    train: 1.2,
    bus: 1.5,
    car: 9,
    ev: 8,
    walk: 0,
    mixed: 2,
  };
  const perPerson = mode === "train" || mode === "bus" || mode === "mixed";
  const multiplier = perPerson ? Math.max(1, travelers) : 1;
  return Math.round(distanceKm * perKm[mode] * multiplier);
}

/* ------------------------------------------------------------------ */
/* Normalization                                                       */
/* ------------------------------------------------------------------ */

function addDays(isoDate: string, offset: number): string {
  const base = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return isoDate;
  base.setDate(base.getDate() + offset);
  return base.toISOString().slice(0, 10);
}

const DEFAULT_TITLES = ["Low-Impact & Accessible", "Comfort & Experience"];

const REST_DAY: TripActivity[] = [
  {
    time: "10:00",
    title: "Flexible rest and explore time",
    location: "",
    transport: "",
    cost: 0,
    accessibility: "Pace can be adapted on the day.",
    sustainability: "",
    co2Kg: 0,
  },
];

/**
 * Turns one validated AI option into the application's internal option.
 * Numbers (cost, duration, emissions) are computed here, not trusted.
 */
export function normalizeOption(
  raw: AiOption,
  index: 0 | 1,
  request: TripRequestSummary,
  dataSource: "ai" | "prototype",
): ItineraryOption {
  const travelers = Math.max(1, request.travelers);

  const mode = resolveMode(`${raw.transport.mode} ${raw.transport.label}`);
  const oneWayKm = estimateDistanceKm(request.from, request.to);
  // The itinerary covers the whole trip, so emissions include the return leg.
  const roundTripKm = oneWayKm * 2;
  const factor = EMISSION_FACTORS[mode];
  const co2Kg = Math.round(roundTripKm * factor * travelers * 10) / 10;

  const duration = estimateDuration(oneWayKm, mode);
  // Transport cost covers the whole trip (there and back).
  const transportCost =
    raw.transport.cost > 0
      ? raw.transport.cost
      : estimateTransportCost(roundTripKm, mode, travelers);

  const stay: TripStay = {
    name: raw.stay.name || "Sustainable stay",
    type: raw.stay.type,
    costPerNight: raw.stay.costPerNight,
    nights: request.nights,
    totalCost: raw.stay.costPerNight * request.nights,
    accessibilityScore: raw.stay.accessibilityScore,
    sustainabilityScore: raw.stay.sustainabilityScore,
    features: raw.stay.features,
    notes: raw.stay.notes,
  };

  const experiences: TripExperience[] = raw.experiences
    .filter((experience) => experience.title.length > 0)
    .map((experience) => ({
      title: experience.title,
      description: experience.description,
      accessibilityScore: experience.accessibilityScore,
      sustainabilityLabel: experience.sustainabilityLabel,
      cost: experience.cost,
    }));

  const days: TripDay[] = raw.days
    .slice()
    .sort((a, b) => a.day - b.day)
    .slice(0, request.days)
    .map((day, dayIndex) => ({
      day: dayIndex + 1,
      date: addDays(request.startDate, dayIndex),
      title: day.title || `Day ${dayIndex + 1}`,
      summary: day.summary,
      activities:
        day.activities.length > 0
          ? day.activities.map((activity) => ({
              time: activity.time || "09:00",
              title: activity.title || "Planned activity",
              location: activity.location,
              transport: activity.transport,
              cost: activity.cost,
              accessibility: activity.accessibility,
              sustainability: activity.sustainability,
              co2Kg: activity.co2Kg,
            }))
          : REST_DAY,
    }));

  if (days.length === 0) {
    days.push({
      day: 1,
      date: addDays(request.startDate, 0),
      title: "Day 1",
      summary: "",
      activities: REST_DAY,
    });
  }

  // The application owns trip structure: if the model returned fewer days than
  // the trip length (truncation, or it simply ignored the instruction), fill the
  // remainder so the traveller always gets a complete day-by-day plan.
  while (days.length < request.days) {
    const index = days.length;
    days.push({
      day: index + 1,
      date: addDays(request.startDate, index),
      title: `Day ${index + 1}`,
      summary:
        "A flexible day — keep the pace light and adapt it on the day.",
      activities: [
        {
          time: "10:00",
          title: "Flexible exploring at your own pace",
          location: request.to,
          transport: "",
          cost: 0,
          accessibility: "Pace can be adapted on the day.",
          sustainability: "",
          co2Kg: 0,
        },
        {
          time: "19:00",
          title: "Dinner nearby",
          location: request.to,
          transport: "Walk",
          cost: 0,
          accessibility: "Written menu and step-free entry where possible.",
          sustainability: "Locally sourced where possible.",
          co2Kg: 0,
        },
      ],
    });
  }

  const activityCost = days.reduce(
    (sum, day) =>
      sum + day.activities.reduce((inner, activity) => inner + activity.cost, 0),
    0,
  );

  const totalCost = Math.round(transportCost + stay.totalCost + activityCost);

  const optionId: "option_a" | "option_b" =
    index === 0 ? "option_a" : "option_b";

  return {
    optionId,
    title: raw.title || DEFAULT_TITLES[index],
    tagline: raw.tagline,
    description: raw.description,
    focus: raw.focus,
    highlights: raw.highlights,
    safetyNotes: raw.safetyNotes,
    summary: {
      cost: totalCost,
      duration,
      co2Kg,
      accessibilityScore: raw.accessibilityScore,
      sustainabilityScore: raw.sustainabilityScore,
    },
    transport: {
      mode,
      label: raw.transport.label || MODE_LABELS[mode],
      notes: raw.transport.notes,
      cost: transportCost,
      duration,
      distanceKm: oneWayKm,
      co2Kg,
      accessibility: raw.transport.notes,
    },
    stay,
    experiences,
    days,
    dataSource,
  };
}

export function buildAssumptions(
  raw: AiOption,
  request: TripRequestSummary,
): Co2Assumption[] {
  const mode = resolveMode(`${raw.transport.mode} ${raw.transport.label}`);
  const oneWayKm = estimateDistanceKm(request.from, request.to);
  const roundTripKm = oneWayKm * 2;
  const travelers = Math.max(1, request.travelers);
  const factor = EMISSION_FACTORS[mode];
  const co2Kg = Math.round(roundTripKm * factor * travelers * 10) / 10;

  return [
    {
      label: `${MODE_LABELS[mode]} round trip`,
      distanceKm: roundTripKm,
      mode,
      factor,
      travelers,
      co2Kg,
      basis: `${roundTripKm} km × ${factor} kg CO₂ per km × ${travelers} traveller${
        travelers === 1 ? "" : "s"
      } = ${co2Kg} kg`,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Descriptive comparison labels (never a universal "best")            */
/* ------------------------------------------------------------------ */

export function buildComparisons(
  options: ItineraryOption[],
): Record<string, string[]> {
  const labels: Record<string, string[]> = {};
  for (const option of options) labels[option.optionId] = [];
  if (options.length < 2) return labels;

  const [a, b] = options;

  const winner = (
    pick: (option: ItineraryOption) => number,
    direction: "low" | "high",
    label: string,
  ) => {
    const va = pick(a);
    const vb = pick(b);
    if (va === vb) return;
    const aWins = direction === "low" ? va < vb : va > vb;
    labels[(aWins ? a : b).optionId].push(label);
  };

  winner((o) => o.summary.cost, "low", "Lower cost");
  winner((o) => o.summary.co2Kg, "low", "Lower estimated emissions");
  winner((o) => o.summary.accessibilityScore, "high", "Higher accessibility");
  winner((o) => o.summary.sustainabilityScore, "high", "Higher sustainability");
  winner(
    (o) => o.experiences.length + o.highlights.length + o.days.length,
    "high",
    "More experience-focused",
  );

  // Duration is a string; compare via a rough hours parse.
  const hours = (value: string) => {
    const match = /(\d+)\s*h/.exec(value);
    const mins = /(\d+)\s*m/.exec(value);
    return (match ? Number(match[1]) : 0) + (mins ? Number(mins[1]) / 60 : 0);
  };
  winner((o) => hours(o.summary.duration), "low", "Faster travel");

  return labels;
}

/**
 * Deterministic placeholder itinerary used only when every AI provider is
 * unreachable. Clearly labelled prototype data — never raw AI output.
 */
/** Profile snapshot stored with a confirmed trip (server-derived). */
export type TripProfileView = {
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

/** The shape every result/PDF screen renders. */
export type SavedTripView = {
  id: string;
  title: string;
  fromLocation: string;
  toLocation: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  elderly: number;
  mobilitySupport: number;
  budget: number;
  transportPreference: string;
  priorities: string[];
  additionalPreferences: string;
  tripNeeds: string[];
  selectedOption: string;
  status: string;
  totalCost: number;
  estimatedCo2: number;
  accessibilityScore: number;
  sustainabilityScore: number;
  dataSource: string;
  engine: string;
  createdAt: string;
  itinerary: ItineraryOption;
  assumptions: Co2Assumption[];
  profileSnapshot: TripProfileView;
};

export const ITINERARY_OPTION_IDS = ["option_a", "option_b"] as const;

export function isOptionId(value: unknown): value is "option_a" | "option_b" {
  return value === "option_a" || value === "option_b";
}

/** Shared with pages that render a saved request back to the user. */
export function summarizeRequest(request: {
  from: string;
  to: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  elderly: number;
  mobilitySupport: number;
  budget: number;
}): Pick<
  TripRequestSummary,
  "nights" | "days" | "travelers"
> {
  return {
    nights: nightsBetween(request.startDate, request.endDate),
    days: daysBetween(request.startDate, request.endDate),
    travelers: request.adults + request.children + request.elderly,
  };
}
