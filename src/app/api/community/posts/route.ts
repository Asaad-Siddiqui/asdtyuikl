import { NextResponse } from "next/server";

import { readJson, readString, requireApiUser, serverError } from "@/lib/api-helpers";
import { createPost, getCommunityFeed, TravelloError } from "@/lib/travello-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/community/posts — publishes a post as the authenticated user. */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const content = readString(body.payload, "content", 1200);
  if (!content) {
    return NextResponse.json(
      { error: "Write something before posting." },
      { status: 422 },
    );
  }

  try {
    await createPost(auth.userId, {
      content,
      imageUrl: readString(body.payload, "imageUrl", 500) || null,
      destinationId: readString(body.payload, "destinationId", 80) || null,
      challengeId: readString(body.payload, "challengeId", 80) || null,
    });

    const posts = await getCommunityFeed(auth.userId);
    return NextResponse.json({ ok: true, posts });
  } catch (error) {
    if (error instanceof TravelloError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("[community:post] failed:", error);
    return serverError();
  }
}
