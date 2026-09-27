# UI Updates — Every Page

A plain-English record of what was redesigned, which reference image it follows,
and what is still worth doing. No code, no jargon.

Read this together with **DESIGN.md** (which explains the dashboard in depth).

---

## 1. What changed on every signed-in page

Every signed-in page now renders inside **one shared frame**:

- **A navigation rail down the left** — the same rail everywhere, so moving
  between Explore, Trips and Challenges no longer feels like changing apps.
- **A top bar** with search, the notification bell (it shows how many of your
  reports are still open) and your account button.
- **One page canvas and one set of margins**, so no page is oddly wide, narrow or
  double-padded any more.
- **The rail can be collapsed.** Press the double-arrow at the top of the rail
  and it shrinks to a narrow strip of icons; everything beside it slides across
  to use the space. Your choice is remembered the next time you visit, and
  hovering a collapsed icon shows its name.

Before this, the dashboard had a rail and every other page had a top menu — the
two spellings of the same navigation. Now there is only one.

---

## 2. Page by page

| Page | What it looks like now | Reference used |
|------|------------------------|----------------|
| **Dashboard** (`/dashboard`) | Rebuilt earlier: welcome banner, four impact tiles, trip + mission cards, incident chart and feed, AI insight rail | `materials/image.png` |
| **Explore** (`/explore`) | Photo banner, search + "least crowded" + map buttons, filter chips, a three-across grid of destination cards with save hearts, and a right rail (your impact, next destinations, quick links) | `materials/explore.png` |
| **Destination hub** (`/explore/[id]`) | Kept the destination's own full-bleed banner, but reshaped into the shared card and frame; the action bar, attractions, challenges and accessibility panels follow | Explained by Explore |
| **Trips** (`/trips`) | Photo banner, Upcoming / Past / All tabs, search + sort, and one card per journey with its photo, status, dates, carbon estimate and four real facts | `materials/plantrip.png` |
| **Trip detail** (`/trips/[id]`) | Frame and spacing only — the itinerary itself is untouched | — |
| **Plan a trip** (`/plan`) | Frame and width only — the step-by-step planner keeps its own layout | — |
| **Challenges** (`/challenges`) | Photo banner, four real number tiles, category and difficulty chips, search + destination + sort, then one row per mission with its photo, points, progress bar and a Start/Continue button | `materials/challenges.png` |
| **Challenge detail + evidence** (`/challenges/[id]`, `/evidence`) | Frame and spacing only | — |
| **Impact** (`/impact`) | Photo banner, then the score, contribution breakdown, activity timeline, badges and leaderboard — now with proper icons instead of emoji | Dashboard vocabulary |
| **Reports** (`/reports`) | Photo banner, then the report form and the list of what you have filed | Dashboard vocabulary |
| **Community** (`/community`) | Photo banner, then the composer and the wider post feed | Dashboard vocabulary |
| **Profile** (`/profile`) | Photo banner, then your details, quick stats and the menu to the rest of the product — emoji replaced with icons | Dashboard vocabulary |
| **Digital Twin** (`/twin`) | Frame and spacing only — the map, controls and scenario sliders are untouched | — |
| **Accessibility profile** (`/accessibility`) | Deliberately untouched — it is a full-height questionnaire that runs outside the signed-in frame | — |
| **Landing page** (`/`) | Rebuilt to the reference: full-bleed hero, trust strip, "Plan. Explore. Make a Difference." step route, then three animated sections | `materials/image copy.png` |
| **Sign-in / sign-up** | Untouched — still in the older style | — |

The four reference images live in `materials/`. The dashboard, Explore, Trips and
Challenges follow them closely; the rest follow the same vocabulary (banner, the
same card style, the same chips and buttons) so the product reads as one design.

---

## 3. Things I fixed while restyling

Restyling surfaced three numbers that were not honest, so they were corrected:

- **Challenges — "Impact Points"** used to add a made-up starting figure (1,450)
  when your real total was lower. It now shows your actual ledger total.
- **Challenges — "Your Rank #12"** was invented. It is now a real tile: badges
  earned, which the app genuinely tracks.
- **Challenge rows — "N explorers completed"** was calculated from the length of
  the mission's title. It has been removed; the row now shows your own real step
  progress (for example 2 of 4) and nothing else.

Nothing else on the pages states a number that the app cannot point at.

---

## 4. What was not touched

Deliberately left alone, so nothing can break:

- Sign-in, sign-up and the session handling.
- Everything that writes to the database: saving a trip, filing a report,
  starting or completing a challenge, liking or commenting, saving a destination.
- The trip-planning engine, the ranking logic (senior / accessibility mode,
  least-crowded sorting), the Digital Twin simulation and the AI advisor.
- The accessibility questionnaire.

The filters that existed before still exist. Where a filter needed a new home, it
was kept — for example Explore still has "Least crowded first", and Challenges
still lets you filter by difficulty.

---

## 5. Worth deciding next

These are the honest gaps, in the order I would tackle them:

1. **Trip detail and Plan a trip** still use older card styling inside the new
   frame. They work fine; they just have not had the same visual pass yet.
2. **Explore's "Map view" button** opens the Digital Twin map rather than showing
   a map inside Explore. An inline map is possible but slower to load.
3. **Community and Impact are single-column.** They would suit a right-hand rail
   (top contributors, recent badges) like Explore and the dashboard have.
4. **The sign-in page** is still in the old style. It is the first thing a new
   visitor sees after the landing page, so it is now the highest-value next step.
5. **Mobile polish.** The rail becomes a slide-in menu on phones and the bottom
   thumb bar stays — but this has not yet been checked on a real device (see
   DESIGN.md, section 9).

---

## 6. How to see it

1. Run the app (`npm run dev`) and sign in.
2. Walk the rail top to bottom — every page now shares the frame.
3. Press the double-arrow at the top of the rail to collapse it, then reload the
   page: it stays collapsed.

---

## 7. The public landing page

The landing page (`/`) was rebuilt to match `materials/image copy.png`, and some
of the animation work was ported from the zip in `materials/`. It now reads, top
to bottom:

1. **Full-bleed hero** — a coastline photograph with a light wash on the left so
   the headline stays readable. "Travel with a greater purpose.", the two calls
   to action, and the rating line. The floating white card is a featured
   destination with its Eco Score and three trait chips, and a dashed route
   leads away from it to a quieter stop.
2. **A trust strip** — Sustainable Travel, Accessible Journeys, Support Local,
   Real Impact, one per column with a divider between them.
3. **How a trip comes together** — a vertical step selector (Discover / Plan /
   Go, then track it) on the left driving a dark product preview on the right.
   Clicking a step swaps the preview: matching places with their eco scores, a
   draft itinerary with the carbon of each leg, then the impact tally with a
   progress bar. Arrow keys, Home and End move between the steps.

   This replaced a dotted four-step route that used to sit here. That route was a
   near-duplicate of **One thoughtful journey** further down the page — two
   diagrams of the same idea, one after the other. The new section is
   asymmetric, interactive, and shows the actual product instead of redrawing a
   route.
4. **See the difference** — the aeroplane flying from Baga Beach to quieter
   Morjim Beach, with the two pressure cards either side.
5. **One thoughtful journey** — five stops on a single dotted route, each card
   anchored to its node.
6. **Explore your options** — pick Flight, Train, Bus or Car and the cost, carbon,
   time and accessibility figures change immediately.

A few honest notes about it:

- **No animation library was added.** The motion is plain CSS and SVG, which is
  why it works without downloading anything new.
- **The route geometry is deliberate.** The dotted stage keeps the same aspect
  ratio as its own drawing, so a stop's dot cannot slide off the line when the
  window is resized.
- **The dashed route in the hero is decoration.** It is hidden on phones and
  tablets, and it is the one part of the page that was placed by hand — it is the
  most likely thing to want a nudge.
- **The hero copy is placeholder-friendly.** It says Banff National Park / Canada
  because the reference did; the card links to the real Manali destination and
  the wording is safe to swap.
- I could not check it in a real browser (none is installed here), so the page
  was verified by compiling and rendering it, not by looking at it.

---

## 8. The richness pass

The landing page was light and correct but washed out, so it was deepened rather
than redesigned. The light theme stays; it just has colour and weight now.

- **The fog over the hero is gone.** The left half used a near-white overlay at
  97% opacity, which flattened the photograph. It is now a green-tinted scrim
  that clears by about three-quarters of the way across, so the coastline keeps
  its colour while the headline stays readable.
- **One heading typeface.** The hero title was a serif and every section heading
  was a sans-serif. All section headings are now the same serif, with tighter
  tracking and balanced line breaks.
- **A deeper, greener palette.** The page background, borders, secondary surfaces
  and muted text all moved a step greener and darker, so large areas read as a
  considered colour instead of near-white.
- **Texture and depth.** A fine film grain sits over the hero photograph, the
  trust strip has a soft green gradient with a hairline highlight along its top,
  and the step section has a warmer glow behind it. Cards got a hairline inner
  highlight on top of their shadow so they read as glass rather than flat white.
- **The photographs inside the sections are less muted.** The haze over the
  coastline and bus photography came down, so those sections look richer too.
- **Small finishing details.** Numbers now use tabular figures so columns of
  figures line up; the hero buttons have visible keyboard focus rings and a
  pressed state; the play triangle is nudged a pixel so it looks centred in its
  circle; the footer's internal links now use proper client-side navigation
  instead of full page reloads, and its surface is tinted to match.
- **Contrast was measured, not guessed.** Every text-on-background pair on the
  page was checked against the WCAG 4.5:1 minimum. Deepening the palette pushed
  the red "high pressure" colour to 3.85:1, so it was darkened until it passes in
  both directions — 4.69:1 as text, 5.06:1 as a filled badge.

### Then brightened again

The first pass went a shade too heavy, so the page was lifted back up without
returning to the fog:

- The page now has its own base surface, a near-white green that is brighter
  than the app's canvas. It is scoped to the landing page, so the signed-in app
  keeps the tone it already had.
- The hero's scrim was lifted and its heavy green wash along the bottom cut
  right back — that wash was the main reason the hero looked murky.
- Borders, secondary surfaces and the trust strip all came up a step. The strip
  is now almost pure white with just a hint of green.
- The step section's corner blob was dark green and sat over the top-right of
  the section making it read as a shadow. It is now a *light* green highlight,
  so it adds depth without darkening anything.
- **The product preview panel went from near-black to a light card.** It was the
  single largest dark mass on the page. It kept its structure — header, divided
  rows, coloured figures, progress bar — but on white with a green tint, so the
  page still has contrast without a black rectangle in the middle of it.
- Every text and background pair was re-measured after brightening. All pass,
  including the new figures on the light panel (5.6:1 and 5.1:1) and the
  progress bar against its own track (3.0:1).

One thing deliberately **not** added: an active-page highlight in the top menu.
The signed-in rail already marks the current page properly, and the top menu only
appears on the landing page and the sign-in page, where none of its links are the
current page — so it would have been code that would never run.

## 9. Sustainable Hospitality

A small business-facing section, not a second product. It lives at
**Sustainable Hospitality** in the sidebar (under More), and every screen reuses
the existing cards, buttons, icons and colours — the same `PageHero`, `StatTiles`,
`SectionCard`, `EmptyNote` and `CalloutBar` every other page is built from, with
the page's own root spacing (`space-y-4 sm:space-y-5`) rather than a bespoke
layout or extra page padding. Category artwork is drawn from the project's one
icon family (Lucide) rather than emoji, so it sits alongside the rest of the
product.

### The two flows

- **A business** answers a ten-point checklist across five categories (Food
  Waste, Water Efficiency, Energy Efficiency, CO₂ / Transportation, Waste
  Management), submits, and sees a score out of 100, the five category scores,
  and the two things worth fixing next.
- **A traveller** sees that score on the destination's business cards and can
  leave a 1–5 rating with an optional comment.

### The score is calculated, never written down

The single most important decision: **no score is stored on the business.** The
business's number comes from its newest checklist submission; the traveller's
number comes from aggregated feedback. Both are derived at read time, so neither
can drift from the data behind it, and the two are shown side by side but *never
averaged together* — one is a self-assessment, the other is what visitors found,
and the page says so in plain words.

The scoring itself is a dozen lines of arithmetic in `src/lib/hospitality.ts`:
within a category the load-bearing question counts double, a category scores
`checked ÷ available`, and the overall score is the mean of the five categories.
The server re-scores every submission from sanitised answers, so a client cannot
submit a score of its own — and anything unrecognised in the payload is dropped
before scoring. A tampered submission can only ever produce a worse (or honest)
score.

### Data

Three tables, no more: `businesses` (the profile), `business_assessments`
(append-only, stores both the raw answers and the scores derived from them) and
`business_feedback` (one row per traveller per business, so re-rating replaces
rather than inflates). The old `sustainabilityScore`, `rating` and `reviews`
fields were removed from the fixture — they used to be hardcoded numbers
that nothing could verify.

### The demo business

**Green Valley Resort — Chithirapuram, Munnar.** Seeded with realistic answers
(strong food, energy and waste; no EV charging; water metered but no low-flow
fittings), which scores **80/100** — a figure the seeder computes with the same
function the API uses. Three seeded traveller ratings put it at **4.3/5**.

### Seeding and verifying

```bash
npm run db:generate      # writes drizzle/0004_*.sql
npm run db:migrate       # applies it
npx tsx scripts/seed.ts  # re-runnable; scores the demo business from its answers
```

If the tables are missing, the app still works: `loadAppData` catches the
hospitality read and degrades to "no businesses" rather than blanking a page.
Verified with `npm run typecheck`, `eslint` (0 errors), `npm run build`, and live
`curl` calls against `/hospitality`, `/explore/munnar`, and both API routes —
including the unauthenticated (401) and tampered-payload cases.
