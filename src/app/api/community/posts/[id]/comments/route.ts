import { NextResponse } from "next/server";

import { readJson, readString, requireApiUser, serverError } from "@/lib/api-helpers";
import { addComment, getCommunityFeed, TravelloError } from "@/lib/travello-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/community/posts/:id/comments — adds a comment as this user. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const content = readString(body.payload, "content", 600);
  if (!content) {
    return NextResponse.json(
      { error: "Write a comment first." },
      { status: 422 },
    );
  }

  try {
    await addComment(auth.userId, id, content);
    const posts = await getCommunityFeed(auth.userId);
    return NextResponse.json({ ok: true, posts });
  } catch (error) {
    if (error instanceof TravelloError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("[community:comment] failed:", error);
    return serverError();
  }
}
