/**
 * Recommendation helpers — the shared brain behind three Travello features:
 *
 *  1. Senior + Accessibility mode  → `seniorAccessibility()`
 *  2. Crowd-aware recommendations  → `crowdAwarePicks()` + `bestVisitWindow()`
 *  3. Less-crowded alternatives    → `lessCrowdedAlternative()`
 *
 * Client-safe and pure: no server-only imports, no side effects. Every number
 * is derived transparently from the catalogue fields we already store
 * (`accessibility`, `crowdLevel`, `visitorPressure`, `attractions.alternativeId`)
 * so the UI can always explain *why* it made a suggestion — which is what makes
 * the features honest enough to demo and to pitch.
 */

import type { Attraction, Destination } from "@/types";

/* ------------------------------------------------------------------ */
/* Crowd levels                                                        */
/* ------------------------------------------------------------------ */

export type CrowdLevel = Destination["crowdLevel"];

/** Higher = busier. Used for sorting and for the "% calmer" estimate. */
const CROWD_ORDER: Record<CrowdLevel, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  "Very High": 3,
};

export function crowdRank(level: CrowdLevel): number {
  return CROWD_ORDER[level] ?? 0;
}

/** Anything at "High" or above is worth offering an alternative for. */
export function isCrowded(level: CrowdLevel): boolean {
  return crowdRank(level) >= 2;
}

/**
 * A transparent, prototype estimate of how much calmer one band is than
 * another. One step down ≈ 30% fewer people, capped at 80% so we never imply
 * an empty place. Labelled as an estimate wherever it is shown.
 */
export function crowdReductionPercent(from: CrowdLevel, to: CrowdLevel): number {
  const steps = Math.max(0, crowdRank(from) - crowdRank(to));
  return Math.min(80, steps * 30);
}

export type CrowdStatus = "Calm" | "Busy" | "Peak";

export function crowdStatus(level: CrowdLevel): CrowdStatus {
  const rank = crowdRank(level);
  if (rank <= 1) return "Calm";
  if (rank === 2) return "Busy";
  return "Peak";
}

/** Tailwind classes for a crowd chip, matching the app's existing palette. */
export function crowdTone(level: CrowdLevel): string {
  switch (crowdStatus(level)) {
    case "Calm":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Busy":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-red-100 text-red-700 border-red-200";
  }
}

/**
 * The best time to visit a place at this crowd level. Deliberately generic and
 * clearly advisory — Travello does not have live footfall sensors.
 */
export function bestVisitWindow(level: CrowdLevel): string {
  switch (crowdStatus(level)) {
    case "Calm":
      return "Any time today";
    case "Busy":
      return "Before 10:00 or after 16:00";
    default:
      return "Weekday early morning, or pick a calmer alternative";
  }
}

/* ------------------------------------------------------------------ */
/* 1. Senior + Accessibility mode                                      */
/* ------------------------------------------------------------------ */

export type SeniorAccessibility = {
  /** 0–100, weighted by what actually matters for senior and reduced-mobility travel. */
  score: number;
  /** True at 70+, the threshold used for the mode's ranking. */
  friendly: boolean;
  /** The positives we found, in plain language (never empty when friendly). */
  reasons: string[];
  /** What to plan around — shown so the verdict is never a bare number. */
  caution: string[];
};

/** Weights sum to 100. Step-free + low walking dominate, which is how seniors travel. */
const SENIOR_WEIGHTS: {
  key: keyof Destination["accessibility"];
  weight: number;
  reason: string;
  caution: string;
}[] = [
  {
    key: "stepFreeRoutes",
    weight: 30,
    reason: "Step-free routes across the main areas",
    caution: "Some routes have steps or uneven ground",
  },
  {
    key: "lowWalkingRequirement",
    weight: 25,
    reason: "Low walking distances between stops",
    caution: "Expect longer walks between stops",
  },
  {
    key: "accessibleToilets",
    weight: 15,
    reason: "Accessible toilets available",
    caution: "Accessible toilets are limited",
  },
  {
    key: "wheelchairAccessible",
    weight: 12,
    reason: "Wheelchair accessible",
    caution: "Not fully wheelchair accessible",
  },
  {
    key: "elevator",
    weight: 10,
    reason: "Lifts available at stays and venues",
    caution: "Few lifts — expect stairs",
  },
  {
    key: "accessibleParking",
    weight: 8,
    reason: "Accessible parking on site",
    caution: "Accessible parking is limited",
  },
];

/**
 * Scores a destination for senior and reduced-mobility travellers, with the
 * reasons attached so the UI can show a verdict instead of a mystery number.
 */
export function seniorAccessibility(destination: Destination): SeniorAccessibility {
  let score = 0;
  const reasons: string[] = [];
  const caution: string[] = [];

  for (const item of SENIOR_WEIGHTS) {
    const available = destination.accessibility[item.key] === true;
    if (available) {
      score += item.weight;
      reasons.push(item.reason);
    } else {
      caution.push(item.caution);
    }
  }

  // Gentle terrain is a bonus; difficult terrain is a clear caution.
  const difficulty = destination.accessibility.trailDifficulty?.toLowerCase() ?? "";
  if (difficulty === "easy") {
    score += 5;
    reasons.push("Gentle, easy-grade trails");
  } else if (difficulty === "difficult") {
    score -= 15;
    caution.push("Difficult terrain underfoot");
  }

  const clamped = Math.max(0, Math.min(100, score));

  return {
    score: clamped,
    friendly: clamped >= 70,
    reasons,
    caution,
  };
}

/** Convenience predicate used for filtering and badges. */
export function isSeniorFriendly(destination: Destination): boolean {
  return seniorAccessibility(destination).friendly;
}

/**
 * Ranks destinations for Senior + Accessibility mode. Friendly places come
 * first, then the score, then the greener option as a tie-break.
 */
export function rankForSeniorMode(destinations: Destination[]): Destination[] {
  return [...destinations].sort((a, b) => {
    const aFriendly = isSeniorFriendly(a) ? 1 : 0;
    const bFriendly = isSeniorFriendly(b) ? 1 : 0;
    if (aFriendly !== bFriendly) return bFriendly - aFriendly;
    const diff = seniorAccessibility(b).score - seniorAccessibility(a).score;
    if (diff !== 0) return diff;
    return b.sustainabilityScore - a.sustainabilityScore;
  });
}

/* ------------------------------------------------------------------ */
/* 2. Crowd-aware recommendations                                      */
/* ------------------------------------------------------------------ */

export type CrowdAwarePick = {
  destination: Destination;
  status: CrowdStatus;
  bestWindow: string;
  /** Plain-language reason, e.g. "Low visitor pressure and a gentle, accessible layout". */
  reason: string;
};

/**
 * Picks the calmest destinations to recommend right now, and says why.
 *
 * Calm first, then visitor pressure, then sustainability — so a quiet, green
 * place is suggested over a quiet-but-fragile one, and crowded places are
 * never presented as a recommendation.
 */
export function crowdAwarePicks(
  destinations: Destination[],
  limit = 3,
): CrowdAwarePick[] {
  return [...destinations]
    .sort((a, b) => {
      const byCrowd = crowdRank(a.crowdLevel) - crowdRank(b.crowdLevel);
      if (byCrowd !== 0) return byCrowd;
      const byPressure = crowdRank(a.visitorPressure) - crowdRank(b.visitorPressure);
      if (byPressure !== 0) return byPressure;
      return b.sustainabilityScore - a.sustainabilityScore;
    })
    .slice(0, limit)
    .map((destination) => {
      const status = crowdStatus(destination.crowdLevel);
      const reason =
        status === "Calm"
          ? `Low visitor pressure and ${destination.environmentalSensitivity.toLowerCase()} habitat sensitivity — a gentle, spacious choice.`
          : `${destination.visitorPressure} visitor pressure right now — travel ${bestVisitWindow(
              destination.crowdLevel,
            ).toLowerCase()}.`;
      return {
        destination,
        status,
        bestWindow: bestVisitWindow(destination.crowdLevel),
        reason,
      };
    });
}

/**
 * The single busiest place in a set — the one the "less crowded" nudge should
 * steer a traveller away from.
 */
export function busiestDestination(
  destinations: Destination[],
): Destination | null {
  if (destinations.length === 0) return null;
  return [...destinations].sort(
    (a, b) => crowdRank(b.crowdLevel) - crowdRank(a.crowdLevel),
  )[0];
}

/* ------------------------------------------------------------------ */
/* 3. Less-crowded alternatives                                        */
/* ------------------------------------------------------------------ */

export type CrowdAlternative = {
  from: Attraction;
  /** The calmer attraction we suggest instead. */
  to: Attraction;
  /** Estimated % fewer people than the original (prototype estimate). */
  crowdDrop: number;
  /** Positive when the alternative is also more accessible. */
  accessibilityChange: number;
  /** Why this alternative was chosen — shown verbatim in the UI. */
  reasons: string[];
};

/**
 * Finds a genuinely calmer version of a crowded attraction.
 *
 * Order of preference:
 *   1. The curated `alternativeId` link, when that target is less crowded.
 *   2. Any other attraction in the same destination with a lower crowd level.
 * If nothing is calmer, returns `null` — we never invent a downgrade.
 */
export function lessCrowdedAlternative(
  attraction: Attraction,
  catalogue: Attraction[],
): CrowdAlternative | null {
  if (!isCrowded(attraction.crowdLevel)) return null;

  const pool = catalogue.filter((item) => item.id !== attraction.id);

  const curated = attraction.alternativeId
    ? pool.find((item) => item.id === attraction.alternativeId)
    : undefined;

  const calmer = pool
    .filter(
      (item) =>
        item.destinationId === attraction.destinationId &&
        crowdRank(item.crowdLevel) < crowdRank(attraction.crowdLevel),
    )
    .sort((a, b) => {
      const byCrowd = crowdRank(a.crowdLevel) - crowdRank(b.crowdLevel);
      if (byCrowd !== 0) return byCrowd;
      return b.accessibilityScore - a.accessibilityScore;
    });

  const target =
    curated && crowdRank(curated.crowdLevel) < crowdRank(attraction.crowdLevel)
      ? curated
      : calmer[0];

  if (!target) return null;

  const crowdDrop = crowdReductionPercent(attraction.crowdLevel, target.crowdLevel);
  const accessibilityChange = target.accessibilityScore - attraction.accessibilityScore;

  const reasons: string[] = [
    `${target.crowdLevel} crowd instead of ${attraction.crowdLevel} — roughly ${crowdDrop}% fewer people (estimate).`,
  ];
  if (accessibilityChange > 0) {
    reasons.push(`Also easier to move around: accessibility ${target.accessibilityScore}/100 vs ${attraction.accessibilityScore}/100.`);
  } else if (accessibilityChange === 0) {
    reasons.push(`Similar accessibility (${target.accessibilityScore}/100), so nothing is given up.`);
  } else {
    reasons.push(`Slightly lower accessibility (${target.accessibilityScore}/100 vs ${attraction.accessibilityScore}/100) — a trade-off to weigh.`);
  }
  if (target.travelTime) {
    reasons.push(`Travel time about ${target.travelTime}.`);
  }

  return {
    from: attraction,
    to: target,
    crowdDrop,
    accessibilityChange,
    reasons,
  };
}
