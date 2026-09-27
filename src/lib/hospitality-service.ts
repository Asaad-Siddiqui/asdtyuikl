import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  businessAssessments,
  businessFeedback,
  businesses,
  destinations,
  type Business as BusinessRow,
  type BusinessAssessment,
  type BusinessFeedback,
} from "@/db/schema";
import {
  categoryBreakdown,
  normaliseAnswers,
  scoreAssessment,
  summariseRatings,
  type AssessmentAnswers,
} from "@/lib/hospitality";
import type {
  Business,
  BusinessAssessmentSummary,
  BusinessTravellerRating,
} from "@/types";

/**
 * Reads and writes for the Sustainable Hospitality feature.
 *
 * Everything the UI shows is derived at read time:
 *   - the business score comes from its newest assessment row
 *   - the traveller score comes from aggregated feedback rows
 * Nothing is denormalised onto the business row, so the two scores can never
 * drift apart from their source data.
 *
 * `userId` is optional throughout: a signed-out visitor can read scores, but
 * only a session holder can submit (enforced by the API routes).
 */

/** A business problem the caller should surface to the user (bad input, missing row). */
export class HospitalityError extends Error {}

/* ------------------------------------------------------------------ */
/* Views                                                              */
/* ------------------------------------------------------------------ */

function toAssessmentSummary(row: BusinessAssessment): BusinessAssessmentSummary {
  const suggestions = row.suggestions ?? [];

  return {
    overall: row.overallScore,
    band: row.overallScore >= 80 ? "strong" : row.overallScore >= 60 ? "fair" : "weak",
    categories: categoryBreakdown(row.categoryScores ?? {}),
    weakest: suggestions.map((suggestion) => suggestion.category),
    suggestions,
    submittedAt: row.createdAt.toISOString(),
  };
}

/**
 * Newest assessment wins. There are only a handful of rows in this feature, so a
 * single ordered read beats a window function for readability — the rows are
 * already sorted oldest-to-newest, so the last write per business is the current
 * score.
 */
function latestAssessmentMap(rows: BusinessAssessment[]) {
  const map = new Map<string, BusinessAssessment>();
  for (const row of rows) map.set(row.businessId, row);
  return map;
}

function ratingMap(rows: BusinessFeedback[], userId?: string) {
  const byBusiness = new Map<string, BusinessFeedback[]>();
  for (const row of rows) {
    const list = byBusiness.get(row.businessId);
    if (list) list.push(row);
    else byBusiness.set(row.businessId, [row]);
  }

  const map = new Map<string, BusinessTravellerRating>();
  for (const [businessId, list] of byBusiness) {
    const summary = summariseRatings(list.map((row) => row.rating));
    if (!summary) continue;
    map.set(businessId, {
      average: summary.average,
      count: summary.count,
      myRating: userId
        ? (list.find((row) => row.userId === userId)?.rating ?? null)
        : null,
    });
  }
  return map;
}

function toBusinessView(
  row: BusinessRow,
  assessment: BusinessAssessment | undefined,
  travellerRating: BusinessTravellerRating | undefined,
): Business {
  return {
    id: row.id,
    destinationId: row.destinationId,
    name: row.name,
    type: row.type,
    description: row.description,
    imageUrl: row.imageUrl,
    locality: row.locality,
    priceRange: row.priceRange,
    accessibilitySummary: row.accessibilitySummary,
    sustainabilityPractices: row.sustainabilityPractices ?? [],
    accessibilityFeatures: row.accessibilityFeatures ?? [],
    assessment: assessment ? toAssessmentSummary(assessment) : null,
    traveller: travellerRating ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Reads                                                              */
/* ------------------------------------------------------------------ */

export async function listBusinesses(userId?: string): Promise<Business[]> {
  const [rows, assessmentRows, feedbackRows] = await Promise.all([
    db.select().from(businesses).orderBy(businesses.name),
    db.select().from(businessAssessments).orderBy(businessAssessments.createdAt),
    db.select().from(businessFeedback),
  ]);

  const assessments = latestAssessmentMap(assessmentRows);
  const ratings = ratingMap(feedbackRows, userId);

  return rows.map((row) =>
    toBusinessView(row, assessments.get(row.id), ratings.get(row.id)),
  );
}

export async function getBusiness(
  id: string,
  userId?: string,
): Promise<Business | null> {
  const [row] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, id))
    .limit(1);
  if (!row) return null;

  const [assessmentRow] = await db
    .select()
    .from(businessAssessments)
    .where(eq(businessAssessments.businessId, id))
    .orderBy(desc(businessAssessments.createdAt))
    .limit(1);

  const feedbackRows = await db
    .select()
    .from(businessFeedback)
    .where(eq(businessFeedback.businessId, id));

  const ratings = ratingMap(feedbackRows, userId);

  return toBusinessView(row, assessmentRow, ratings.get(id));
}

/* ------------------------------------------------------------------ */
/* Writes                                                             */
/* ------------------------------------------------------------------ */

/**
 * Stores a checklist submission and returns the business with its new score.
 *
 * The score is always computed here from the sanitised answers — the client
 * never sends a score, and anything unrecognised in the payload is dropped
 * before scoring. Submissions are appended, never overwritten, so a business
 * can see its score move over time.
 */
export async function submitAssessment(input: {
  businessId: string;
  answers: unknown;
  userId: string | null;
}): Promise<Business> {
  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.id, input.businessId))
    .limit(1);

  if (!business) {
    throw new HospitalityError("We couldn't find that business.");
  }

  const answers: AssessmentAnswers = normaliseAnswers(input.answers);
  const result = scoreAssessment(answers);

  await db.insert(businessAssessments).values({
    businessId: business.id,
    answers: answers as Record<string, Record<string, boolean>>,
    overallScore: result.overallScore,
    categoryScores: result.categoryScores,
    suggestions: result.suggestions,
    submittedByUserId: input.userId,
  });

  const view = await getBusiness(business.id, input.userId ?? undefined);
  if (!view) throw new HospitalityError("We couldn't find that business.");
  return view;
}

/**
 * Records one traveller's rating. Re-rating replaces the traveller's previous
 * value rather than adding a second row, so a business's traveller score always
 * reflects distinct people.
 */
export async function submitFeedback(input: {
  businessId: string;
  userId: string;
  rating: number;
  comment?: string | null;
}): Promise<Business> {
  const [business] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.id, input.businessId))
    .limit(1);

  if (!business) {
    throw new HospitalityError("We couldn't find that business.");
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new HospitalityError("Pick a rating between 1 and 5 stars.");
  }

  const comment = input.comment?.trim() ? input.comment.trim().slice(0, 600) : null;

  await db
    .insert(businessFeedback)
    .values({
      businessId: business.id,
      userId: input.userId,
      rating: input.rating,
      comment,
    })
    .onConflictDoUpdate({
      target: [businessFeedback.businessId, businessFeedback.userId],
      set: { rating: input.rating, comment, updatedAt: new Date() },
    });

  const view = await getBusiness(business.id, input.userId);
  if (!view) throw new HospitalityError("We couldn't find that business.");
  return view;
}

/** Destination names for the businesses, used by the nav/hub copy. */
export async function listBusinessDestinations(): Promise<
  { id: string; name: string }[]
> {
  const rows = await db
    .select({ id: destinations.id, name: destinations.name })
    .from(destinations)
    .orderBy(destinations.name);
  return rows;
}
