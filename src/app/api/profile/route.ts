import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { profilePayloadSchema } from "@/lib/profile-validation";
import { getProfileData, saveProfileData } from "@/lib/profile-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Your session has expired. Please log in again." },
        { status: 401 },
      );
    }

    const profile = await getProfileData(user.id);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[profile:get] failed:", error);
    return NextResponse.json(
      { error: "We couldn't load your profile. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Your session has expired. Please log in again." },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "We couldn't read that request. Please try again." },
      { status: 400 },
    );
  }

  const parsed = profilePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Some answers couldn't be saved. Please review and retry." },
      { status: 422 },
    );
  }

  try {
    const profile = await saveProfileData(user.id, parsed.data);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    console.error("[profile:post] failed:", error);
    return NextResponse.json(
      { error: "We couldn't save your profile. Please try again." },
      { status: 500 },
    );
  }
}
