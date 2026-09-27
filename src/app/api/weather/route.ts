import { NextResponse } from "next/server";

import { requireApiUser, serverError } from "@/lib/api-helpers";
import { coordsOrCenter, resolveCoords } from "@/lib/geo";
import { fetchWeather } from "@/lib/weather";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/weather?place=Matheran  (or ?lat=&lon=)
 *
 * Live current + forecast from Open-Meteo (no API key). Never fails hard: an
 * unreachable provider returns a labelled sample snapshot so the Digital Twin
 * keeps rendering.
 */
export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const latParam = Number(url.searchParams.get("lat"));
    const lonParam = Number(url.searchParams.get("lon"));
    const place = url.searchParams.get("place") ?? "";

    const coord =
      Number.isFinite(latParam) && Number.isFinite(lonParam) && latParam !== 0
        ? { lat: latParam, lon: lonParam }
        : place
          ? coordsOrCenter(place)
          : resolveCoords("Mumbai")!;

    const weather = await fetchWeather(coord, { revalidateSeconds: 300 });
    return NextResponse.json({ ok: true, weather });
  } catch (error) {
    console.error("[weather:get] failed:", error);
    return serverError();
  }
}
