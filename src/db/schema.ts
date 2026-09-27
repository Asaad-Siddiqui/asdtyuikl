import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Users
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    /** Public handle shown on the profile and community feed. */
    username: text("username"),
    /** Short traveller bio. */
    bio: text("bio"),
    /** Remote avatar URL, or null to fall back to initials. */
    avatarUrl: text("avatar_url"),
    /** "traveler" | "creator" | "manager" — drives the profile persona toggle. */
    role: text("role").notNull().default("traveler"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique_idx").on(table.email)],
);

/**
 * One accessibility profile per user.
 * `completed` distinguishes a started-but-unfinished questionnaire from a
 * finished one. Phase 2+ features (carbon, itineraries) hang off this row.
 */
export const accessibilityProfiles = pgTable(
  "accessibility_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    completed: boolean("completed").notNull().default(false),
    /** Optional free text captured alongside the mobility step. */
    mobilityDetail: text("mobility_detail"),
    /** Optional free text captured alongside the dietary step. */
    dietaryDetail: text("dietary_detail"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("accessibility_profiles_user_unique_idx").on(table.userId),
  ],
);

/**
 * Step 1 — who the traveller is travelling with (multi-select).
 */
export const travelerTypes = pgTable(
  "traveler_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => accessibilityProfiles.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
  },
  (table) => [
    uniqueIndex("traveler_types_profile_type_unique_idx").on(
      table.profileId,
      table.type,
    ),
    index("traveler_types_profile_idx").on(table.profileId),
  ],
);

/**
 * Steps 2–4 — structured accessibility requirements, grouped by category
 * (mobility | visual | hearing). Stored as a slug plus an explicit boolean so
 * the data stays queryable and future scoring can weight individual needs.
 */
export const accessibilityRequirements = pgTable(
  "accessibility_requirements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => accessibilityProfiles.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    requirement: text("requirement").notNull(),
    selected: boolean("selected").notNull().default(true),
  },
  (table) => [
    uniqueIndex("accessibility_requirements_unique_idx").on(
      table.profileId,
      table.category,
      table.requirement,
    ),
    index("accessibility_requirements_profile_idx").on(table.profileId),
  ],
);

/**
 * Step 5 — dietary requirements.
 */
export const dietaryRequirements = pgTable(
  "dietary_requirements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => accessibilityProfiles.id, { onDelete: "cascade" }),
    requirement: text("requirement").notNull(),
  },
  (table) => [
    uniqueIndex("dietary_requirements_profile_requirement_unique_idx").on(
      table.profileId,
      table.requirement,
    ),
    index("dietary_requirements_profile_idx").on(table.profileId),
  ],
);

/**
 * Step 6 — travel preference weights (0–100).
 */
export const travelPreferences = pgTable(
  "travel_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => accessibilityProfiles.id, { onDelete: "cascade" }),
    sustainabilityWeight: integer("sustainability_weight").notNull().default(50),
    accessibilityWeight: integer("accessibility_weight").notNull().default(50),
    budgetWeight: integer("budget_weight").notNull().default(50),
    timeWeight: integer("time_weight").notNull().default(50),
    comfortWeight: integer("comfort_weight").notNull().default(50),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("travel_preferences_profile_unique_idx").on(table.profileId),
  ],
);

/**
 * Free-text requirements captured at the end of the questionnaire.
 * Deliberately a separate table from the structured selections.
 */
export const specialRequirements = pgTable(
  "special_requirements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => accessibilityProfiles.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("special_requirements_profile_idx").on(table.profileId),
  ],
);

/**
 * A confirmed, saved trip. Only created when the traveller clicks
 * "Confirm itinerary" — drafts live in the browser, never here.
 *
 * `itinerary_json` holds the application-owned normalized itinerary (never
 * raw AI text) that every screen and the PDF render from. `raw_itinerary_json`
 * keeps the pre-normalization payload for auditing; it is never shown to a
 * user. Every query against this table must be scoped to the session user.
 */
export const trips = pgTable(
  "trips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    fromLocation: text("from_location").notNull(),
    toLocation: text("to_location").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    adults: integer("adults").notNull().default(1),
    children: integer("children").notNull().default(0),
    elderly: integer("elderly").notNull().default(0),
    mobilitySupport: integer("mobility_support").notNull().default(0),
    budget: integer("budget").notNull().default(0),
    transportPreference: text("transport_preference").notNull().default(""),
    priorities: jsonb("priorities")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    additionalPreferences: text("additional_preferences")
      .notNull()
      .default(""),
    tripNeeds: jsonb("trip_needs")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    selectedOption: text("selected_option").notNull(),
    status: text("status").notNull().default("confirmed"),
    totalCost: integer("total_cost").notNull().default(0),
    estimatedCo2: real("estimated_co2").notNull().default(0),
    accessibilityScore: integer("accessibility_score").notNull().default(0),
    sustainabilityScore: integer("sustainability_score").notNull().default(0),
    /** "ai" | "prototype" — prototype plans are labelled in the UI. */
    dataSource: text("data_source").notNull().default("prototype"),
    engine: text("engine").notNull().default("prototype"),
    itineraryJson: jsonb("itinerary_json").$type<unknown>().notNull(),
    rawItineraryJson: jsonb("raw_itinerary_json").$type<unknown>().notNull(),
    assumptions: jsonb("assumptions")
      .$type<unknown>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    /** Server-derived snapshot of the accessibility profile at confirm time. */
    profileSnapshot: jsonb("profile_snapshot")
      .$type<unknown>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("trips_user_idx").on(table.userId),
    index("trips_user_created_idx").on(table.userId, table.createdAt),
  ],
);

/**
 * ─── Travello catalogue & social domain ────────────────────────────────
 *
 * `destinations`, `attractions` and `challenges` are curated catalogue data
 * (seeded from the prototype content) — they are the single source of truth
 * for Explore, Challenges, Impact and Reports. Everything a user does
 * (`user_challenges`, `point_events`, `posts`, `reports`, `saved_destinations`)
 * references these rows plus `users.id`, so the same numbers appear on every
 * page for the same account.
 */

export type DestinationFactor = {
  factor: string;
  score: number;
  explanation: string;
  icon: string;
};

export type DestinationAccessibility = {
  wheelchairAccessible: boolean;
  stepFreeRoutes: boolean;
  accessibleToilets: boolean;
  elevator: boolean;
  accessibleParking: boolean;
  lowWalkingRequirement: boolean;
  trailDifficulty: string;
  notes: string;
};

export const destinations = pgTable("destinations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  country: text("country").notNull(),
  description: text("description").notNull(),
  heroImageUrl: text("hero_image_url").notNull(),
  sustainabilityScore: integer("sustainability_score").notNull().default(0),
  visitorPressure: text("visitor_pressure").notNull().default("Low"),
  wastePressure: text("waste_pressure").notNull().default("Low"),
  waterPressure: text("water_pressure").notNull().default("Low"),
  environmentalSensitivity: text("environmental_sensitivity")
    .notNull()
    .default("Low"),
  crowdLevel: text("crowd_level").notNull().default("Low"),
  accessibilitySummary: text("accessibility_summary").notNull().default(""),
  factors: jsonb("factors")
    .$type<DestinationFactor[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  accessibility: jsonb("accessibility")
    .$type<DestinationAccessibility>()
    .notNull(),
  tags: jsonb("tags")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  image: text("image").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const attractions = pgTable(
  "attractions",
  {
    id: text("id").primaryKey(),
    destinationId: text("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    crowdLevel: text("crowd_level").notNull().default("Low"),
    sustainabilityScore: integer("sustainability_score").notNull().default(0),
    accessibilityScore: integer("accessibility_score").notNull().default(0),
    estimatedCost: integer("estimated_cost").notNull().default(0),
    travelTime: text("travel_time").notNull().default(""),
    image: text("image").notNull().default(""),
    alternativeId: text("alternative_id"),
  },
  (table) => [index("attractions_destination_idx").on(table.destinationId)],
);

export const challenges = pgTable(
  "challenges",
  {
    id: text("id").primaryKey(),
    destinationId: text("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    difficulty: text("difficulty").notNull(),
    points: integer("points").notNull().default(0),
    estimatedMinutes: integer("estimated_minutes").notNull().default(0),
    instructions: jsonb("instructions")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    evidenceRequired: boolean("evidence_required").notNull().default(true),
    whyItMatters: text("why_it_matters").notNull().default(""),
    icon: text("icon").notNull().default("🌱"),
  },
  (table) => [index("challenges_destination_idx").on(table.destinationId)],
);

/** A user's relationship to one challenge. One row per (user, challenge). */
export const userChallenges = pgTable(
  "user_challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    /** "in_progress" | "completed" */
    status: text("status").notNull().default("in_progress"),
    progress: integer("progress").notNull().default(0),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("user_challenges_user_challenge_unique_idx").on(
      table.userId,
      table.challengeId,
    ),
    index("user_challenges_user_idx").on(table.userId),
  ],
);

/**
 * Append-only points ledger. Dashboard, Profile, Challenges, Impact, Reports
 * and Community all read totals from here, so a single action can never show
 * two different point values.
 */
export const pointEvents = pgTable(
  "point_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    points: integer("points").notNull(),
    /** "challenge" | "trip" | "bonus" | "welcome" */
    source: text("source").notNull(),
    label: text("label").notNull(),
    /** Optional reference to the row that earned the points. */
    refId: text("ref_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("point_events_user_idx").on(table.userId),
    index("point_events_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    destinationId: text("destination_id"),
    /** Set when the post celebrates a completed challenge. */
    challengeId: text("challenge_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("posts_created_idx").on(table.createdAt)],
);

export const postReactions = pgTable(
  "post_reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reactionType: text("reaction_type").notNull().default("like"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("post_reactions_post_user_unique_idx").on(
      table.postId,
      table.userId,
    ),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("comments_post_idx").on(table.postId)],
);

export const savedDestinations = pgTable(
  "saved_destinations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    destinationId: text("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("saved_destinations_user_destination_unique_idx").on(
      table.userId,
      table.destinationId,
    ),
  ],
);

/** Community-submitted sustainability/accessibility incident reports. */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    destinationId: text("destination_id").notNull(),
    category: text("category").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull().default("submitted"),
    priority: text("priority").notNull().default("medium"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("reports_user_idx").on(table.userId)],
);

/*
 * ─── Sustainable Hospitality ───────────────────────────────────────────
 *
 * A small feature bolted onto the existing catalogue: hospitality businesses
 * self-assess against a five-category checklist, and travellers rate them
 * afterwards.
 *
 * Note what is deliberately NOT stored on the business row: `sustainabilityScore`,
 * `rating` and `reviews`. Those used to be hardcoded fixture numbers. The
 * business score is now derived from its latest assessment and the traveller
 * score from aggregated feedback, so the two can never be confused and a score
 * can always be traced back to the answers that produced it.
 *
 * Three tables, no more: the profile, the assessment (which stores both the raw
 * answers and the scores derived from them) and the feedback.
 */

export type BusinessAccessibilityFeature = {
  feature: string;
  available: boolean;
};

/** One business's self-assessment answers, keyed `category -> question -> yes/no`. */
export type BusinessAssessmentAnswers = Record<
  string,
  Record<string, boolean>
>;

export type BusinessSuggestion = {
  category: string;
  title: string;
  advice: string;
};

export const businesses = pgTable(
  "businesses",
  {
    id: text("id").primaryKey(),
    destinationId: text("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** "homestay" | "resort" | "restaurant" | "experience" | "lodge" | "hotel" */
    type: text("type").notNull(),
    description: text("description").notNull(),
    imageUrl: text("image_url").notNull().default(""),
    /** Nearest town or estate, shown under the name. */
    locality: text("locality").notNull().default(""),
    priceRange: text("price_range").notNull().default(""),
    accessibilitySummary: text("accessibility_summary").notNull().default(""),
    sustainabilityPractices: jsonb("sustainability_practices")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    accessibilityFeatures: jsonb("accessibility_features")
      .$type<BusinessAccessibilityFeature[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("businesses_destination_idx").on(table.destinationId)],
);

/**
 * One submitted checklist. Append-only: every submission is kept so the score
 * history is auditable, and "the current score" is simply the newest row.
 * `answers` is the raw response set; `overall_score` and `category_scores` are
 * computed from it server-side on the way in, never supplied by the client.
 */
export const businessAssessments = pgTable(
  "business_assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    answers: jsonb("answers")
      .$type<BusinessAssessmentAnswers>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    overallScore: integer("overall_score").notNull().default(0),
    categoryScores: jsonb("category_scores")
      .$type<Record<string, number>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    /** The 1–2 weakest categories at submit time, with the advice shown for them. */
    suggestions: jsonb("suggestions")
      .$type<BusinessSuggestion[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    /** Null when the assessment was loaded by the seeder rather than by a person. */
    submittedByUserId: uuid("submitted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("business_assessments_business_idx").on(
      table.businessId,
      table.createdAt,
    ),
  ],
);

/**
 * A traveller's sustainability rating for a place they visited.
 *
 * One row per (traveller, business) — re-rating updates the existing row rather
 * than inflating the average, which is what makes the traveller score
 * trustworthy. Never mixed with the business's own self-assessment score.
 */
export const businessFeedback = pgTable(
  "business_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** 1–5 stars, validated on the server. */
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("business_feedback_business_user_unique_idx").on(
      table.businessId,
      table.userId,
    ),
    index("business_feedback_business_idx").on(table.businessId),
  ],
);

/**
 * Eco Rewards — one row per (traveller, goodie) once claimed. Rewards are
 * unlocked by eco-challenge points (achievement progress, never spent), so the
 * only state we must persist is the claim itself: refreshing the page or
 * re-running the seed must not lose or duplicate it.
 */
export const rewardClaims = pgTable(
  "reward_claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Slug from the goodies catalogue, e.g. "tote-bag". */
    rewardId: text("reward_id").notNull(),
    /** Snapshot of the reward name at claim time, for auditability. */
    rewardName: text("reward_name").notNull(),
    /** Points total the traveller had when they claimed. Not deducted. */
    pointsAtClaim: integer("points_at_claim").notNull().default(0),
    claimedAt: timestamp("claimed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("reward_claims_user_reward_unique_idx").on(
      table.userId,
      table.rewardId,
    ),
    index("reward_claims_user_idx").on(table.userId),
  ],
);

export type Business = typeof businesses.$inferSelect;
export type BusinessAssessment = typeof businessAssessments.$inferSelect;
export type BusinessFeedback = typeof businessFeedback.$inferSelect;

export type Destination = typeof destinations.$inferSelect;
export type Attraction = typeof attractions.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type PointEvent = typeof pointEvents.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostReaction = typeof postReactions.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type SavedDestination = typeof savedDestinations.$inferSelect;
export type Report = typeof reports.$inferSelect;

export type User = typeof users.$inferSelect;
export type AccessibilityProfile = typeof accessibilityProfiles.$inferSelect;
export type TravelerType = typeof travelerTypes.$inferSelect;
export type AccessibilityRequirement =
  typeof accessibilityRequirements.$inferSelect;
export type DietaryRequirement = typeof dietaryRequirements.$inferSelect;
export type TravelPreference = typeof travelPreferences.$inferSelect;
export type SpecialRequirement = typeof specialRequirements.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type RewardClaim = typeof rewardClaims.$inferSelect;
