import { NextResponse } from "next/server";

import { readJson, readString, requireApiUser, serverError } from "@/lib/api-helpers";
import { startUserChallenge, TravelloError } from "@/lib/travello-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/challenges/start — marks a challenge as in progress for this user. */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const challengeId = readString(body.payload, "challengeId", 80);
  if (!challengeId) {
    return NextResponse.json(
      { error: "Pick a challenge to start." },
      { status: 422 },
    );
  }

  try {
    await startUserChallenge(auth.userId, challengeId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TravelloError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("[challenges:start] failed:", error);
    return serverError();
  }
}
