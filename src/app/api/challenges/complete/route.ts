import { NextResponse } from "next/server";

import { readJson, readString, requireApiUser, serverError } from "@/lib/api-helpers";
import { completeUserChallenge, getUserStats, TravelloError } from "@/lib/travello-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/challenges/complete
 *
 * Awards the challenge's points exactly once and returns the recomputed totals
 * so the client's optimistic numbers match the database immediately.
 */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const challengeId = readString(body.payload, "challengeId", 80);
  if (!challengeId) {
    return NextResponse.json(
      { error: "Pick a challenge to complete." },
      { status: 422 },
    );
  }

  try {
    const result = await completeUserChallenge(auth.userId, challengeId);
    const stats = await getUserStats(auth.userId);
    return NextResponse.json({ ok: true, ...result, stats });
  } catch (error) {
    if (error instanceof TravelloError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("[challenges:complete] failed:", error);
    return serverError();
  }
}
