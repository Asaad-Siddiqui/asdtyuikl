import { NextResponse } from "next/server";

import { readJson, readString, requireApiUser, serverError } from "@/lib/api-helpers";
import { createReport, getUserReports, TravelloError } from "@/lib/travello-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/reports — files a community incident report for this user. */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const destinationId = readString(body.payload, "destinationId", 80);
  const category = readString(body.payload, "category", 60);
  const description = readString(body.payload, "description", 1200);
  const priority = readString(body.payload, "priority", 20) || "medium";

  if (!destinationId || !category || !description) {
    return NextResponse.json(
      { error: "Add a destination, a category and a short description." },
      { status: 422 },
    );
  }

  try {
    const report = await createReport(auth.userId, {
      destinationId,
      category,
      description,
      priority,
    });
    const reports = await getUserReports(auth.userId);
    return NextResponse.json({
      ok: true,
      reportId: report?.id ?? null,
      reports,
    });
  } catch (error) {
    if (error instanceof TravelloError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("[reports:create] failed:", error);
    return serverError();
  }
}
