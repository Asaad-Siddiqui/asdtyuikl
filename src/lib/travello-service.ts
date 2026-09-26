import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  attractions,
  challenges,
  comments,
  destinations,
  pointEvents,
  postReactions,
  posts,
  reports,
  savedDestinations,
  trips,
  userChallenges,
  users,
  type Attraction,
  type Challenge,
  type Destination,
} from "@/db/schema";
import type {
  Challenge as ChallengeView,
  Destination as DestinationView,
} from "@/types";

/**
 * Every query in this module is scoped to a user id that the caller MUST derive
 * from the session. Nothing here trusts a client-supplied user id, so one
 * traveller can never read or mutate another traveller's rows.
 *
 * Prototype data is labelled as such in the UI: the catalogue
 * (`destinations`, `attractions`, `challenges`) is seeded demo content, and the
 * impact factors below are transparent estimates rather than verified science.
 */

/** Transparent, documented → shown as "Estimated" in the UI. */
export const IMPACT_FACTORS = {
  /** kg CO₂e attributed to one completed transport-category challenge. */
  co2PerTransportChallenge: 6.5,
  /** kg CO₂e attributed to any other completed challenge. */
  co2PerOtherChallenge: 1.5,
} as const;

const BADGE_THRESHOLDS = [2, 4, 6, 8, 12, 16];

export type TravellerStats = {
  points: number;
  challengesCompleted: number;
  challengesInProgress: number;
  destinationsVisited: number;
  badgesEarned: number;
  co2Avoided: number;
  approvedReports: number;
};

export type CommunityCommentView = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null };
};

export type CommunityPostView = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  destinationName: string | null;
  challengeTitle: string | null;
  challengePoints: number | null;
  likes: number;
  likedByMe: boolean;
  comments: CommunityCommentView[];
  author: { id: string; name: string; avatar: string | null; username: string | null };
};

export type ReportView = {
  id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  destinationId: string;
  destinationName: string | null;
};

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export async function listDestinations(): Promise<DestinationView[]> {
  const rows = await db.select().from(destinations).orderBy(destinations.name);
  return rows.map(toDestinationView);
}

export async function getDestination(id: string): Promise<Destination | null> {
  const rows = await db
    .select()
    .from(destinations)
    .where(eq(destinations.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listAttractions(destinationId?: string): Promise<Attraction[]> {
  if (destinationId) {
    return db
      .select()
      .from(attractions)
      .where(eq(attractions.destinationId, destinationId));
  }
  return db.select().from(attractions);
}

export async function listChallenges(): Promise<ChallengeView[]> {
  const rows = await db
    .select()
    .from(challenges)
    .orderBy(challenges.destinationId, challenges.points);
  return rows.map(toChallengeView);
}

export async function listSavedDestinationIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ destinationId: savedDestinations.destinationId })
    .from(savedDestinations)
    .where(eq(savedDestinations.userId, userId));
  return rows.map((row) => row.destinationId);
}

/* ------------------------------------------------------------------ */
/* User progress                                                       */
/* ------------------------------------------------------------------ */

export async function getUserChallengeRows(userId: string) {
  return db
    .select()
    .from(userChallenges)
    .where(eq(userChallenges.userId, userId))
    .orderBy(desc(userChallenges.startedAt));
}

export async function getUserStats(userId: string): Promise<TravellerStats> {
  const [pointsRow] = await db
    .select({ total: sql<number>`coalesce(sum(${pointEvents.points}), 0)::int` })
    .from(pointEvents)
    .where(eq(pointEvents.userId, userId));

  const rows = await getUserChallengeRows(userId);

  const completed = rows.filter((row) => row.status === "completed");
  const completedIds = completed.map((row) => row.challengeId);

  const completedChallenges =
    completedIds.length > 0
      ? await db
          .select()
          .from(challenges)
          .where(inArray(challenges.id, completedIds))
      : [];

  const transportCompleted = completedChallenges.filter(
    (challenge) =>
      challenge.category === "transport" || challenge.category === "environment",
  ).length;
  const otherCompleted = completed.length - transportCompleted;

  const destinationsVisited = new Set(
    completedChallenges.map((challenge) => challenge.destinationId),
  ).size;

  const [{ total: approvedReports }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(reports)
    .where(and(eq(reports.userId, userId), eq(reports.status, "resolved")));

  return {
    points: pointsRow?.total ?? 0,
    challengesCompleted: completed.length,
    challengesInProgress: rows.filter((row) => row.status === "in_progress").length,
    destinationsVisited,
    badgesEarned: BADGE_THRESHOLDS.filter((threshold) => completed.length >= threshold)
      .length,
    co2Avoided:
      Math.round(
        (transportCompleted * IMPACT_FACTORS.co2PerTransportChallenge +
          otherCompleted * IMPACT_FACTORS.co2PerOtherChallenge) *
          10,
      ) / 10,
    approvedReports: approvedReports ?? 0,
  };
}

export async function getUserReports(userId: string): Promise<ReportView[]> {
  const rows = await db
    .select()
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt));

  const names = await destinationNameMap(rows.map((row) => row.destinationId));

  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    description: row.description,
    status: row.status,
    priority: row.priority,
    createdAt: row.createdAt.toISOString(),
    destinationId: row.destinationId,
    destinationName: names.get(row.destinationId) ?? null,
  }));
}

async function destinationNameMap(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map<string, string>();
  const rows = await db
    .select({ id: destinations.id, name: destinations.name })
    .from(destinations)
    .where(inArray(destinations.id, unique));
  return new Map(rows.map((row) => [row.id, row.name]));
}

/* ------------------------------------------------------------------ */
/* Community                                                           */
/* ------------------------------------------------------------------ */

export async function getCommunityFeed(
  userId: string,
): Promise<CommunityPostView[]> {
  const postRows = await db
    .select({
      id: posts.id,
      content: posts.content,
      imageUrl: posts.imageUrl,
      destinationId: posts.destinationId,
      challengeId: posts.challengeId,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
      authorUsername: users.username,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.userId))
    .orderBy(desc(posts.createdAt))
    .limit(40);

  if (postRows.length === 0) return [];

  const ids = postRows.map((row) => row.id);

  const reactionRows = await db
    .select({ postId: postReactions.postId, userId: postReactions.userId })
    .from(postReactions)
    .where(inArray(postReactions.postId, ids));

  const commentRows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      content: comments.content,
      createdAt: comments.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(inArray(comments.postId, ids))
    .orderBy(comments.createdAt);

  const challengeIds = [
    ...new Set(postRows.map((row) => row.challengeId).filter(Boolean)),
  ] as string[];
  const challengeRows =
    challengeIds.length > 0
      ? await db
          .select({
            id: challenges.id,
            title: challenges.title,
            points: challenges.points,
          })
          .from(challenges)
          .where(inArray(challenges.id, challengeIds))
      : [];
  const challengeMap = new Map(challengeRows.map((row) => [row.id, row]));

  const names = await destinationNameMap(
    postRows.map((row) => row.destinationId).filter(Boolean) as string[],
  );

  return postRows.map((row) => {
    const postReactionRows = reactionRows.filter((r) => r.postId === row.id);
    const challenge = row.challengeId ? challengeMap.get(row.challengeId) : undefined;
    return {
      id: row.id,
      content: row.content,
      imageUrl: row.imageUrl,
      createdAt: row.createdAt.toISOString(),
      destinationName: row.destinationId
        ? (names.get(row.destinationId) ?? null)
        : null,
      challengeTitle: challenge?.title ?? null,
      challengePoints: challenge?.points ?? null,
      likes: postReactionRows.length,
      likedByMe: postReactionRows.some((r) => r.userId === userId),
      comments: commentRows
        .filter((comment) => comment.postId === row.id)
        .map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          author: {
            id: comment.authorId,
            name: comment.authorName,
            avatar: comment.authorAvatar,
          },
        })),
      author: {
        id: row.authorId,
        name: row.authorName,
        avatar: row.authorAvatar,
        username: row.authorUsername,
      },
    };
  });
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export class TravelloError extends Error {}

export async function startUserChallenge(userId: string, challengeId: string) {
  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1);
  if (!challenge) throw new TravelloError("That challenge no longer exists.");

  await db
    .insert(userChallenges)
    .values({ userId, challengeId, status: "in_progress" })
    .onConflictDoUpdate({
      target: [userChallenges.userId, userChallenges.challengeId],
      set: { status: "in_progress", completedAt: null },
    });
}

/**
 * Marks a challenge complete and records the points in the append-only ledger.
 * Idempotent: re-completing does not award points twice.
 */
export async function completeUserChallenge(
  userId: string,
  challengeId: string,
): Promise<{ pointsAwarded: number; alreadyCompleted: boolean }> {
  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1);
  if (!challenge) throw new TravelloError("That challenge no longer exists.");

  const [existing] = await db
    .select()
    .from(userChallenges)
    .where(
      and(
        eq(userChallenges.userId, userId),
        eq(userChallenges.challengeId, challengeId),
      ),
    )
    .limit(1);

  if (existing?.status === "completed") {
    return { pointsAwarded: existing.pointsAwarded, alreadyCompleted: true };
  }

  const values = {
    userId,
    challengeId,
    status: "completed" as const,
    pointsAwarded: challenge.points,
    completedAt: new Date(),
  };

  await db
    .insert(userChallenges)
    .values(values)
    .onConflictDoUpdate({
      target: [userChallenges.userId, userChallenges.challengeId],
      set: {
        status: values.status,
        pointsAwarded: values.pointsAwarded,
        completedAt: values.completedAt,
      },
    });

  await db.insert(pointEvents).values({
    userId,
    points: challenge.points,
    source: "challenge",
    label: `Completed “${challenge.title}”`,
    refId: challengeId,
  });

  return { pointsAwarded: challenge.points, alreadyCompleted: false };
}

export async function createReport(
  userId: string,
  input: { destinationId: string; category: string; description: string; priority?: string },
) {
  const [destination] = await db
    .select({ id: destinations.id })
    .from(destinations)
    .where(eq(destinations.id, input.destinationId))
    .limit(1);
  if (!destination) {
    throw new TravelloError("Pick a destination we know about.");
  }

  const [row] = await db
    .insert(reports)
    .values({
      userId,
      destinationId: input.destinationId,
      category: input.category,
      description: input.description,
      status: "submitted",
      priority: input.priority ?? "medium",
    })
    .returning();

  return row;
}

export async function createPost(
  userId: string,
  input: { content: string; imageUrl?: string | null; destinationId?: string | null; challengeId?: string | null },
) {
  const [row] = await db
    .insert(posts)
    .values({
      userId,
      content: input.content,
      imageUrl: input.imageUrl?.trim() ? input.imageUrl.trim() : null,
      destinationId: input.destinationId ?? null,
      challengeId: input.challengeId ?? null,
    })
    .returning();
  return row;
}

/** Returns the resulting like state so the UI can reconcile optimistic updates. */
export async function togglePostReaction(userId: string, postId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(postId)) throw new TravelloError("Post not found.");

  const [existing] = await db
    .select()
    .from(postReactions)
    .where(
      and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)),
    )
    .limit(1);

  if (existing) {
    await db.delete(postReactions).where(eq(postReactions.id, existing.id));
    return { liked: false };
  }

  await db.insert(postReactions).values({ postId, userId, reactionType: "like" });
  return { liked: true };
}

export async function addComment(userId: string, postId: string, content: string) {
  if (!/^[0-9a-f-]{36}$/i.test(postId)) throw new TravelloError("Post not found.");
  const trimmed = content.trim().slice(0, 600);
  if (!trimmed) throw new TravelloError("Write something first.");

  const [row] = await db
    .insert(comments)
    .values({ postId, userId, content: trimmed })
    .returning();
  return row;
}

export async function toggleSavedDestination(userId: string, destinationId: string) {
  const [existing] = await db
    .select()
    .from(savedDestinations)
    .where(
      and(
        eq(savedDestinations.userId, userId),
        eq(savedDestinations.destinationId, destinationId),
      ),
    )
    .limit(1);

  if (existing) {
    await db.delete(savedDestinations).where(eq(savedDestinations.id, existing.id));
    return { saved: false };
  }

  await db.insert(savedDestinations).values({ userId, destinationId });
  return { saved: true };
}

export async function updateTravellerProfile(
  userId: string,
  input: { name?: string; username?: string; bio?: string; avatarUrl?: string; role?: string },
) {
  const patch: Record<string, string | null> = {};
  if (typeof input.name === "string" && input.name.trim()) {
    patch.name = input.name.trim().slice(0, 80);
  }
  if (typeof input.username === "string") {
    patch.username = input.username.trim().slice(0, 40) || null;
  }
  if (typeof input.bio === "string") {
    patch.bio = input.bio.trim().slice(0, 400) || null;
  }
  if (typeof input.avatarUrl === "string") {
    patch.avatarUrl = input.avatarUrl.trim().slice(0, 500) || null;
  }
  if (typeof input.role === "string" && ["traveler", "creator", "manager"].includes(input.role)) {
    patch.role = input.role;
  }

  if (Object.keys(patch).length === 0) return;

  await db
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/** Aggregate points grouped by day, for the Reports charts. */
export async function getPointsTimeline(userId: string, days = 30) {
  const rows = await db
    .select({
      day: sql<string>`to_char(${pointEvents.createdAt}, 'YYYY-MM-DD')`,
      points: sql<number>`sum(${pointEvents.points})::int`,
    })
    .from(pointEvents)
    .where(eq(pointEvents.userId, userId))
    .groupBy(sql`to_char(${pointEvents.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${pointEvents.createdAt}, 'YYYY-MM-DD')`);

  return rows.slice(-days);
}

/* ------------------------------------------------------------------ */
/* Aggregate loader used by the (app) layout                           */
/* ------------------------------------------------------------------ */

/** Minimal trip shape the dashboard/trips UI renders from. */
export type SavedTripSummary = {
  id: string;
  title: string;
  fromLocation: string;
  toLocation: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  estimatedCo2: number;
  accessibilityScore: number;
  sustainabilityScore: number;
  dataSource: string;
  status: string;
};

/**
 * Mappers from the stored rows to the shapes the ported Travello UI expects.
 * Kept in one place so no screen invents its own field names.
 */
export function toDestinationView(row: Destination): DestinationView {
  return {
    ...row,
    visitorPressure: row.visitorPressure as DestinationView["visitorPressure"],
    wastePressure: row.wastePressure as DestinationView["wastePressure"],
    waterPressure: row.waterPressure as DestinationView["waterPressure"],
    environmentalSensitivity:
      row.environmentalSensitivity as DestinationView["environmentalSensitivity"],
    crowdLevel: row.crowdLevel as DestinationView["crowdLevel"],
  };
}

export function toChallengeView(row: Challenge): ChallengeView {
  return {
    ...row,
    difficulty: row.difficulty as ChallengeView["difficulty"],
  };
}

export type AppData = {
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string;
    bio: string;
    role: "traveler" | "creator" | "manager";
    impactPoints: number;
    challengesCompleted: number;
    destinationsVisited: number;
    badgesEarned: number;
    co2Avoided: number;
  };
  stats: TravellerStats;
  destinations: DestinationView[];
  challenges: ChallengeView[];
  completions: {
    id: string;
    userId: string;
    challengeId: string;
    status: "in_progress" | "completed";
    startedAt: string;
    completedAt?: string;
    pointsAwarded: number;
  }[];
  reports: ReportView[];
  posts: CommunityPostView[];
  savedDestinationIds: string[];
  trips: SavedTripSummary[];
};

/**
 * One call that assembles everything the signed-in app shell needs. The layout
 * passes the result straight into the client provider, so every Travello page
 * reads the same numbers from the same query set.
 */
export async function loadAppData(userId: string): Promise<AppData> {
  const [account] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!account) throw new TravelloError("Your account could not be loaded.");

  const [stats, destinations, challenges, completionRows, reports, posts, savedDestinationIds, tripRows] =
    await Promise.all([
      getUserStats(userId),
      listDestinations(),
      listChallenges(),
      getUserChallengeRows(userId),
      getUserReports(userId),
      getCommunityFeed(userId),
      listSavedDestinationIds(userId),
      db
        .select()
        .from(trips)
        .where(eq(trips.userId, userId))
        .orderBy(desc(trips.startDate)),
    ]);

  const role =
    account.role === "creator" || account.role === "manager"
      ? account.role
      : "traveler";

  return {
    user: {
      id: account.id,
      displayName: account.name,
      username: account.username ?? "",
      avatarUrl: account.avatarUrl ?? "",
      bio: account.bio ?? "",
      role,
      impactPoints: stats.points,
      challengesCompleted: stats.challengesCompleted,
      destinationsVisited: stats.destinationsVisited,
      badgesEarned: stats.badgesEarned,
      co2Avoided: stats.co2Avoided,
    },
    stats,
    destinations,
    challenges,
    completions: completionRows.map((row) => ({
      id: row.id,
      userId: row.userId,
      challengeId: row.challengeId,
      status: row.status === "completed" ? "completed" : "in_progress",
      startedAt: row.startedAt.toISOString(),
      completedAt: row.completedAt?.toISOString(),
      pointsAwarded: row.pointsAwarded,
    })),
    reports,
    posts,
    savedDestinationIds,
    trips: tripRows.map((row) => ({
      id: row.id,
      title: row.title,
      fromLocation: row.fromLocation,
      toLocation: row.toLocation,
      startDate: row.startDate,
      endDate: row.endDate,
      totalCost: row.totalCost,
      estimatedCo2: row.estimatedCo2,
      accessibilityScore: row.accessibilityScore,
      sustainabilityScore: row.sustainabilityScore,
      dataSource: row.dataSource,
      status: row.status,
    })),
  };
}

export async function listPointEvents(userId: string, limit = 20) {
  const rows = await db
    .select()
    .from(pointEvents)
    .where(eq(pointEvents.userId, userId))
    .orderBy(desc(pointEvents.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    points: row.points,
    source: row.source,
    label: row.label,
    createdAt: row.createdAt.toISOString(),
  }));
}
