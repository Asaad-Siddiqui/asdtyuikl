import {
  DIETARY_LABELS,
  HEARING_LABELS,
  MOBILITY_LABELS,
  PREFERENCE_META,
  TRAVELER_TYPE_LABELS,
  VISUAL_LABELS,
  weightToLabel,
} from "@/lib/profile-options";
import type { ProfileData } from "@/lib/profile-service";
import type { IconName } from "@/lib/icons";

export type SummarySection = {
  key: string;
  label: string;
  icon: IconName;
  values: string[];
  /** Optional single value rendered as a highlighted statement. */
  highlight?: string;
  emptyHint: string;
};

function labelsFrom(
  values: string[],
  map: Record<string, string>,
): string[] {
  return values.map((value) => map[value] ?? value);
}

export function buildSummarySections(
  profile: ProfileData,
): SummarySection[] {
  const topPreference = [...PREFERENCE_META].sort(
    (a, b) => profile.preferences[b.key] - profile.preferences[a.key],
  )[0];

  return [
    {
      key: "travelers",
      label: "Travelling with",
      icon: "users",
      values: labelsFrom(profile.travelerTypes, TRAVELER_TYPE_LABELS),
      emptyHint: "Not set yet",
    },
    {
      key: "mobility",
      label: "Accessibility",
      icon: "accessibility",
      values: [
        ...labelsFrom(profile.requirements.mobility, MOBILITY_LABELS),
        ...labelsFrom(profile.requirements.visual, VISUAL_LABELS),
        ...labelsFrom(profile.requirements.hearing, HEARING_LABELS),
      ],
      emptyHint: "No accessibility needs selected",
    },
    {
      key: "dietary",
      label: "Dietary",
      icon: "utensils",
      values: labelsFrom(profile.dietary, DIETARY_LABELS),
      emptyHint: "No dietary requirements",
    },
    {
      key: "priority",
      label: "Travel priority",
      icon: "compass",
      values: topPreference ? [topPreference.label] : [],
      highlight: topPreference
        ? `${weightToLabel(profile.preferences[topPreference.key])} priority`
        : undefined,
      emptyHint: "Not set yet",
    },
    {
      key: "comfort",
      label: "Comfort",
      icon: "sofa",
      values: [],
      highlight: weightToLabel(profile.preferences.comfort),
      emptyHint: "Not set yet",
    },
  ];
}

/** Preference rows with weights, ordered by importance. */
export function preferenceRows(profile: ProfileData) {
  return [...PREFERENCE_META]
    .map((meta) => ({
      key: meta.key,
      label: meta.label,
      icon: meta.icon,
      value: profile.preferences[meta.key],
      label2: weightToLabel(profile.preferences[meta.key]),
    }))
    .sort((a, b) => b.value - a.value);
}
