import { getCurrentUser } from "@/lib/auth";
import { buildTripPdf, pdfFileName } from "@/lib/trip-pdf";
import { getTrip } from "@/lib/trip-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/trips/[id]/pdf
 *
 * Generates a real PDF (embedded text, not a screenshot) from the saved
 * structured itinerary. The lookup is scoped to the session user, so a trip id
 * belonging to somebody else returns a friendly 404 rather than leaking data.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Your session has expired. Please log in again.", {
      status: 401,
    });
  }

  const { id } = await params;
  const trip = await getTrip(user.id, id);
  if (!trip) {
    return new Response("We couldn't find that trip.", { status: 404 });
  }

  try {
    const bytes = await buildTripPdf(trip);
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${pdfFileName(trip)}"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[trips:pdf] failed:", error);
    return new Response(
      "We couldn't build your PDF just now. Please try again.",
      { status: 500 },
    );
  }
}
