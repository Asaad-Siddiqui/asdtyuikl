import type { Challenge, ChallengeCompletion } from "@/types";

/**
 * Eco Rewards — a motivating extension of Eco Challenges, not a separate app.
 *
 * Design rules this module enforces:
 *  - Points are achievement progress/currency, never a balance that is spent.
 *    Nothing deducts points; claiming marks a goodie as claimed.
 *  - Everything here is derived from real data: the user's completed
 *    challenges (`completions`), the challenge catalogue (difficulty → points)
 *    and the points ledger total (`stats.points`). No final points value is
 *    ever hardcoded.
 *  - Client-safe: no database imports. The server passes plain data in, the UI
 *    renders the result.
 */

/* ------------------------------------------------------------------ */
/* Goodie catalogue                                                    */
/* ------------------------------------------------------------------ */

/**
 * Physical goodies, cheapest unlock first. `pointsRequired` is the
 * achievement-progress threshold at which the goodie unlocks.
 */
export type RewardGoodie = {
  id: string;
  name: string;
  /** Points of eco-progress needed to unlock. */
  pointsRequired: number;
  image: string;
};

export const GOODIES: RewardGoodie[] = [
  {
    id: "stickers",
    name: "Stickers",
    pointsRequired: 50,
    image: "/goodies/goodie-5.jpeg",
  },
  {
    id: "tote-bag",
    name: "Sustainable Tote Bag",
    pointsRequired: 150,
    image: "/goodies/goodie-1.jpeg",
  },
  {
    id: "coffee-mug",
    name: "Travel Coffee Mug",
    pointsRequired: 250,
    image: "/goodies/goodie-2.jpeg",
  },
  {
    id: "phone-cover",
    name: "Phone Cover",
    pointsRequired: 350,
    image: "/goodies/goodie-3.jpeg",
  },
  {
    id: "travel-pillow",
    name: "Travel Pillow",
    pointsRequired: 500,
    image: "/goodies/goodie-4.jpeg",
  },
  {
    id: "hoodie",
    name: "Premium Eco Hoodie",
    pointsRequired: 750,
    image: "/goodies/goodie-1.jpeg",
  },
];

/* ------------------------------------------------------------------ */
/* Reward tiers                                                        */
/* ------------------------------------------------------------------ */

export type RewardTier = {
  id: string;
  name: string;
  /** "1 challenge" | "5 challenges" | … shown under the tier name. */
  requirement: string;
  /** Reward headline for the tier. */
  reward: string;
  /** Longest bar in the tier ladder, in the same order as this array. */
  completedRequired: number;
  /** Additional gate beyond raw completions (null = none). */
  bonusRequired: number | null;
};

/**
 * A "high-difficulty / bonus" challenge counts toward SENTINEL's gate.
 * The existing catalogue's difficulty scale is Easy/Medium today (Hard/Very
 * Hard may arrive later), so every difficulty above Easy counts as the
 * top of the current scale.
 */
export const BONUS_DIFFICULTIES = new Set(["medium", "hard", "very hard"]);

export const TIERS: RewardTier[] = [
  {
    id: "scout",
    name: "Scout",
    requirement: "1 completed challenge",
    reward: "Digital badge + reward eligibility",
    completedRequired: 1,
    bonusRequired: null,
  },
  {
    id: "guardian",
    name: "Guardian",
    requirement: "5 completed challenges",
    reward: "Sustainable tote bag",
    completedRequired: 5,
    bonusRequired: null,
  },
  {
    id: "sentinel",
    name: "Sentinel",
    requirement: "3 hard / bonus challenges",
    reward: "Travel coffee mug",
    completedRequired: 3,
    bonusRequired: 3,
  },
  {
    id: "city-champion",
    name: "City Champion",
    requirement: "750+ points of verified impact",
    reward: "Premium eco goodie",
    completedRequired: 8,
    bonusRequired: null,
  },
];

/* ------------------------------------------------------------------ */
/* Derivation                                                          */
/* ------------------------------------------------------------------ */

export type RewardState = {
  points: number;
  completedCount: number;
  bonusCount: number;
  goodies: (RewardGoodie & {
    unlocked: boolean;
    claimed: boolean;
    claimable: boolean;
  })[];
  unlockedGoodies: number;
  claimedGoodies: number;
  /** First unclaimed unlocked goodie — the "Next Reward" hero card. */
  nextReward: (RewardGoodie & { unlocked: boolean }) | null;
  /** Next goodie still locked, with points remaining. */
  upcomingReward: { goodie: RewardGoodie; pointsRemaining: number; percent: number } | null;
  tiers: (RewardTier & { earned: boolean; progressPercent: number })[];
  earnedTier: (typeof TIERS)[number] | null;
};

export type ClaimedReward = { rewardId: string; claimedAt: string };

/**
 * Derives the whole reward state from real completion data. `completedChallenges`
 * provides each finished challenge's difficulty so the SENTINEL bonus gate can
 * be computed from the catalogue rather than invented.
 */
export function deriveRewardState(
  points: number,
  completions: Pick<ChallengeCompletion, "challengeId" | "status">[],
  challenges: Pick<Challenge, "id" | "difficulty">[],
  claims: ClaimedReward[],
): RewardState {
  const completedIds = new Set(
    completions.filter((c) => c.status === "completed").map((c) => c.challengeId),
  );

  const difficultyById = new Map(challenges.map((c) => [c.id, c.difficulty]));
  let bonusCount = 0;
  for (const id of completedIds) {
    if (BONUS_DIFFICULTIES.has((difficultyById.get(id) ?? "").toLowerCase())) {
      bonusCount += 1;
    }
  }

  const claimedIds = new Set(claims.map((claim) => claim.rewardId));

  const goodies = GOODIES.map((goodie) => {
    const unlocked = points >= goodie.pointsRequired;
    const claimed = claimedIds.has(goodie.id);
    return { ...goodie, unlocked, claimed, claimable: unlocked && !claimed };
  });

  const nextReward =
    goodies.find((goodie) => goodie.unlocked && !goodie.claimed) ?? null;

  const upcoming = goodies.find((goodie) => !goodie.unlocked) ?? null;
  const upcomingReward = upcoming
    ? {
        goodie: upcoming,
        pointsRemaining: Math.max(0, upcoming.pointsRequired - points),
        percent: Math.min(100, Math.round((points / upcoming.pointsRequired) * 100)),
      }
    : null;

  const tiers = TIERS.map((tier) => {
    let progress: number;
    if (tier.bonusRequired !== null) {
      progress = bonusCount / tier.bonusRequired;
    } else if (tier.id === "city-champion") {
      // Strong monthly performance ≈ sustained high-point achievement.
      progress = points / 750;
    } else {
      progress = completedIds.size / tier.completedRequired;
    }
    return {
      ...tier,
      earned:
        tier.bonusRequired !== null
          ? bonusCount >= tier.bonusRequired
          : tier.id === "city-champion"
            ? points >= 750
            : completedIds.size >= tier.completedRequired,
      progressPercent: Math.min(100, Math.round(progress * 100)),
    };
  });

  const earnedTier = [...tiers].reverse().find((tier) => tier.earned) ?? null;

  return {
    points,
    completedCount: completedIds.size,
    bonusCount,
    goodies,
    unlockedGoodies: goodies.filter((g) => g.unlocked).length,
    claimedGoodies: goodies.filter((g) => g.claimed).length,
    nextReward,
    upcomingReward,
    tiers,
    earnedTier,
  };
}
