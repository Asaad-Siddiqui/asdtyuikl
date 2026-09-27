# Travello (Wayfare)

An AI-assisted, accessibility-first, lower-impact travel platform built with **Next.js 16 + React 19 + TypeScript + Neon + Drizzle**.

It combines:
- a structured accessibility profile,
- sustainable trip planning with strict server-side validation,
- challenge/reward loops,
- community and incident reporting,
- sustainable hospitality scoring,
- and a weather-driven digital twin with advisory output.

---

## Why this project stands out

Travello is designed with one hard product rule:

> **AI can suggest, but the app owns structure, validation, security, and persisted truth.**

That rule appears across the codebase:
- server-only model clients,
- strict Zod validation and normalization,
- user-scoped queries in every sensitive path,
- prototype/estimated labeling for non-verified data,
- graceful fallbacks when external AI/weather/social sources fail.

---

## Core product surfaces

### 1) Account + accessibility profile
- Auth with signup/login/logout APIs (`/api/auth/*`)
- Signed cookie session (JWT) in `wayfare_session`
- Conversational accessibility flow at `/accessibility`
- Profile persisted as structured relational data (not a chat blob)

### 2) Trip planner (`/plan`)
- One-question-at-a-time conversational trip intake
- Reuses saved accessibility profile automatically
- Server pipeline: validate request → generate options → normalize/repair → compare
- Returns **four** options (`option_a`…`option_d`)
- Supports itinerary modification before confirm
- Confirm step persists trip and supports PDF download

### 3) Traveller app shell
Protected routes inside `(app)`:
- `/dashboard`
- `/explore` and `/explore/[id]`
- `/trips` and `/trips/[id]`
- `/challenges` (+ challenge detail/evidence)
- `/impact`
- `/reports`
- `/community`
- `/hospitality`
- `/profile`
- `/twin`

### 4) Sustainable hospitality
- Businesses can be assessed via weighted sustainability checklist
- Traveller ratings and business assessments are stored separately
- Overall score is derived from latest assessment, not hardcoded

### 5) Weather-driven digital twin (`/twin`)
- Simulates destination impact under weather scenarios
- Uses live weather (Open-Meteo, no key required) with sample fallback
- Pulls public social signals (Reddit/Mastodon) with sample fallback
- Provides advisor output via Nugen model with deterministic fallback

---

## Architecture at a glance

```text
Client UI (App Router pages + components)
  -> Authenticated API routes (/api/*)
      -> Domain services in src/lib/*
          -> Drizzle ORM
              -> Neon PostgreSQL

Trip planning AI path
  -> /api/trips/plan | /api/trips/modify
      -> trip-validation.ts (strict request schema)
      -> trip-planning.ts
      -> openrouter.ts (server-only)
      -> trip-schema.ts (extract/repair/normalize)
      -> compare payload returned to client

Trip persistence path
  -> /api/trips/confirm
      -> strict re-validation of selected option
      -> saveConfirmedTrip() to DB
      -> /api/trips/[id]/pdf for server-generated PDF
```

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| DB | Neon PostgreSQL |
| ORM | Drizzle ORM + Drizzle Kit |
| Auth | bcrypt + signed JWT session cookie |
| Validation | Zod |
| AI (trip planner) | OpenRouter (server-only) |
| AI (twin advisor) | Nugen inference (server-only) |
| PDF | pdf-lib |
| Charts/Maps | recharts + leaflet |
| E2E | Playwright scripts |

---

## Repository structure

```text
src/
  app/
    page.tsx                      public landing
    auth/page.tsx                 login/signup
    accessibility/page.tsx        conversational accessibility profile

    (app)/                        protected app shell
      dashboard/page.tsx
      explore/page.tsx
      trips/page.tsx
      challenges/page.tsx
      impact/page.tsx
      reports/page.tsx
      community/page.tsx
      hospitality/page.tsx
      profile/page.tsx
      plan/page.tsx
      twin/page.tsx

    api/
      auth/{signup,login,logout}
      profile
      profile/traveller
      trips/{plan,modify,confirm,[id]/pdf,route}
      challenges/{start,complete}
      community/posts(+ likes/comments)
      destinations/[id]/save
      reports
      rewards/claim
      hospitality/{assess,feedback}
      weather
      social-signals
      ai/{message,advisor}

  components/
    TripPlanner.tsx
    ProfileWizard.tsx
    travello/*                    app shell + pages + UI building blocks
    twin/*                        map + controls + advisor UI

  lib/
    auth/session/password helpers
    profile-*, trip-*, hospitality-* domain modules
    digital-twin, weather, social-signals, nugen

  db/
    schema.ts

drizzle/
  SQL migrations + metadata

scripts/
  e2e-check.mjs
  e2e-trip.mjs
  e2e-trip-api.mjs
  seed.ts
```

---

## Data model (high level)

Main table families in `src/db/schema.ts`:

- **Identity**: `users`
- **Accessibility profile**:
  - `accessibility_profiles`
  - `traveler_types`
  - `accessibility_requirements`
  - `dietary_requirements`
  - `travel_preferences`
  - `special_requirements`
- **Trips**: `trips` (itinerary JSON + assumptions + profile snapshot)
- **Destination ecosystem**:
  - `destinations`, `attractions`, `challenges`
  - `user_challenges`, `point_events`
  - `posts`, `post_reactions`, `comments`
  - `reports`, `saved_destinations`
- **Hospitality + rewards**:
  - `businesses`, `business_assessments`, `business_feedback`
  - `reward_claims`

---

## Security and trust boundaries

- Route protection is centralized in `src/proxy.ts`.
- Protected pages redirect to `/auth?reason=session` when session is invalid.
- API auth helper (`requireApiUser`) avoids trusting client-provided user IDs.
- Data access patterns in service modules scope reads/writes by authenticated user.
- OpenRouter and Nugen keys are read only in `server-only` modules.
- Trip confirm endpoint re-validates selected itinerary before persistence.
- PDF endpoint returns only owner’s trip (`404` for other users).

---

## Environment variables

Copy and fill:

```bash
cp .env.example .env.local
```

Required:
- `DATABASE_URL`
- `AUTH_SECRET`
- `OPENROUTER_API_KEY` (for trip planning AI)
- `NUGEN_API_KEY` (for twin advisor AI)

Optional:
- `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`
- `OPENROUTER_MODEL`, `OPENROUTER_FALLBACK_MODELS`, `OPENROUTER_SITE_URL`, `OPENROUTER_APP_NAME`
- `NUGEN_MODEL`, `NUGEN_BASE_URL`

> Never expose these as `NEXT_PUBLIC_*`.

---

## Local setup

```bash
npm install
npm run db:migrate
npm run dev
```

Open: `http://localhost:3000`

---

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck

npm run db:generate
npm run db:migrate
npm run db:studio

npm run test:e2e
npm run test:e2e:trip
npm run test:trip:api
npm run test:e2e:install
```

Demo data seed:

```bash
npx tsx scripts/seed.ts
```

---

## Testing coverage

### `npm run test:e2e`
Covers the account + accessibility journey end-to-end:
- auth tab switching,
- full profile completion,
- redirect behavior,
- persistence checks,
- mobile layout sanity checks.

### `npm run test:e2e:trip`
Covers UI trip-planning flow end-to-end:
- conversational intake,
- adaptive questions,
- loading/progress states,
- 4-option comparison,
- modify + confirm + result + PDF pathway,
- browser-side security assertions.

### `npm run test:trip:api`
Covers server acceptance/security pipeline:
- auth guards,
- strict validation,
- plan/modify/confirm lifecycle,
- owner-only access guarantees,
- PDF integrity checks.

---

## Notes on external dependencies and fallback behavior

The app is intentionally resilient:
- OpenRouter congestion/failure -> prototype itinerary fallback
- Nugen unavailable -> deterministic advisor fallback
- Weather/social source failure -> labeled sample feeds

This keeps product flows operational during demos and development while making fallback status explicit in UI.

---

## Known prototype boundaries

Travello is a production-style architecture over a prototype dataset. Current boundaries include:
- seeded catalogue and demo-oriented assumptions,
- estimated (not certified) emissions and impact metrics,
- no live booking/payment integrations,
- no full account recovery pipeline.

---

## License

Use according to repository owner policy.
