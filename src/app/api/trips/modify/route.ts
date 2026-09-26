import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { modifyTrip } from "@/lib/trip-planning";
import { getProfileData } from "@/lib/profile-service";
import { modifyTripSchema, toTripRequestSummary } from "@/lib/trip-validation";
import { fieldErrors } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/trips/modify
 *
 * Same guarded pipeline as planning: the modification goes to OpenRouter, the
 * response is validated + normalized by the application, and the frontend only
 * ever receives the clean internal itinerary object. Nothing is persisted here.
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

  const parsed = modifyTripSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Tell us a little more about the change you'd like.",
        fields: fieldErrors(parsed.error),
      },
      { status: 422 },
    );
  }

  const summary = toTripRequestSummary(parsed.data.request);

  try {
    const profile = await getProfileData(user.id);
    const result = await modifyTrip(
      summary,
      profile,
      parsed.data.option,
      parsed.data.modification,
    );

    if (!result.ok || !result.option) {
      return NextResponse.json(
        {
          error:
            result.note ??
            "Your trip planner hit a small bump. Let's try that again.",
          retryable: true,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      option: result.option,
      assumptions: result.assumptions,
      note: result.note,
    });
  } catch (error) {
    console.error("[trips:modify] failed:", error);
    return NextResponse.json(
      {
        error:
          "Your trip planner hit a small bump. Let's try that again in a moment.",
        retryable: true,
      },
      { status: 502 },
    );
  }
}
