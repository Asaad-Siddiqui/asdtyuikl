import "server-only";

/**
 * Optional AI layer.
 *
 * The product's core accessibility profile flow is fully deterministic and
 * works with no AI provider configured. When `AI_API_KEY` is present we ask an
 * OpenAI-compatible chat endpoint for a short, friendly note. Any failure
 * (missing key, timeout, bad response, offline) resolves to `null` so callers
 * fall back to built-in copy.
 */

export type AssistantRequest = {
  /** Short description of what the traveller just completed. */
  step: string;
  /** Human-readable summaries of what they selected. */
  selections: string[];
};

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

export async function generateAssistantNote(
  request: AssistantRequest,
): Promise<string | null> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/+$/,
    "",
  );
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 90,
        messages: [
          {
            role: "system",
            content:
              "You are a warm, concise travel accessibility assistant. Reply with one short sentence (max 25 words), no greetings, no emoji.",
          },
          {
            role: "user",
            content: `The traveller just completed: ${request.step}. They selected: ${
              request.selections.length ? request.selections.join(", ") : "nothing yet"
            }. Acknowledge it briefly and helpfully.`,
          },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string") return null;

    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
