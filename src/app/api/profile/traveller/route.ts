import { NextResponse } from "next/server";

import { readJson, readString, requireApiUser, serverError } from "@/lib/api-helpers";
import { updateTravellerProfile } from "@/lib/travello-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/profile/traveller
 *
 * Updates only the signed-in user's public traveller details. The accessibility
 * profile has its own route (`/api/profile`); this one never touches it.
 */
export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  try {
    await updateTravellerProfile(auth.userId, {
      name: readString(body.payload, "name", 80) || undefined,
      username: readString(body.payload, "username", 40),
      bio: readString(body.payload, "bio", 400),
      avatarUrl: readString(body.payload, "avatarUrl", 500),
      role: readString(body.payload, "role", 20) || undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[profile:traveller] failed:", error);
    return serverError();
  }
}
