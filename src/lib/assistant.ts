import {
  CATEGORY_META,
  DIETARY_LABELS,
  PREFERENCE_META,
  TRAVELER_TYPE_LABELS,
  labelForCategory,
  type RequirementCategory,
} from "@/lib/profile-options";

export type StepKey =
  | "intro"
  | "travelers"
  | "mobility"
  | "visual"
  | "hearing"
  | "dietary"
  | "preferences"
  | "special"
  | "done";

/** The assistant's opening lines on the profile screen. */
export const INTRO_MESSAGES = [
  "Hi! I'm your travel accessibility assistant. Before we recommend destinations, I'd like to understand how you prefer to travel and what you may need along the way.",
  "You can select anything that applies to you. You can also tell me anything specific that isn't listed.",
];

export type StepScript = {
  key: StepKey;
  stepNumber: number;
  title: string;
  prompt: string;
  hint?: string;
};

export const STEP_SCRIPT: Record<Exclude<StepKey, "intro" | "done">, StepScript> =
  {
    travelers: {
      key: "travelers",
      stepNumber: 1,
      title: "Who you're travelling with",
      prompt: "Who will you be traveling with?",
      hint: "Select every option that applies — you can pick more than one.",
    },
    mobility: {
      key: "mobility",
      stepNumber: 2,
      title: "Mobility & accessibility",
      prompt: "What would make getting around easier for you?",
      hint: "Mobility needs. Choose as many as you like.",
    },
    visual: {
      key: "visual",
      stepNumber: 3,
      title: "Visual accessibility",
      prompt: "Do you have any visual accessibility preferences?",
      hint: "Skip this step if it doesn't apply.",
    },
    hearing: {
      key: "hearing",
      stepNumber: 4,
      title: "Hearing accessibility",
      prompt: "Do you have any hearing accessibility preferences?",
      hint: "Skip this step if it doesn't apply.",
    },
    dietary: {
      key: "dietary",
      stepNumber: 5,
      title: "Dietary requirements",
      prompt: "Do you have any dietary requirements we should consider?",
      hint: "This helps us match restaurants and stays.",
    },
    preferences: {
      key: "preferences",
      stepNumber: 6,
      title: "Travel preferences",
      prompt: "What matters most when you travel?",
      hint: "Move each slider to set your priorities.",
    },
    special: {
      key: "special",
      stepNumber: 6,
      title: "Anything else",
      prompt: "Is there anything else you'd like us to consider?",
      hint: "Optional — tell us anything that wasn't covered.",
    },
  };

/** Steps that render a question card (everything except intro/done). */
export type QuestionKey = Exclude<StepKey, "intro" | "done">;

export const STEP_ORDER: QuestionKey[] = [
  "travelers",
  "mobility",
  "visual",
  "hearing",
  "dietary",
  "preferences",
  "special",
];

/** Deterministic acknowledgement used when no AI provider is configured. */
export function fallbackNote(
  key: StepKey,
  selections: string[],
): string {
  if (selections.length === 0) {
    return "No problem — you can always add this later. Moving on.";
  }

  switch (key) {
    case "travelers":
      return `Got it — I've noted: ${selections.join(", ")}. I'll keep that in mind for every recommendation.`;
    case "mobility":
      return `Thanks — I've saved your mobility needs (${selections.slice(0, 3).join(", ")}${
        selections.length > 3 ? " and more" : ""
      }).`;
    case "visual":
      return `Noted: ${selections.join(", ")}. I'll favour places that provide these.`;
    case "hearing":
      return `Noted: ${selections.join(", ")}. I'll look for venues that support this.`;
    case "dietary":
      return `Saved your dietary requirements: ${selections.join(", ")}.`;
    case "preferences":
      return "Your priorities are set — I'll weight recommendations accordingly.";
    case "special":
      return "Thanks for the extra detail. I've attached it to your profile.";
    default:
      return "Saved.";
  }
}

/** Turns a step's raw selections into friendly labels for display. */
export function labelSelections(
  key: QuestionKey,
  value: {
    travelerTypes: string[];
    mobility: string[];
    visual: string[];
    hearing: string[];
    dietary: string[];
  },
): string[] {
  switch (key) {
    case "travelers":
      return value.travelerTypes.map((v) => TRAVELER_TYPE_LABELS[v] ?? v);
    case "mobility":
      return value.mobility.map((v) =>
        labelForCategory("mobility" as RequirementCategory, v),
      );
    case "visual":
      return value.visual.map((v) =>
        labelForCategory("visual" as RequirementCategory, v),
      );
    case "hearing":
      return value.hearing.map((v) =>
        labelForCategory("hearing" as RequirementCategory, v),
      );
    case "dietary":
      return value.dietary.map((v) => DIETARY_LABELS[v] ?? v);
    default:
      return [];
  }
}

export const COMPLETION_SUMMARY = [
  {
    label: "Accessibility preferences saved",
    icon: "accessibility" as const,
  },
  { label: "Sustainability preferences saved", icon: "leaf" as const },
  { label: "Dietary preferences saved", icon: "utensils" as const },
  { label: "Travel preferences saved", icon: "compass" as const },
];

export const PREFERENCE_KEYS = PREFERENCE_META.map((meta) => meta.key);

export const CATEGORY_ORDER: RequirementCategory[] = [
  "mobility",
  "visual",
  "hearing",
];

export { CATEGORY_META };
