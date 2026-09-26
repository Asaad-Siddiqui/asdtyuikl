import { NextResponse } from "next/server";

import { SESSION_COOKIE, clearedSessionCookieOptions } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", clearedSessionCookieOptions);
  return response;
}
