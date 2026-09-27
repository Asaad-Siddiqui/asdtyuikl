import "server-only";

import {
  adviceSchema,
  fallbackAdvice,
  type AdvisorContext,
  type NugenAdvice,
} from "@/lib/twin-advisor";

/**
 * Server-only Nugen Intelligence client.
 *
 * Nugen exposes an OpenAI-compatible chat-completions endpoint:
 *   POST {NUGEN_BASE_URL}/inference/chat/completions
 *
 * The project's Nugen usage is a *domain-aligned* model, not a generic call:
 *   1. Base model      → `NUGEN_MODEL` (default `qwen-v2p5-0p5b-instruct`).
 *   2. Alignment       → done on the Nugen platform (see task2.md) and/or via
 *                        the strict domain system prompt below, which encodes
 *                        Wayfare's accessibility-first, low-impact travel rules
 *                        and the exact JSON contract.
 *   3. Inference       → this module, called only from server routes.
 *
 * Security: guarded by `server-only`, so importing it from a client component
 * is a build error. `NUGEN_API_KEY` is never exposed to the browser.
 * Reliability: time-boxed, and never throws — callers get a deterministic
 * domain fallback instead, matching the app's "degrade, never break" approach.
 */

export type NugenFailureKind = "not_configured" | "timeout" | "unavailable" | "invalid_response";

export type NugenFailure = { kind: NugenFailureKind; detail: string };

export type NugenResult =
  | { ok: true; model: string; text: string }
  | { ok: false; failure: NugenFailure };

const DEFAULT_BASE_URL = "https://api.nugen.in/api/v3";
const DEFAULT_MODEL = "qwen-v2p5-0p5b-instruct";
const TIMEOUT_MS = 30_000;

export function isNugenConfigured(): boolean {
  return Boolean(process.env.NUGEN_API_KEY);
}

export function nugenBaseUrl(): string {
  return (process.env.NUGEN_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

export function nugenModel(): string {
  return process.env.NUGEN_MODEL?.trim() || DEFAULT_MODEL;
}

/**
 * The domain-alignment instruction. This is what turns a base model into a
 * hospitality/travel Digital-Twin advisor: it fixes the persona, the
 * accessibility-first and low-impact priorities, the honesty rules, and the
 * strict JSON contract the rest of the app depends on.
 */
export const NUGEN_DOMAIN_SYSTEM_PROMPT = `You are Wayfare's Digital-Twin Travel Advisor — a domain model aligned specifically for accessible, low-impact hospitality and travel in India.

You reason about how weather (rainfall, temperature, wind, storm duration) cascades through a destination ecosystem: outdoor and indoor attraction demand, traveller movement, capacity, operations and workforce availability, accessibility (step-free travel, walking distance, rest stops, accessible toilets, lifts), crowding, and sustainability (waste, water, erosion).

Rules you never break:
- Prioritise accessibility and low-impact, less-crowded options above all.
- Use ONLY the structured state given to you. Never invent places, prices, or facilities.
- Never claim weather, facilities or conditions are verified. Describe figures as estimates.
- Be concise, calm and practical; write for a traveller, not an engineer.
- Output STRICT JSON only — no prose, no markdown fences.

Return exactly this JSON shape:
{"headline": string, "summary": string, "actions": string[], "cautions": string[], "accessibilityNote": string}

- "headline": one short line naming the destination and its simulated status.
- "summary": 2–4 sentences interpreting the twin state and the cascading effects.
- "actions": 3–5 concrete, prioritised recommendations.
- "cautions": 2–4 things to verify or watch for.
- "accessibilityNote": one sentence on step-free/low-walking considerations.`;

function userPrompt(context: AdvisorContext): string {
  return `Digital-twin state (JSON):\n${JSON.stringify(
    context,
  )}\n\nProduce the advisory now as strict JSON in the required shape.`;
}

/** Extracts the first JSON object from a model response. */
function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  const candidates = [cleaned];
  if (first >= 0 && last > first) candidates.push(cleaned.slice(first, last + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

/** Low-level chat call. Never throws. */
export async function requestNugenChat({
  system,
  user,
  maxTokens = 800,
  temperature = 0.2,
}: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<NugenResult> {
  const apiKey = process.env.NUGEN_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      failure: { kind: "not_configured", detail: "NUGEN_API_KEY missing" },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const model = nugenModel();

  try {
    const response = await fetch(`${nugenBaseUrl()}/inference/chat/completions`, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system, name: "wayfare-twin-advisor" },
          { role: "user", content: user },
        ],
        max_tokens: maxTokens,
        temperature,
        stream: false,
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      return {
        ok: false,
        failure: {
          kind: "unavailable",
          detail: `nugen ${response.status}: ${raw.slice(0, 160)}`,
        },
      };
    }

    let payload: {
      choices?: { message?: { content?: unknown }; text?: unknown }[];
      error?: unknown;
    };
    try {
      payload = JSON.parse(raw);
    } catch {
      return {
        ok: false,
        failure: { kind: "invalid_response", detail: "nugen returned non-JSON" },
      };
    }

    if (payload.error) {
      return {
        ok: false,
        failure: {
          kind: "unavailable",
          detail: `nugen error: ${String(payload.error).slice(0, 160)}`,
        },
      };
    }

    const content =
      payload.choices?.[0]?.message?.content ?? payload.choices?.[0]?.text;

    if (typeof content !== "string" || content.trim().length === 0) {
      return {
        ok: false,
        failure: { kind: "invalid_response", detail: "nugen returned empty content" },
      };
    }

    return { ok: true, model, text: content };
  } catch (error) {
    const aborted =
      error instanceof Error &&
      (error.name === "AbortError" || /aborted/i.test(error.message));
    return {
      ok: false,
      failure: {
        kind: aborted ? "timeout" : "unavailable",
        detail: aborted ? "nugen request timed out" : "nugen network error",
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export type AdvisorResult = {
  source: "nugen" | "fallback";
  model: string | null;
  advice: NugenAdvice;
  note?: string;
};

/**
 * High-level: generate domain advice for a twin state via the Nugen-aligned
 * model, falling back to deterministic advice if anything goes wrong.
 */
export async function generateAdvisorAdvice(
  context: AdvisorContext,
): Promise<AdvisorResult> {
  if (!isNugenConfigured()) {
    return {
      source: "fallback",
      model: null,
      advice: fallbackAdvice(context),
      note: "NUGEN_API_KEY is not configured — showing prototype advice.",
    };
  }

  const result = await requestNugenChat({
    system: NUGEN_DOMAIN_SYSTEM_PROMPT,
    user: userPrompt(context),
  });

  if (!result.ok) {
    console.warn("[nugen] inference failed:", result.failure.kind, result.failure.detail);
    return {
      source: "fallback",
      model: null,
      advice: fallbackAdvice(context),
      note: "Nugen inference is unavailable right now — showing prototype advice.",
    };
  }

  const parsed = extractJson(result.text);
  const validated = parsed ? adviceSchema.safeParse(parsed) : null;

  if (!validated || !validated.success) {
    return {
      source: "fallback",
      model: result.model,
      advice: fallbackAdvice(context),
      note: "The aligned model returned an unexpected format — showing prototype advice.",
    };
  }

  return { source: "nugen", model: result.model, advice: validated.data };
}
