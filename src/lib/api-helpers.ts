import "server-only";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

/** Safely reads a string field out of an untrusted JSON payload. */
export function readString(payload: unknown, key: string, max = 1000): string {
  if (!payload || typeof payload !== "object") return "";
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function readJson(
  request: Request,
): Promise<{ ok: true; payload: unknown } | { ok: false; response: NextResponse }> {
  try {
    return { ok: true, payload: await request.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "We couldn't read that request. Please try again." },
        { status: 400 },
      ),
    };
  }
}

/**
 * Resolves the authenticated user for an API route. Returns either the user or
 * a ready-made 401 response — callers must never trust a client-supplied id.
 */
export async function requireApiUser(): Promise<
  | { ok: true; userId: string; name: string }
  | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Your session has expired. Please log in again." },
        { status: 401 },
      ),
    };
  }
  return { ok: true, userId: user.id, name: user.name };
}

export function serverError(): NextResponse {
  return NextResponse.json(
    { error: "Something went wrong. Please try again in a moment." },
    { status: 500 },
  );
}
