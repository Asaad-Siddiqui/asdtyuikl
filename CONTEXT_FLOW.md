# CONTEXT_FLOW.md — Feature Context, Flow & Demo Guide

This file is the single place to see **what has been added**, **where it lives**,
and **how to demo and pitch it**. Every checklist item below is implemented and
wired into the existing Travello / Wayfare solution — nothing is a standalone
mock-up.

> Naming note: the public marketing shell is branded **Travello**, and the
> accessibility-profile + trip-planning engine is branded **Wayfare**. They are
> one app sharing one database and one catalogue.

---

## 1. Checklist status

| # | Feature | Status | Primary surface |
|---|---------|--------|-----------------|
| 1 | Senior + Accessibility mode | ✅ Done | Explore (`/explore`), Destination Hub (`/explore/[id]`) |
| 2 | Crowd-aware recommendations | ✅ Done | Dashboard (`/dashboard`), Explore |
| 3 | Less-crowded alternatives | ✅ Done | Destination Hub (`/explore/[id]`) |
| 4 | Travel Together / Group matching | ✅ Done | Planner confirm step (`/plan`), Saved trip (`/trips/[id]`) |
| 5 | Carbon savings from grouping | ✅ Done | Same as #4 |
| 6 | Weather-Driven Digital Twin | ✅ Done | Digital Twin (`/twin`), weather strip on Destination Hub |
| 7 | Nugen Intelligence (aligned model) | ✅ Done | Digital Twin (`/twin`) — "Nugen AI Advisor" panel |

---

## 2. Added features — detail

### 2.1 Shared engines (the brain)

| File | Purpose |
|------|---------|
| `src/lib/recommend.ts` | Senior/accessibility scoring, crowd ranking, crowd-aware picks, less-crowded-alternative resolver. Pure + client-safe. |
| `src/lib/group-matching.ts` | Seeded companion profiles, group matching, and the transparent carbon-savings-from-grouping model. |
| `src/lib/digital-twin.ts` | The Digital Twin engine: severity vector, cascading propagation, probabilistic predictions. Pure + client-safe. |
| `src/lib/weather.ts` | Keyless Open-Meteo client (live + forecast) with a labelled sample fallback. |
| `src/lib/social-signals.ts` | Keyless Reddit + Mastodon social signals with sentiment + relevance, and a sample fallback. |
| `src/lib/geo.ts` | Approximate coordinates for destinations/cities (map + weather). |
| `src/lib/twin-entities.ts` | Adapter from the Travello catalogue's `Destination` to a `TwinEntity`. |
| `src/components/travello/SeniorModeToggle.tsx` | Persistent Senior + Accessibility mode (localStorage + window event so screens stay in sync). |
| `src/components/GroupMatchPanel.tsx` | Reusable "Travel Together" panel (companions + carbon saved). |
| `src/components/twin/DigitalTwinView.tsx` | The `/twin` client orchestrator (simulation, refresh, layout). |
| `src/components/twin/DigitalTwinMap.tsx` | Leaflet + OpenStreetMap map with impact-coloured markers and propagation rings. |
| `src/components/twin/TwinControls.tsx` | What-if presets + sliders for rainfall, temperature, wind and storm duration. |
| `src/components/twin/WeatherStrip.tsx` | Server-rendered live weather + twin outlook for a destination hub. |

Everything reads the **same catalogue fields** the app already stores:
`destination.crowdLevel`, `destination.visitorPressure`,
`destination.accessibility.*`, `attraction.crowdLevel`,
`attraction.accessibilityScore`, `attraction.alternativeId`. No new tables or
migrations were required.

---

### 2.2 Senior + Accessibility mode  ✅

**What it does.** One switch flips the catalogue into a reduced-mobility view.
It ranks destinations by a 0–100 senior/accessibility score built from step-free
routes, low walking distance, accessible toilets, wheelchair access, lifts and
accessible parking — and shows *why* via reasons and cautions.

**Where it lives**
- `src/lib/recommend.ts` → `seniorAccessibility()`, `isSeniorFriendly()`, `rankForSeniorMode()`
- `src/components/travello/SeniorModeToggle.tsx` → the toggle + `useSeniorMode()` hook
- `src/components/travello/pages/DestinationsPage.tsx` → toggle + re-ranking + count
- `src/components/travello/pages/DestinationHubPage.tsx` → "Senior & Accessibility" verdict panel
- `src/components/travello/DestinationCard.tsx` → "Senior-friendly" badge on qualifying cards

**How to demo**
1. Open `/explore`. Toggle **Senior + Accessibility** (top of the page).
2. The grid re-orders to step-free, low-walking places first, badges appear, and
   the helper line reports how many are senior-friendly.
3. Open any destination → the **Senior & Accessibility** panel shows the score,
   reasons and cautions, plus the crowd outlook.
4. Refresh or navigate away and back — the mode **persists**.

**Pitch line.** *"One switch turns the whole catalogue into a reduced-mobility
view — no digging through filters, and every result explains itself."*

---

### 2.3 Crowd-aware recommendations  ✅

**What it does.** Ranks destinations by how busy they are *right now*
(`crowdLevel` → `visitorPressure` → eco-score) and states the calmest visit
window. Crowded places are never presented as a recommendation.

**Where it lives**
- `src/lib/recommend.ts` → `crowdAwarePicks()`, `bestVisitWindow()`, `crowdStatus()`, `crowdTone()`
- `src/components/travello/TravellerOverview.tsx` → **"Crowd-Aware Picks"** panel on `/dashboard`
- `src/components/travello/pages/DestinationsPage.tsx` → **"Least crowded first"** sort

**How to demo**
1. Open `/dashboard` → scroll to **Crowd-Aware Picks**. Each row shows a
   Calm/Busy/Peak chip, the reason, and the best window.
2. On `/explore`, press **Least crowded first** to sort the grid.

**Pitch line.** *"Recommendations know how busy a place is right now and steer
you to the calm window — or away from a place that's at capacity."*

---

### 2.4 Less-crowded alternatives  ✅

**What it does.** Instead of only flagging a place as "crowded", it suggests a
genuinely calmer option: first the curated `alternativeId` link (if calmer),
otherwise the lowest-crowd attraction in the same destination — with the
estimated % fewer people and any accessibility trade-off.

**Where it lives**
- `src/lib/recommend.ts` → `lessCrowdedAlternative()`
- `src/components/travello/pages/DestinationHubPage.tsx` → **"Attractions & Crowd Outlook"** section (this section did not exist before)
- `src/components/travello/DestinationCard.tsx` → "Less-crowded picks inside →" hint on busy cards

**How to demo**
1. Open `/explore/matheran`.
2. In **Attractions & Crowd Outlook**, Echo Point (High crowd) shows a green
   **"Less-crowded alternative → Charlotte Lake & Forest Trail"** callout with
   the estimate.

**Pitch line.** *"We don't just warn you it's crowded — we hand you the quieter
version and show the math."*

---

### 2.5 Travel Together / Group matching  ✅

**What it does.** Matches the traveller with compatible companions heading the
same way on overlapping dates who share the same needs. Order of matching:
same destination + overlapping dates (required) → shared needs → same origin.
Everyone in a group shares **the exact same confirmed itinerary**.

**Where it lives**
- `src/lib/group-matching.ts` → `GROUP_TRAVELERS`, `matchGroupTravelers()`, `travellerCount()`
- `src/components/GroupMatchPanel.tsx` → the panel
- `src/components/TripPlanner.tsx` → rendered in `DetailView` (the confirm step)
- `src/components/TripResultView.tsx` → rendered on `/trips/[id]`

**How to demo**
1. Go to `/plan` and press **Continue** through the pre-filled questions.
2. On the detailed itinerary, find **Travel Together** before *Confirm itinerary*.
3. With the demo answers (Mumbai → Mahabaleshwar, 2 adults + mobility support,
   ~21 days out) it matches 3 companions. Click **Request to travel together**
   (demo only — states no real traveller is contacted).

**Pitch line.** *"Our planner already knows your route and your needs. Travel
Together finds people on the same route and dates and gives you one shared
itinerary."*

---

### 2.6 Carbon savings from grouping  ✅

**What it does.** Estimates the CO₂ avoided when a group travels as one plan
instead of separately, using the same emission factors as the itinerary.
- Private modes (car / EV): one shared vehicle split across the group instead of
  one per person.
- Mass transit: a documented coordination saving (~15%, 30% for mixed).
- Always shown with `separate → together`, the %, and the calculation basis.

**Where it lives**
- `src/lib/group-matching.ts` → `groupCarbonSavings()`
- Displayed inside `src/components/GroupMatchPanel.tsx` (the green highlight card)

**How to demo.** Same place as 2.5 — the green **"Carbon saved by grouping"**
card shows the kg saved, the percentage, and the basis line.

**Pitch line.** *"The payoff is measurable: consolidating travellers onto one
plan cuts the journey's estimated CO₂ — and we show the calculation."*

---

## 3. How to run & verify

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit
npm run lint
npm run build
```

**Honesty caveats to state in any pitch (this project deliberately labels estimates):**
- Companion profiles are **seeded prototype data**, labelled "Prototype companions".
- Crowd "% fewer people" and CO₂ savings are **prototype estimates**, not verified measurements.
- "Request to travel together" is a **demo interaction** — no real traveller is contacted.

---

## 4. Weather-Driven Digital Twin  ✅

**What it does.** A continuously-updating simulation layer over the *existing*
Travello ecosystem. It does not replace any feature — it models how weather
propagates through the destinations, attractions, stays and transport the app
already manages, then feeds those insights back into its recommendations.

**How it works**
1. **Severity vector** — rain, wind, heat, cold and duration are normalised to
   0–1 and combined (`weatherSeverity()`), weighted by each destination's terrain
   (coastal / hill / mountain / plantation, inferred from catalogue tags).
2. **Direct effects** — outdoor demand, movement, capacity and operations move
   first.
3. **Cascading effects** — displaced crowds raise indoor demand → crowd pressure;
   rain on slopes raises accessibility risk; flooding erodes capacity and
   sustainability; movement + capacity loss tighten availability. Each link is a
   `TwinPropagation` step tagged direct / secondary / higher-order with a
   magnitude.
4. **Probabilistic predictions** — footfall, indoor demand, on-time arrivals and
   stay availability as **ranges** (`low`–`high`) with a confidence that falls as
   severity rises.
5. **Feed-back into the app** — recommendations reference the earlier features
   (Senior + Accessibility mode, Crowd-Aware Picks, Less-crowded alternatives,
   Travel Together).

Everything is **deterministic** (same scenario → same twin state) and runs
client-side, so a what-if never touches the real system.

### Where it lives

| File / route | Role |
|--------------|------|
| `src/lib/digital-twin.ts` | `weatherSeverity()`, `simulateTwin()` (metrics, propagation, predictions), `twinSummary()`, `SCENARIO_PRESETS`. |
| `src/lib/weather.ts` | `fetchWeather()` via **Open-Meteo** (free, no key); `sampleWeather()` fallback. |
| `src/lib/social-signals.ts` | `fetchSocialSignals()` via **Reddit search JSON + Mastodon public timeline** (both keyless); sentiment + weather relevance; sample fallback. |
| `src/lib/geo.ts`, `src/lib/twin-entities.ts` | Coordinates and catalogue→twin mapping. |
| `src/app/api/weather/route.ts` | `GET /api/weather?lat=&lon=` (or `?place=`) — session-scoped live refresh. |
| `src/app/api/social-signals/route.ts` | `GET /api/social-signals?q=&tag=` — session-scoped social refresh. |
| `src/app/(app)/twin/page.tsx` | `/twin` — loads the catalogue + weather + socials server-side, renders the client twin. |
| `src/components/twin/DigitalTwinView.tsx` | Map + controls + metrics + propagation + predictions + weather + socials. |
| `src/components/twin/DigitalTwinMap.tsx` | Leaflet + OpenStreetMap map; impact-coloured markers, propagation ring. |
| `src/components/twin/TwinControls.tsx` | Presets + sliders (rainfall, temperature, wind, storm duration). |
| `src/components/twin/WeatherStrip.tsx` | Live weather + twin outlook embedded on each Destination Hub. |
| `src/components/travello/nav.ts` | New **Digital Twin** entry under the "More" menu. |

Dependency added: `leaflet` (+ `@types/leaflet`, dev). Tiles © OpenStreetMap
contributors.

### How to demo (mandatory requirements 1–4)

1. **Live weather (req 1)** — open `/twin`. The header badge reads
   **"● Live weather"** from Open-Meteo; each destination shows current
   conditions + a 5-day forecast. Press **Refresh live data** to pull again.
   (If the provider is unreachable — e.g. an offline judge box — the badge reads
   **"Sample weather"** and the UI says so. It never breaks.)
2. **Map visualization (req 2)** — the Leaflet/OpenStreetMap map shows every
   destination as an impact-coloured pin; click one to select it and see its
   propagation ring grow with simulated impact.
3. **Social signals (req 3)** — the **Real-world social signals** panel lists
   Reddit + Mastodon posts with sentiment and weather-relevance tags; it states
   **LIVE FEED** or **SAMPLE FEED**.
4. **What-if simulation (req 4)** — use **TwinControls**: pick a preset
   (Normal / Monsoon downpour / Heatwave / Cyclone / Cold snap) or drag rainfall,
   temperature, wind or storm duration. The map, metrics, cascading propagation,
   predictions and recommendations all update instantly — the real system is
   untouched.
5. **Integration with existing features** — on any Destination Hub
   (`/explore/[id]`) a **Live weather & twin outlook** strip shows what weather is
   doing to that place now, with a link into `/twin`.

### Try these exact scenarios

| Scenario | What to point out |
|----------|-------------------|
| **Cyclone** on Matheran (hill) | Movement and capacity collapse; accessibility risk spikes; crowd pressure rises as everyone funnels indoors. |
| **Heatwave** on Goa (coastal) | Outdoor demand falls, heat strain rises; recommendations push indoor + calm-window choices. |
| **Cold snap** on Manali (mountain) | Cold sensitivity dominates; mountain terrain amplifies accessibility risk. |
| **Monsoon** across all | Compare impact rings between coastal (flood-prone) and hill destinations. |

### Honesty caveats (state these)

- The Digital Twin is a **prototype simulation**; metrics, propagation strengths
  and prediction bands are model estimates from the catalogue + weather inputs,
  not verified forecasts.
- Locations are approximate city centroids; map tiles are OpenStreetMap.
- Open-Meteo, Reddit and Mastodon are **free / keyless**; when unreachable the
  app clearly labels the sample data instead of faking a live feed.

### Pitch line

*"Weather isn't a separate app for us — it's a simulation layer over the
solution we already built. Change the storm and watch demand, movement, capacity
and availability cascade through our destinations, then feed straight back into
the accessibility, crowd and group-planning features."*

---

## 5. Free / keyless services used

| Purpose | Service | Key needed? | Fallback |
|---------|---------|-------------|----------|
| Weather (live + forecast) | Open-Meteo | No | Labelled sample snapshot |
| Map tiles | OpenStreetMap | No | — |
| Map rendering | Leaflet (npm) | No | — |
| Social signals | Reddit search JSON | No | Labelled sample feed |
| Social signals | Mastodon public timeline | No | Labelled sample feed |
| Domain-aligned inference | Nugen Intelligence | Yes (`NUGEN_API_KEY`, server-only) | Deterministic prototype advice |

---

## 6. Nugen Intelligence — domain-aligned model (Task 2)

**What it does.** Runs a **domain-aligned** AI model over the Digital Twin's
simulated state to produce an accessibility-first travel advisory. The pipeline
is: **Base model → Nugen alignment → domain-specific model → inference in
Travello**, not a generic API call.

### Where it lives

| File / route | Role |
|--------------|------|
| `src/lib/nugen.ts` | Server-only Nugen client + **domain-alignment system prompt** + fallback. |
| `src/lib/twin-advisor.ts` | Client-safe `AdvisorContext` builder, strict `adviceSchema` (zod), deterministic fallback advice. |
| `src/app/api/ai/advisor/route.ts` | `POST /api/ai/advisor` — session-scoped; sanitizes context, runs the aligned model. |
| `src/components/twin/NugenAdvisor.tsx` | The **Nugen AI Advisor** panel on `/twin`. |
| `src/components/twin/DigitalTwinView.tsx` | Builds the context from the selected entity/twin state and renders the panel. |

### Alignment design

- **Base model** — `NUGEN_MODEL` (default `qwen-v2p5-0p5b-instruct`).
- **Customization layer** — a strict domain system prompt fixing the persona
  (accessible, low-impact Indian hospitality & travel Digital-Twin advisor), the
  honesty rules (no invented places/facilities, everything is an estimate), and
  the exact JSON output contract. The model can also be a **customised/aligned
  model id** created on the Nugen platform (set `NUGEN_MODEL` to it).
- **Inference** — server-only, time-boxed, never throws; falls back to
  deterministic domain advice labelled "Prototype fallback".

### Environment

```bash
# add to .env.local (gitignored — never commit)
NUGEN_API_KEY=<your-nugen-key>
NUGEN_MODEL=qwen-v2p5-0p5b-instruct
NUGEN_BASE_URL=https://api.nugen.in/api/v3
```

### How to demo

1. Open `/twin`. Under the metrics/propagation/predictions grid you'll find the
   **Nugen AI Advisor** panel.
2. Change the scenario (e.g. **Cyclone**) and press **Generate advisory**.
3. The panel shows the model badge (**Nugen: <model>** or **Prototype fallback**),
   a headline, a summary, prioritised actions, cautions and an accessibility note.

### Honesty notes

- The key is **server-only**; the browser never sees it.
- If Nugen is unreachable (its upstream can return 502), the panel clearly labels
  the deterministic fallback rather than faking live output.
- The advisory is AI guidance over a prototype simulation — not verified safety
  advice.
