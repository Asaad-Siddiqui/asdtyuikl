import { NextResponse } from "next/server";

import { readJson, readString, requireApiUser, serverError } from "@/lib/api-helpers";
import { HospitalityError, submitFeedback } from "@/lib/hospitality-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/hospitality/feedback
 *
 * Records a traveller's 1–5 sustainability rating for a place they visited.
 * One row per traveller per business — re-rating replaces the previous value, so
 * the average always reflects distinct people.
 */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const payload = body.payload as Record<string, unknown> | null;

  const businessId = readString(payload, "businessId", 80);
  if (!businessId) {
    return NextResponse.json(
      { error: "Pick which place you are rating." },
      { status: 422 },
    );
  }

  const rawRating = payload?.rating;
  const rating =
    typeof rawRating === "number" ? rawRating : Number.parseInt(String(rawRating), 10);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Pick a rating between 1 and 5 stars." },
      { status: 422 },
    );
  }

  const comment = readString(payload, "comment", 600);

  try {
    const business = await submitFeedback({
      businessId,
      userId: auth.userId,
      rating,
      comment: comment || null,
    });
    return NextResponse.json({ ok: true, business });
  } catch (error) {
    if (error instanceof HospitalityError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("[hospitality:feedback] failed:", error);
    return serverError();
  }
}
