import { NextResponse } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { findUserByEmail } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/session";
import { fieldErrors, signupSchema } from "@/lib/validation";

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

  const parsed = signupSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the highlighted fields.",
        fields: fieldErrors(parsed.error),
      },
      { status: 422 },
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        {
          error: "An account with that email already exists.",
          fields: { email: "This email is already registered. Try logging in." },
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const inserted = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning({ id: users.id, name: users.name, email: users.email });

    const user = inserted[0];
    if (!user) {
      return NextResponse.json(
        { error: "We couldn't create your account. Please try again." },
        { status: 500 },
      );
    }

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
    console.error("[signup] failed:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("duplicate key")) {
      return NextResponse.json(
        {
          error: "An account with that email already exists.",
          fields: { email: "This email is already registered." },
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Something went wrong on our side. Please try again." },
      { status: 500 },
    );
  }
}
