# Wayfare — Phases 1 & 2

Personalized, accessible and lower-impact travel planning.

**Phase 1** delivers one polished user journey:

```
LANDING → AUTH → PERSONALIZED ACCESSIBILITY PROFILE → PERSONALIZED DASHBOARD
```

**Phase 2** adds the complete "Plan My Trip" experience:

```
DASHBOARD → CONVERSATIONAL TRIP QUESTIONS → SAVED PROFILE FROM NEON
→ OpenRouter (server-side) → RAW AI JSON → PARSE → VALIDATE (zod) → NORMALIZE
→ TWO OPTIONS → COMPARE → SELECT → DETAILED ITINERARY → MODIFY → CONFIRM
→ SAVE TO NEON → RESULT PAGE → REAL PDF → DASHBOARD "YOUR TRIPS"
```

Everything the traveller selects is stored as **structured rows in Neon
PostgreSQL** — the chat transcript is never the source of truth, and raw AI
output is never rendered.

---

## Tech stack

| Area      | Choice                                             |
| --------- | -------------------------------------------------- |
| Framework | Next.js 16 (App Router) + React 19                 |
| Language  | TypeScript (strict)                                |
| Styling   | Tailwind CSS v4 with a custom design-token theme   |
| Database  | Neon PostgreSQL                                    |
| ORM       | Drizzle ORM + Drizzle Kit                          |
| Auth      | bcrypt password hashing + signed JWT session cookie |
| Validation| Zod                                                |
| AI        | OpenRouter (server-only) with an app-owned fallback |
| PDF       | `pdf-lib` — real server-generated, selectable text  |

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the template and fill it in. **Never commit real credentials.**

```bash
cp .env.example .env.local
```

| Variable      | Required | Purpose                                                |
| ------------- | -------- | ------------------------------------------------------ |
| `DATABASE_URL`| yes      | Neon pooled connection string (`...?sslmode=require`)  |
| `AUTH_SECRET` | yes      | Secret used to sign session cookies                    |
| `AI_API_KEY`  | no       | Enables optional AI acknowledgements                   |
| `AI_BASE_URL` | no       | OpenAI-compatible endpoint (defaults to OpenAI)         |
| `AI_MODEL`    | no       | Model name (defaults to `gpt-4o-mini`)                  |
| `OPENROUTER_API_KEY` | for trip planning | Server-only OpenRouter key ([openrouter.ai/keys](https://openrouter.ai/keys)) |
| `OPENROUTER_MODEL` | no | Primary model (defaults to `google/gemma-4-26b-a4b-it:free`) |
| `OPENROUTER_FALLBACK_MODELS` | no | Comma-separated backups tried in parallel |
| `OPENROUTER_SITE_URL` / `OPENROUTER_APP_NAME` | no | Attribution headers |

The accessibility profile flow is fully deterministic and **works with no AI
provider configured**. If `AI_API_KEY` is missing, times out or returns an
error, the app falls back to built-in copy.

**The OpenRouter key is server-only.** It is read exclusively inside
`src/lib/openrouter.ts`, which is guarded by the `server-only` package, so
importing it from a client component is a **build error**. It is never read
into `NEXT_PUBLIC_*`, never passed to a component, and the browser never talks
to OpenRouter — `npm run build` plus the e2e suite both verify this.

If every model in the chain is unavailable (OpenRouter's free pool is shared
and often rate-limited), planning does **not** fail: the application builds the
two options from its own prototype dataset and labels them clearly. Raw AI text
is never shown either way.

### 3. Create the database schema

```bash
npm run db:migrate   # applies ./drizzle migrations (recommended)
```

> `npm run db:push` also exists for quick local iteration, but it prompts
> interactively and therefore fails in non-TTY environments (CI, some editor
> terminals). Prefer `db:generate` + `db:migrate` there.

### 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000.

### Useful scripts

```bash
npm run dev         # start dev server
npm run build       # production build
npm run start       # run production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run db:generate # generate a migration from schema changes
npm run db:migrate  # apply migrations
npm run db:studio   # browse the database

# tests (need a running app; override the target with BASE=http://...) —
npm run test:e2e        # Phase 1 journey (45 checks)
npm run test:e2e:trip   # Phase 2 "Plan My Trip" journey in Chromium (49 checks)
npm run test:trip:api   # Phase 2 API + security checks, no browser (32 checks)
```

---

## Testing the full flow in a real browser

`scripts/e2e-check.mjs` drives a headless Chromium through the entire journey:
landing → auth (including tab switching) → all 6 profile stages → completion →
**automatic** dashboard redirect → refresh → logout → login.

It also asserts the layout guarantees: the page has no scrollbar at 1280×720,
the selections rail has no scrollbar, there is exactly one `<main>` landmark,
the conversation region fills the remaining height, and no horizontal overflow on
a 390px-wide viewport — plus keyboard focus and the mobile menu.

```bash
npm run test:e2e:install   # one-time: downloads Chromium (kept in node_modules)
npm run dev                # in one terminal
npm run test:e2e           # in another (override with BASE=http://localhost:4000)
```

It creates a real account each run, so clean up demo rows when you're done.

### Trip planning tests

Two extra suites cover Phase 2:

```bash
npm run test:e2e:install   # one-time: downloads Chromium
npm run dev

npm run test:trip:api      # fast, no browser — full server pipeline + isolation
npm run test:e2e:trip      # drives the real conversational UI
```

`test:trip:api` exercises the whole server pipeline with the exact acceptance
scenario (Mumbai → Mahabaleshwar, 12–15 Oct, 2 adults + 1 elderly, ₹15,000) and
asserts: two options only, descriptive comparison labels, computed CO₂ with
recorded assumptions, tamper rejection, a **real** `%PDF` download, and that a
second traveller gets a 404 for someone else's trip and PDF.

`test:e2e:trip` drives the same scenario through Chromium: the one-question-at-
a-time flow, the adaptive elderly/mobility/dietary questions, the intentional
loading state, side-by-side comparison, the timeline, modify → re-validate,
confirm → result page → **Download PDF**, and the dashboard "Your trips" list.
It also asserts the two hard rules: the browser makes **no** request to
`openrouter.ai`, and no raw AI text or JSON is ever rendered.

> Planning can take up to ~50 s when OpenRouter's free pool is congested, which
> is why the planner shows a multi-message progress state and is written to fall
> back rather than hang. The tests wait accordingly.

> **Using a dev tunnel (ngrok, Cloudflare, VS Code tunnels)?**
> Next.js blocks cross-origin requests to dev-only assets by default, which
> returns **403 for every `/_next/*` JavaScript file** — the page renders but
> React never hydrates and *no button works*. `allowedDevOrigins` in
> `next.config.ts` already allows the common tunnel hostnames. If you use a
> different tunnel, add your hostname there (hostname only — no scheme, no
> port) and restart the dev server.

---

## Routes

| Route        | Access            | Behaviour                                                        |
| ------------ | ----------------- | ---------------------------------------------------------------- |
| `/`          | public            | Landing page (hero, features, how it works, coming next, business) |
| `/auth`      | public            | Sign up / log in. Signed-in users are forwarded automatically.    |
| `/profile`   | protected         | Full-screen conversational accessibility profile (6 stages)        |
| `/dashboard` | protected         | Dashboard: saved profile, real "Your trips" from Neon, destinations |
| `/plan`      | protected         | Conversational trip planner → compare → detail → modify → confirm  |
| `/trips/[id]`| protected (owner) | Final result page for one saved trip + Download PDF                |

API routes added in Phase 2 (all `nodejs`, all session-scoped):

| Route                    | Behaviour                                                   |
| ------------------------ | ----------------------------------------------------------- |
| `GET  /api/trips`        | Lists only the signed-in user's trips                        |
| `POST /api/trips/plan`   | Validates input, loads the profile, calls OpenRouter, returns 2 options |
| `POST /api/trips/modify` | Same guarded pipeline for a change request (nothing saved)   |
| `POST /api/trips/confirm`| Re-validates the itinerary and persists it — the only write   |
| `GET  /api/trips/[id]/pdf` | Real server-generated PDF, 404 for anyone but the owner    |

Routing rules:

- After signup/login → `/profile`
- After profile completion → `/dashboard` (automatic, ~3s after the completion panel)
- Already completed → `/dashboard` (visiting `/profile` redirects)
- No / expired session → `/auth?reason=session`

Route protection lives in `src/proxy.ts` (Next.js middleware/proxy convention).

---

## The profile screen

`/profile` is a **fixed-height, full-screen chat shell** — the page itself never
scrolls, on any screen size. It is laid out as three regions inside `h-dvh`:

```
┌─────────────────────────────────────────────────────────┐
│ header: logo · user · logout                            │  fixed
│ stage tracker ①─②─③─④─⑤─⑥                              │
├──────────────────────────────────┬──────────────────────┤
│ conversation                     │ Your selections      │
│   assistant prompt               │  (compact, bounded)  │  only this
│   question card with options     │  · counts            │  middle region
│   user reply                     │  · clamped text      │  scrolls
│   assistant acknowledgement      │  · no scrollbar      │
├──────────────────────────────────┤                      │
│ composer: Back · Skip · Continue │                      │  fixed
└──────────────────────────────────┴──────────────────────┘
```

Design decisions worth knowing:

- **Only the conversation scrolls.** The header, stage tracker, composer and
  selections rail are all outside the scroll region, so nothing important ever
  scrolls out of view.
- **The selections rail never scrolls.** It renders clamped text (`line-clamp`)
  and counts rather than wrapping chips, so its height is bounded no matter how
  many options are selected. Verified at 1024×700 and up.
- **Stages are always visible** so the traveller can see where they are and how
  much is left; on mobile it collapses to "Step X of 6" plus a progress bar.
- **Auto-redirect.** After the final save, the completion panel appears and the
  app moves to `/dashboard` on its own after 3s (a manual button is there too).
- **Autosave.** Every stage POSTs the full structured payload as `complete: false`;
  only the final stage sends `complete: true`. A dropped connection never loses
  previous answers, and `Back` re-edits without discarding anything.

---

## Database schema

```
users                     id, name, email (unique), password_hash, timestamps
accessibility_profiles    id, user_id (unique FK), completed,
                          mobility_detail, dietary_detail, timestamps
traveler_types            id, profile_id FK, type                 (unique per profile+type)
accessibility_requirements id, profile_id FK, category,
                          requirement, selected                  (unique per profile+category+requirement)
dietary_requirements      id, profile_id FK, requirement          (unique per profile+requirement)
travel_preferences        id, profile_id FK (unique),
                          sustainability_weight, accessibility_weight,
                          budget_weight, time_weight, comfort_weight
special_requirements      id, profile_id FK, content, created_at
```

All child tables cascade on profile/user delete and are indexed on `profile_id`.

Phase 2 adds one table:

```
trips   id, user_id FK (cascade), title, from_location, to_location,
        start_date, end_date, adults, children, elderly, mobility_support,
        budget, transport_preference, priorities (jsonb), additional_preferences,
        trip_needs (jsonb), selected_option, status, total_cost, estimated_co2,
        accessibility_score, sustainability_score, data_source, engine,
        itinerary_json (jsonb), raw_itinerary_json (jsonb), assumptions (jsonb),
        profile_snapshot (jsonb), created_at, updated_at
        indexed on (user_id) and (user_id, created_at)
```

- `itinerary_json` holds the **application-owned normalized itinerary** — the
  only thing any screen or the PDF renders. `raw_itinerary_json` keeps the
  pre-normalization payload for auditing and is never displayed.
- `profile_snapshot` is derived **server-side** at confirm time, so the PDF's
  "requirements considered" section cannot be forged by the client.
- A trip row is written **only** by `/api/trips/confirm`. Plan and modify are
  stateless: drafts live in the browser until the traveller confirms.
- Every query filters on `user_id` from the session, so one traveller can never
  read another's itinerary.

### Why this shape

Selecting "Step-free access", "Elevator" and "Minimal walking" stores:

```
mobility | step_free_access | selected = true
mobility | elevator         | selected = true
mobility | minimal_walking  | selected = true
```

rather than a blob of text. That keeps the data queryable and lets Phase 2
(carbon scoring, itinerary optimization, accessibility scoring, business
dashboards) build on it without a migration of the profile system.

Free-text answers are stored separately: the mobility/dietary notes on the
profile row and the final "anything else" answer in `special_requirements`.

---

## Project structure

```
src/
  app/
    page.tsx                landing
    auth/page.tsx           authentication (sign up / log in tabs)
    profile/page.tsx        accessibility profile (protected)
    dashboard/page.tsx      personalized dashboard (protected)
    api/
      auth/{signup,login,logout}/route.ts
      profile/route.ts      GET + POST structured profile
      ai/message/route.ts   optional AI acknowledgement
  components/
    ProfileWizard.tsx       the 6-stage conversational flow (+ autosave, redirect)
    SelectionsRail.tsx      bounded, non-scrolling "your selections" panel
    ProgressIndicator.tsx   stage tracker (desktop pills / mobile bar)
    AssistantBubble.tsx     ChatGPT-style assistant message + typing dots
    ChatMessage.tsx         message bubble
    AuthForm.tsx            signup/login form with field-level errors
    Navbar.tsx Footer.tsx Hero.tsx HowItWorks.tsx FeatureCard.tsx
    ComingNext.tsx BusinessesSection.tsx Logo.tsx Icon.tsx Button.tsx
    SelectionCard.tsx CheckboxGroup.tsx PreferenceSlider.tsx TextAreaField.tsx
    ProfileSummary.tsx DestinationCard.tsx DashboardSection.tsx LogoutButton.tsx
  db/                       Drizzle client + schema
  lib/
    session.ts              JWT session cookie (jose)
    password.ts             bcrypt hashing
    auth.ts                 getCurrentUser / requireUser / lookups
    validation.ts           zod schemas for signup + login
    profile-validation.ts   zod schema for the profile payload
    profile-service.ts      getProfileData / saveProfileData (DB source of truth)
    profile-options.ts      option slugs + labels
    profile-summary.ts      derived summary for the dashboard
    destinations.ts         mock destinations + profile-weighted scoring
    ai.ts assistant.ts      optional AI acknowledgement + scripted fallback copy
    icons.ts                icon name union

  # Phase 2 — trip planning
  app/
    plan/page.tsx           conversational planner (protected)
    trips/[id]/page.tsx     saved trip result page (owner only)
    api/trips/route.ts      GET  list trips (session-scoped)
    api/trips/plan/route.ts POST validate → profile → OpenRouter → 2 options
    api/trips/modify/route.ts POST same pipeline for a change request
    api/trips/confirm/route.ts POST re-validate + persist (the only write)
    api/trips/[id]/pdf/route.ts GET real server-generated PDF
  components/
    TripPlanner.tsx         question flow → compare → detail → modify → confirm
    TripOptionCard.tsx      one comparable option
    TripItineraryTimeline.tsx day-by-day timeline
    TripResultView.tsx      result page body + Download PDF
    TripPlanningProgress.tsx intentional multi-message loading state
  lib/
    trip-options.ts         client-safe questions, slugs, budgets, formatting
    trip-schema.ts          zod AI schema + internal types + normalize + CO₂ model
    trip-validation.ts      server-side request + strict stored-itinerary schemas
    openrouter.ts           server-only client: model race, retries, JSON repair
    trip-planning.ts        prompts + plan/modify orchestration
    trip-fallback.ts        app-owned prototype plan when all models fail
    trip-modify-fallback.ts app-owned plain-language modification rules
    trip-service.ts         persist + query trips, always scoped to the user
    trip-pdf.ts             real PDF from stored data (pdf-lib)

  proxy.ts                  route protection
drizzle/                    generated SQL migrations
scripts/e2e-check.mjs       Phase 1 full-journey browser test
scripts/e2e-trip.mjs        Phase 2 planner browser test
scripts/e2e-trip-api.mjs    Phase 2 API + security test
```

---

## How Phase 2 protects the boundary between AI and the app

```
USER INPUT → FRONTEND → BACKEND (validate) → PROFILE FROM NEON
→ OpenRouter → RAW AI RESPONSE → extract JSON → zod validate → repair
→ normalize → APP COMPUTES cost / duration / CO₂ / dates → clean UI
```

The model only supplies narrative and a transport choice. The application owns:

- **Structure** — exactly two options (`option_a`, `option_b`), day count forced
  to the trip length (missing days are filled, extra days dropped).
- **Numbers** — cost is summed from components, travel time and distance are
  derived, and **Estimated CO₂ is computed by our own model**
  (`distance × emission factor × travellers`, return leg included). The
  assumptions are stored on the trip and printed in the PDF.
- **Validation** — a strict zod schema (`src/lib/trip-schema.ts`) coerces and
  repairs every field; a second strict schema re-validates the itinerary on
  confirm, so a tampered payload is rejected with 422.
- **Honesty** — CO₂ is always labelled "Estimated CO₂" with its calculation
  basis; accessibility/sustainability numbers are labelled prototype scores; the
  result page and PDF carry a prototype-data notice. Hotel lifts, step-free
  access and schedules are presented as suggestions, never verified facts.

### Model chain and fallback

`OPENROUTER_MODEL` is tried first (the mandated
`google/gemma-4-26b-a4b-it:free`), with `OPENROUTER_FALLBACK_MODELS` racing a few
seconds behind it. The first model to return parseable JSON wins and the rest
are aborted, so latency tracks the fastest healthy provider. Reasoning is
disabled (`reasoning: { enabled: false }`) because reasoning models otherwise
burn the token budget on hidden chain-of-thought and truncate the JSON; a
JSON-closing repair step salvages output cut off by a token limit.

If **every** provider fails, the app still completes the flow: it builds the two
options from `src/lib/trip-fallback.ts`, or applies a plain-language change via
`src/lib/trip-modify-fallback.ts`, and says so in the UI. Nothing is ever faked
as verified data.

---

## Phase 1 scope

**Included:** authentication, the six-step guided accessibility profile with
structured persistence, profile completion screen, and a dashboard that renders
the traveller's own saved data plus personalized destination matches.

**Deliberately excluded (Phase 3+):** live routing, hotel booking, business
dashboards, food-waste prediction, rewards, and real-time transport
integrations. Destinations and emission factors are a small prototype dataset.

---

## Phase 2 scope

**Included:** the conversational trip planner, adaptive questions driven by the
stored profile, server-side OpenRouter generation and modification, strict
validation + normalization, two-option comparison with descriptive labels, a
timeline itinerary, confirm-to-persist, a saved-trip result page, a real
server-side PDF, and a dashboard "Your trips" list read from Neon.

**Deliberately excluded:** payments, live availability/pricing, verified
facility audits, and multi-user trip sharing.

---

## Known limitations

- **Mock destinations.** Phase 1 scores six seeded destinations; there is no
  live inventory, pricing or availability.
- **No password reset.** "Forgot password" is a disabled placeholder.
- **No email verification**, and sessions are a stateless 7-day cookie — a
  logged-out device cannot be revoked server-side.
- **The AI acknowledgement is optional.** With no `AI_API_KEY`, scripted copy is
  used, so behaviour is identical apart from the wording.
- **Destination weights are heuristic**, not a trained model — they are visible
  in `src/lib/destinations.ts` and `src/lib/profile-options.ts`.
- **All trip data is prototype data.** Precise facts about lifts, step-free
  access, certifications, schedules, opening hours and prices are *suggestions*
  produced for a demo, and are labelled as estimates everywhere they appear.
- **Estimated CO₂ uses prototype emission factors** in `src/lib/trip-schema.ts`
  (per-passenger-km) and a small known-distance table with a default fallback.
  Every trip stores the exact calculation it used.
- **OpenRouter's free tier is shared and frequently rate-limited.** The planner
  degrades to the app-owned prototype plan (clearly labelled) rather than
  failing, so a demo run may not always show model-authored prose.
- **Trip drafts are not server-side.** Options and modifications live in the
  browser until "Confirm itinerary" — only confirmed trips reach Postgres.
