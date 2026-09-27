import { NextResponse } from "next/server";

import { readJson, readString, requireApiUser, serverError } from "@/lib/api-helpers";
import { claimUserReward, TravelloError } from "@/lib/travello-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/rewards/claim
 *
 * Marks one unlocked goodie as claimed for the signed-in traveller. Points are
 * achievement progress — they are validated, never deducted. Idempotent.
 */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const rewardId = readString(body.payload, "rewardId", 60);
  if (!rewardId) {
    return NextResponse.json(
      { error: "Pick a reward to claim." },
      { status: 422 },
    );
  }

  try {
    const result = await claimUserReward(auth.userId, rewardId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof TravelloError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("[rewards:claim] failed:", error);
    return serverError();
  }
}
