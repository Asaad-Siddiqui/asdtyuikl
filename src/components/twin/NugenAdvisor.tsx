"use client";

import { useState } from "react";

import Icon from "@/components/Icon";
import type { AdvisorContext, NugenAdvice } from "@/lib/twin-advisor";

type AdvisorState = {
  source: "nugen" | "fallback";
  model: string | null;
  advice: NugenAdvice;
  note?: string;
};

/**
 * Nugen AI Advisor.
 *
 * Runs the Nugen-aligned, domain-specific model over the current simulated twin
 * state and renders structured travel advice. The model is only ever invoked
 * server-side (via `/api/ai/advisor`); the browser never sees the API key.
 */
export default function NugenAdvisor({ context }: { context: AdvisorContext }) {
  const [state, setState] = useState<AdvisorState | null>(null);
  const [stateSignature, setStateSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The scenario changed — any previous advisory no longer matches this state.
  const signature = JSON.stringify(context);
  const stale = state !== null && stateSignature !== signature;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ context }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        advice?: NugenAdvice;
        source?: "nugen" | "fallback";
        model?: string | null;
        note?: string;
        error?: string;
      };
      if (!response.ok || !data.advice) {
        setError(data.error ?? "Could not generate advice just now.");
        return;
      }
      setState({
        source: data.source ?? "fallback",
        model: data.model ?? null,
        advice: data.advice,
        note: data.note,
      });
      setStateSignature(signature);
    } catch {
      setError("We couldn't reach the advisor. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="Nugen AI advisor" className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-forest-950">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-forest-50 text-forest-700">
              <Icon name="sparkles" className="h-4.5 w-4.5" />
            </span>
            Nugen AI Advisor
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600">
            A domain-aligned model that reads the simulated twin and writes an
            accessibility-first advisory. Nugen runs server-side; the key never
            reaches the browser.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-forest-200 bg-forest-50 px-2.5 py-1 text-[10px] font-bold text-forest-700">
            Nugen · aligned
          </span>
          {state && (
            <span
              className={
                state.source === "nugen"
                  ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800"
                  : "rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800"
              }
            >
              {state.source === "nugen" ? `Nugen: ${state.model}` : "Prototype fallback"}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void generate()}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-forest-800 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-forest-900 disabled:opacity-60"
      >
        <Icon name="leaf" className="h-4 w-4 text-emerald-300" />
        {loading
          ? "Generating advisory…"
          : state
            ? "Regenerate advisory"
            : "Generate advisory"}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      {stale && (
        <p className="mt-3 text-xs font-medium text-amber-700">
          The scenario changed — generate an advisory for the new conditions.
        </p>
      )}

      {state && !stale && (
        <div className="mt-4 space-y-4 rounded-2xl border border-forest-200 bg-forest-50/60 p-4">
          <div>
            <p className="text-sm font-bold text-forest-900">{state.advice.headline}</p>
            <p className="mt-1 text-sm leading-relaxed text-forest-900/90">
              {state.advice.summary}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-black tracking-wide text-forest-700 uppercase">
              Recommended actions
            </p>
            <ul className="mt-2 space-y-1.5">
              {state.advice.actions.map((action) => (
                <li
                  key={action}
                  className="flex items-start gap-2 text-xs leading-relaxed text-forest-900"
                >
                  <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" />
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {state.advice.cautions.length > 0 && (
            <div>
              <p className="text-[11px] font-black tracking-wide text-amber-700 uppercase">
                Cautions
              </p>
              <ul className="mt-2 space-y-1.5">
                {state.advice.cautions.map((caution) => (
                  <li
                    key={caution}
                    className="flex items-start gap-2 text-xs leading-relaxed text-amber-900"
                  >
                    <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    {caution}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {state.advice.accessibilityNote && (
            <p className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">
              <Icon name="accessibility" className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              {state.advice.accessibilityNote}
            </p>
          )}

          {state.note && <p className="text-[11px] text-amber-700">{state.note}</p>}
          <p className="text-[11px] leading-relaxed text-ink-400">
            AI-generated guidance over a prototype simulation — not a verified
            forecast or safety advice. Confirm details before travelling.
          </p>
        </div>
      )}
    </section>
  );
}
