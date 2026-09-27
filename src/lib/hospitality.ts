/**
 * Sustainable Hospitality — the domain rules.
 *
 * This module is pure (no database, no React) so the same scoring runs on the
 * server when a checklist is submitted and on the client to render a preview.
 * The score a business sees is therefore always the score the server stored.
 *
 * How a score is produced
 * -----------------------
 * There are five categories with two questions each. Within a category the two
 * questions are not equally important — monitoring waste matters more than
 * recycling some of it — so each question carries a weight of 2 (primary) or 1
 * (supporting). A category scores `checked ÷ available` as a percentage, and the
 * overall score is the mean of the five categories. Nothing is hardcoded: an
 * unanswered checklist scores 0, and every point in the result can be traced to
 * a specific ticked box.
 */

export type CategoryKey = "food" | "water" | "energy" | "transport" | "waste";

export type ChecklistQuestion = {
  key: string;
  label: string;
  /** 2 = the load-bearing habit, 1 = the supporting habit. */
  weight: 1 | 2;
};

export type ChecklistCategory = {
  key: CategoryKey;
  label: string;
  questions: ChecklistQuestion[];
  /** Shown when this is one of the business's weakest categories. */
  advice: string;
};

/**
 * The five categories, in the order they are shown. `key`s are the contract
 * between the form, the API and the stored `answers` JSON — never rename one
 * without migrating the rows.
 */
export const HOSPITALITY_CATEGORIES: ChecklistCategory[] = [
  {
    key: "food",
    label: "Food Waste",
    advice:
      "Start by weighing what the kitchen throws away each day, then prep to that number instead of to a fixed menu.",
    questions: [
      { key: "food-monitored", label: "Food waste is monitored", weight: 2 },
      {
        key: "food-reused",
        label: "Excess food is reused, donated or composted",
        weight: 1,
      },
    ],
  },
  {
    key: "water",
    label: "Water Efficiency",
    advice:
      "Fit low-flow taps and shower heads, and read the meter weekly — leaks usually show up as a sudden jump.",
    questions: [
      { key: "water-monitored", label: "Water usage is monitored", weight: 2 },
      {
        key: "water-saving",
        label: "Water-saving fixtures or systems are used",
        weight: 1,
      },
    ],
  },
  {
    key: "energy",
    label: "Energy Efficiency",
    advice:
      "Swap the remaining halogen and CFL bulbs for LEDs first — it is the cheapest saving, and shading windows cuts cooling load.",
    questions: [
      {
        key: "energy-efficient",
        label: "Energy-efficient lighting and appliances are used",
        weight: 2,
      },
      {
        key: "energy-monitored",
        label: "Energy consumption is monitored",
        weight: 1,
      },
    ],
  },
  {
    key: "transport",
    label: "CO₂ / Transportation",
    advice:
      "Offer a shared pickup from the nearest station or bus stand, and put secure cycle parking somewhere guests can see it.",
    questions: [
      {
        key: "transport-shared",
        label: "Public or shared transport is encouraged",
        weight: 1,
      },
      {
        key: "transport-ev",
        label: "EV charging or bicycle facilities are available",
        weight: 2,
      },
    ],
  },
  {
    key: "waste",
    label: "Waste Management",
    advice:
      "Set up three clearly labelled bins where guests actually pass them, and switch refillable soap and water dispensers in every room.",
    questions: [
      { key: "waste-segregated", label: "Waste is properly segregated", weight: 2 },
      {
        key: "waste-plastic",
        label: "Single-use plastic is reduced",
        weight: 1,
      },
    ],
  },
];

/** Total weight available in one category — 3, because 2 + 1. */
const CATEGORY_WEIGHT = HOSPITALITY_CATEGORIES[0].questions.reduce(
  (sum, question) => sum + question.weight,
  0,
);

export type CategoryScore = { key: CategoryKey; label: string; score: number };

export type Suggestion = { category: string; title: string; advice: string };

export type AssessmentResult = {
  overallScore: number;
  categoryScores: Record<CategoryKey, number>;
  weakest: CategoryKey[];
  suggestions: Suggestion[];
};

/** `{ food: { "food-monitored": true } }` — the shape stored in the database. */
export type AssessmentAnswers = Partial<
  Record<CategoryKey, Record<string, boolean>>
>;

/**
 * Discards anything the client made up: unknown categories, unknown questions
 * and non-boolean values. Whatever survives is what gets scored, so a tampered
 * payload can only ever produce a worse (or honest) score.
 */
export function normaliseAnswers(input: unknown): AssessmentAnswers {
  const source =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const answers: AssessmentAnswers = {};

  for (const category of HOSPITALITY_CATEGORIES) {
    const rawCategory = source[category.key];
    const categoryAnswers: Record<string, boolean> = {};
    const raw =
      rawCategory && typeof rawCategory === "object"
        ? (rawCategory as Record<string, unknown>)
        : {};

    for (const question of category.questions) {
      categoryAnswers[question.key] = raw[question.key] === true;
    }

    answers[category.key] = categoryAnswers;
  }

  return answers;
}

/** How many questions were ticked, for the "answered x of y" affordance. */
export function countChecked(answers: AssessmentAnswers): number {
  return HOSPITALITY_CATEGORIES.reduce((total, category) => {
    const checked = category.questions.filter(
      (question) => answers[category.key]?.[question.key],
    ).length;
    return total + checked;
  }, 0);
}

export const TOTAL_QUESTIONS = HOSPITALITY_CATEGORIES.reduce(
  (total, category) => total + category.questions.length,
  0,
);

/**
 * Scores a checklist. Always derives every number — there is no branch that
 * returns a fixed value, so the UI cannot show a score the answers don't support.
 */
export function scoreAssessment(answers: AssessmentAnswers): AssessmentResult {
  const categoryScores = {} as Record<CategoryKey, number>;

  for (const category of HOSPITALITY_CATEGORIES) {
    const earned = category.questions.reduce((sum, question) => {
      const checked = answers[category.key]?.[question.key] === true;
      return sum + (checked ? question.weight : 0);
    }, 0);

    categoryScores[category.key] = Math.round((earned / CATEGORY_WEIGHT) * 100);
  }

  const values = HOSPITALITY_CATEGORIES.map(
    (category) => categoryScores[category.key],
  );
  const overallScore = Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );

  const weakest = weakestCategories(categoryScores);

  return {
    overallScore,
    categoryScores,
    weakest,
    suggestions: suggestionsFor(weakest, categoryScores),
  };
}

/**
 * The categories most worth fixing, worst first. A category already at 100 is
 * never suggested, so a perfect business gets no advice rather than filler.
 * Ties fall back to the order the categories are defined in, which keeps the
 * output stable between renders.
 */
export function weakestCategories(
  scores: Partial<Record<string, number>>,
  limit = 2,
): CategoryKey[] {
  return HOSPITALITY_CATEGORIES.map((category) => ({
    key: category.key,
    score: scores[category.key] ?? 0,
  }))
    .filter((entry) => entry.score < 100)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((entry) => entry.key);
}

function suggestionsFor(
  weakest: CategoryKey[],
  scores: Partial<Record<string, number>>,
): Suggestion[] {
  return weakest.map((key) => {
    const category = HOSPITALITY_CATEGORIES.find((item) => item.key === key)!;
    const score = scores[key] ?? 0;
    return {
      category: key,
      title: `${category.label} — ${score}/100`,
      advice: category.advice,
    };
  });
}

/** `82` → `{ key: "food", label: "Food Waste", score: 80 }`, ready for the UI. */
export function categoryBreakdown(
  scores: Partial<Record<string, number>>,
): CategoryScore[] {
  return HOSPITALITY_CATEGORIES.map((category) => ({
    key: category.key,
    label: category.label,
    score: scores[category.key] ?? 0,
  }));
}

/** The label for a 0–100 score, used for the badge and the headline. */
export function scoreBand(score: number): {
  label: string;
  tone: "strong" | "fair" | "weak";
} {
  if (score >= 80) return { label: "Leading", tone: "strong" };
  if (score >= 60) return { label: "Progressing", tone: "fair" };
  return { label: "Needs work", tone: "weak" };
}

/**
 * Aggregates traveller ratings. Kept as its own function, and its own section in
 * the UI, so a business's self-assessment can never be averaged into a
 * traveller's opinion — they answer different questions.
 */
export function summariseRatings(
  ratings: number[],
): { average: number; count: number } | null {
  if (ratings.length === 0) return null;
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return {
    average: Math.round((total / ratings.length) * 10) / 10,
    count: ratings.length,
  };
}
