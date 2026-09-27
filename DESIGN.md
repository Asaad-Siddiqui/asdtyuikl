# Travello Dashboard — Design Notes

This document explains the redesigned **Dashboard** page in plain English: what it
shows, where the numbers come from, why it is built this way, and what changes
next. You do not need to know how to program to read it.

The design follows the reference image in `materials/image.png`. Everything in it
is wired to the traveller's real data — nothing on this page is a decorative
mock-up.

> This document is the dashboard. For the page-by-page record of the redesign
> across the rest of the product, read **UI_UPDATES.md**.

The dashboard was the first page to get this treatment. The same frame — rail,
top bar, page margins — now wraps **every signed-in page**, and the rail can be
collapsed to an icon strip. See **UI_UPDATES.md** for the page-by-page record.

---

## 1. The short version

- The dashboard now has a **left-hand sidebar** for navigation instead of the
  top bar, exactly like the reference image.
- The sidebar carries **everything the top bar used to carry** — including the
  items that were hidden inside the "More" menu. Nothing is missing, and nothing
  needs two places to be updated.
- Every number on the page — points, trips, missions, reports, warnings — comes
  from that traveller's real records, and each card says where it came from.

---

## 2. What a traveller sees, top to bottom

**The sidebar (left).** Who they are, where they can go, and their account.
Described in full in section 3.

**The top strip.** A search box that takes them to the destination catalogue, a
bell showing how many of their reports are still open, and their account menu.
The bell lists those open reports so the count is never a mystery.

**The welcome banner.** "Welcome back, {first name}!" over a photograph of the
destination currently being looked at, with a reminder that their travel is
already making a difference. It is friendly rather than data-heavy — the first
thing you read on the page is your own name.

**Four impact tiles.** Four small cards answering "how am I doing?":

| Tile | What it means | The small green label under it |
|------|----------------|-------------------------------|
| Impact Points | Points earned for completed eco-missions | How many points were earned in the last 7 days, or "steady this week" |
| Missions Completed | Eco-missions finished | How many were finished in the last 7 days |
| Destinations | Destinations visited | How many places are saved for later |
| Est. CO₂ Avoided | Estimated carbon avoided | How much of that was avoided this week, or how many reports were verified |

**Your Trips.** The journey the traveller is currently on (or their most recent
one): a photo, where it goes, the dates, the estimated carbon, and four quick
facts — nights, cost, carbon, and how accessible the trip scored.

**Active Missions.** Eco-missions already started, each with a progress bar and a
plain count of steps done, e.g. `2 / 4`.

**Weekly Incident vs Resolution (chart).** A week-long view of reports filed
(the red line) against reports a ranger has since resolved (the green line). It
answers "is anyone acting on what people report?"

**Recent Incident Reports.** The latest problems travellers flagged — waste,
overcrowding, broken infrastructure, accessibility — with where it was and its
current status (Open, In review, Resolved). Filter buttons let you see one
category at a time.

**The bar at the bottom.** Chooses which destination the page is looking at. It
is a single control with two effects: it swaps the welcome banner photograph and
it decides which warnings the right-hand panel shows.

**The right-hand panel.** Three informative cards plus a closing photograph:
1. **AI Insights** — patterns found in the reports ("waste is building up near
   Echo Point", "visitor pressure is up 28% this weekend") each with a
   recommended action.
2. **Impact at a Glance** — four short reminders of what the traveller's choices
   add up to: cleaner destinations, happier communities, smarter travel, a
   greener future.
3. **Crowd-Aware Picks** — the calmest places to visit right now, with the best
   time of day, and an honest "busy" warning where it applies.
4. A small photograph card that reads "Travel Responsibly".

---

## 3. The sidebar, and why it replaced the top bar

The reference image puts navigation down the left side, so the dashboard drops
the shared top bar and uses that layout. The important part is that **nothing
was lost in the move**: the sidebar is a complete replacement, not a shorter
menu.

Here is the one-to-one match:

| On the old top bar | Where it is now |
|--------------------|-----------------|
| Travello logo + tagline | Top of the sidebar |
| "Plan a Trip" button | Pushed-up button under the logo, same dark green |
| "Traveller mode" / "Creator mode" badge | Directly under the Plan a Trip button |
| Dashboard, Explore, Trips, Challenges, Impact | Main list in the sidebar |
| The **More** dropdown (Digital Twin, Reports, Community, Profile) | The same "More" entry at the bottom of the list, opening in place on click — and already open if you are currently inside one of those four sections |
| Account menu (Your profile, Accessibility profile, Your trips, Log out) | The account block at the bottom: a photo, a name, a points total, and the same four actions |

**Why this matters for the rest of the app.** The list of sections used to be
written separately in the top bar. If someone edited one list, the other could
quietly disagree — a page would appear in one and vanish from the other. Both
layouts now read the *same* list, so they can never drift apart. When the other
pages are switched over to the sidebar, they will automatically show exactly the
same sections.

**On a phone.** The sidebar is off-screen. A small menu button in the top strip
slides it in over the page, and the existing thumb bar along the bottom stays
where it is, so the most-used sections are always one tap away.

---

## 4. Where the numbers come from

Nothing on this page invents a figure. Each card reads the same records that the
Trips, Challenges, Impact and Reports pages read, so the screens cannot disagree.

| What you see | Where it actually comes from |
|--------------|------------------------------|
| Points, missions, destinations, CO₂ | The traveller's own account records |
| The last-7-days labels | The dates on their completed missions |
| The current trip | The next confirmed trip in their account (most recent if none are upcoming) |
| Mission progress (`2 / 4`) | Steps completed so far against the number of steps that mission has |
| The chart | Reports they filed in the last 7 days, split into "filed" and "resolved" |
| The report list | Their filed reports, with status, category and location |
| AI Insights | The pattern library, narrowed to the destination chosen in the bottom bar |
| Crowd-Aware Picks | The destination catalogue's live busyness ratings |

---

## 5. What is real and what is an estimate

Being straight about this matters more than looking impressive.

- **Real:** your points, trips, missions, mission progress, reports, report
  statuses, saved destinations and which destination you have selected.
- **Estimated and labelled as such:** the carbon figure (the app uses a fixed,
  documented conversion and calls it an estimate everywhere), the "prototype
  companions" and carbon-saving numbers elsewhere in the app, and the AI
  advisories.
- **One honest fallback:** the weekly chart is built from the traveller's own
  reports. A brand-new account has barely any, and a line drawn from two dots
  would be misleading — so when there is too little to draw honestly, the card
  swaps in a clearly-labelled sample week and the badge in its corner changes
  from a percentage to the words **"Prototype series"**. It never pretends to
  have data it does not have.
- **Images:** the photographs are stock travel photos, and the welcome banner
  uses the picture already stored for the destination you selected.

---

## 6. Decisions made, and why

**Every page uses the sidebar, and it collapses.** The rail started on the
dashboard, then became the shared frame once it carried everything the top bar
did. It collapses to a strip of icons and remembers your choice. The public
pages (landing, sign-in) and the accessibility questionnaire keep their own
layouts on purpose.

**No animation library was added.** A richer motion library was considered, but
it is not part of this project today, and adding one for a single page means
extra weight and a new thing to maintain. The existing project animations and
hover effects are used instead.

**Trip facts are real fields, not the image's list.** The reference image shows
"Flights / Hotels / Activities / Transport". This app stores the trip's dates,
cost, carbon estimate and accessibility score instead, so those are what the
card shows. Same shape, truthful content. If you would prefer prototype counts
with a "prototype" label, that is a small change.

**Crowd-Aware Picks was kept.** It is documented as living on the dashboard, so
rather than lose it, it became a card in the right-hand panel.

---

## 7. What happened next

Every signed-in page now renders inside the shared frame, so the move described
in the first version of this document is done: the rail is on all of them, the
content shifts right to match whether the rail is open or collapsed, and sections
highlight themselves automatically ("Explore" lights up while you are deep inside
a destination).

One list of sections feeds both the rail and any remaining top bar, so the two
can never disagree.

The remaining opportunities — trip detail, the planner, the landing page, a
right-hand rail for Community and Impact — are listed in **UI_UPDATES.md**,
section 5.

---

## 8. Where the work lives

For anyone who does need the file names:

| File | Its job |
|------|---------|
| `src/components/travello/AppShell.tsx` | The shared frame: rail, top bar, page margins, collapse memory |
| `src/components/travello/AppSidebar.tsx` | The rail: every section, the mode badge, the account menu, the collapse toggle |
| `src/components/travello/AppTopbar.tsx` | The shared search, notification bell and account button |
| `src/components/travello/ui/PageKit.tsx` | The shared page pieces: banner, number tiles, chips, toolbar, cards, closing bar |
| `src/components/travello/dashboard/DashboardTopbar.tsx` | Search, the notification bell, the account button |
| `src/components/travello/dashboard/DashboardWelcome.tsx` | The welcome banner and the four impact tiles |
| `src/components/travello/dashboard/DashboardTrip.tsx` | The current trip card and the active missions card |
| `src/components/travello/dashboard/DashboardIncidents.tsx` | The weekly chart, the report list, the destination picker |
| `src/components/travello/dashboard/DashboardInsightsRail.tsx` | AI Insights, Impact at a Glance, Crowd-Aware Picks, the closing photo |
| `src/components/travello/pages/DashboardPage.tsx` | Arranges all of the above into the page |
| `src/components/travello/nav.ts` | The single list of sections both layouts read |

**To see it:** run the app and open `/dashboard`.

---

## 9. Checked before handing over

- **Checked:** the page loads for a real signed-in traveller and shows their real
  records — the seeded account's name, points total, four completed missions, the
  upcoming trip and its dates, mission progress (2 of 4 steps), and the actual
  filed reports with their real statuses.
- **Checked:** type checks, code-style checks and the production build all pass
  with no new warnings.
- **Not yet checked in a browser:** the exact spacing at each screen width, and
  the phone slide-in menu opening and closing by hand. The layout is built to
  avoid side-to-side scrolling at every width, but a visual pass on a real screen
  is still worth doing before the demo — say the word and it can be done here.
