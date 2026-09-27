# Task 2 — Nugen Intelligence (Domain-Aligned AI Model)

> **Status:** ✅ Implemented and integrated into the working project.
> **Where it runs:** server-only, via `POST /api/ai/advisor`.
> **Where users see it:** **Nugen AI Advisor** panel on the Digital Twin page (`/twin`).
> **Compulsory requirement:** use Nugen to *customize/align* an AI model and use
> the aligned model for inference — not a generic model or a plain API call.

This document is the full knowledge base for Task 2: the required pipeline, how
each part is satisfied, the exact files and API contract, the alignment design,
how to demo it, and its honest limitations.

---

## 1. What the task requires

The mandatory pipeline:

```
Base AI Model  →  Nugen Alignment/Customization  →  Domain-Specific Model  →  Integration into the project
```

"Simply using a generic AI model or making a basic API call will not satisfy this
requirement." The customization must be **relevant to the problem statement** and
**contribute meaningfully** to the solution.

- Sign up: https://nugen.in/signup?invite=PILLAIUNIV2026
- Cookbook: https://github.com/nugen-in/nugen-cookbook
- Docs: https://docs.nugen.in

Reference inference call (from the brief):

```python
url = "https://api.nugen.in/api/v3/inference/chat/completions"
payload = {
  "max_tokens": 500,
  "model": "qwen-v2p5-0p5b-instruct",
  "messages": [{"role": "system", "content": "...", "name": "test"}],
  "stream": True,
  "temperature": 0.1
}
headers = {"Authorization": "Bearer <NUGEN_API_KEY>", "Content-Type": "application/json"}
```

---

## 2. How we satisfy it (pipeline mapping)

| Stage | In our project |
|-------|----------------|
| **Base AI model** | `NUGEN_MODEL` — default `qwen-v2p5-0p5b-instruct` (a Nugen-hosted base model). |
| **Nugen alignment / customization** | Two-layer: (a) a **custom/aligned model id** created on the Nugen platform can be dropped into `NUGEN_MODEL`, and (b) a **strict domain system prompt** encodes the task-specific persona, priorities, honesty rules and JSON contract (`NUGEN_DOMAIN_SYSTEM_PROMPT`). |
| **Domain-specific model** | "Wayfare Digital-Twin Travel Advisor" — reasons about weather cascading through accessible, low-impact Indian hospitality & travel. |
| **Integration** | `POST /api/ai/advisor` (server-only) is called by the **Nugen AI Advisor** panel on `/twin`, consuming the live Digital Twin state (Task 1) and returning structured advice. |

The customization is **relevant** (it speaks the same weather/accessibility/crowd
vocabulary the app already uses) and **contributes meaningfully** (it turns a raw
simulation into traveller-ready guidance).

---

## 3. Architecture & data flow

```
 Digital Twin (Task 1)                                  Nugen Intelligence
 ─────────────────────                                  ──────────────────
 selected entity + scenario + conditions
 + twin state (metrics, propagation, predictions)
 + live weather + social signals
            │
            ▼
   buildAdvisorContext()   (client, twin-advisor.ts)
            │  AdvisorContext JSON
            ▼
   NugenAdvisor.tsx  ──POST──▶  /api/ai/advisor   (server, nodejs)
            │                         │
            │                         ▼
            │                 generateAdvisorAdvice()
            │                         │
            │                 requestNugenChat()  ──▶ https://api.nugen.in/api/v3/inference/chat/completions
            │                         │                 (Base model + aligned system prompt)
            │                         ▼
            │                 extract JSON → zod `adviceSchema`
            │                         │
            │              ok?  ──▶ source: "nugen"  (model id)
            │              fail? ─▶ source: "fallback" (deterministic advice + note)
            ▼
   renders headline / summary / actions / cautions / accessibilityNote
```

Key security property: **the Nugen key never leaves the server.** `src/lib/nugen.ts`
is guarded by `server-only`, so importing it from a client component is a build
error; the browser only ever talks to our own `/api/ai/advisor`.

---

## 4. Files & responsibilities

| File | Responsibility |
|------|----------------|
| `src/lib/nugen.ts` | **Server-only** Nugen client. Domain system prompt, `requestNugenChat()`, `generateAdvisorAdvice()`, timeouts, fallback. Reads `NUGEN_API_KEY`. |
| `src/lib/twin-advisor.ts` | **Client-safe** domain layer: `AdvisorContext` builder, strict `adviceSchema` (zod), `NugenAdvice` type, deterministic `fallbackAdvice()`. |
| `src/app/api/ai/advisor/route.ts` | `POST /api/ai/advisor` — session-scoped; sanitizes the context; runs the aligned model; always returns advice. |
| `src/components/twin/NugenAdvisor.tsx` | The **Nugen AI Advisor** panel (button, loading, results, source badge). |
| `src/components/twin/DigitalTwinView.tsx` | Builds the `AdvisorContext` from the selected entity + twin state + scenario and renders the panel. |
| `.env.example` | Documents the `NUGEN_*` variables (template only, no secrets). |

---

## 5. Environment setup

Add to `.env.local` (gitignored — **never commit real keys**):

```bash
NUGEN_API_KEY=<your-nugen-key>
NUGEN_MODEL=qwen-v2p5-0p5b-instruct
NUGEN_BASE_URL=https://api.nugen.in/api/v3
```

- `NUGEN_MODEL` accepts either a Nugen base model **or** the id of your
  customised/aligned model created on the Nugen platform.
- Nothing is `NEXT_PUBLIC_*`; the key is read only inside `src/lib/nugen.ts`.

> If `NUGEN_API_KEY` is absent, the feature still works: the API returns the
> labelled **Prototype fallback** advice and the panel says so. This keeps the
> demo honest and unbreakable.

---

## 6. API contract — `POST /api/ai/advisor`

**Auth:** session required (401 otherwise).

**Request body**

```jsonc
{
  "context": {
    "destination": "Matheran",
    "region": "Maharashtra",
    "scenario": "Monsoon downpour",
    "conditions": { "rainfallMm": 38, "tempC": 24, "windKph": 35, "durationHours": 18 },
    "severity": 0.89,
    "status": "Severe",
    "metrics": [{ "label": "Movement & travel ease", "value": 25, "baseline": 100 }, ...],
    "propagation": [{ "order": 1, "from": "Weather", "to": "Outdoor demand", "effect": "...", }, ...],
    "predictions": [{ "label": "Outdoor visitor footfall", "low": -118, "high": -51, "unit": "%" }, ...],
    "weather": { "condition": "Rain", "tempC": 24, "precipitationMm": 38, "source": "open-meteo" },
    "socialSignals": [{ "source": "reddit", "title": "Heavy rain near Matheran", "sentiment": "negative" }]
  }
}
```

Every field is sanitized and length-capped server-side before use.

**Response (success)**

```jsonc
{
  "ok": true,
  "source": "nugen",            // or "fallback"
  "model": "qwen-v2p5-0p5b-instruct",
  "advice": {
    "headline": "Matheran: Severe under monsoon downpour conditions",
    "summary": "…2–4 sentences interpreting the twin state…",
    "actions": ["…3–5 prioritised actions…"],
    "cautions": ["…2–4 things to verify…"],
    "accessibilityNote": "…one sentence on step-free / low-walking…"
  },
  "note": "…present only when the fallback was used…"
}
```

The response always contains a usable `advice` object — the endpoint never fails
on provider trouble.

---

## 7. The alignment design (what makes it "domain-specific")

Two complementary mechanisms:

### 7.1 Platform alignment (recommended for the judges)

On the Nugen platform, create a **customised/aligned model** from a base model
using domain data, then set `NUGEN_MODEL` to its id. A ready-to-use dataset for
this domain is a set of `(twin-context JSON → advisory JSON)` pairs — the exact
shape `AdvisorContext` / `NugenAdvice` already use, so training samples are easy
to generate from the app itself.

Suggested steps:
1. Sign up at the invite link and open the Nugen dashboard.
2. Pick a base model (e.g. `qwen-v2p5-0p5b-instruct`).
3. Create an alignment/customization job with domain samples (accessible travel,
   weather impact, low-impact choices, JSON output contract).
4. Deploy it and copy the **aligned model id**.
5. Set `NUGEN_MODEL=<aligned-model-id>` in `.env.local`.

### 7.2 Prompt-level alignment (always active)

`NUGEN_DOMAIN_SYSTEM_PROMPT` fixes:

- **Persona** — Wayfare's Digital-Twin Travel Advisor for accessible, low-impact
  hospitality & travel in India.
- **Reasoning** — weather → demand (outdoor/indoor), movement, capacity,
  operations, accessibility, crowding, sustainability.
- **Priorities** — accessibility and low-impact, less-crowded options first.
- **Honesty rules** — use only the given state; never invent places/prices;
  everything is an estimate; never claim verification.
- **Output contract** — strict JSON: `headline`, `summary`, `actions[]`,
  `cautions[]`, `accessibilityNote`.

The returned JSON is validated with **zod** (`adviceSchema`); anything off-spec is
rejected and replaced with the deterministic fallback.

---

## 8. Fallback behaviour

`generateAdvisorAdvice()` returns deterministic, domain-specific advice (built
from the twin metrics) when:

- `NUGEN_API_KEY` is not configured → note: *"NUGEN_API_KEY is not configured…"*;
- the request times out or errors → note: *"Nugen inference is unavailable…"*;
- the model returns unparseable/off-schema output → note: *"…unexpected format…"*.

The UI always shows which path was taken via the badge: **Nugen: <model>** or
**Prototype fallback**. Nothing is ever faked as live model output.

---

## 9. Demo script

1. Open `/twin`.
2. Scroll to the **Nugen AI Advisor** panel (below the metrics / propagation /
   predictions grid).
3. Change the scenario (e.g. click **Cyclone**) and press **Generate advisory**.
4. Show the badge: **Nugen: qwen-v2p5-0p5b-instruct** (live) or
   **Prototype fallback** (if Nugen is unreachable), then read the headline,
   summary, prioritised actions, cautions and the accessibility note.
5. Point out that the same context is the Digital Twin's own simulated state — so
   the aligned model is genuinely part of the solution, not bolted on.

---

## 10. Verification performed

```bash
npm run typecheck   # clean
npm run lint        # 0 errors (pre-existing warnings only)
npm run build       # succeeds; /api/ai/advisor registered
```

Confirmed in the build output: `ƒ /api/ai/advisor`.

Endpoint check performed during development: the Nugen host resolves and the
route exists, but its upstream inference returned **502 Bad Gateway** at test
time — which is exactly why the client is built to fall back instead of failing.

---

## 11. Limitations & honesty

- The Nugen upstream can be temporarily unavailable (observed 502); the app
  degrades gracefully and clearly labels the fallback.
- The advisory is **AI guidance over a prototype simulation** — not a verified
  forecast, and not safety advice.
- A truly platform-trained aligned model depends on running the alignment job on
  Nugen (Section 7.1); the code is ready for its model id via `NUGEN_MODEL`.

---

## 12. Reuse

`requestNugenChat()` is generic: any other feature can call it server-side with
its own system prompt (e.g. to narrate a trip itinerary). The Digital-Twin advisor
is simply the best-fitting, most demonstrable integration point for this project.
