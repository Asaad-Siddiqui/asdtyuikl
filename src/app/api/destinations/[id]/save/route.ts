import { NextResponse } from "next/server";

import { requireApiUser, serverError } from "@/lib/api-helpers";
import { toggleSavedDestination, TravelloError } from "@/lib/travello-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/destinations/:id/save — toggles this destination in saved trips. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const result = await toggleSavedDestination(auth.userId, id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof TravelloError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("[destinations:save] failed:", error);
    return serverError();
  }
}
