import type { ProfileData } from "@/lib/profile-service";
import type { RequirementCategory } from "@/lib/profile-options";
import { labelForCategory } from "@/lib/profile-options";

export type Destination = {
  id: string;
  name: string;
  region: string;
  description: string;
  /** Tailwind gradient used for the Phase 1 image placeholder. */
  gradient: string;
  /** Emoji-free scenic hint rendered inside the placeholder. */
  scene: "hills" | "coast" | "forest" | "lake";
  baseAccessibility: number;
  sustainability: number;
  budget: number;
  time: number;
  comfort: number;
  supports: string[];
  highlights: string[];
  bestFor: string[];
};

export const DESTINATIONS: Destination[] = [
  {
    id: "mahabaleshwar",
    name: "Mahabaleshwar",
    region: "Maharashtra, India",
    description:
      "Accessible viewpoints and lower-impact travel options, with gentle hill walks and lift-served lookout points.",
    gradient: "from-brand-500 via-brand-600 to-brand-800",
    scene: "hills",
    baseAccessibility: 78,
    sustainability: 84,
    budget: 62,
    time: 58,
    comfort: 80,
    supports: [
      "step_free_access",
      "elevator",
      "accessible_bathroom",
      "accessible_parking",
      "minimal_walking",
      "seating_areas",
      "wheelchair_transport",
      "high_contrast_signage",
      "staff_assistance",
      "audio_announcements",
      "written_instructions",
      "captioned_info",
    ],
    highlights: [
      "Ramp-accessed valley viewpoints",
      "Quiet, shaded rest stops",
      "Locally-run, low-waste stays",
    ],
    bestFor: ["wheelchair_user", "elderly_traveler", "general_traveler"],
  },
  {
    id: "lonavala",
    name: "Lonavala",
    region: "Maharashtra, India",
    description:
      "Rail-connected hill town with accessible parks, short hop itineraries and plenty of step-free dining.",
    gradient: "from-brand-400 via-brand-600 to-ink-800",
    scene: "forest",
    baseAccessibility: 74,
    sustainability: 71,
    budget: 70,
    time: 84,
    comfort: 72,
    supports: [
      "step_free_access",
      "accessible_bathroom",
      "minimal_walking",
      "seating_areas",
      "accessible_parking",
      "high_contrast_signage",
      "written_instructions",
      "staff_assistance",
      "visual_alerts",
    ],
    highlights: [
      "Quick, low-transfer rail access",
      "Step-free park promenades",
      "Accessible cafés with written menus",
    ],
    bestFor: ["general_traveler", "child", "visual_needs"],
  },
  {
    id: "alibaug",
    name: "Alibaug",
    region: "Maharashtra, India",
    description:
      "Coastal escape with accessible beachfront boardwalks, calm off-season pacing and eco-certified homestays.",
    gradient: "from-sand-400 via-brand-500 to-brand-700",
    scene: "coast",
    baseAccessibility: 69,
    sustainability: 88,
    budget: 55,
    time: 60,
    comfort: 76,
    supports: [
      "step_free_access",
      "accessible_bathroom",
      "minimal_walking",
      "seating_areas",
      "wheelchair_transport",
      "staff_assistance",
      "audio_announcements",
      "written_instructions",
    ],
    highlights: [
      "Boardwalk beach access",
      "Solar-powered homestays",
      "Low-crowd weekday windows",
    ],
    bestFor: ["general_traveler", "elderly_traveler", "wheelchair_user"],
  },
  {
    id: "matheran",
    name: "Matheran",
    region: "Maharashtra, India",
    description:
      "Vehicle-free hill station — the quietest air in the region, with pony paths and shaded, graded walkways.",
    gradient: "from-brand-600 via-brand-800 to-ink-900",
    scene: "forest",
    baseAccessibility: 58,
    sustainability: 92,
    budget: 64,
    time: 48,
    comfort: 66,
    supports: [
      "seating_areas",
      "high_contrast_signage",
      "staff_assistance",
      "written_instructions",
      "accessible_bathroom",
      "audio_announcements",
    ],
    highlights: [
      "Car-free, low-emission trails",
      "Graded, mostly level walkways",
      "Community-run guesthouses",
    ],
    bestFor: ["general_traveler", "child"],
  },
  {
    id: "karjat",
    name: "Karjat",
    region: "Maharashtra, India",
    description:
      "Riverside retreat with accessible farm-stays and slow, comfort-first itineraries under two hours from the city.",
    gradient: "from-brand-500 via-brand-700 to-ink-800",
    scene: "lake",
    baseAccessibility: 66,
    sustainability: 79,
    budget: 72,
    time: 88,
    comfort: 82,
    supports: [
      "step_free_access",
      "accessible_parking",
      "minimal_walking",
      "seating_areas",
      "accessible_bathroom",
      "written_instructions",
      "staff_assistance",
    ],
    highlights: [
      "Under-2-hour transfer",
      "Ground-floor farm stays",
      "Shaded riverside seating",
    ],
    bestFor: ["elderly_traveler", "general_traveler", "hearing_needs"],
  },
  {
    id: "igatpuri",
    name: "Igatpuri",
    region: "Maharashtra, India",
    description:
      "Monsoon-green valley known for meditation retreats and very low-impact, small-group experiences.",
    gradient: "from-brand-400 via-brand-700 to-ink-900",
    scene: "hills",
    baseAccessibility: 61,
    sustainability: 90,
    budget: 68,
    time: 74,
    comfort: 70,
    supports: [
      "step_free_access",
      "accessible_bathroom",
      "seating_areas",
      "staff_assistance",
      "audio_announcements",
      "captioned_info",
      "sign_language_support",
    ],
    highlights: [
      "Low-impact retreat stays",
      "Quiet, predictable schedules",
      "Captioned audio guides",
    ],
    bestFor: ["hearing_needs", "general_traveler"],
  },
];

export type ScoredDestination = {
  destination: Destination;
  accessibilityMatch: number;
  sustainabilityScore: number;
  overallMatch: number;
  matchedRequirements: string[];
  unmetRequirements: string[];
};

const CATEGORIES: RequirementCategory[] = ["mobility", "visual", "hearing"];

function collectRequirements(
  profile: ProfileData,
): { value: string; category: RequirementCategory }[] {
  const seen = new Set<string>();
  const result: { value: string; category: RequirementCategory }[] = [];
  for (const category of CATEGORIES) {
    for (const value of profile.requirements[category] ?? []) {
      const key = `${category}:${value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ value, category });
    }
  }
  return result;
}

const clamp = (value: number, min = 30, max = 99) =>
  Math.max(min, Math.min(max, Math.round(value)));

/**
 * Scores a destination against the traveller's stored profile.
 * This is intentionally simple, deterministic and DB-driven — it is the hook
 * the Phase 2 recommendation engine will replace.
 */
export function scoreDestination(
  destination: Destination,
  profile: ProfileData | null,
): ScoredDestination {
  const requirements = profile ? collectRequirements(profile) : [];
  const supported = destination.supports;

  const matched: string[] = [];
  const unmet: string[] = [];

  for (const requirement of requirements) {
    if (supported.includes(requirement.value)) {
      matched.push(
        labelForCategory(requirement.category, requirement.value),
      );
    } else {
      unmet.push(labelForCategory(requirement.category, requirement.value));
    }
  }

  // Accessibility match: start from the destination's baseline, reward each
  // supported need and penalise each unmet one.
  let accessibility = destination.baseAccessibility;
  if (requirements.length > 0) {
    const ratio = matched.length / requirements.length;
    accessibility = destination.baseAccessibility * 0.6 + ratio * 40;
    accessibility -= unmet.length * 2.5;
  }
  accessibility = clamp(accessibility, 42, 98);

  // Wheelchair travellers weight mobility coverage more heavily.
  const travelerTypes = profile?.travelerTypes ?? [];
  if (travelerTypes.includes("wheelchair_user")) {
    const mobilityCovered = ["step_free_access", "wheelchair_transport"].filter(
      (slug) => supported.includes(slug),
    ).length;
    accessibility = clamp(accessibility - (2 - mobilityCovered) * 6, 35, 98);
  }

  const weights = profile?.preferences ?? {
    sustainability: 50,
    accessibility: 50,
    budget: 50,
    time: 50,
    comfort: 50,
  };

  const weightSum =
    weights.sustainability +
    weights.accessibility +
    weights.budget +
    weights.time +
    weights.comfort || 1;

  const overall =
    (destination.sustainability * weights.sustainability +
      accessibility * weights.accessibility +
      destination.budget * weights.budget +
      destination.time * weights.time +
      destination.comfort * weights.comfort) /
    weightSum;

  return {
    destination,
    accessibilityMatch: accessibility,
    sustainabilityScore: destination.sustainability,
    overallMatch: clamp(overall, 40, 98),
    matchedRequirements: matched.slice(0, 4),
    unmetRequirements: unmet,
  };
}

export function recommendDestinations(
  profile: ProfileData | null,
  limit = 6,
): ScoredDestination[] {
  return DESTINATIONS.map((destination) =>
    scoreDestination(destination, profile),
  )
    .sort((a, b) => b.overallMatch - a.overallMatch)
    .slice(0, limit);
}
