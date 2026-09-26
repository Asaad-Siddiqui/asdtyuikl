import { NextResponse } from "next/server";

import { requireApiUser, serverError } from "@/lib/api-helpers";
import { togglePostReaction, TravelloError } from "@/lib/travello-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/community/posts/:id/like — toggles this user's like on a post. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const result = await togglePostReaction(auth.userId, id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof TravelloError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("[community:like] failed:", error);
    return serverError();
  }
}
