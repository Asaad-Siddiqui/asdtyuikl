import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getProfileData } from "@/lib/profile-service";
import { toProfileSnapshot } from "@/lib/trip-planning";
import { saveConfirmedTrip } from "@/lib/trip-service";
import { confirmTripSchema, toTripRequestSummary } from "@/lib/trip-validation";
import { fieldErrors } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/trips/confirm
 *
 * The ONLY place a trip is written. The final itinerary is re-validated against
 * the strict application-owned schema, the profile snapshot is derived
 * server-side, and the row is scoped to the authenticated user (the client
 * never supplies a user id).
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Your session has expired. Please log in again." },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn't read that request. Please try again." },
      { status: 400 },
    );
  }

  const parsed = confirmTripSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "We couldn't verify that itinerary. Please plan it again.",
        fields: fieldErrors(parsed.error),
      },
      { status: 422 },
    );
  }

  try {
    const summary = toTripRequestSummary(parsed.data.request);
    const profile = await getProfileData(user.id);

    const saved = await saveConfirmedTrip(user.id, {
      request: summary,
      option: parsed.data.option,
      assumptions: parsed.data.assumptions,
      profileSnapshot: toProfileSnapshot(profile),
      rawPayload: {
        engine: parsed.data.engine,
        option: parsed.data.option,
      },
      engine: parsed.data.engine,
    });

    return NextResponse.json({ ok: true, tripId: saved.id });
  } catch (error) {
    console.error("[trips:confirm] failed:", error);
    return NextResponse.json(
      {
        error:
          "We couldn't save your trip just now. Please try again in a moment.",
        retryable: true,
      },
      { status: 500 },
    );
  }
}
