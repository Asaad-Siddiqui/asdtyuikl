import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { listTrips } from "@/lib/trip-service";

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

    // Always scoped to the session user — never a client-supplied id.
    const trips = await listTrips(user.id);
    return NextResponse.json({ trips });
  } catch (error) {
    console.error("[trips:list] failed:", error);
    return NextResponse.json(
      { error: "We couldn't load your trips just now. Please try again." },
      { status: 500 },
    );
  }
}
