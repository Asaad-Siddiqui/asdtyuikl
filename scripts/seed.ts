/**
 * Seeds the Travello catalogue and one fully-populated demo account.
 *
 * Run with:  npx tsx scripts/seed.ts
 *
 * Everything is idempotent: catalogue rows are upserted and the demo users'
 * dependent rows are replaced, so the same numbers show up on every page after
 * re-running. One account — Aarav Mehta — tells one consistent story:
 * 4 completed challenges + welcome bonus + a resolved report + a booked trip
 * = 275 impact points, shown identically on Dashboard, Profile, Challenges,
 * Impact and Reports.
 */

import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

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

async function main() {
  const { db } = await import("../src/db");
  const schema = await import("../src/db/schema");
  const { destinations, attractions, challenges } = await import(
    "../src/lib/travello-data"
  );
  const { normalizeOption, buildAssumptions } = await import(
    "../src/lib/trip-schema"
  );

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

  console.log("→ Seeding demo accounts…");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const people = [AARAV, ROHAN, SNEHA];
  const ids: Record<string, string> = {};

  for (const person of people) {
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
          passwordHash,
          username: person.username,
          bio: person.bio,
          avatarUrl: person.avatar,
          role: person.role,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, existing[0].id));
      ids[person.email] = existing[0].id;
    } else {
      const inserted = await db
        .insert(schema.users)
        .values({
          name: person.name,
          email: person.email,
          passwordHash,
          username: person.username,
          bio: person.bio,
          avatarUrl: person.avatar,
          role: person.role,
        })
        .returning();
      ids[person.email] = inserted[0].id;
    }
  }

  const aaravId = ids[AARAV.email];
  const rohanId = ids[ROHAN.email];
  const snehaId = ids[SNEHA.email];

  // Clear Aarav's activity so the seed is deterministic on re-run. Scoped to
  // this account only — we never touch other users' data.
  await db.delete(schema.userChallenges).where(eq(schema.userChallenges.userId, aaravId));
  await db.delete(schema.pointEvents).where(eq(schema.pointEvents.userId, aaravId));
  await db.delete(schema.posts).where(eq(schema.posts.userId, aaravId));
  await db.delete(schema.savedDestinations).where(eq(schema.savedDestinations.userId, aaravId));
  await db.delete(schema.reports).where(eq(schema.reports.userId, aaravId));
  await db.delete(schema.trips).where(eq(schema.trips.userId, aaravId));
  await db.delete(schema.postReactions).where(eq(schema.postReactions.userId, aaravId));

  console.log("→ Seeding Aarav's accessibility profile…");

  await db
    .delete(schema.accessibilityProfiles)
    .where(eq(schema.accessibilityProfiles.userId, aaravId));

  const [profile] = await db
    .insert(schema.accessibilityProfiles)
    .values({
      userId: aaravId,
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

  console.log("→ Seeding challenges, points and impact…");

  const completedChallenges = [
    { id: "ch-matheran-1", label: "Waste-Free Trail", points: 25 },
    { id: "ch-matheran-2", label: "Refill Champion", points: 20 },
    { id: "ch-goa-1", label: "Beach Cleanup Warrior", points: 30 },
    { id: "ch-goa-2", label: "Local Food Explorer", points: 20 },
  ];
  const inProgressChallenges = ["ch-matheran-5", "ch-manali-1"];

  const daysAgo = (days: number) =>
    new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  for (const [index, challenge] of completedChallenges.entries()) {
    await db.insert(schema.userChallenges).values({
      userId: aaravId,
      challengeId: challenge.id,
      status: "completed",
      progress: 1,
      pointsAwarded: challenge.points,
      startedAt: daysAgo(20 - index * 3),
      completedAt: daysAgo(18 - index * 3),
    });

    await db.insert(schema.pointEvents).values({
      userId: aaravId,
      points: challenge.points,
      source: "challenge",
      label: `Completed “${challenge.label}”`,
      refId: challenge.id,
      createdAt: daysAgo(18 - index * 3),
    });
  }

  for (const [index, challengeId] of inProgressChallenges.entries()) {
    await db.insert(schema.userChallenges).values({
      userId: aaravId,
      challengeId,
      status: "in_progress",
      progress: 2,
      pointsAwarded: 0,
      startedAt: daysAgo(6 - index),
    });
  }

  const challengePointsTotal = completedChallenges.reduce(
    (sum, challenge) => sum + challenge.points,
    0,
  );

  await db.insert(schema.pointEvents).values([
    {
      userId: aaravId,
      points: 100,
      source: "welcome",
      label: "Welcome to Travello",
      createdAt: daysAgo(30),
    },
    {
      userId: aaravId,
      points: 50,
      source: "trip",
      label: "Booked a lower-impact trip to Matheran",
      refId: "seed-trip-matheran",
      createdAt: daysAgo(12),
    },
    {
      userId: aaravId,
      points: 30,
      source: "bonus",
      label: "Community report resolved",
      createdAt: daysAgo(4),
    },
  ]);

  const totalPoints = 100 + challengePointsTotal + 50 + 30;
  console.log(
    `   Aarav total = 100 welcome + ${challengePointsTotal} challenges + 50 trip + 30 bonus = ${totalPoints} pts`,
  );

  console.log("→ Seeding trips…");

  const tripSeeds: {
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
  }[] = [
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

  for (const seed of tripSeeds) {
    const request: TripRequestSummary = {
      from: seed.from,
      to: seed.to,
      startDate: seed.startDate,
      endDate: seed.endDate,
      adults: seed.adults,
      children: 0,
      elderly: seed.elderly,
      mobilitySupport: 1,
      budget: seed.budget,
      transportPreference: seed.transportPreference,
      priorities: ["accessible", "low_impact"],
      additionalPreferences: "",
      tripNeeds: ["minimal_walking", "frequent_rest_stops"],
      nights: seed.nights,
      days: seed.days,
      travelers: seed.adults + seed.elderly,
    };

    const raw = buildRawOption(seed, request);
    const option = normalizeOption(raw, 0, request, seed.dataSource);
    const assumptions = buildAssumptions(raw, request);

    await db.insert(schema.trips).values({
      userId: aaravId,
      title: `${seed.from} → ${seed.to}`,
      fromLocation: seed.from,
      toLocation: seed.to,
      startDate: seed.startDate,
      endDate: seed.endDate,
      adults: seed.adults,
      children: 0,
      elderly: seed.elderly,
      mobilitySupport: 1,
      budget: seed.budget,
      transportPreference: seed.transportPreference,
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
      createdAt: seed.createdAt,
      updatedAt: seed.createdAt,
    });
  }

  console.log("→ Seeding reports and community…");

  await db.insert(schema.reports).values([
    {
      userId: aaravId,
      destinationId: "matheran",
      category: "accessibility",
      description:
        "The ramp near the Matheran market taxi stand has a broken handrail — difficult to use with a wheelchair.",
      status: "resolved",
      priority: "high",
      createdAt: daysAgo(9),
    },
    {
      userId: aaravId,
      destinationId: "goa",
      category: "waste",
      description:
        "Overflowing bins along the Palolem beach approach road. Reported to the local panchayat.",
      status: "under_review",
      priority: "medium",
      createdAt: daysAgo(4),
    },
    {
      userId: aaravId,
      destinationId: "matheran",
      category: "infrastructure",
      description:
        "Charlotte Lake trail marker missing after the monsoon, easy to take the wrong fork.",
      status: "submitted",
      priority: "low",
      createdAt: daysAgo(1),
    },
  ]);

  const postSeeds = [
    {
      userId: aaravId,
      content:
        "Completed the “Use Public Transport” eco challenge today! The toy train from Neral to Matheran is still the most beautiful way to arrive without a car. 🌱",
      destinationId: "matheran",
      challengeId: "ch-matheran-1",
      daysAgo: 3,
      imageUrl:
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=700&fit=crop&auto=format",
    },
    {
      userId: aaravId,
      content:
        "Refilled my bottle six times on the Charlotte Lake trail — no single-use plastic for the whole trip. Small habit, big difference.",
      destinationId: "matheran",
      challengeId: "ch-matheran-2",
      daysAgo: 7,
      imageUrl: null,
    },
    {
      userId: rohanId,
      content:
        "South Goa's Divar Island ferry is genuinely wheelchair roll-on. Quiet roads, baroque churches, almost no traffic.",
      destinationId: "goa",
      challengeId: null,
      daysAgo: 2,
      imageUrl:
        "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&h=700&fit=crop&auto=format",
    },
    {
      userId: snehaId,
      content:
        "Eravikulam's Rajamalai base trail is paved and step-free — one of the most accessible national park walks I've filmed in Kerala.",
      destinationId: "munnar",
      challengeId: null,
      daysAgo: 1,
      imageUrl:
        "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1200&h=700&fit=crop&auto=format",
    },
  ];

  const postIds: string[] = [];
  for (const post of postSeeds) {
    const [row] = await db
      .insert(schema.posts)
      .values({
        userId: post.userId,
        content: post.content,
        imageUrl: post.imageUrl,
        destinationId: post.destinationId,
        challengeId: post.challengeId,
        createdAt: daysAgo(post.daysAgo),
      })
      .returning();
    postIds.push(row.id);
  }

  const reactions: { postId: string; userId: string }[] = [
    { postId: postIds[0], userId: rohanId },
    { postId: postIds[0], userId: snehaId },
    { postId: postIds[1], userId: snehaId },
    { postId: postIds[2], userId: aaravId },
    { postId: postIds[3], userId: aaravId },
    { postId: postIds[3], userId: rohanId },
  ];
  for (const reaction of reactions) {
    await db
      .insert(schema.postReactions)
      .values({ ...reaction, reactionType: "like" })
      .onConflictDoNothing();
  }

  await db.insert(schema.comments).values([
    {
      postId: postIds[0],
      userId: rohanId,
      content: "That toy train ride is unbeatable. Did you get the window seats?",
      createdAt: daysAgo(3),
    },
    {
      postId: postIds[0],
      userId: snehaId,
      content: "Adding this to my accessible-trails list — thanks for the detail!",
      createdAt: daysAgo(2),
    },
    {
      postId: postIds[2],
      userId: aaravId,
      content: "Good to know the ferry has roll-on access. Planning Goa for December.",
      createdAt: daysAgo(1),
    },
  ]);

  await db
    .insert(schema.savedDestinations)
    .values([
      { userId: aaravId, destinationId: "matheran" },
      { userId: aaravId, destinationId: "munnar" },
    ])
    .onConflictDoNothing();

  console.log("→ Seeding sustainable hospitality…");

  const { businesses } = await import("../src/lib/travello-data");
  const { normaliseAnswers, scoreAssessment } = await import(
    "../src/lib/hospitality"
  );

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
    {
      userId: aaravId,
      rating: 4,
      comment:
        "Step-free ground floor worked well for my parents. Would like to see EV charging added.",
    },
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
  console.log(`   Impact points: ${totalPoints}`);
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
