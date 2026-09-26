import {
  boolean,
  index,
  integer,
  pgTable,
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

export type User = typeof users.$inferSelect;
export type AccessibilityProfile = typeof accessibilityProfiles.$inferSelect;
export type TravelerType = typeof travelerTypes.$inferSelect;
export type AccessibilityRequirement =
  typeof accessibilityRequirements.$inferSelect;
export type DietaryRequirement = typeof dietaryRequirements.$inferSelect;
export type TravelPreference = typeof travelPreferences.$inferSelect;
export type SpecialRequirement = typeof specialRequirements.$inferSelect;
