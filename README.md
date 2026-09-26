# Wayfare — Phase 1

Personalized, accessible and lower-impact travel planning.

Phase 1 delivers one polished user journey:

```
LANDING → AUTH → PERSONALIZED ACCESSIBILITY PROFILE → PERSONALIZED DASHBOARD
```

Everything the traveller selects is stored as **structured rows in Neon
PostgreSQL** — the chat transcript is never the source of truth.

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

The accessibility profile flow is fully deterministic and **works with no AI
provider configured**. If `AI_API_KEY` is missing, times out or returns an
error, the app falls back to built-in copy.

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
npm run test:e2e    # browser test of the full journey (needs a running app)
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
| `/dashboard` | protected         | Personalized dashboard driven by saved profile data               |

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
  proxy.ts                  route protection
drizzle/                    generated SQL migrations
scripts/e2e-check.mjs       full-journey browser test
```

---

## Phase 1 scope

**Included:** authentication, the six-step guided accessibility profile with
structured persistence, profile completion screen, and a dashboard that renders
the traveller's own saved data plus personalized destination matches.

**Deliberately excluded (Phase 2+):** carbon calculations, live routing, hotel
booking, business dashboards, food-waste prediction, rewards, and real-time
transport integrations. Destinations are a small mock dataset scored against
the stored profile — the seam the real recommendation engine will replace.

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
