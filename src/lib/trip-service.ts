import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { trips } from "@/db/schema";
import type {
  Co2Assumption,
  ItineraryOption,
  SavedTripView,
  TripProfileView,
  TripRequestSummary,
} from "@/lib/trip-schema";

/**
 * Every function here is scoped to the authenticated user's id, which callers
 * must derive from the session — never from the request body. Queries combine
 * `user_id` with the trip id so one traveller can never read another's trip.
 */

export class TripError extends Error {}

/** Server-derived snapshot of the accessibility profile at confirm time. */
export type TripProfileSnapshot = TripProfileView;

export type SavedTrip = {
  id: string;
  title: string;
  fromLocation: string;
  toLocation: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  elderly: number;
  mobilitySupport: number;
  budget: number;
  transportPreference: string;
  priorities: string[];
  additionalPreferences: string;
  tripNeeds: string[];
  selectedOption: string;
  status: string;
  totalCost: number;
  estimatedCo2: number;
  accessibilityScore: number;
  sustainabilityScore: number;
  dataSource: string;
  engine: string;
  createdAt: string;
};

export type FullTrip = SavedTrip & {
  itinerary: ItineraryOption;
  assumptions: Co2Assumption[];
  profileSnapshot: TripProfileSnapshot;
};

/** FullTrip satisfies the shared result view-model used by the UI. */
export type FullTripView = SavedTripView;

type TripRow = typeof trips.$inferSelect;

function toSavedTrip(row: TripRow): SavedTrip {
  return {
    id: row.id,
    title: row.title,
    fromLocation: row.fromLocation,
    toLocation: row.toLocation,
    startDate: row.startDate,
    endDate: row.endDate,
    adults: row.adults,
    children: row.children,
    elderly: row.elderly,
    mobilitySupport: row.mobilitySupport,
    budget: row.budget,
    transportPreference: row.transportPreference,
    priorities: Array.isArray(row.priorities) ? row.priorities : [],
    additionalPreferences: row.additionalPreferences,
    tripNeeds: Array.isArray(row.tripNeeds) ? row.tripNeeds : [],
    selectedOption: row.selectedOption,
    status: row.status,
    totalCost: row.totalCost,
    estimatedCo2: row.estimatedCo2,
    accessibilityScore: row.accessibilityScore,
    sustainabilityScore: row.sustainabilityScore,
    dataSource: row.dataSource,
    engine: row.engine,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listTrips(userId: string): Promise<SavedTrip[]> {
  const rows = await db
    .select()
    .from(trips)
    .where(eq(trips.userId, userId))
    .orderBy(desc(trips.createdAt));

  return rows.map(toSavedTrip);
}

export async function getTrip(
  userId: string,
  tripId: string,
): Promise<FullTrip | null> {
  // A malformed id would otherwise raise a Postgres cast error.
  if (!/^[0-9a-f-]{36}$/i.test(tripId)) return null;

  const rows = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    ...toSavedTrip(row),
    itinerary: row.itineraryJson as ItineraryOption,
    assumptions: (row.assumptions ?? []) as Co2Assumption[],
    profileSnapshot: (row.profileSnapshot ?? {}) as TripProfileSnapshot,
  };
}

export type SaveTripInput = {
  request: TripRequestSummary;
  option: ItineraryOption;
  assumptions: Co2Assumption[];
  profileSnapshot: TripProfileSnapshot;
  /** Pre-normalization payload for auditing only — never rendered. */
  rawPayload: unknown;
  engine: "ai" | "prototype";
};

export async function saveConfirmedTrip(
  userId: string,
  input: SaveTripInput,
): Promise<SavedTrip> {
  const { request, option } = input;

  const inserted = await db
    .insert(trips)
    .values({
      userId,
      title: `${request.from} → ${request.to}`,
      fromLocation: request.from,
      toLocation: request.to,
      startDate: request.startDate,
      endDate: request.endDate,
      adults: request.adults,
      children: request.children,
      elderly: request.elderly,
      mobilitySupport: request.mobilitySupport,
      budget: request.budget,
      transportPreference: request.transportPreference,
      priorities: request.priorities,
      additionalPreferences: request.additionalPreferences,
      tripNeeds: request.tripNeeds,
      selectedOption: option.optionId,
      status: "confirmed",
      totalCost: option.summary.cost,
      estimatedCo2: option.summary.co2Kg,
      accessibilityScore: option.summary.accessibilityScore,
      sustainabilityScore: option.summary.sustainabilityScore,
      dataSource: option.dataSource,
      engine: input.engine,
      itineraryJson: option,
      rawItineraryJson: input.rawPayload,
      assumptions: input.assumptions,
      profileSnapshot: input.profileSnapshot,
    })
    .returning();

  const row = inserted[0];
  if (!row) throw new TripError("Could not save the trip.");
  return toSavedTrip(row);
}
