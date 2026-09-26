import "server-only";

import { requestJson } from "@/lib/openrouter";
import { buildPrototypeOptions } from "@/lib/trip-fallback";
import { applyPrototypeModification } from "@/lib/trip-modify-fallback";
import {
  DIETARY_LABELS,
  HEARING_LABELS,
  MOBILITY_LABELS,
  TRAVELER_TYPE_LABELS,
  VISUAL_LABELS,
  weightToLabel,
} from "@/lib/profile-options";
import type { ProfileData } from "@/lib/profile-service";
import {
  buildAssumptions,
  buildComparisons,
  extractAiOptions,
  normalizeOption,
  type AiOption,
  type Co2Assumption,
  type ItineraryOption,
  type TripRequestSummary,
} from "@/lib/trip-schema";
import {
  CHILD_NEED_LABELS,
  ELDERLY_PRIORITY_LABELS,
  MOBILITY_NEED_LABELS,
  PRIORITY_LABELS,
  TRANSPORT_LABELS,
} from "@/lib/trip-options";
import type { TripProfileSnapshot } from "@/lib/trip-service";

const SYSTEM_PROMPT = [
  "You are Wayfare's trip planning engine.",
  "You produce structured, accessible and lower-impact travel recommendations.",
  "Return ONLY valid JSON. Do not include markdown code fences.",
  "Do not include any explanation, greeting or prose outside the JSON object.",
  "Never claim a facility is verified: describe suggestions, not confirmed facts.",
  "Never include an option that ignores the traveller's accessibility needs.",
].join(" ");

const JSON_SHAPE = `{
  "options": [
    {
      "optionId": "option_a",
      "title": "short title",
      "tagline": "one short line",
      "description": "one or two short sentences",
      "focus": ["theme", "theme", "theme"],
      "highlights": ["highlight", "highlight", "highlight"],
      "safetyNotes": "one short line",
      "transport": { "mode": "train", "label": "human label", "notes": "one short line" },
      "stay": {
        "name": "stay name",
        "type": "short type",
        "costPerNight": 1400,
        "accessibilityScore": 88,
        "sustainabilityScore": 86,
        "features": ["attribute", "attribute", "attribute"],
        "notes": "one short line"
      },
      "experiences": [
        { "title": "name", "description": "one short line", "accessibilityScore": 90, "sustainabilityLabel": "Lower impact", "cost": 150 }
      ],
      "accessibilityScore": 88,
      "sustainabilityScore": 86,
      "days": [
        { "day": 1, "title": "short day title", "summary": "one short line", "activities": [
          { "time": "08:00", "title": "activity", "location": "place", "transport": "train", "cost": 900, "accessibility": "one short line", "sustainability": "one short line" }
        ] }
      ]
    },
    {
      "optionId": "option_b",
      "title": "short title",
      "tagline": "one short line",
      "description": "one or two short sentences",
      "focus": ["theme", "theme", "theme"],
      "highlights": ["highlight", "highlight", "highlight"],
      "safetyNotes": "one short line",
      "transport": { "mode": "car", "label": "human label", "notes": "one short line" },
      "stay": {
        "name": "stay name",
        "type": "short type",
        "costPerNight": 1900,
        "accessibilityScore": 92,
        "sustainabilityScore": 80,
        "features": ["attribute", "attribute", "attribute"],
        "notes": "one short line"
      },
      "experiences": [
        { "title": "name", "description": "one short line", "accessibilityScore": 92, "sustainabilityLabel": "Moderate impact", "cost": 200 }
      ],
      "accessibilityScore": 92,
      "sustainabilityScore": 80,
      "days": [
        { "day": 1, "title": "short day title", "summary": "one short line", "activities": [
          { "time": "09:00", "title": "activity", "location": "place", "transport": "car", "cost": 1000, "accessibility": "one short line", "sustainability": "one short line" }
        ] }
      ]
    }
  ]
}`;

function labelsFrom(values: string[], map: Record<string, string>): string {
  if (values.length === 0) return "none recorded";
  return values.map((value) => map[value] ?? value).join(", ");
}

export function toProfileSnapshot(profile: ProfileData): TripProfileSnapshot {
  return {
    completed: profile.completed,
    travelerTypes: profile.travelerTypes,
    mobility: profile.requirements.mobility,
    visual: profile.requirements.visual,
    hearing: profile.requirements.hearing,
    dietary: profile.dietary,
    mobilityDetail: profile.details.mobility,
    dietaryDetail: profile.details.dietary,
    specialRequirement: profile.specialRequirement,
    priorities: { ...profile.preferences },
  };
}

/** The stored accessibility profile, rendered for the model. */
export function describeProfile(
  profile: ProfileData,
  request: TripRequestSummary,
): string {
  const lines = [
    `Travelling with: ${labelsFrom(profile.travelerTypes, TRAVELER_TYPE_LABELS)}`,
    `Mobility needs: ${labelsFrom(profile.requirements.mobility, MOBILITY_LABELS)}`,
    `Visual needs: ${labelsFrom(profile.requirements.visual, VISUAL_LABELS)}`,
    `Hearing needs: ${labelsFrom(profile.requirements.hearing, HEARING_LABELS)}`,
    `Dietary requirements: ${labelsFrom(profile.dietary, DIETARY_LABELS)}`,
    `Priority weights — sustainability: ${weightToLabel(
      profile.preferences.sustainability,
    )}, accessibility: ${weightToLabel(
      profile.preferences.accessibility,
    )}, budget: ${weightToLabel(profile.preferences.budget)}, time: ${weightToLabel(
      profile.preferences.time,
    )}, comfort: ${weightToLabel(profile.preferences.comfort)}`,
  ];

  if (profile.details.mobility.trim()) {
    lines.push(`Mobility notes: ${profile.details.mobility.trim()}`);
  }
  if (profile.details.dietary.trim()) {
    lines.push(`Dietary notes: ${profile.details.dietary.trim()}`);
  }
  if (profile.specialRequirement.trim()) {
    lines.push(`Other requirements: ${profile.specialRequirement.trim()}`);
  }

  const tripNeeds = request.tripNeeds
    .map(
      (slug) =>
        ELDERLY_PRIORITY_LABELS[slug] ??
        MOBILITY_NEED_LABELS[slug] ??
        CHILD_NEED_LABELS[slug] ??
        slug,
    )
    .filter(Boolean);
  if (tripNeeds.length > 0) {
    lines.push(`Trip-specific priorities: ${tripNeeds.join(", ")}`);
  }

  return lines.join("\n");
}

function describeTrip(request: TripRequestSummary): string {
  const priorities = request.priorities.length
    ? request.priorities.map((slug) => PRIORITY_LABELS[slug] ?? slug).join(", ")
    : "no strong preference";
  return [
    `Route: ${request.from} → ${request.to}`,
    `Dates: ${request.startDate} to ${request.endDate} (${request.days} days, ${request.nights} nights)`,
    `Travellers: ${request.adults} adult(s), ${request.children} child(ren), ${request.elderly} elderly, ${request.mobilitySupport} needing mobility support`,
    `Total traveller count: ${request.travelers}`,
    `Budget: ${request.budget} INR for the whole trip`,
    `Preferred transport: ${TRANSPORT_LABELS[request.transportPreference] ?? request.transportPreference}`,
    `Priorities: ${priorities}`,
    request.additionalPreferences.trim()
      ? `Extra notes: ${request.additionalPreferences.trim()}`
      : "Extra notes: none",
  ].join("\n");
}

export type PlanResult = {
  options: ItineraryOption[];
  /** Estimated-CO2 basis per option id. */
  assumptions: Record<string, Co2Assumption[]>;
  comparisons: Record<string, string[]>;
  engine: "ai" | "prototype";
  /** Raw engine payload — stored for auditing, never rendered. */
  rawPayload: unknown;
  /** Set when we fell back, for the UI's honest label. */
  note: string | null;
};

function normalizePair(
  raws: AiOption[],
  request: TripRequestSummary,
  dataSource: "ai" | "prototype",
): ItineraryOption[] {
  return raws
    .slice(0, 2)
    .map((raw, index) =>
      normalizeOption(raw, index === 0 ? 0 : 1, request, dataSource),
    );
}

export async function planTrip(
  request: TripRequestSummary,
  profile: ProfileData,
): Promise<PlanResult> {
  const user = [
    describeTrip(request),
    "",
    "The traveller's saved accessibility profile (already collected — do not ask for it again):",
    describeProfile(profile, request),
    "",
    "Produce EXACTLY two itinerary options.",
    "Option A (optionId \"option_a\") must target the lower estimated CO2 and a practical journey, while fully respecting the accessibility needs.",
    "Option B (optionId \"option_b\") must be the more comfortable, experience-rich plan — still fully accessible.",
    "Never make an option inaccessible to create contrast.",
    `Return exactly ${request.days} day object(s), numbered 1 to ${request.days}.`,
    "Use plain integer rupees for all costs (no currency symbols).",
    "Be concise: keep every string under 90 characters, at most 3 focus items, 3 highlights, 2 experiences and 2 activities per day.",
    "The complete response must be one JSON object — never truncate it.",
    "Return only JSON matching this shape:",
    JSON_SHAPE,
  ].join("\n");

  const result = await requestJson({ system: SYSTEM_PROMPT, user });

  if (result.ok) {
    const raws = extractAiOptions(result.json).slice(0, 2);
    if (raws.length === 2) {
      const options = normalizePair(raws, request, "ai");
      return {
        options,
        assumptions: {
          option_a: buildAssumptions(raws[0], request),
          option_b: buildAssumptions(raws[1], request),
        },
        comparisons: buildComparisons(options),
        engine: "ai",
        rawPayload: result.json,
        note: null,
      };
    }
    console.warn(
      "[trip:plan] model returned an unusable payload:",
      result.model,
      `options=${raws.length}`,
    );
  } else {
    console.warn(
      "[trip:plan] OpenRouter unavailable:",
      result.failure.kind,
      result.failure.detail,
    );
  }

  // Every provider failed or returned unusable JSON. Build the plan ourselves
  // so the traveller is never stuck — clearly labelled as prototype data.
  const raws = buildPrototypeOptions(request, toProfileSnapshot(profile));
  const options = normalizePair(raws, request, "prototype");
  return {
    options,
    assumptions: {
      option_a: buildAssumptions(raws[0], request),
      option_b: buildAssumptions(raws[1], request),
    },
    comparisons: buildComparisons(options),
    engine: "prototype",
    rawPayload: { engine: "prototype", options: raws },
    note:
      "Our AI assistant is busy right now, so we built this plan from our own prototype dataset. Every figure is an estimate.",
  };
}

export type ModifyResult = {
  ok: boolean;
  option: ItineraryOption | null;
  assumptions: Co2Assumption[];
  rawPayload: unknown;
  note: string | null;
};

export async function modifyTrip(
  request: TripRequestSummary,
  profile: ProfileData,
  current: ItineraryOption,
  modification: string,
): Promise<ModifyResult> {
  const user = [
    describeTrip(request),
    "",
    "The traveller's saved accessibility profile:",
    describeProfile(profile, request),
    "",
    "This is the CURRENT itinerary that must be updated. Preserve everything the traveller did not ask to change:",
    JSON.stringify(current),
    "",
    `The traveller asked for this change: "${modification}"`,
    "",
    "Return the COMPLETE updated itinerary as ONE option object using the same schema as before (a single object with optionId, title, tagline, description, focus, highlights, safetyNotes, transport, stay, experiences, accessibilityScore, sustainabilityScore, days).",
    `Keep the same optionId ("${current.optionId}") and return exactly ${request.days} day object(s).`,
    "Be concise: keep every string under 90 characters, at most 3 activities per day.",
    "Return only the JSON object — no markdown fences, no prose, and never truncate it.",
  ].join("\n");

  const result = await requestJson({ system: SYSTEM_PROMPT, user });

  if (result.ok) {
    const raws = extractAiOptions(result.json);
    const raw = raws[0];
    if (raw) {
      const option = normalizeOption(
        { ...raw, optionId: current.optionId },
        current.optionId === "option_a" ? 0 : 1,
        request,
        "ai",
      );
      return {
        ok: true,
        option,
        assumptions: buildAssumptions(raw, request),
        rawPayload: result.json,
        note: null,
      };
    }
    console.warn("[trip:modify] model returned unusable JSON");
  } else {
    console.warn(
      "[trip:modify] OpenRouter unavailable:",
      result.failure.kind,
      result.failure.detail,
    );
  }

  // Every provider failed. Apply the request deterministically from our own
  // rules instead of dead-ending, and say so honestly in the UI.
  const fallback = applyPrototypeModification(request, current, modification);
  return {
    ok: true,
    option: fallback.option,
    assumptions: buildAssumptions(toAiOptionForAssumptions(fallback.option), request),
    rawPayload: { engine: "prototype", modification },
    note: fallback.note,
  };
}

/** Minimal adapter so the fallback path can still record CO₂ assumptions. */
function toAiOptionForAssumptions(option: ItineraryOption): AiOption {
  return {
    optionId: option.optionId,
    title: option.title,
    tagline: option.tagline,
    description: option.description,
    focus: option.focus,
    highlights: option.highlights,
    safetyNotes: option.safetyNotes,
    transport: {
      mode: option.transport.mode,
      label: option.transport.label,
      notes: option.transport.notes,
      cost: option.transport.cost,
    },
    stay: {
      name: option.stay.name,
      type: option.stay.type,
      costPerNight: option.stay.costPerNight,
      accessibilityScore: option.stay.accessibilityScore,
      sustainabilityScore: option.stay.sustainabilityScore,
      features: option.stay.features,
      notes: option.stay.notes,
    },
    experiences: option.experiences.map((experience) => ({
      title: experience.title,
      description: experience.description,
      accessibilityScore: experience.accessibilityScore,
      sustainabilityLabel: experience.sustainabilityLabel,
      cost: experience.cost,
    })),
    accessibilityScore: option.summary.accessibilityScore,
    sustainabilityScore: option.summary.sustainabilityScore,
    days: option.days.map((day) => ({
      day: day.day,
      title: day.title,
      summary: day.summary,
      activities: day.activities.map((activity) => ({
        time: activity.time,
        title: activity.title,
        location: activity.location,
        transport: activity.transport,
        cost: activity.cost,
        accessibility: activity.accessibility,
        sustainability: activity.sustainability,
        co2Kg: activity.co2Kg,
      })),
    })),
  };
}
