import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { planTrip } from "@/lib/trip-planning";
import { getProfileData } from "@/lib/profile-service";
import { planTripSchema, toTripRequestSummary } from "@/lib/trip-validation";
import { fieldErrors } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/trips/plan
 *
 * Server-only AI pipeline: validate the request → load the saved accessibility
 * profile from Neon → ask OpenRouter for structured JSON → validate + normalize
 * → return two clean, application-owned options.
 *
 * The OpenRouter key is read only inside the server-only client. Raw model text
 * is never returned to the browser.
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

  const parsed = planTripSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Some trip details need another look.",
        fields: fieldErrors(parsed.error),
      },
      { status: 422 },
    );
  }

  const summary = toTripRequestSummary(parsed.data.request);

  try {
    const profile = await getProfileData(user.id);
    if (!profile.completed) {
      return NextResponse.json(
        {
          error:
            "Finish your accessibility profile first — it's how we personalise your trip.",
          needsProfile: true,
        },
        { status: 409 },
      );
    }

    const plan = await planTrip(summary, profile);

    return NextResponse.json({
      request: summary,
      options: plan.options,
      assumptions: plan.assumptions,
      comparisons: plan.comparisons,
      engine: plan.engine,
      note: plan.note,
    });
  } catch (error) {
    console.error("[trips:plan] failed:", error);
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
