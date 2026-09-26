/**
 * Single source of truth for the accessibility questionnaire.
 * Values here are the slugs persisted in Postgres.
 */

import type { IconName } from "@/lib/icons";

export type RequirementCategory = "mobility" | "visual" | "hearing";

export type Option = {
  value: string;
  label: string;
  description?: string;
  icon?: IconName;
};

export const TOTAL_STEPS = 6;

export const TRAVELER_TYPE_OPTIONS: Option[] = [
  {
    value: "general_traveler",
    label: "General traveler",
    description: "No specific requirements",
    icon: "compass",
  },
  {
    value: "child",
    label: "Child",
    description: "Travelling with a child",
    icon: "user",
  },
  {
    value: "elderly_traveler",
    label: "Elderly traveler",
    description: "Travelling with an older adult",
    icon: "users",
  },
  {
    value: "wheelchair_user",
    label: "Wheelchair user",
    description: "Using a wheelchair or mobility aid",
    icon: "accessibility",
  },
  {
    value: "visual_needs",
    label: "Traveler with visual needs",
    description: "Blind or low vision",
    icon: "eye",
  },
  {
    value: "hearing_needs",
    label: "Traveler with hearing needs",
    description: "Deaf or hard of hearing",
    icon: "ear",
  },
];

export const MOBILITY_OPTIONS: Option[] = [
  {
    value: "step_free_access",
    label: "Step-free access",
    description: "Ramps and level entrances",
    icon: "ramp",
  },
  {
    value: "elevator",
    label: "Elevator / lift",
    description: "Lifts available at most stops",
    icon: "elevator",
  },
  {
    value: "accessible_bathroom",
    label: "Accessible bathroom",
    description: "Wheelchair-accessible washrooms",
    icon: "bathroom",
  },
  {
    value: "accessible_parking",
    label: "Accessible parking",
    description: "Dedicated accessible bays",
    icon: "parking",
  },
  {
    value: "minimal_walking",
    label: "Minimal walking",
    description: "Short distances, seated transport",
    icon: "footsteps",
  },
  {
    value: "seating_areas",
    label: "Seating / rest areas",
    description: "Frequent places to sit and rest",
    icon: "seat",
  },
  {
    value: "wheelchair_transport",
    label: "Wheelchair-accessible transport",
    description: "Accessible vehicles and transit",
    icon: "bus",
  },
];

export const VISUAL_OPTIONS: Option[] = [
  {
    value: "tactile_paths",
    label: "Tactile paths",
    description: "Guiding floor surfaces",
    icon: "footsteps",
  },
  {
    value: "audio_announcements",
    label: "Audio announcements",
    description: "Spoken directions and alerts",
    icon: "volume",
  },
  {
    value: "high_contrast_signage",
    label: "High-contrast signage",
    description: "Readable signs with strong contrast",
    icon: "sign",
  },
  {
    value: "braille_info",
    label: "Braille information",
    description: "Braille menus and guides",
    icon: "braille",
  },
  {
    value: "screen_reader_info",
    label: "Screen-reader-friendly info",
    description: "Digital content that works with screen readers",
    icon: "phone",
  },
  {
    value: "staff_assistance",
    label: "Staff assistance",
    description: "Trained staff on hand",
    icon: "support",
  },
];

export const HEARING_OPTIONS: Option[] = [
  {
    value: "visual_alerts",
    label: "Visual alerts",
    description: "Flashing or on-screen notifications",
    icon: "bell",
  },
  {
    value: "sign_language_support",
    label: "Sign-language support",
    description: "Staff or guides who sign",
    icon: "hands",
  },
  {
    value: "captioned_info",
    label: "Captioned information",
    description: "Captions on all audio and video",
    icon: "captions",
  },
  {
    value: "written_instructions",
    label: "Written instructions",
    description: "Clear written directions",
    icon: "note",
  },
  {
    value: "staff_assistance",
    label: "Staff assistance",
    description: "Trained staff on hand",
    icon: "support",
  },
];

export const DIETARY_OPTIONS: Option[] = [
  { value: "vegetarian", label: "Vegetarian", icon: "leaf" },
  { value: "vegan", label: "Vegan", icon: "leaf" },
  { value: "jain", label: "Jain", icon: "utensils" },
  { value: "gluten_free", label: "Gluten-free", icon: "utensils" },
  { value: "nut_allergy", label: "Nut allergy", icon: "alert" },
  { value: "other_allergy", label: "Other allergy", icon: "alert" },
  { value: "other", label: "Other", icon: "plus" },
];

export type PreferenceKey =
  | "sustainability"
  | "accessibility"
  | "budget"
  | "time"
  | "comfort";

export type PreferenceMeta = {
  key: PreferenceKey;
  label: string;
  description: string;
  icon: IconName;
  low: string;
  high: string;
};

export const PREFERENCE_META: PreferenceMeta[] = [
  {
    key: "sustainability",
    label: "Low environmental impact",
    description: "Favour greener transport and lower-impact stays",
    icon: "leaf",
    low: "Not a priority",
    high: "Top priority",
  },
  {
    key: "accessibility",
    label: "Accessibility",
    description: "Prioritise step-free, well-equipped places",
    icon: "accessibility",
    low: "Not a priority",
    high: "Top priority",
  },
  {
    key: "budget",
    label: "Affordable",
    description: "Keep costs low where possible",
    icon: "wallet",
    low: "Not a priority",
    high: "Top priority",
  },
  {
    key: "time",
    label: "Time efficient",
    description: "Minimise travel time and transfers",
    icon: "clock",
    low: "Not a priority",
    high: "Top priority",
  },
  {
    key: "comfort",
    label: "Comfortable",
    description: "Relaxed pace and comfortable stays",
    icon: "sofa",
    low: "Not a priority",
    high: "Top priority",
  },
];

/* ------------------------------------------------------------------ */
/* Label lookup (used by the dashboard summary and the review panel)   */
/* ------------------------------------------------------------------ */

function toLabelMap(options: Option[]): Record<string, string> {
  return options.reduce<Record<string, string>>((acc, option) => {
    acc[option.value] = option.label;
    return acc;
  }, {});
}

export const TRAVELER_TYPE_LABELS = toLabelMap(TRAVELER_TYPE_OPTIONS);
export const MOBILITY_LABELS = toLabelMap(MOBILITY_OPTIONS);
export const VISUAL_LABELS = toLabelMap(VISUAL_OPTIONS);
export const HEARING_LABELS = toLabelMap(HEARING_OPTIONS);
export const DIETARY_LABELS = toLabelMap(DIETARY_OPTIONS);

export const CATEGORY_META: Record<
  RequirementCategory,
  { title: string; options: Option[]; labels: Record<string, string> }
> = {
  mobility: {
    title: "Mobility & accessibility",
    options: MOBILITY_OPTIONS,
    labels: MOBILITY_LABELS,
  },
  visual: {
    title: "Visual accessibility",
    options: VISUAL_OPTIONS,
    labels: VISUAL_LABELS,
  },
  hearing: {
    title: "Hearing accessibility",
    options: HEARING_OPTIONS,
    labels: HEARING_LABELS,
  },
};

export function labelForCategory(
  category: RequirementCategory,
  value: string,
): string {
  return CATEGORY_META[category].labels[value] ?? value;
}

/** Turns a 0–100 weight into a human label used on the dashboard. */
export function weightToLabel(weight: number): string {
  if (weight >= 85) return "Very high";
  if (weight >= 65) return "High";
  if (weight >= 40) return "Medium";
  if (weight >= 15) return "Low";
  return "Not a priority";
}
