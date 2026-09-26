import "server-only";

import {
  ITINERARY_OPTION_IDS,
  normalizeOption,
  resolveMode,
  type AiOption,
  type ItineraryOption,
  type TripRequestSummary,
} from "@/lib/trip-schema";

/**
 * Deterministic modification, applied by the application.
 *
 * Only used when every configured model is unreachable, so that "Modify
 * itinerary" never dead-ends for the traveller. It honours the common requests
 * in plain language using rules we control, then pushes the result back through
 * the same normalization pipeline so every derived number stays consistent.
 * The result is labelled as a prototype adjustment in the UI.
 */

function toAiOption(option: ItineraryOption): AiOption {
  return {
    optionId: option.optionId,
    title: option.title,
    tagline: option.tagline,
    description: option.description,
    focus: [...option.focus],
    highlights: [...option.highlights],
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
      features: [...option.stay.features],
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

const has = (text: string, words: string[]) =>
  words.some((word) => text.includes(word));

export function applyPrototypeModification(
  request: TripRequestSummary,
  option: ItineraryOption,
  modification: string,
): { option: ItineraryOption; note: string } {
  const raw = toAiOption(option);
  const text = modification.toLowerCase();
  const applied: string[] = [];

  /* Reduce walking / make it less tiring / more rest ---------------- */
  if (has(text, ["walk", "tiring", "rest", "knee", "tired", "slow", "relax", "easier", "less"])) {
    raw.days = raw.days.map((day) => ({
      ...day,
      activities: day.activities.slice(0, 2),
    }));
    raw.days = raw.days.map((day, index) => {
      const activities = [...day.activities];
      activities.push({
        time: "17:00",
        title: "Rest back at the stay",
        location: request.to,
        transport: "",
        cost: 0,
        accessibility:
          "Deliberate rest window — no walking required, seating available.",
        sustainability: "",
        co2Kg: 0,
      });
      return {
        ...day,
        summary: day.summary
          ? `${day.summary} Extra rest time added.`
          : "Kept deliberately short with an extra rest window.",
        activities,
        title: day.title || `Day ${index + 1}`,
      };
    });
    raw.highlights = [
      ...raw.highlights.slice(0, 2),
      "Shorter, rest-focused days",
    ];
    applied.push("reduced walking and added rest windows");
  }

  /* Cheaper -------------------------------------------------------- */
  if (has(text, ["cheap", "budget", "cost", "afford", "less expensive", "save money"])) {
    raw.stay = {
      ...raw.stay,
      costPerNight: Math.round((raw.stay.costPerNight * 0.75) / 50) * 50,
      name: raw.stay.name || "Budget-friendly stay",
      notes: raw.stay.notes,
    };
    raw.days = raw.days.map((day) => ({
      ...day,
      activities: day.activities.map((activity) => ({
        ...activity,
        cost: Math.round((activity.cost * 0.8) / 10) * 10,
      })),
    }));
    raw.experiences = raw.experiences.map((experience) => ({
      ...experience,
      cost: Math.round((experience.cost * 0.8) / 10) * 10,
    }));
    applied.push("trimmed accommodation and activity costs");
  }

  /* Lower impact / more sustainable --------------------------------- */
  if (has(text, ["sustainab", "green", "low impact", "low-impact", "emission", "eco", "environment"])) {
    const mode = resolveMode(raw.transport.mode);
    if (mode !== "train" && mode !== "walk") {
      raw.transport = {
        ...raw.transport,
        mode: "train",
        label: "Train (lower-impact option)",
        // Reset so the application recalculates the fare and emissions.
        cost: 0,
        notes: "Switched to the lower-emission option where the route allows.",
      };
    }
    raw.sustainabilityScore = Math.min(98, raw.sustainabilityScore + 5);
    raw.experiences = raw.experiences.map((experience) => ({
      ...experience,
      sustainabilityLabel: "Lower impact",
    }));
    applied.push("switched to the lower-impact route and stay");
  }

  /* Public transport specifically ---------------------------------- */
  if (has(text, ["public transport", "train", "rail", "metro", "transit"])) {
    raw.transport = {
      ...raw.transport,
      mode: "train",
      label: "Train",
      cost: 0,
      notes: "Public transport requested.",
    };
    applied.push("moved travel onto public transport");
  }

  /* Change the hotel / stay ---------------------------------------- */
  if (
    has(text, ["hotel", "stay", "accommodation", "resort", "somewhere else to sleep"])
  ) {
    raw.stay = {
      ...raw.stay,
      name: `${request.to} Alternative Accessible Stay`,
      type: "Alternative prototype stay",
      costPerNight: Math.round((raw.stay.costPerNight * 0.9) / 50) * 50,
      notes:
        "Alternative prototype stay. Confirm accessibility features directly before booking.",
    };
    applied.push("swapped to an alternative stay");
  }

  /* More nature / outdoors ----------------------------------------- */
  if (has(text, ["nature", "outdoor", "green", "park", "garden", "scenic"])) {
    raw.days = raw.days.map((day, index) => {
      if (index === 0 || index === raw.days.length - 1) return day;
      if (day.activities.some((activity) => /nature|walk|park|garden|viewpoint/i.test(activity.title))) {
        return day;
      }
      return {
        ...day,
        activities: [
          ...day.activities,
          {
            time: "15:00",
            title: "Accessible nature stop",
            location: request.to,
            transport: "Walk",
            cost: 0,
            accessibility:
              "Flat, shaded route with seating; can be skipped on the day.",
            sustainability: "Small-group, low-waste activity.",
            co2Kg: 0,
          },
        ],
      };
    });
    applied.push("added accessible nature stops");
  }

  /* Quieter places -------------------------------------------------- */
  if (has(text, ["quiet", "calm", "crowd", "peaceful", "less busy"])) {
    raw.highlights = [
      ...raw.highlights.slice(0, 2),
      "Quieter, lower-crowd timings",
    ];
    raw.safetyNotes = [raw.safetyNotes, "Quieter places prioritised."]
      .filter(Boolean)
      .join(" ");
    applied.push("prioritised quieter places and timings");
  }

  /* Shorten the days / more experiences ---------------------------- */
  if (has(text, ["experience", "more to do", "activities", "explore more"])) {
    raw.days = raw.days.map((day) => ({
      ...day,
      activities: day.activities.slice(0, 3),
    }));
    applied.push("kept a fuller set of experiences");
  }

  const index = Math.max(0, ITINERARY_OPTION_IDS.indexOf(option.optionId));
  const normalized = normalizeOption(raw, index, request, "prototype");

  if (applied.length === 0) {
    return {
      option: normalized,
      note:
        "Our AI assistant is busy, so we kept your itinerary and refreshed it with a prototype re-check. Nothing else changed — try again in a moment to apply a more nuanced edit.",
    };
  }

  return {
    option: normalized,
    note: `Our AI assistant is busy, so we applied your request from our own prototype rules (${applied.join(
      "; ",
    )}). Every figure is an estimate.`,
  };
}
