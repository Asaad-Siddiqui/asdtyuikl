import "server-only";

/**
 * Server-only OpenRouter client.
 *
 * Security: this module reads OPENROUTER_API_KEY and is guarded by
 * `server-only`, so importing it from a client component is a build error.
 * The key never appears in any NEXT_PUBLIC_* variable and is never sent to the
 * browser.
 *
 * Reliability: OpenRouter's free tier is a shared pool that is often congested.
 * Rather than walking models one at a time (which can mean a minute of dead
 * waiting), we race them with a short stagger — the configured primary model
 * starts first, backups follow a couple of seconds behind. The first model to
 * return parseable JSON wins and the rest are aborted, so latency tracks the
 * fastest healthy provider instead of the slowest.
 */

export type OpenRouterFailureKind =
  | "not_configured"
  | "rate_limit"
  | "timeout"
  | "unavailable"
  | "invalid_json";

export type OpenRouterFailure = {
  kind: OpenRouterFailureKind;
  /** Technical detail — logged server-side only, never shown to the user. */
  detail: string;
};

export type OpenRouterResult =
  | { ok: true; model: string; json: unknown; text: string }
  | { ok: false; failure: OpenRouterFailure };

const DEFAULT_MODEL = "google/gemma-4-26b-a4b-it:free";

/** Hard ceiling for the whole race. */
const OVERALL_DEADLINE_MS = 50_000;
/** Per-attempt network timeout. */
const ATTEMPT_TIMEOUT_MS = 34_000;
/** Head start for the primary model before backups join the race. */
const STAGGER_MS = 2_500;
/** Backoff before one quick retry of a rate-limited model. */
const RETRY_DELAY_MS = 1_200;

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export function primaryModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
}

/**
 * The model chain: the configured primary first (the project mandates
 * `google/gemma-4-26b-a4b-it:free`), then explicitly approved backups.
 */
export function modelChain(): string[] {
  const chain = [primaryModel()];
  const extra = (process.env.OPENROUTER_FALLBACK_MODELS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  for (const model of extra) {
    if (!chain.includes(model)) chain.push(model);
  }
  return chain;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Pulls the first JSON object out of a model response. Models frequently wrap
 * JSON in markdown fences or leak chain-of-thought prose before the payload,
 * so we slice from the first `{` to the last `}` rather than trusting the
 * whole string.
 */
/**
 * Last-resort repair for output cut off by a token limit: closes any open
 * string and bracket so a truncated but otherwise well-formed payload can
 * still be salvaged instead of being thrown away.
 */
function closeTruncatedJson(input: string): string {
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (const char of input) {
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{" || char === "[") stack.push(char);
    else if (char === "}" || char === "]") stack.pop();
  }

  if (!inString && stack.length === 0) return input;

  let out = inString ? input : input.replace(/[,:\s]+$/, "");
  if (inString) out += '"';
  while (stack.length > 0) {
    const open = stack.pop();
    out += open === "{" ? "}" : "]";
  }
  return out;
}

/**
 * Pulls the first JSON object out of a model response. Models frequently wrap
 * JSON in markdown fences, leak chain-of-thought prose before the payload, or
 * get cut off by a token limit, so we try several strategies rather than
 * trusting the whole string.
 */
export function extractJson(text: string): unknown {
  if (typeof text !== "string") return null;
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  const candidates: string[] = [cleaned];
  if (first >= 0 && last > first) candidates.push(cleaned.slice(first, last + 1));
  if (first >= 0) {
    const sliced = cleaned.slice(first);
    candidates.push(closeTruncatedJson(sliced));
    candidates.push(closeTruncatedJson(cleaned));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

type AttemptOutcome =
  | { kind: "ok"; text: string }
  | { kind: "failed"; failure: OpenRouterFailure };

async function attempt(
  model: string,
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number,
  temperature: number,
  controller: AbortController,
): Promise<AttemptOutcome> {
  const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
  };
  const siteUrl = process.env.OPENROUTER_SITE_URL;
  const appName = process.env.OPENROUTER_APP_NAME;
  if (siteUrl) headers["http-referer"] = siteUrl;
  if (appName) headers["x-title"] = appName;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: maxTokens,
          // Reasoning models burn most of their budget on hidden
          // chain-of-thought and then truncate the JSON. OpenRouter ignores
          // this for models that don't reason.
          reasoning: { enabled: false },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      },
    );

    const raw = await response.text();

    if (!response.ok) {
      const kind: OpenRouterFailureKind =
        response.status === 429 ? "rate_limit" : "unavailable";
      return { kind: "failed", failure: { kind, detail: `${model} ${response.status}` } };
    }

    let payload: {
      choices?: { message?: { content?: unknown; reasoning?: unknown } }[];
      error?: { message?: unknown };
    };
    try {
      payload = JSON.parse(raw);
    } catch {
      return {
        kind: "failed",
        failure: { kind: "unavailable", detail: `${model} non-JSON body` },
      };
    }

    if (payload.error) {
      return {
        kind: "failed",
        failure: {
          kind: "unavailable",
          detail: `${model} error: ${String(payload.error.message ?? "").slice(0, 120)}`,
        },
      };
    }

    const message = payload.choices?.[0]?.message;
    let content = message?.content;
    // Reasoning models occasionally leave `content` empty and put the answer
    // in `reasoning`; prefer content, fall back to reasoning.
    if (
      (typeof content !== "string" || content.trim().length === 0) &&
      typeof message?.reasoning === "string"
    ) {
      content = message.reasoning;
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      return {
        kind: "failed",
        failure: { kind: "unavailable", detail: `${model} empty content` },
      };
    }

    return { kind: "ok", text: content };
  } catch (error) {
    const aborted =
      error instanceof Error &&
      (error.name === "AbortError" || /aborted/i.test(error.message));
    return {
      kind: "failed",
      failure: {
        kind: aborted ? "timeout" : "unavailable",
        detail: aborted ? `${model} timed out` : `${model} network error`,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

type Winner = { model: string; text: string; json: unknown };

/**
 * Runs one model, retrying a rate limit once, and resolves with a winner or
 * null. Never rejects.
 */
async function raceModel({
  model,
  delayMs,
  apiKey,
  system,
  user,
  maxTokens,
  temperature,
  controllers,
  hasWon,
}: {
  model: string;
  delayMs: number;
  apiKey: string;
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
  controllers: Set<AbortController>;
  hasWon: () => boolean;
}): Promise<Winner | null> {
  if (delayMs > 0) await sleep(delayMs);
  if (hasWon()) return null;

  for (let round = 0; round < 2; round += 1) {
    if (hasWon()) return null;

    const controller = new AbortController();
    controllers.add(controller);
    const outcome = await attempt(
      model,
      apiKey,
      system,
      user,
      maxTokens,
      temperature,
      controller,
    );
    controllers.delete(controller);

    if (outcome.kind === "ok") {
      const json = extractJson(outcome.text);
      if (json !== null) return { model, text: outcome.text, json };
      console.warn(`[openrouter] ${model} returned unparseable JSON`);
      return null;
    }

    console.warn(
      `[openrouter] ${model} failed:`,
      outcome.failure.kind,
      outcome.failure.detail,
    );

    // Only a fast 429 is worth retrying; a timeout or outage is not.
    if (outcome.failure.kind !== "rate_limit") return null;
    if (round === 0) await sleep(RETRY_DELAY_MS);
  }

  return null;
}

/**
 * Sends a JSON-only chat request and returns the parsed object from whichever
 * model in the chain answers first.
 */
export async function requestJson({
  system,
  user,
  maxTokens = 3200,
  temperature = 0.4,
}: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<OpenRouterResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      failure: { kind: "not_configured", detail: "OPENROUTER_API_KEY missing" },
    };
  }

  const chain = modelChain();
  const controllers = new Set<AbortController>();
  let won = false;

  const winner = await new Promise<Winner | null>((resolve) => {
    let pending = chain.length;
    let settled = false;

    const finish = (value: Winner | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const overall = setTimeout(() => {
      console.warn("[openrouter] overall deadline reached");
      finish(null);
    }, OVERALL_DEADLINE_MS);

    chain.forEach((model, index) => {
      void raceModel({
        model,
        delayMs: index * STAGGER_MS,
        apiKey,
        system,
        user,
        maxTokens,
        temperature,
        controllers,
        hasWon: () => settled,
      })
        .then((result) => {
          pending -= 1;
          if (result) {
            won = true;
            clearTimeout(overall);
            finish(result);
            return;
          }
          if (pending === 0) {
            clearTimeout(overall);
            finish(null);
          }
        })
        .catch(() => {
          pending -= 1;
          if (pending === 0) {
            clearTimeout(overall);
            finish(null);
          }
        });
    });
  });

  // Stop every in-flight request once we have an answer.
  for (const controller of controllers) controller.abort();
  controllers.clear();

  if (winner && won) {
    return { ok: true, model: winner.model, json: winner.json, text: winner.text };
  }

  return {
    ok: false,
    failure: {
      kind: "unavailable",
      detail: `no model in chain answered (${chain.join(", ")})`,
    },
  };
}
