import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { generateAssistantNote, isAiConfigured } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Without a configured provider the client simply uses its built-in copy.
  if (!isAiConfigured()) {
    return NextResponse.json({ configured: false, note: null });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Your session has expired. Please log in again." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      step?: unknown;
      selections?: unknown;
    };

    const step = typeof body.step === "string" ? body.step.slice(0, 200) : "";
    const selections = Array.isArray(body.selections)
      ? body.selections
          .filter((value): value is string => typeof value === "string")
          .slice(0, 20)
          .map((value) => value.slice(0, 80))
      : [];

    const note = await generateAssistantNote({ step, selections });
    return NextResponse.json({ configured: true, note });
  } catch {
    // Never block the questionnaire on the optional AI layer.
    return NextResponse.json({ configured: true, note: null });
  }
}
