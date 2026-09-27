import { NextResponse } from "next/server";

import { readJson, requireApiUser, serverError } from "@/lib/api-helpers";
import { generateAdvisorAdvice } from "@/lib/nugen";
import type { AdvisorContext } from "@/lib/twin-advisor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/advisor
 *
 * Runs the Nugen-aligned Digital-Twin advisor model over the current simulated
 * twin state, and returns structured advice. Always succeeds: if Nugen inference
 * is unavailable it returns deterministic prototype advice with a note, exactly
 * like the rest of the app degrades.
 */

const str = (value: unknown, max = 200): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";

const num = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 10) / 10 : 0;
};

const list = (value: unknown, max = 12): unknown[] =>
  Array.isArray(value) ? value.slice(0, max) : [];

/** Rebuilds a clean, bounded context from the untrusted client payload. */
function sanitizeContext(input: unknown): AdvisorContext | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;

  const conditions = (raw.conditions ?? {}) as Record<string, unknown>;
  const weatherRaw = (raw.weather ?? null) as Record<string, unknown> | null;

  const destination = str(raw.destination, 120);
  if (!destination) return null;

  return {
    destination,
    region: str(raw.region, 120),
    scenario: str(raw.scenario, 60) || "Custom",
    conditions: {
      rainfallMm: num(conditions.rainfallMm),
      tempC: num(conditions.tempC),
      windKph: num(conditions.windKph),
      durationHours: num(conditions.durationHours),
    },
    severity: num(raw.severity),
    status: str(raw.status, 20) || "Normal",
    metrics: list(raw.metrics).map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return { label: str(row.label, 60), value: num(row.value), baseline: num(row.baseline) };
    }),
    propagation: list(raw.propagation).map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return {
        order: num(row.order),
        from: str(row.from, 60),
        to: str(row.to, 60),
        effect: str(row.effect, 300),
      };
    }),
    predictions: list(raw.predictions).map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return {
        label: str(row.label, 60),
        low: num(row.low),
        high: num(row.high),
        unit: str(row.unit, 10),
      };
    }),
    weather: weatherRaw
      ? {
          condition: str(weatherRaw.condition, 60),
          tempC: num(weatherRaw.tempC),
          precipitationMm: num(weatherRaw.precipitationMm),
          source: str(weatherRaw.source, 20),
        }
      : undefined,
    socialSignals: list(raw.socialSignals, 6).map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return {
        source: str(row.source, 20),
        title: str(row.title, 160),
        sentiment: str(row.sentiment, 20),
      };
    }),
  };
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const context = sanitizeContext((body.payload as Record<string, unknown>)?.context);
  if (!context) {
    return NextResponse.json(
      { error: "A destination and twin state are required." },
      { status: 422 },
    );
  }

  try {
    const result = await generateAdvisorAdvice(context);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[ai:advisor] failed:", error);
    return serverError();
  }
}
