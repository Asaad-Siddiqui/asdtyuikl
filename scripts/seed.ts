/**
 * Seeds the Travello catalogue and demo accounts.
 *
 * Run with:  npx tsx scripts/seed.ts
 *
 * Everything is idempotent: catalogue rows are upserted and each demo account's
 * dependent rows are replaced, so the same numbers show up on every page after
 * re-running.
 *
 * Two accounts are fully populated with the demo dataset:
 *
 *  - **Aarav Mehta** (`aarav.mehta@example.com` / `Travello123!`) — the
 *    documented demo account: 4 completed challenges + welcome bonus + a booked
 *    trip + a resolved report.
 *  - **The account you signed up with, named “test”** — matched automatically by
 *    name/email/username containing `test` (override with `TEST_EMAIL` in
 *    `.env.local`). It is filled with the same style of dummy data so you can
 *    sign in with it and see every page populated: challenges, impact points,
 *    trips, reports, saved destinations, community posts and a hospitality
 *    rating.
 *
 * Rohan Iyer and Sneha Patel are light community accounts (one post each) so the
 * feed, likes and comments have variety.
 */

import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { eq, ilike, or } from "drizzle-orm";

config({ path: ".env.local" });

const DEMO_PASSWORD = "Travello123!";

type AiOption = import("../src/lib/trip-schema").AiOption;
type TripRequestSummary = import("../src/lib/trip-schema").TripRequestSummary;

type Person = {
  email: string;
  name: string;
  username: string;
  bio: string;
  avatar: string;
  role: string;
};

const AARAV: Person = {
  email: "aarav.mehta@example.com",
  name: "Aarav Mehta",
  username: "@aarav_mehta",
  bio: "Slow-travel enthusiast mapping step-free routes across the Western Ghats.",
  avatar:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&auto=format",
  role: "traveler",
};

const ROHAN: Person = {
  email: "rohan.iyer@example.com",
  name: "Rohan Iyer",
  username: "@rohan_trails",
  bio: "Weekend trekker, plastic-free since 2023.",
  avatar:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&auto=format",
  role: "traveler",
};

const SNEHA: Person = {
  email: "sneha.patel@example.com",
  name: "Sneha Patel",
  username: "@snehawanders",
  bio: "Travel creator & responsible tourism advocate.",
  avatar:
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&auto=format",
  role: "creator",
};

/** Shared by every activity seeder; a plain helper so fixtures can use it. */
function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

type PostSeed = {
  content: string;
  destinationId: string;
  challengeId: string | null;
  daysAgo: number;
  imageUrl: string | null;
};

type ReportSeed = {
  destinationId: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  daysAgo: number;
};

type TripSeed = {
  from: string;
  to: string;
  startDate: string;
  endDate: string;
  nights: number;
  days: number;
  adults: number;
  elderly: number;
  budget: number;
  transportPreference: string;
  transportMode: string;
  transportLabel: string;
  stayName: string;
  stayType: string;
  costPerNight: number;
  dataSource: "prototype";
  createdAt: Date;
};

type ActivitySeed = {
  completedChallengeIds: string[];
  inProgressChallengeIds: string[];
  posts: PostSeed[];
  reports: ReportSeed[];
  savedDestinationIds: string[];
  /** Eco goodies to pre-claim so the demo shows the claimed state too. */
  claimedRewardIds: string[];
  feedback: { rating: number; comment: string };
  trips: TripSeed[];
};

const TRIP_SEEDS: TripSeed[] = [
  {
    from: "Mumbai",
    to: "Mahabaleshwar",
    startDate: "2026-10-12",
    endDate: "2026-10-15",
    nights: 3,
    days: 4,
    adults: 2,
    elderly: 1,
    budget: 15000,
    transportPreference: "public_transport",
    transportMode: "train",
    transportLabel: "Train to Pune, then shared coach",
    stayName: "Mahabaleshwar Green Stay",
    stayType: "Lower-impact guesthouse",
    costPerNight: 1800,
    dataSource: "prototype",
    createdAt: daysAgo(5),
  },
  {
    from: "Mumbai",
    to: "Matheran",
    startDate: "2026-07-04",
    endDate: "2026-07-06",
    nights: 2,
    days: 3,
    adults: 2,
    elderly: 1,
    budget: 9000,
    transportPreference: "public_transport",
    transportMode: "train",
    transportLabel: "Toy train from Neral",
    stayName: "Charlotte Lake Eco Cottage",
    stayType: "Heritage eco-stay",
    costPerNight: 1500,
    dataSource: "prototype",
    createdAt: daysAgo(45),
  },
  {
    from: "Mumbai",
    to: "Goa",
    startDate: "2026-12-20",
    endDate: "2026-12-24",
    nights: 4,
    days: 5,
    adults: 2,
    elderly: 1,
    budget: 32000,
    transportPreference: "public_transport",
    transportMode: "train",
    transportLabel: "Overnight Konkan railway",
    stayName: "Palolem Beach Accessible Huts",
    stayType: "Beach hut eco-stay",
    costPerNight: 2600,
    dataSource: "prototype",
    createdAt: daysAgo(2),
  },
];

const AARAV_ACTIVITY: ActivitySeed = {
  completedChallengeIds: ["ch-matheran-1", "ch-matheran-2", "ch-goa-1", "ch-goa-2"],
  inProgressChallengeIds: ["ch-matheran-5", "ch-manali-1"],
  posts: [
    {
      content:
        "Completed the “Use Public Transport” eco challenge today! The toy train from Neral to Matheran is still the most beautiful way to arrive without a car. 🌱",
      destinationId: "matheran",
      challengeId: "ch-matheran-1",
      daysAgo: 3,
      imageUrl:
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=700&fit=crop&auto=format",
    },
    {
      content:
        "Refilled my bottle six times on the Charlotte Lake trail — no single-use plastic for the whole trip. Small habit, big difference.",
      destinationId: "matheran",
      challengeId: "ch-matheran-2",
      daysAgo: 7,
      imageUrl: null,
    },
  ],
  reports: [
    {
      destinationId: "matheran",
      category: "accessibility",
      description:
        "The ramp near the Matheran market taxi stand has a broken handrail — difficult to use with a wheelchair.",
      status: "resolved",
      priority: "high",
      daysAgo: 9,
    },
    {
      destinationId: "goa",
      category: "waste",
      description:
        "Overflowing bins along the Palolem beach approach road. Reported to the local panchayat.",
      status: "under_review",
      priority: "medium",
      daysAgo: 4,
    },
    {
      destinationId: "matheran",
      category: "infrastructure",
      description:
        "Charlotte Lake trail marker missing after the monsoon, easy to take the wrong fork.",
      status: "submitted",
      priority: "low",
      daysAgo: 1,
    },
  ],
  savedDestinationIds: ["matheran", "munnar"],
  claimedRewardIds: ["stickers"],
  feedback: {
    rating: 4,
    comment:
      "Step-free ground floor worked well for my parents. Would like to see EV charging added.",
  },
  trips: TRIP_SEEDS,
};

const TEST_ACTIVITY: ActivitySeed = {
  completedChallengeIds: [
    "ch-matheran-1",
    "ch-matheran-2",
    "ch-matheran-3",
    "ch-goa-1",
    "ch-goa-2",
    "ch-manali-1",
  ],
  inProgressChallengeIds: ["ch-matheran-4", "ch-matheran-5"],
  posts: [
    {
      content:
        "Six eco challenges done this season — the toy train up to Matheran and the Goa beach cleanup were the highlights. 🌱",
      destinationId: "matheran",
      challengeId: "ch-matheran-1",
      daysAgo: 4,
      imageUrl:
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=700&fit=crop&auto=format",
    },
    {
      content:
        "Bought a handmade souvenir straight from a Matheran artisan — every rupee stayed in the village.",
      destinationId: "matheran",
      challengeId: "ch-matheran-3",
      daysAgo: 8,
      imageUrl: null,
    },
  ],
  reports: [
    {
      destinationId: "matheran",
      category: "accessibility",
      description:
        "The boardwalk near the market has a steep unmarked step that is hard to manage with a walker.",
      status: "resolved",
      priority: "high",
      daysAgo: 11,
    },
    {
      destinationId: "munnar",
      category: "waste",
      description:
        "Plastic wrappers collecting along the viewpoint trail off the Munnar tea estate road.",
      status: "under_review",
      priority: "medium",
      daysAgo: 6,
    },
    {
      destinationId: "goa",
      category: "water",
      description:
        "No refill point near the Palolem beach entrance — visitors are buying bottled water.",
      status: "submitted",
      priority: "low",
      daysAgo: 2,
    },
  ],
  savedDestinationIds: ["matheran", "munnar", "goa"],
  claimedRewardIds: ["stickers", "tote-bag"],
  feedback: {
    rating: 5,
    comment:
      "Genuinely plastic-free and the kitchen garden was used every morning. Would stay again.",
  },
  trips: TRIP_SEEDS,
};

const ROHAN_POSTS: PostSeed[] = [
  {
    content:
      "South Goa's Divar Island ferry is genuinely wheelchair roll-on. Quiet roads, baroque churches, almost no traffic.",
    destinationId: "goa",
    challengeId: null,
    daysAgo: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&h=700&fit=crop&auto=format",
  },
];

const SNEHA_POSTS: PostSeed[] = [
  {
    content:
      "Eravikulam's Rajamalai base trail is paved and step-free — one of the most accessible national park walks I've filmed in Kerala.",
    destinationId: "munnar",
    challengeId: null,
    daysAgo: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1200&h=700&fit=crop&auto=format",
  },
];

const COMMENT_TEXTS = [
  "That toy train ride is unbeatable. Did you get the window seats?",
  "Adding this to my accessible-trails list — thanks for the detail!",
  "Good to know the access is this good. Adding it to my list.",
  "Love that you kept the whole trip plastic-free.",
];

async function main() {
  const { db } = await import("../src/db");
  const schema = await import("../src/db/schema");
  const { destinations, attractions, challenges, businesses } = await import(
    "../src/lib/travello-data"
  );
  const { normalizeOption, buildAssumptions } = await import(
    "../src/lib/trip-schema"
  );
  const { normaliseAnswers, scoreAssessment } = await import(
    "../src/lib/hospitality"
  );
  const { GOODIES } = await import("../src/lib/rewards");

  const challengeIndex = new Map(challenges.map((challenge) => [challenge.id, challenge]));

  /* ---------------------------------------------------------------- */
  /* Nested helpers (kept inside `main` so every type is inferred)    */
  /* ---------------------------------------------------------------- */

  /** Creates or refreshes one named demo account and returns its id. */
  async function ensureUser(person: Person): Promise<string> {
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, person.email))
      .limit(1);

    if (existing[0]) {
      await db
        .update(schema.users)
        .set({
          name: person.name,
          passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
          username: person.username,
          bio: person.bio,
          avatarUrl: person.avatar,
          role: person.role,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, existing[0].id));
      return existing[0].id;
    }

    const inserted = await db
      .insert(schema.users)
      .values({
        name: person.name,
        email: person.email,
        passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
        username: person.username,
        bio: person.bio,
        avatarUrl: person.avatar,
        role: person.role,
      })
      .returning();
    return inserted[0].id;
  }

  /**
   * Finds the account the user created by hand (named “test”). Matches on
   * name/email/username, preferring an exact name match; `TEST_EMAIL` in
   * `.env.local` overrides the search.
   */
  async function findTestAccount() {
    const override = process.env.TEST_EMAIL?.trim();
    const rows = override
      ? await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, override))
          .limit(1)
      : await db
          .select()
          .from(schema.users)
          .where(
            or(
              ilike(schema.users.name, "%test%"),
              ilike(schema.users.email, "%test%"),
              ilike(schema.users.username, "%test%"),
            ),
          );

    if (rows.length === 0) return null;
    const exact = rows.find(
      (row) => (row.name ?? "").trim().toLowerCase() === "test",
    );
    return exact ?? rows[0];
  }

  /** Inserts a user's community posts and returns their new ids. */
  async function seedUserPosts(userId: string, posts: PostSeed[]) {
    const ids: string[] = [];
    for (const post of posts) {
      const [row] = await db
        .insert(schema.posts)
        .values({
          userId,
          content: post.content,
          imageUrl: post.imageUrl,
          destinationId: post.destinationId,
          challengeId: post.challengeId,
          createdAt: daysAgo(post.daysAgo),
        })
        .returning();
      ids.push(row.id);
    }
    return ids;
  }

  /** Fills one account with the complete dummy dataset. */
  async function seedActivity(userId: string, seed: ActivitySeed) {
    // Replace this account's activity so re-running is deterministic.
    await db.delete(schema.userChallenges).where(eq(schema.userChallenges.userId, userId));
    await db.delete(schema.pointEvents).where(eq(schema.pointEvents.userId, userId));
    await db.delete(schema.posts).where(eq(schema.posts.userId, userId));
    await db.delete(schema.savedDestinations).where(eq(schema.savedDestinations.userId, userId));
    await db.delete(schema.reports).where(eq(schema.reports.userId, userId));
    await db.delete(schema.trips).where(eq(schema.trips.userId, userId));
    await db.delete(schema.postReactions).where(eq(schema.postReactions.userId, userId));

    // Accessibility profile.
    await db
      .delete(schema.accessibilityProfiles)
      .where(eq(schema.accessibilityProfiles.userId, userId));

    const [profile] = await db
      .insert(schema.accessibilityProfiles)
      .values({
        userId,
        completed: true,
        mobilityDetail:
          "Travelling with my parents, who need regular rest stops and step-free access.",
        dietaryDetail: "Vegetarian household.",
      })
      .returning();

    await db.insert(schema.travelerTypes).values([
      { profileId: profile.id, type: "adults" },
      { profileId: profile.id, type: "elderly" },
    ]);

    await db.insert(schema.accessibilityRequirements).values([
      { profileId: profile.id, category: "mobility", requirement: "step_free_routes" },
      { profileId: profile.id, category: "mobility", requirement: "minimal_walking" },
      { profileId: profile.id, category: "mobility", requirement: "elevator" },
      { profileId: profile.id, category: "mobility", requirement: "rest_areas" },
    ]);

    await db.insert(schema.dietaryRequirements).values([
      { profileId: profile.id, requirement: "vegetarian" },
      { profileId: profile.id, requirement: "local_only" },
    ]);

    await db.insert(schema.travelPreferences).values({
      profileId: profile.id,
      sustainabilityWeight: 80,
      accessibilityWeight: 90,
      budgetWeight: 55,
      timeWeight: 45,
      comfortWeight: 65,
    });

    await db.insert(schema.specialRequirements).values({
      profileId: profile.id,
      content: "Prefers quiet stays and early starts; avoid long stairs.",
    });

    // Challenges and points.
    const completed = seed.completedChallengeIds
      .map((id) => challengeIndex.get(id))
      .filter((challenge): challenge is NonNullable<typeof challenge> => Boolean(challenge));

    for (const [index, challenge] of completed.entries()) {
      await db.insert(schema.userChallenges).values({
        userId,
        challengeId: challenge.id,
        status: "completed",
        progress: challenge.instructions.length,
        pointsAwarded: challenge.points,
        startedAt: daysAgo(20 - index * 2),
        completedAt: daysAgo(18 - index * 2),
      });

      await db.insert(schema.pointEvents).values({
        userId,
        points: challenge.points,
        source: "challenge",
        label: `Completed “${challenge.title}”`,
        refId: challenge.id,
        createdAt: daysAgo(18 - index * 2),
      });
    }

    for (const [index, challengeId] of seed.inProgressChallengeIds.entries()) {
      await db.insert(schema.userChallenges).values({
        userId,
        challengeId,
        status: "in_progress",
        progress: 2,
        pointsAwarded: 0,
        startedAt: daysAgo(6 - index),
      });
    }

    const challengePointsTotal = completed.reduce(
      (sum, challenge) => sum + challenge.points,
      0,
    );

    await db.insert(schema.pointEvents).values([
      {
        userId,
        points: 100,
        source: "welcome",
        label: "Welcome to Travello",
        createdAt: daysAgo(30),
      },
      {
        userId,
        points: 50,
        source: "trip",
        label: "Booked a lower-impact trip to Matheran",
        refId: "seed-trip-matheran",
        createdAt: daysAgo(12),
      },
      {
        userId,
        points: 30,
        source: "bonus",
        label: "Community report resolved",
        createdAt: daysAgo(4),
      },
    ]);

    // Confirmed trips (full itinerary JSON so the trip detail page renders).
    for (const seedTrip of seed.trips) {
      const request: TripRequestSummary = {
        from: seedTrip.from,
        to: seedTrip.to,
        startDate: seedTrip.startDate,
        endDate: seedTrip.endDate,
        adults: seedTrip.adults,
        children: 0,
        elderly: seedTrip.elderly,
        mobilitySupport: 1,
        budget: seedTrip.budget,
        transportPreference: seedTrip.transportPreference,
        priorities: ["accessible", "low_impact"],
        additionalPreferences: "",
        tripNeeds: ["minimal_walking", "frequent_rest_stops"],
        nights: seedTrip.nights,
        days: seedTrip.days,
        travelers: seedTrip.adults + seedTrip.elderly,
      };

      const raw = buildRawOption(seedTrip, request);
      const option = normalizeOption(raw, 0, request, seedTrip.dataSource);
      const assumptions = buildAssumptions(raw, request);

      await db.insert(schema.trips).values({
        userId,
        title: `${seedTrip.from} → ${seedTrip.to}`,
        fromLocation: seedTrip.from,
        toLocation: seedTrip.to,
        startDate: seedTrip.startDate,
        endDate: seedTrip.endDate,
        adults: seedTrip.adults,
        children: 0,
        elderly: seedTrip.elderly,
        mobilitySupport: 1,
        budget: seedTrip.budget,
        transportPreference: seedTrip.transportPreference,
        priorities: request.priorities,
        additionalPreferences: "",
        tripNeeds: request.tripNeeds,
        selectedOption: option.optionId,
        status: "confirmed",
        totalCost: option.summary.cost,
        estimatedCo2: option.summary.co2Kg,
        accessibilityScore: option.summary.accessibilityScore,
        sustainabilityScore: option.summary.sustainabilityScore,
        dataSource: "prototype",
        engine: "prototype",
        itineraryJson: option,
        rawItineraryJson: { engine: "prototype", option: raw },
        assumptions,
        profileSnapshot: {
          completed: true,
          travelerTypes: ["adults", "elderly"],
          mobility: ["step_free_routes", "minimal_walking", "elevator", "rest_areas"],
          visual: [],
          hearing: [],
          dietary: ["vegetarian", "local_only"],
          mobilityDetail: "Needs regular rest stops and step-free access.",
          dietaryDetail: "Vegetarian household.",
          specialRequirement: "Prefers quiet stays and early starts.",
          priorities: {
            sustainability: 80,
            accessibility: 90,
            budget: 55,
            time: 45,
            comfort: 65,
          },
        },
        createdAt: seedTrip.createdAt,
        updatedAt: seedTrip.createdAt,
      });
    }

    // Incident reports.
    await db.insert(schema.reports).values(
      seed.reports.map((report) => ({
        userId,
        destinationId: report.destinationId,
        category: report.category,
        description: report.description,
        status: report.status,
        priority: report.priority,
        createdAt: daysAgo(report.daysAgo),
      })),
    );

    // Saved destinations.
    await db
      .insert(schema.savedDestinations)
      .values(
        seed.savedDestinationIds.map((destinationId) => ({ userId, destinationId })),
      )
      .onConflictDoNothing();

    // Community posts.
    const postIds = await seedUserPosts(userId, seed.posts);

    // A traveller rating on the demo hospitality business.
    await db
      .insert(schema.businessFeedback)
      .values({
        businessId: "biz-6",
        userId,
        rating: seed.feedback.rating,
        comment: seed.feedback.comment,
        createdAt: daysAgo(3),
      })
      .onConflictDoUpdate({
        target: [schema.businessFeedback.businessId, schema.businessFeedback.userId],
        set: {
          rating: seed.feedback.rating,
          comment: seed.feedback.comment,
          updatedAt: new Date(),
        },
      });

    const totalPoints = 100 + challengePointsTotal + 50 + 30;

    // Eco Rewards: pre-claim some goodies so the page shows the claimed state
    // alongside the unlocked-but-claimable and locked cards.
    await db.delete(schema.rewardClaims).where(eq(schema.rewardClaims.userId, userId));
    for (const rewardId of seed.claimedRewardIds) {
      const goodie = GOODIES.find((item) => item.id === rewardId);
      if (!goodie) continue;
      await db.insert(schema.rewardClaims).values({
        userId,
        rewardId: goodie.id,
        rewardName: goodie.name,
        pointsAtClaim: totalPoints,
        claimedAt: daysAgo(2),
      });
    }

    return {
      points: totalPoints,
      postIds,
    };
  }

  /** Cross-likes and comments so the community feed looks alive for every account. */
  async function seedInteractions(postIdsByUser: Record<string, string[]>) {
    const owners = Object.entries(postIdsByUser);
    let commentSlot = 0;

    for (const [ownerId, postIds] of owners) {
      for (const postId of postIds.slice(0, 2)) {
        for (const [otherId] of owners) {
          if (otherId === ownerId) continue;
          await db
            .insert(schema.postReactions)
            .values({ postId, userId: otherId, reactionType: "like" })
            .onConflictDoNothing();
        }
      }

      const firstPost = postIds[0];
      if (!firstPost) continue;

      for (const [commenterId] of owners) {
        if (commenterId === ownerId) continue;
        await db.insert(schema.comments).values({
          postId: firstPost,
          userId: commenterId,
          content: COMMENT_TEXTS[commentSlot % COMMENT_TEXTS.length],
          createdAt: daysAgo(1),
        });
        commentSlot += 1;
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Catalogue                                                         */
  /* ---------------------------------------------------------------- */

  console.log("→ Seeding catalogue…");

  for (const destination of destinations) {
    await db
      .insert(schema.destinations)
      .values({
        id: destination.id,
        name: destination.name,
        region: destination.region,
        country: destination.country,
        description: destination.description,
        heroImageUrl: destination.heroImageUrl,
        sustainabilityScore: destination.sustainabilityScore,
        visitorPressure: destination.visitorPressure,
        wastePressure: destination.wastePressure,
        waterPressure: destination.waterPressure,
        environmentalSensitivity: destination.environmentalSensitivity,
        crowdLevel: destination.crowdLevel,
        accessibilitySummary: destination.accessibilitySummary,
        factors: destination.factors,
        accessibility: destination.accessibility,
        tags: destination.tags,
        image: destination.image,
      })
      .onConflictDoUpdate({
        target: schema.destinations.id,
        set: {
          name: destination.name,
          description: destination.description,
          sustainabilityScore: destination.sustainabilityScore,
          factors: destination.factors,
          accessibility: destination.accessibility,
          tags: destination.tags,
          image: destination.image,
        },
      });
  }

  for (const attraction of attractions) {
    await db
      .insert(schema.attractions)
      .values({
        id: attraction.id,
        destinationId: attraction.destinationId,
        name: attraction.name,
        description: attraction.description,
        crowdLevel: attraction.crowdLevel,
        sustainabilityScore: attraction.sustainabilityScore,
        accessibilityScore: attraction.accessibilityScore,
        estimatedCost: attraction.estimatedCost,
        travelTime: attraction.travelTime,
        image: attraction.image,
        alternativeId: attraction.alternativeId ?? null,
      })
      .onConflictDoUpdate({
        target: schema.attractions.id,
        set: {
          name: attraction.name,
          sustainabilityScore: attraction.sustainabilityScore,
          accessibilityScore: attraction.accessibilityScore,
          image: attraction.image,
        },
      });
  }

  for (const challenge of challenges) {
    await db
      .insert(schema.challenges)
      .values({
        id: challenge.id,
        destinationId: challenge.destinationId,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        difficulty: challenge.difficulty,
        points: challenge.points,
        estimatedMinutes: challenge.estimatedMinutes,
        instructions: challenge.instructions,
        evidenceRequired: challenge.evidenceRequired,
        whyItMatters: challenge.whyItMatters,
        icon: challenge.icon,
      })
      .onConflictDoUpdate({
        target: schema.challenges.id,
        set: {
          title: challenge.title,
          description: challenge.description,
          points: challenge.points,
          instructions: challenge.instructions,
          whyItMatters: challenge.whyItMatters,
          icon: challenge.icon,
        },
      });
  }

  /* ---------------------------------------------------------------- */
  /* Accounts                                                          */
  /* ---------------------------------------------------------------- */

  console.log("→ Seeding demo accounts…");

  const aaravId = await ensureUser(AARAV);
  const rohanId = await ensureUser(ROHAN);
  const snehaId = await ensureUser(SNEHA);

  const testAccount = await findTestAccount();
  if (testAccount) {
    console.log(
      `   Found the account to fill: “${testAccount.name}” <${testAccount.email}>`,
    );
  } else {
    console.warn(
      "   No account matching “test” found — skipping it. Sign up with a name like",
    );
    console.warn(
      "   “test”, or set TEST_EMAIL in .env.local to its email, then re-run.",
    );
  }

  /* ---------------------------------------------------------------- */
  /* Activity                                                          */
  /* ---------------------------------------------------------------- */

  console.log("→ Seeding Aarav's activity…");
  const aaravResult = await seedActivity(aaravId, AARAV_ACTIVITY);
  console.log(
    `   Aarav total = 100 welcome + challenges + 50 trip + 30 bonus = ${aaravResult.points} pts`,
  );

  // Rohan and Sneha keep light, community-only rows (one post each).
  await db.delete(schema.posts).where(eq(schema.posts.userId, rohanId));
  await db.delete(schema.posts).where(eq(schema.posts.userId, snehaId));
  const rohanPostIds = await seedUserPosts(rohanId, ROHAN_POSTS);
  const snehaPostIds = await seedUserPosts(snehaId, SNEHA_POSTS);

  const postIdsByUser: Record<string, string[]> = {
    [aaravId]: aaravResult.postIds,
    [rohanId]: rohanPostIds,
    [snehaId]: snehaPostIds,
  };

  if (testAccount) {
    console.log("→ Seeding the “test” account's activity…");
    const testResult = await seedActivity(testAccount.id, TEST_ACTIVITY);
    postIdsByUser[testAccount.id] = testResult.postIds;
    console.log(
      `   test total = 100 welcome + challenges + 50 trip + 30 bonus = ${testResult.points} pts`,
    );
  }

  console.log("→ Seeding community interactions…");
  await seedInteractions(postIdsByUser);

  /* ---------------------------------------------------------------- */
  /* Sustainable hospitality                                          */
  /* ---------------------------------------------------------------- */

  console.log("→ Seeding sustainable hospitality…");

  for (const business of businesses) {
    await db
      .insert(schema.businesses)
      .values({
        id: business.id,
        destinationId: business.destinationId,
        name: business.name,
        type: business.type,
        description: business.description,
        imageUrl: business.imageUrl,
        locality: business.locality,
        priceRange: business.priceRange,
        accessibilitySummary: business.accessibilitySummary,
        sustainabilityPractices: business.sustainabilityPractices,
        accessibilityFeatures: business.accessibilityFeatures,
      })
      .onConflictDoUpdate({
        target: schema.businesses.id,
        set: {
          name: business.name,
          type: business.type,
          description: business.description,
          imageUrl: business.imageUrl,
          locality: business.locality,
          priceRange: business.priceRange,
          accessibilitySummary: business.accessibilitySummary,
          sustainabilityPractices: business.sustainabilityPractices,
          accessibilityFeatures: business.accessibilityFeatures,
        },
      });
  }

  /**
   * One assessed demo business — Green Valley Resort, Munnar. Its score is not
   * written here: the same `scoreAssessment` the API uses scores these answers,
   * so the number on screen can never drift from the checklist behind it.
   */
  const assessedBusinessId = "biz-6";
  await db
    .delete(schema.businessAssessments)
    .where(eq(schema.businessAssessments.businessId, assessedBusinessId));

  const greenValleyAnswers = normaliseAnswers({
    food: { "food-monitored": true, "food-reused": true },
    water: { "water-monitored": true, "water-saving": false },
    energy: { "energy-efficient": true, "energy-monitored": true },
    transport: { "transport-shared": true, "transport-ev": false },
    waste: { "waste-segregated": true, "waste-plastic": true },
  });
  const greenValleyScore = scoreAssessment(greenValleyAnswers);

  await db.insert(schema.businessAssessments).values({
    businessId: assessedBusinessId,
    answers: greenValleyAnswers,
    overallScore: greenValleyScore.overallScore,
    categoryScores: greenValleyScore.categoryScores,
    suggestions: greenValleyScore.suggestions,
    submittedByUserId: null,
    createdAt: daysAgo(6),
  });

  console.log(
    `   Green Valley Resort scored ${greenValleyScore.overallScore}/100 from its checklist`,
  );

  const feedbackSeeds = [
    {
      userId: rohanId,
      rating: 4,
      comment:
        "Solar and rainwater harvesting are real here, but the transport to town is still a diesel shuttle.",
    },
    {
      userId: snehaId,
      rating: 5,
      comment:
        "No single-use plastic anywhere on the property and the kitchen garden is genuinely used.",
    },
    ...(testAccount
      ? [
          {
            userId: testAccount.id,
            rating: 5,
            comment:
              "Genuinely plastic-free and the kitchen garden was used every morning. Would stay again.",
          },
        ]
      : []),
  ];

  for (const feedback of feedbackSeeds) {
    await db
      .insert(schema.businessFeedback)
      .values({
        businessId: assessedBusinessId,
        userId: feedback.userId,
        rating: feedback.rating,
        comment: feedback.comment,
        createdAt: daysAgo(3),
      })
      .onConflictDoUpdate({
        target: [
          schema.businessFeedback.businessId,
          schema.businessFeedback.userId,
        ],
        set: {
          rating: feedback.rating,
          comment: feedback.comment,
          updatedAt: new Date(),
        },
      });
  }

  console.log("\n✅ Seed complete.");
  console.log(`   Demo login: ${AARAV.email} / ${DEMO_PASSWORD}`);
  if (testAccount) {
    console.log(
      `   Filled account: ${testAccount.name} <${testAccount.email}> (password unchanged)`,
    );
  }
}

/** Builds the raw (pre-normalization) engine payload for a seeded trip. */
function buildRawOption(
  seed: {
    from: string;
    to: string;
    transportMode: string;
    transportLabel: string;
    stayName: string;
    stayType: string;
    costPerNight: number;
  },
  request: TripRequestSummary,
): AiOption {
  const accessibility = "Step-free route planned with rest stops; lift access at the stay.";

  const days: AiOption["days"] = [];
  for (let index = 0; index < request.days; index += 1) {
    const isFirst = index === 0;
    const isLast = index === request.days - 1 && request.days > 1;
    days.push({
      day: index + 1,
      title: isFirst
        ? "Travel and settle in"
        : isLast
          ? "Last morning and journey home"
          : "Gentle exploring",
      summary: isFirst
        ? `Head from ${seed.from} to ${seed.to} and keep the first afternoon light.`
        : isLast
          ? "A slow final morning, then the return journey with buffer time."
          : "A low-pace day with shaded stops and plenty of seating.",
      activities: [
        {
          time: isFirst ? "08:00" : "09:30",
          title: isFirst
            ? `${seed.transportLabel} to ${seed.to}`
            : "Accessible viewpoint visit",
          location: isFirst ? `${seed.from} → ${seed.to}` : seed.to,
          transport: isFirst ? seed.transportMode : "Walk",
          cost: isFirst ? 0 : 450,
          accessibility,
          sustainability: "Lower-impact option where the route allows.",
          co2Kg: 0,
        },
        {
          time: "13:00",
          title: isFirst ? "Check-in and rest" : "Locally-sourced lunch",
          location: seed.to,
          transport: "Walk",
          cost: isFirst ? 0 : 600,
          accessibility: "Step-free seating and accessible washrooms.",
          sustainability: "Locally sourced menu.",
          co2Kg: 0,
        },
        {
          time: "19:00",
          title: "Dinner nearby",
          location: seed.to,
          transport: "Walk",
          cost: 700,
          accessibility: "Written menu and step-free entry.",
          sustainability: "Locally sourced menu.",
          co2Kg: 0,
        },
      ],
    });
  }

  return {
    optionId: "option_a",
    title: "Low-Impact & Accessible",
    tagline: "Lower estimated emissions with an easy, step-free pace",
    description: `A ${request.days}-day plan from ${seed.from} to ${seed.to} built around lower-impact travel and step-free stops.`,
    focus: ["Lower estimated CO₂", "Strong accessibility", "Lower-impact stay"],
    highlights: [
      "Train-based travel where the route allows",
      "Step-free viewpoints with seating",
      "Locally-run, lower-impact accommodation",
    ],
    safetyNotes: accessibility,
    transport: {
      mode: seed.transportMode,
      label: seed.transportLabel,
      notes: "Slower but lower-impact where the route allows.",
      cost: 0,
    },
    stay: {
      name: seed.stayName,
      type: seed.stayType,
      costPerNight: seed.costPerNight,
      accessibilityScore: 88,
      sustainabilityScore: 86,
      features: [
        "Prototype: step-free access",
        "Prototype: lift",
        "Prototype: local sourcing",
      ],
      notes: "Prototype planning attributes — confirm with the property before booking.",
    },
    experiences: [
      {
        title: "Accessible viewpoint",
        description: "A shorter route to a level lookout with seating.",
        accessibilityScore: 90,
        sustainabilityLabel: "Lower impact",
        cost: 250,
      },
      {
        title: "Locally-sourced meal",
        description: "A small, quieter restaurant with a written menu.",
        accessibilityScore: 86,
        sustainabilityLabel: "Lower impact",
        cost: 400,
      },
    ],
    accessibilityScore: 88,
    sustainabilityScore: 86,
    days,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
