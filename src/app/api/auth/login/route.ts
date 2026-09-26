import { NextResponse } from "next/server";

import { findUserByEmail } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/session";
import { fieldErrors, loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn't read that request. Please try again." },
      { status: 400 },
    );
  }

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the highlighted fields.",
        fields: fieldErrors(parsed.error),
      },
      { status: 422 },
    );
  }

  const { email, password } = parsed.data;

  try {
    const user = await findUserByEmail(email);

    // Same generic message for unknown email and wrong password so we never
    // reveal whether an account exists.
    const invalid = NextResponse.json(
      { error: "That email or password doesn't match our records." },
      { status: 401 },
    );

    if (!user) return invalid;

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return invalid;

    const token = await signSession({
      userId: user.id,
      name: user.name,
      email: user.email,
    });

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    console.error("[login] failed:", error);
    return NextResponse.json(
      { error: "Something went wrong on our side. Please try again." },
      { status: 500 },
    );
  }
}
