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
| **Landing page, sign-in/sign-up** | Untouched — public pages keep their own look | — |

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
4. **The landing page and sign-in page** are still in the old style. They are the
   first thing a new visitor sees, so they are arguably the highest-value next
   step.
5. **Mobile polish.** The rail becomes a slide-in menu on phones and the bottom
   thumb bar stays — but this has not yet been checked on a real device (see
   DESIGN.md, section 9).

---

## 6. How to see it

1. Run the app (`npm run dev`) and sign in.
2. Walk the rail top to bottom — every page now shares the frame.
3. Press the double-arrow at the top of the rail to collapse it, then reload the
   page: it stays collapsed.
