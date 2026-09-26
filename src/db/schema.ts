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

export type User = typeof users.$inferSelect;
export type AccessibilityProfile = typeof accessibilityProfiles.$inferSelect;
export type TravelerType = typeof travelerTypes.$inferSelect;
export type AccessibilityRequirement =
  typeof accessibilityRequirements.$inferSelect;
export type DietaryRequirement = typeof dietaryRequirements.$inferSelect;
export type TravelPreference = typeof travelPreferences.$inferSelect;
export type SpecialRequirement = typeof specialRequirements.$inferSelect;
export type Trip = typeof trips.$inferSelect;
