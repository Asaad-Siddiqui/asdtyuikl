import { NextResponse } from "next/server";

import { requireApiUser, serverError } from "@/lib/api-helpers";
import { fetchSocialSignals } from "@/lib/social-signals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/social-signals?q=Matheran rain&tag=monsoon
 *
 * Public traveller chatter from Reddit + Mastodon (both keyless). Falls back to
 * a labelled sample feed when the sources are unreachable.
 */
export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "India travel weather").slice(0, 120);
    const tag = (url.searchParams.get("tag") ?? "monsoon").replace(/[^a-z0-9]/gi, "").slice(0, 30) || "monsoon";

    const result = await fetchSocialSignals(query, tag);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[social-signals:get] failed:", error);
    return serverError();
  }
}
