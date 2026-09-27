# Task 1 — Weather-Driven Digital Twin (Hospitality & Travel)

> **Status:** ✅ Complete — implemented, typechecked, lint-clean and production-built.
> **App:** Travello / Wayfare (Next.js 16 App Router + React 19 + Neon/Drizzle + Tailwind v4).
> **New route:** `/twin` · **Embedded on:** every Destination Hub (`/explore/[id]`).

This document is the full knowledge base for Task 1: what the problem asked for,
how each requirement is met, how the engine works (with formulas), every file and
API involved, how to demo it, and its honest limitations.

> The solution also contains earlier supporting features (Senior + Accessibility
> mode, Crowd-aware recommendations, Less-crowded alternatives, Travel Together /
> Group matching, Carbon savings from grouping). They are documented in
> `CONTEXT_FLOW.md`; this file focuses on **Task 1 — the Weather-Driven Digital
> Twin**.

---

## 1. The problem statement (condensed)

Extend the existing HackCelestial solution with an **AI-driven Digital Twin** —
not a standalone weather app. It must:

1. Represent the real-world entities/resources/relationships the solution already
   manages and **continuously estimate how they behave under changing weather**.
2. Use **weather observations and forecasts** together with existing data.
3. **Identify direct and cascading effects**, and generate a continuously evolving
   virtual representation.
4. Enable **what-if / counterfactual scenarios** (rainfall intensity, temperature,
   storm duration, extreme heat, etc.).
5. Update as new data arrives, propagate changes across interconnected entities,
   identify **secondary and higher-order effects**, and give **probabilistic
   predictions with uncertainty**.
6. Demonstrate behaviour under **normal and extreme** weather without affecting the
   real system.

### Mandatory integration requirements

| # | Requirement | Met? |
|---|-------------|------|
| 1 | Live Weather Integration (real-time API as model input) | ✅ |
| 2 | Geospatial Map Visualization | ✅ |
| 3 | Real-World Social Signal Integration | ✅ |
| 4 | Digital Twin What-If Simulation (interactive) | ✅ |

---

## 2. Requirement → implementation map

| Requirement | Where | What it does |
|-------------|-------|--------------|
| **1. Live weather** | `src/lib/weather.ts`, `src/app/api/weather/route.ts` | Open-Meteo (free, **no API key**) current + 5-day forecast, normalised. Live badge + "Refresh live data". Falls back to a clearly-labelled sample snapshot. |
| **2. Geospatial map** | `src/components/twin/DigitalTwinMap.tsx` | Leaflet + OpenStreetMap (free, no key). Impact-coloured destination pins, click-to-select, propagation ring sized by simulated impact. |
| **3. Social signals** | `src/lib/social-signals.ts`, `src/app/api/social-signals/route.ts` | Reddit search JSON + Mastodon public timeline (both keyless), sentiment + weather-relevance tags, LIVE/SAMPLE badge, sample fallback. |
| **4. What-if simulation** | `src/lib/digital-twin.ts`, `src/components/twin/TwinControls.tsx`, `DigitalTwinView.tsx` | Presets (Monsoon / Heatwave / Cyclone / Cold snap) + sliders (rainfall, temperature, wind, storm duration). Re-simulates instantly, client-side, real system untouched. |

---

## 3. Architecture & data flow

```
                       ┌─────────────────────────────────────────────┐
  Open-Meteo (live) ──▶│  /twin  (server component)                   │
  Reddit + Mastodon ──▶│  • listDestinations()  (existing catalogue)  │
                       │  • fetchWeather()      (per destination)     │
                       │  • fetchSocialSignals()                      │
                       └───────────────┬─────────────────────────────┘
                                       │ props (entities, weather, socials)
                                       ▼
                       ┌─────────────────────────────────────────────┐
                       │  DigitalTwinView (client orchestrator)       │
                       │   conditions ──▶ simulateTwin(entity, cond)  │
                       │   for every entity  →  TwinState             │
                       └───────┬───────────────┬──────────────┬───────┘
                               │               │              │
                       DigitalTwinMap     TwinControls   Metrics / Propagation /
                       (Leaflet/OSM)      (sliders)      Predictions / Recs
                               │               │              │
                               └───────┬───────┴──────────────┘
                                       ▼
                       Refresh → /api/weather, /api/social-signals
                       (session-scoped, nodejs runtime)
```

**Key idea:** the twin **reads** the same catalogue the rest of the app renders
and **simulates** over it. Nothing in the real system is mutated — what-if runs
entirely in the browser.

---

## 4. The simulation engine (`src/lib/digital-twin.ts`)

Pure, deterministic, client-safe. Same inputs → same state (important so a demo
is reproducible).

### 4.1 Inputs

```ts
type TwinConditions = { rainfallMm: number; tempC: number; windKph: number; durationHours: number };
type TwinEntity     = { id, name, region, lat, lon, sustainabilityScore,
                        crowdLevel, visitorPressure, environmentalSensitivity,
                        accessibility{...}, tags };
```

### 4.2 Terrain profile (from catalogue `tags`)

Tags are mapped to sensitivities so the same storm behaves differently on a beach,
a hill station, a mountain and a plantation:

| Terrain (tags) | flood | slope | heat | cold | rainAppeal |
|---|---|---|---|---|---|
| coastal (`beach/coastal/island/backwater`) | 0.90 | 0.15 | 0.85 | 0.10 | 0.30 |
| mountain (`mountain/snow/alpine/himalaya`) | 0.50 | 0.90 | 0.40 | 0.95 | 0.40 |
| hill/forest (`hill/forest/walking/railway`) | 0.45 | 0.80 | 0.50 | 0.60 | 0.70 |
| plantation (`tea/plantation/spice/gardens`) | 0.55 | 0.55 | 0.60 | 0.10 | 0.70 |
| default | 0.40 | 0.40 | 0.60 | 0.10 | 0.40 |

### 4.3 Severity vector

```
rain     = clamp01(rainfallMm / 40)
wind     = clamp01(windKph / 70)
heat     = clamp01((tempC − 33) / 8)  × (0.6 + heatSensitivity × 0.6)
cold     = clamp01((8 − tempC) / 12)  × (0.6 + coldSensitivity × 0.6)
duration = clamp01(durationHours / 24)
peak     = max(rain, wind, heat, cold)
overall  = clamp01(peak × 0.7 + duration × 0.3)     ← the twin's severity
```

### 4.4 Metrics (0–100), with calm baseline

| Metric | Formula (abridged) | Meaning |
|--------|--------------------|---------|
| Outdoor demand | `72 × (1 − .85·rain − .5·heat − .4·cold − .3·wind) + rainAppeal·12·rain` | Outdoor attraction footfall |
| Indoor demand | `40 × (1 + .9·rain + .5·heat + .5·cold)` | Crowd displaced indoors |
| Movement | `100 × (1 − .55·rain·flood − .35·rain·slope − .5·wind − .1·heat)` | Travel ease |
| Capacity | `100 × (1 − .55·flood − .35·wind − .2·duration)` | Usable capacity |
| Operations | `100 × (1 − .45·overall − .25·duration − .15·wind)` | Staffing/operations |
| Availability | `100 × (1 − .45·(1−movement/100) − .35·(1−capacity/100))` | Stays/transport |
| Crowd pressure | `(0.7·crowdRank + 0.3·pressureRank) × 100 × (1 + .5·rain + .3·heat + .3·cold)` | Concentrated crowding |
| Sustainability risk | `sensitivityRank·55 + flood·30 + duration·15` | Waste/water/erosion |
| Accessibility risk | `baseRisk + rain·slope·45 + cold·20 + flood·15` | Step-free travel degraded |

`flood = clamp01(rain·floodSensitivity·0.7 + duration·floodSensitivity·0.3)`
`baseRisk = (1 − accessibilityScore/100)·60`, with `accessibilityScore` using the
same weights as the catalogue's senior-accessibility scoring.

Each metric is returned with its **value**, its **calm baseline**, a **direction**
and a plain-language description — so the UI never shows a bare number.

### 4.5 Cascading propagation (requirement 5)

Generated as ordered steps, each with `from → to`, an effect sentence and a
magnitude (0–1):

- **Order 1 (direct):** Weather → Outdoor demand; Weather → Movement.
- **Order 2 (secondary):** Outdoor demand → Indoor demand; Indoor shift → Crowd
  pressure; Rain & terrain → Accessibility.
- **Order 3 (higher-order):** Flooding & wind → Capacity; Movement & capacity →
  Availability; Flooding → Sustainability.

### 4.6 Probabilistic predictions

```
uncertainty = clamp01(0.12 + 0.28 × severity)
confidence  = 1 − uncertainty
spread      = |mean| × uncertainty + 2
band        = [mean − spread, mean + spread]
```

Predictions emitted: **Outdoor visitor footfall**, **Indoor venue demand**,
**On-time arrivals**, **Stay availability** — each as a `low`–`high` % change with
confidence. Uncertainty widens as the storm worsens.

### 4.7 Status bands & map impact

`Normal < 0.20 ≤ Watch < 0.45 ≤ Disrupted < 0.70 ≤ Severe`

`impact = clamp(severity × 70 + (1 − movement/100) × 30)` → drives marker colour
(green → amber → orange → red) and the propagation ring size.

### 4.8 Feed-back into existing features

The twin's recommendations deliberately reference the earlier product features:

- Movement low → *"Shift outdoor stops indoors and lean on Senior + Accessibility mode picks."*
- Crowd pressure high → *"Use Crowd-Aware Picks and travel in the calmest window."*
- Accessibility risk high → *"Check step-free routes on the destination hub."*
- Sustainability risk high → *"Prefer less-crowded alternatives on higher ground."*
- Severity high → *"Travelling as a group shares transport and splits weather risk."*

---

## 5. Live data integrations

### 5.1 Weather — Open-Meteo (free, **no key**)

Endpoint: `https://api.open-meteo.com/v1/forecast`
Params: `current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day`,
`hourly=...`, `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max`,
`timezone=auto`, `forecast_days=5`.
Normalised to `WeatherSnapshot { current, hourly[24], daily[5], source, note }`.
WMO codes are mapped to label + emoji. 3.5 s timeout; on failure returns
`sampleWeather()` with `source: "sample"` and a `note` — **never throws**.

### 5.2 Social signals — Reddit + Mastodon (both keyless)

- Reddit: `https://www.reddit.com/search.json?q=...&sort=new&limit=12` (descriptive User-Agent).
- Mastodon: `https://mastodon.social/api/v1/timelines/tag/<tag>?limit=12`.
- Fetched in parallel (`Promise.allSettled`), merged newest-first, capped at 12.
- Each signal gets **sentiment** (keyword-based) and **weatherRelevance** tags.
- If both fail → labelled sample feed (`source: "sample"`).

### 5.3 Geospatial reference (`src/lib/geo.ts`)

Approximate centroids for the seeded destinations + common trip cities; lookup
falls back to the centre of India. Used by the map and by weather fetches.

---

## 6. Files & responsibilities

| File | Responsibility |
|------|----------------|
| `src/lib/digital-twin.ts` | Engine: `weatherSeverity`, `simulateTwin`, `twinSummary`, `SCENARIO_PRESETS`, `DEFAULT_SCENARIO`. |
| `src/lib/weather.ts` | `fetchWeather()`, `sampleWeather()`, WMO code map. |
| `src/lib/social-signals.ts` | `fetchSocialSignals()`, sentiment/relevance, sample feed. |
| `src/lib/geo.ts` | `PLACE_COORDS`, `resolveCoords`, `coordsOrCenter`. |
| `src/lib/twin-entities.ts` | `destinationToTwinEntity()` — catalogue → twin adapter. |
| `src/app/(app)/twin/page.tsx` | Server page: load catalogue + weather + socials. |
| `src/app/api/weather/route.ts` | `GET /api/weather?lat=&lon=` (or `?place=`), session-scoped. |
| `src/app/api/social-signals/route.ts` | `GET /api/social-signals?q=&tag=`, session-scoped. |
| `src/components/twin/DigitalTwinView.tsx` | Client orchestrator (simulation, refresh, layout). |
| `src/components/twin/DigitalTwinMap.tsx` | Leaflet/OSM map, markers, propagation ring, legend. |
| `src/components/twin/TwinControls.tsx` | Presets + sliders. |
| `src/components/twin/WeatherStrip.tsx` | Server weather + twin outlook on the Destination Hub. |
| `src/components/travello/nav.ts` | "Digital Twin" nav entry. |
| `src/app/(app)/explore/[id]/page.tsx` | Renders the weather strip above the hub. |

**Dependency added:** `leaflet` (+ `@types/leaflet` dev). Tiles © OpenStreetMap
contributors.

---

## 7. API contracts

### `GET /api/weather`

| Param | Meaning |
|-------|---------|
| `lat`, `lon` | Coordinates (preferred). |
| `place` | Place name, resolved via `geo.ts`. |

Response: `{ ok: true, weather: WeatherSnapshot }`. Requires a session. Never
fails hard (sample fallback).

### `GET /api/social-signals`

| Param | Meaning |
|-------|---------|
| `q` | Search query (default `India travel weather`). |
| `tag` | Mastodon hashtag (default `monsoon`). |

Response: `{ ok: true, source, query, fetchedAt, signals[] , note? }`.

---

## 8. Demo script

1. **Live weather** — open `/twin`. Header shows **"● Live weather"** (Open-Meteo);
   each destination lists current conditions + 5-day forecast. Press
   **Refresh live data**.
2. **Map** — the Leaflet/OSM map shows all destinations as impact-coloured pins.
   Click one → propagation ring + its twin panel on the right.
3. **Social signals** — scroll to **Real-world social signals**; note the
   **LIVE FEED / SAMPLE FEED** badge, sentiment chips and relevance tags.
4. **What-if** — in **What-if simulator**, click **Cyclone** (or drag rainfall).
   Map colours, metrics, cascading propagation, predictions and recommendations
   all update instantly.
5. **Normal vs extreme** — reset to **Normal**, then **Heatwave**; call out the
   changed propagation path and widened uncertainty bands.
6. **Integration** — go to `/explore/matheran` and show the **Live weather & twin
   outlook** strip with its link back to `/twin`.

### Scenarios worth calling out

| Scenario | Point to |
|----------|----------|
| Cyclone on Matheran (hill) | Movement & capacity collapse; accessibility risk spikes; crowd pressure rises. |
| Heatwave on Goa (coastal) | Outdoor demand falls; indoor shift; calm-window recommendations. |
| Cold snap on Manali (mountain) | Cold sensitivity dominates; accessibility risk amplified by terrain. |
| Monsoon across all | Compare coastal (flood-prone) vs hill impact rings. |

---

## 9. Verification performed

```bash
npm run typecheck   # clean
npm run lint        # 0 errors (pre-existing warnings only)
npm run build       # succeeds; /twin, /api/weather, /api/social-signals registered
```

Routes confirmed in the build output:
`ƒ /twin`, `ƒ /api/weather`, `ƒ /api/social-signals`.

---

## 10. Limitations & honesty

- The Digital Twin is a **prototype simulation**; metrics, propagation strengths
  and prediction bands are model estimates from catalogue + weather inputs — not
  verified forecasts or measurements. This is stated in the UI.
- Locations are **approximate** city centroids; map tiles are OpenStreetMap.
- Open-Meteo / Reddit / Mastodon are free & keyless; when unreachable the app
  **labels sample data** rather than pretending it is live.
- No new database tables/migrations were required — the twin reads existing data.

---

## 11. Glossary

| Term | Meaning |
|------|---------|
| **Entity** | A destination (eco-hub) and its attractions/stays/transport. |
| **Severity** | 0–1 normalised weather badness used by the engine. |
| **Twin state** | The simulated snapshot of one entity under one scenario. |
| **Propagation** | How an effect moves through connected entities, ordered 1→3. |
| **Impact** | 0–100 blend of severity and movement loss, used for map colour. |
| **What-if** | A simulated scenario that never touches the real system. |
