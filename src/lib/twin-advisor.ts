/**
 * Digital-Twin advisor — domain layer for the Nugen-aligned model.
 *
 * This module is client-safe (zod + types only). It:
 *   • builds the structured `AdvisorContext` the model reasons over, and
 *   • defines the strict `NugenAdvice` schema the model must return, and
 *   • provides a deterministic `fallbackAdvice()` used when Nugen inference is
 *     unavailable, so the panel still gives domain advice (clearly labelled).
 *
 * The Nugen-aligned system prompt and the actual inference live in the
 * server-only `src/lib/nugen.ts`.
 */

import { z } from "zod";

import type { TwinConditions, TwinEntity, TwinState } from "@/lib/digital-twin";
import type { SocialSignal } from "@/lib/social-signals";
import type { WeatherSnapshot } from "@/lib/weather";

export type AdvisorContext = {
  destination: string;
  region: string;
  /** Preset label or "Custom". */
  scenario: string;
  conditions: TwinConditions;
  severity: number;
  status: string;
  metrics: { label: string; value: number; baseline: number }[];
  propagation: { order: number; from: string; to: string; effect: string }[];
  predictions: { label: string; low: number; high: number; unit: string }[];
  weather?: {
    condition: string;
    tempC: number;
    precipitationMm: number;
    source: string;
  };
  socialSignals: { source: string; title: string; sentiment: string }[];
};

export const adviceSchema = z.object({
  headline: z.string().min(3).max(200),
  summary: z.string().min(10).max(1600),
  actions: z.array(z.string().min(3).max(300)).min(1).max(6),
  cautions: z.array(z.string().min(3).max(300)).max(6).default([]),
  accessibilityNote: z.string().max(400).default(""),
});

export type NugenAdvice = z.infer<typeof adviceSchema>;

/** Builds the compact context sent to the aligned model. */
export function buildAdvisorContext({
  entity,
  state,
  scenarioLabel,
  conditions,
  weather,
  signals,
}: {
  entity: TwinEntity;
  state: TwinState;
  scenarioLabel: string;
  conditions: TwinConditions;
  weather?: WeatherSnapshot;
  signals: SocialSignal[];
}): AdvisorContext {
  return {
    destination: entity.name,
    region: entity.region,
    scenario: scenarioLabel,
    conditions,
    severity: state.severity,
    status: state.status,
    metrics: state.metrics.map((metric) => ({
      label: metric.label,
      value: Math.round(metric.value),
      baseline: Math.round(metric.baseline),
    })),
    propagation: state.propagation.map((step) => ({
      order: step.order,
      from: step.from,
      to: step.to,
      effect: step.effect,
    })),
    predictions: state.predictions.map((prediction) => ({
      label: prediction.label,
      low: prediction.low,
      high: prediction.high,
      unit: prediction.unit,
    })),
    weather: weather
      ? {
          condition: weather.current.condition,
          tempC: weather.current.tempC,
          precipitationMm: weather.current.precipitationMm,
          source: weather.source,
        }
      : undefined,
    socialSignals: signals.slice(0, 6).map((signal) => ({
      source: signal.source,
      title: signal.title,
      sentiment: signal.sentiment,
    })),
  };
}

/** Reads a metric value by label fragment, or its baseline if absent. */
function metricValue(ctx: AdvisorContext, label: string): number {
  const hit = ctx.metrics.find((metric) =>
    metric.label.toLowerCase().includes(label.toLowerCase()),
  );
  return hit ? hit.value : 0;
}

/**
 * Deterministic, domain-specific advice used when Nugen inference is
 * unavailable. Derived only from the twin state, so it is always coherent.
 */
export function fallbackAdvice(ctx: AdvisorContext): NugenAdvice {
  const movement = metricValue(ctx, "movement");
  const capacity = metricValue(ctx, "capacity");
  const availability = metricValue(ctx, "availability");
  const accessibility = metricValue(ctx, "accessibility risk");
  const crowd = metricValue(ctx, "crowd pressure");

  const actions: string[] = [];
  if (movement < 60) {
    actions.push(
      "Favour indoor, step-free venues and keep transfers short — movement is simulated below normal.",
    );
  }
  if (crowd > 60) {
    actions.push(
      "Use Crowd-Aware Picks and travel in the calmest window; indoor venues will concentrate crowds.",
    );
  }
  if (accessibility > 55) {
    actions.push(
      "Re-check step-free routes and rest stops on the destination hub before setting out.",
    );
  }
  if (capacity < 70 || availability < 70) {
    actions.push(
      "Confirm stays and transport availability ahead; capacity and availability are both constrained.",
    );
  }
  if (ctx.status === "Severe" || ctx.status === "Disrupted") {
    actions.push(
      "Have a covered plan-B itinerary ready and allow extra time for every leg.",
    );
  }
  if (actions.length === 0) {
    actions.push(
      "Conditions look stable — proceed with the recommended, low-impact itinerary.",
    );
  }

  const cautions: string[] = [
    "This is a prototype simulation, not a verified forecast.",
    "Confirm facilities, schedules and access directly with each provider.",
  ];
  if (ctx.socialSignals.some((signal) => signal.sentiment === "negative")) {
    cautions.push(
      "Some traveller signals are negative — treat on-the-ground reports as unverified.",
    );
  }

  return {
    headline: `${ctx.destination}: ${ctx.status} under ${ctx.scenario.toLowerCase()} conditions`,
    summary: `Simulated severity is ${Math.round(
      ctx.severity * 100,
    )}%. Movement is ${Math.round(movement)}/100, capacity ${Math.round(
      capacity,
    )}/100, stay & transport availability ${Math.round(
      availability,
    )}/100, with accessibility risk at ${Math.round(
      accessibility,
    )}/100 and crowd pressure at ${Math.round(crowd)}/100. These are model estimates from the catalogue and weather inputs.`,
    actions: actions.slice(0, 5),
    cautions: cautions.slice(0, 3),
    accessibilityNote:
      accessibility > 55
        ? "Accessibility is the main concern here: verify step-free routes, lifts and accessible toilets, and keep walking distances short."
        : "Accessibility looks manageable; still confirm step-free access at each stop.",
  };
}
