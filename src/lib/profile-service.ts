import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  accessibilityProfiles,
  accessibilityRequirements,
  dietaryRequirements,
  specialRequirements,
  travelPreferences,
  travelerTypes,
} from "@/db/schema";
import {
  PREFERENCE_META,
  type PreferenceKey,
  type RequirementCategory,
} from "@/lib/profile-options";

export type RequirementSelections = Record<RequirementCategory, string[]>;

export type ProfileData = {
  completed: boolean;
  travelerTypes: string[];
  requirements: RequirementSelections;
  /** Optional free text captured alongside the mobility / dietary steps. */
  details: {
    mobility: string;
    dietary: string;
  };
  dietary: string[];
  preferences: Record<PreferenceKey, number>;
  specialRequirement: string;
  updatedAt: string | null;
};

export const DEFAULT_PREFERENCES: Record<PreferenceKey, number> = {
  sustainability: 70,
  accessibility: 70,
  budget: 50,
  time: 50,
  comfort: 60,
};

export const EMPTY_PROFILE: ProfileData = {
  completed: false,
  travelerTypes: [],
  requirements: { mobility: [], visual: [], hearing: [] },
  details: { mobility: "", dietary: "" },
  dietary: [],
  preferences: { ...DEFAULT_PREFERENCES },
  specialRequirement: "",
  updatedAt: null,
};

/** Thrown for expected, user-facing failures so routes can map them safely. */
export class ProfileError extends Error {}

async function ensureProfileRow(userId: string): Promise<string> {
  const existing = await db
    .select({ id: accessibilityProfiles.id })
    .from(accessibilityProfiles)
    .where(eq(accessibilityProfiles.userId, userId))
    .limit(1);

  if (existing[0]) return existing[0].id;

  const inserted = await db
    .insert(accessibilityProfiles)
    .values({ userId })
    .onConflictDoNothing()
    .returning({ id: accessibilityProfiles.id });

  if (inserted[0]) return inserted[0].id;

  // Lost a race with a concurrent insert — read it back.
  const retry = await db
    .select({ id: accessibilityProfiles.id })
    .from(accessibilityProfiles)
    .where(eq(accessibilityProfiles.userId, userId))
    .limit(1);

  if (!retry[0]) throw new ProfileError("Could not open a profile.");
  return retry[0].id;
}

export async function getProfileData(userId: string): Promise<ProfileData> {
  const rows = await db
    .select()
    .from(accessibilityProfiles)
    .where(eq(accessibilityProfiles.userId, userId))
    .limit(1);

  const profileRow = rows[0];
  if (!profileRow) return { ...EMPTY_PROFILE };

  const profileId = profileRow.id;

  const [types, requirements, dietary, preferenceRows, specials] =
    await Promise.all([
      db
        .select({ type: travelerTypes.type })
        .from(travelerTypes)
        .where(eq(travelerTypes.profileId, profileId)),
      db
        .select()
        .from(accessibilityRequirements)
        .where(eq(accessibilityRequirements.profileId, profileId)),
      db
        .select({ requirement: dietaryRequirements.requirement })
        .from(dietaryRequirements)
        .where(eq(dietaryRequirements.profileId, profileId)),
      db
        .select()
        .from(travelPreferences)
        .where(eq(travelPreferences.profileId, profileId))
        .limit(1),
      db
        .select({ content: specialRequirements.content })
        .from(specialRequirements)
        .where(eq(specialRequirements.profileId, profileId))
        .limit(1),
    ]);

  const selections: RequirementSelections = {
    mobility: [],
    visual: [],
    hearing: [],
  };

  for (const row of requirements) {
    if (!row.selected) continue;
    const category = row.category as RequirementCategory;
    if (!selections[category]) continue;
    selections[category].push(row.requirement);
  }

  const preference = preferenceRows[0];

  return {
    completed: profileRow.completed,
    travelerTypes: types.map((row) => row.type).sort(),
    requirements: {
      mobility: selections.mobility.sort(),
      visual: selections.visual.sort(),
      hearing: selections.hearing.sort(),
    },
    details: {
      mobility: profileRow.mobilityDetail ?? "",
      dietary: profileRow.dietaryDetail ?? "",
    },
    dietary: dietary.map((row) => row.requirement).sort(),
    preferences: preference
      ? {
          sustainability: preference.sustainabilityWeight,
          accessibility: preference.accessibilityWeight,
          budget: preference.budgetWeight,
          time: preference.timeWeight,
          comfort: preference.comfortWeight,
        }
      : { ...DEFAULT_PREFERENCES },
    specialRequirement: specials[0]?.content ?? "",
    updatedAt: profileRow.updatedAt.toISOString(),
  };
}

export type SaveProfileInput = {
  complete?: boolean;
  travelerTypes?: string[];
  requirements?: Partial<RequirementSelections>;
  details?: { mobility?: string; dietary?: string };
  dietary?: string[];
  preferences?: Partial<Record<PreferenceKey, number>>;
  specialRequirement?: string;
};

function clampWeight(value: unknown, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export async function saveProfileData(
  userId: string,
  input: SaveProfileInput,
): Promise<ProfileData> {
  const profileId = await ensureProfileRow(userId);

  const travelerTypeValues = Array.from(new Set(input.travelerTypes ?? []));
  const dietaryValues = Array.from(new Set(input.dietary ?? []));
  const categories: RequirementCategory[] = ["mobility", "visual", "hearing"];

  const requirementRows = categories.flatMap((category) =>
    Array.from(new Set(input.requirements?.[category] ?? [])).map(
      (requirement) => ({
        profileId,
        category,
        requirement,
        selected: true,
      }),
    ),
  );

  const preferences: Record<PreferenceKey, number> = {
    sustainability: clampWeight(
      input.preferences?.sustainability,
      DEFAULT_PREFERENCES.sustainability,
    ),
    accessibility: clampWeight(
      input.preferences?.accessibility,
      DEFAULT_PREFERENCES.accessibility,
    ),
    budget: clampWeight(input.preferences?.budget, DEFAULT_PREFERENCES.budget),
    time: clampWeight(input.preferences?.time, DEFAULT_PREFERENCES.time),
    comfort: clampWeight(
      input.preferences?.comfort,
      DEFAULT_PREFERENCES.comfort,
    ),
  };

  const special = (input.specialRequirement ?? "").trim();
  const complete = input.complete === true;

  await Promise.all([
    db.delete(travelerTypes).where(eq(travelerTypes.profileId, profileId)),
    db
      .delete(accessibilityRequirements)
      .where(eq(accessibilityRequirements.profileId, profileId)),
    db
      .delete(dietaryRequirements)
      .where(eq(dietaryRequirements.profileId, profileId)),
    db
      .delete(specialRequirements)
      .where(eq(specialRequirements.profileId, profileId)),
  ]);

  const writes: Promise<unknown>[] = [];

  if (travelerTypeValues.length > 0) {
    writes.push(
      db
        .insert(travelerTypes)
        .values(travelerTypeValues.map((type) => ({ profileId, type }))),
    );
  }

  if (requirementRows.length > 0) {
    writes.push(db.insert(accessibilityRequirements).values(requirementRows));
  }

  if (dietaryValues.length > 0) {
    writes.push(
      db.insert(dietaryRequirements).values(
        dietaryValues.map((requirement) => ({ profileId, requirement })),
      ),
    );
  }

  if (special) {
    writes.push(
      db.insert(specialRequirements).values({ profileId, content: special }),
    );
  }

  writes.push(
    db
      .insert(travelPreferences)
      .values({
        profileId,
        sustainabilityWeight: preferences.sustainability,
        accessibilityWeight: preferences.accessibility,
        budgetWeight: preferences.budget,
        timeWeight: preferences.time,
        comfortWeight: preferences.comfort,
      })
      .onConflictDoUpdate({
        target: travelPreferences.profileId,
        set: {
          sustainabilityWeight: preferences.sustainability,
          accessibilityWeight: preferences.accessibility,
          budgetWeight: preferences.budget,
          timeWeight: preferences.time,
          comfortWeight: preferences.comfort,
          updatedAt: new Date(),
        },
      }),
  );

  await Promise.all(writes);

  await db
    .update(accessibilityProfiles)
    .set({
      completed: complete,
      mobilityDetail: (input.details?.mobility ?? "").trim() || null,
      dietaryDetail: (input.details?.dietary ?? "").trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(accessibilityProfiles.id, profileId));

  return getProfileData(userId);
}

/** Convenience helper for the dashboard. */
export function preferenceSummary(profile: ProfileData): {
  key: PreferenceKey;
  label: string;
  value: number;
}[] {
  return PREFERENCE_META.map((meta) => ({
    key: meta.key,
    label: meta.label,
    value: profile.preferences[meta.key],
  }));
}
