import { z } from "zod";

import {
  BUDGET_MAX,
  BUDGET_MIN,
  CHILD_NEED_SLUGS,
  ELDERLY_PRIORITY_SLUGS,
  MAX_PRIORITIES,
  MOBILITY_NEED_SLUGS,
  PRIORITY_SLUGS,
  TRANSPORT_SLUGS,
} from "@/lib/trip-options";
import {
  ITINERARY_OPTION_IDS,
  summarizeRequest,
  type TripRequestSummary,
} from "@/lib/trip-schema";

/** Never send uncontrolled frontend data into the AI — validate it here first. */

const asTuple = (values: string[]): [string, ...string[]] => {
  if (values.length === 0) return ["none"];
  return values as [string, ...string[]];
};

const TRIP_NEED_SLUGS = [
  ...ELDERLY_PRIORITY_SLUGS,
  ...MOBILITY_NEED_SLUGS,
  ...CHILD_NEED_SLUGS,
];

const place = z
  .string()
  .trim()
  .min(2, "Add a starting point.")
  .max(80, "That place name is too long.");

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.");

const count = z.number().int().min(0).max(20);

export const tripRequestSchema = z
  .object({
    from: place,
    to: place,
    startDate: isoDate,
    endDate: isoDate,
    adults: count.default(1),
    children: count.default(0),
    elderly: count.default(0),
    mobilitySupport: count.default(0),
    budget: z
      .number()
      .int()
      .min(BUDGET_MIN, "Enter a budget of at least ₹1,000.")
      .max(BUDGET_MAX, "That budget is too large."),
    transportPreference: z.enum(asTuple(TRANSPORT_SLUGS)),
    priorities: z.array(z.enum(asTuple(PRIORITY_SLUGS))).max(MAX_PRIORITIES).default([]),
    additionalPreferences: z.string().trim().max(1000).default(""),
    tripNeeds: z.array(z.enum(asTuple(TRIP_NEED_SLUGS))).max(12).default([]),
  })
  .superRefine((value, ctx) => {
    const start = new Date(`${value.startDate}T00:00:00`).getTime();
    const end = new Date(`${value.endDate}T00:00:00`).getTime();

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      ctx.addIssue({ code: "custom", message: "Check the travel dates." });
      return;
    }

    if (end < start) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "The return date can't be before you leave.",
      });
      return;
    }

    const days = Math.round((end - start) / 86_400_000) + 1;
    if (days > 30) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Please plan a trip of 30 days or fewer.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today.getTime() - 86_400_000) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Pick a date from today onwards.",
      });
    }

    if (value.adults + value.children + value.elderly < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["adults"],
        message: "Add at least one traveller.",
      });
    }
  });

export type TripRequestInput = z.infer<typeof tripRequestSchema>;

/** Validated client input → the structured request the AI receives. */
export function toTripRequestSummary(
  input: TripRequestInput,
): TripRequestSummary {
  const derived = summarizeRequest(input);
  return {
    from: input.from,
    to: input.to,
    startDate: input.startDate,
    endDate: input.endDate,
    adults: input.adults,
    children: input.children,
    elderly: input.elderly,
    mobilitySupport: input.mobilitySupport,
    budget: input.budget,
    transportPreference: input.transportPreference,
    priorities: input.priorities,
    additionalPreferences: input.additionalPreferences,
    tripNeeds: input.tripNeeds,
    nights: derived.nights,
    days: derived.days,
    travelers: derived.travelers,
  };
}

/* ------------------------------------------------------------------ */
/* Strict schema for the FINAL confirmed itinerary                     */
/*                                                                     */
/* The client hands back the option our own API produced. We re-validate */
/* it against this strict, application-owned schema before persisting.  */
/* ------------------------------------------------------------------ */

const boundedString = (max: number) => z.string().trim().max(max);

const storedActivitySchema = z.object({
  time: boundedString(24),
  title: boundedString(200),
  location: boundedString(200),
  transport: boundedString(200),
  cost: z.number().int().min(0).max(1_000_000),
  accessibility: boundedString(400),
  sustainability: boundedString(400),
  co2Kg: z.number().min(0).max(20_000),
});

const storedDaySchema = z.object({
  day: z.number().int().min(1).max(60),
  date: boundedString(24),
  title: boundedString(160),
  summary: boundedString(600),
  activities: z.array(storedActivitySchema).max(16),
});

const storedOptionSchema = z.object({
  optionId: z.enum(ITINERARY_OPTION_IDS),
  title: boundedString(120),
  tagline: boundedString(200),
  description: boundedString(900),
  focus: z.array(boundedString(140)).max(8),
  highlights: z.array(boundedString(180)).max(8),
  safetyNotes: boundedString(400),
  summary: z.object({
    cost: z.number().int().min(0).max(10_000_000),
    duration: boundedString(24),
    co2Kg: z.number().min(0).max(100_000),
    accessibilityScore: z.number().int().min(0).max(100),
    sustainabilityScore: z.number().int().min(0).max(100),
  }),
  transport: z.object({
    mode: z.enum(["train", "bus", "car", "ev", "walk", "mixed"]),
    label: boundedString(140),
    notes: boundedString(400),
    cost: z.number().int().min(0).max(1_000_000),
    duration: boundedString(24),
    distanceKm: z.number().min(0).max(20_000),
    co2Kg: z.number().min(0).max(100_000),
    accessibility: boundedString(400),
  }),
  stay: z.object({
    name: boundedString(160),
    type: boundedString(90),
    costPerNight: z.number().int().min(0).max(1_000_000),
    nights: z.number().int().min(0).max(60),
    totalCost: z.number().int().min(0).max(10_000_000),
    accessibilityScore: z.number().int().min(0).max(100),
    sustainabilityScore: z.number().int().min(0).max(100),
    features: z.array(boundedString(90)).max(12),
    notes: boundedString(400),
  }),
  experiences: z
    .array(
      z.object({
        title: boundedString(180),
        description: boundedString(500),
        accessibilityScore: z.number().int().min(0).max(100),
        sustainabilityLabel: boundedString(90),
        cost: z.number().int().min(0).max(500_000),
      }),
    )
    .max(12),
  days: z.array(storedDaySchema).max(31),
  dataSource: z.enum(["ai", "prototype"]),
});

export const storedItineraryOptionSchema = storedOptionSchema;
export type StoredItineraryOption = z.infer<typeof storedOptionSchema>;

const assumptionSchema = z.object({
  label: boundedString(160),
  distanceKm: z.number().min(0).max(50_000),
  mode: z.enum(["train", "bus", "car", "ev", "walk", "mixed"]),
  factor: z.number().min(0).max(5),
  travelers: z.number().int().min(1).max(60),
  co2Kg: z.number().min(0).max(100_000),
  basis: boundedString(300),
});

export const confirmTripSchema = z.object({
  request: tripRequestSchema,
  option: storedOptionSchema,
  engine: z.enum(["ai", "prototype"]),
  assumptions: z.array(assumptionSchema).max(6).default([]),
});

export type ConfirmTripInput = z.infer<typeof confirmTripSchema>;

export const modifyTripSchema = z.object({
  request: tripRequestSchema,
  option: storedOptionSchema,
  modification: z
    .string()
    .trim()
    .min(3, "Tell us what you'd like to change.")
    .max(600, "Keep your request a little shorter."),
});

export type ModifyTripInput = z.infer<typeof modifyTripSchema>;

export const planTripSchema = z.object({
  request: tripRequestSchema,
});

export type PlanTripInput = z.infer<typeof planTripSchema>;

export { assumptionSchema };
