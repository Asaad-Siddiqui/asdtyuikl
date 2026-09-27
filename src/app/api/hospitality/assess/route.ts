import { NextResponse } from "next/server";

import { readJson, readString, requireApiUser, serverError } from "@/lib/api-helpers";
import { HospitalityError, submitAssessment } from "@/lib/hospitality-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/hospitality/assess
 *
 * Stores a business's sustainability checklist. The request only carries the
 * answers — the score is computed on the server from the sanitised answers, so
 * a client cannot submit a score of its own.
 */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const businessId = readString(body.payload, "businessId", 80);
  if (!businessId) {
    return NextResponse.json(
      { error: "Pick the business you are assessing." },
      { status: 422 },
    );
  }

  const answers = (body.payload as Record<string, unknown>)?.answers;

  try {
    const business = await submitAssessment({
      businessId,
      answers,
      userId: auth.userId,
    });
    return NextResponse.json({ ok: true, business });
  } catch (error) {
    if (error instanceof HospitalityError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("[hospitality:assess] failed:", error);
    return serverError();
  }
}
