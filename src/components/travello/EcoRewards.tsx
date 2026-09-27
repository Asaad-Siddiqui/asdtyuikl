"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  Gift,
  Lock,
  Medal,
  PartyPopper,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";

import { useApp } from "@/components/travello/AppProvider";
import { cn } from "@/lib/format";
import {
  deriveRewardState,
  type RewardGoodie,
  type RewardState,
  type RewardTier,
} from "@/lib/rewards";

/**
 * Your Eco Rewards — a compact extension of the Eco Challenges page.
 *
 * Reuses the page's own vocabulary: white rounded cards on the sand canvas,
 * forest/primary greens, the same text sizes and icon language as StatTiles
 * and ChallengeCard. Points come straight from the traveller's ledger
 * (`stats.points`), unlock state is derived — nothing is hardcoded.
 *
 * Subtle motion only: the points figure and progress bar transition when they
 * change, unlocked cards get one gentle pop, and the claim confirmation uses
 * the shared scale-in keyframes. Nothing loops.
 */

/* Points figure that animates to its new value when challenges complete. */
function AnimatedPoints({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (from === value) return;

    const duration = 600;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="tabular-nums">{display.toLocaleString("en-IN")}</span>;
}

function TierLadder({ tiers }: { tiers: RewardState["tiers"] }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {tiers.map((tier, index) => (
        <TierCard key={tier.id} tier={tier} rank={index + 1} />
      ))}
    </ol>
  );
}

function TierCard({
  tier,
  rank,
}: {
  tier: RewardTier & { earned: boolean; progressPercent: number };
  rank: number;
}) {
  const Icon = tier.earned ? BadgeCheck : Medal;
  return (
    <li
      className={cn(
        "rounded-xl border p-3 transition-colors duration-300",
        tier.earned
          ? "border-primary-200 bg-primary-50/60"
          : "border-sand-200 bg-sand-50/70",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-lg border",
            tier.earned
              ? "border-primary-200 bg-white text-primary-700"
              : "border-sand-200 bg-white text-sand-400",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "text-[0.8rem] leading-tight font-black",
              tier.earned ? "text-forest-900" : "text-sand-600",
            )}
          >
            {rank}. {tier.name}
          </p>
          <p className="text-[10.5px] leading-tight font-semibold text-sand-500">
            {tier.requirement}
          </p>
        </div>
        {tier.earned && (
          <span className="ml-auto rounded-full bg-forest-800 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-white uppercase">
            Earned
          </span>
        )}
      </div>
      <p className="mt-2 text-[10.5px] font-semibold text-sand-500">
        🎁 {tier.reward}
      </p>
      <span
        className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-sand-200/80"
        aria-hidden="true"
      >
        <span
          className={cn(
            "block h-full rounded-full transition-all duration-700 ease-out",
            tier.earned ? "bg-forest-500" : "bg-sand-400",
          )}
          style={{ width: `${tier.progressPercent}%` }}
        />
      </span>
    </li>
  );
}

function RewardCard({
  goodie,
  onClaim,
}: {
  goodie: RewardState["goodies"][number];
  onClaim: (goodie: RewardGoodie) => void;
}) {
  const wasUnlocked = useRef(goodie.unlocked);
  const [justUnlocked, setJustUnlocked] = useState(false);

  useEffect(() => {
    if (!wasUnlocked.current && goodie.unlocked) {
      setJustUnlocked(true);
      const timer = setTimeout(() => setJustUnlocked(false), 900);
      return () => clearTimeout(timer);
    }
    wasUnlocked.current = goodie.unlocked;
  }, [goodie.unlocked]);

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-xs transition-all duration-300",
        goodie.claimed
          ? "border-primary-200/80 bg-primary-50/30"
          : goodie.unlocked
            ? "border-forest-200 hover:-translate-y-0.5 hover:shadow-md"
            : "border-sand-200/80",
        justUnlocked && "animate-pop",
      )}
    >
      <div className="relative h-28 w-full overflow-hidden bg-sand-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={goodie.image}
          alt={goodie.name}
          className={cn(
            "h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105",
            !goodie.unlocked && "opacity-45 saturate-50",
          )}
          loading="lazy"
        />
        <span
          className={cn(
            "absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-black tracking-wide uppercase",
            goodie.claimed
              ? "bg-forest-800 text-white"
              : goodie.unlocked
                ? "bg-white/95 text-forest-800"
                : "bg-forest-950/70 text-white",
          )}
        >
          {goodie.claimed ? (
            <>
              <Check className="h-2.5 w-2.5" /> Claimed
            </>
          ) : goodie.unlocked ? (
            "Unlocked"
          ) : (
            <>
              <Lock className="h-2.5 w-2.5" /> Locked
            </>
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h4 className="text-[0.82rem] leading-tight font-bold text-forest-950">
          {goodie.name}
        </h4>
        <p className="inline-flex items-center gap-1 text-[11px] font-black text-forest-800">
          <Zap className="h-3 w-3 text-primary-600" />
          {goodie.pointsRequired} pts
        </p>

        <div className="mt-auto pt-2">
          {goodie.claimed ? (
            <span className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 py-2 text-[11px] font-bold text-forest-800">
              <Check className="h-3.5 w-3.5 text-primary-700" />
              Reward Claimed
            </span>
          ) : goodie.unlocked ? (
            <button
              type="button"
              onClick={() => onClaim(goodie)}
              className="w-full rounded-xl bg-forest-800 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-forest-900"
            >
              Claim Reward
            </button>
          ) : (
            <span className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-sand-200 bg-sand-50 py-2 text-[11px] font-bold text-sand-500">
              <Lock className="h-3.5 w-3.5" />
              {goodie.pointsRequired.toLocaleString("en-IN")} pts
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function EcoRewards() {
  const { stats, completions, challenges, rewardClaims, claimReward } = useApp();
  const [claimTarget, setClaimTarget] = useState<RewardGoodie | null>(null);
  const [confirming, setConfirming] = useState(false);

  const rewardState = useMemo(
    () =>
      deriveRewardState(
        stats.points,
        completions,
        challenges.map((challenge) => ({
          id: challenge.id,
          difficulty: challenge.difficulty,
        })),
        rewardClaims,
      ),
    [stats.points, completions, challenges, rewardClaims],
  );

  const next = rewardState.nextReward ?? rewardState.upcomingReward?.goodie ?? null;
  const progressPercent = rewardState.upcomingReward
    ? rewardState.upcomingReward.percent
    : 100;
  const progressLabel = rewardState.upcomingReward
    ? `${rewardState.points.toLocaleString("en-IN")} / ${rewardState.upcomingReward.goodie.pointsRequired.toLocaleString("en-IN")} points`
    : "Every reward unlocked 🎉";

  async function handleConfirmClaim() {
    if (!claimTarget) return;
    setConfirming(true);
    try {
      await claimReward(claimTarget.id);
    } finally {
      setConfirming(false);
      setClaimTarget(null);
    }
  }

  return (
    <section
      aria-labelledby="eco-rewards-heading"
      className="animate-fade-up space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="eco-rewards-heading"
          className="flex items-center gap-2 text-[0.95rem] font-bold text-forest-950"
        >
          <Gift className="h-4 w-4 text-primary-600" />
          Your Eco Rewards
          <span className="text-sand-400">
            ({rewardState.claimedGoodies}/{rewardState.goodies.length} claimed)
          </span>
        </h2>
        {rewardState.earnedTier && (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-800">
            <Trophy className="h-3 w-3" />
            {rewardState.earnedTier.name} tier
          </span>
        )}
      </div>

      {/* Progress hero card */}
      <div className="overflow-hidden rounded-2xl border border-sand-200/80 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-[0.14em] text-sand-500 uppercase">
              <Zap className="h-3.5 w-3.5 text-primary-600" />
              <AnimatedPoints value={rewardState.points} />
              <span className="normal-case">points</span>
            </p>
            <p className="mt-1.5 text-[0.95rem] font-bold text-forest-950">
              {next ? "Next Reward" : "All rewards unlocked"}
            </p>
            <p className="text-sm font-semibold text-sand-600">
              {next ? `🎁 ${next.name}` : "You've earned the whole shelf."}
            </p>
          </div>

          <div className="w-full max-w-xs shrink-0">
            <div className="flex items-center justify-between text-[10.5px] font-bold text-sand-500">
              <span>Progress</span>
              <span className="tabular-nums">{progressPercent}%</span>
            </div>
            <span
              className="mt-1 block h-2 w-full overflow-hidden rounded-full bg-sand-200/80"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress to next reward"
            >
              <span
                className="block h-full rounded-full bg-forest-500 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </span>
            <p className="mt-1 text-right text-[10.5px] font-semibold text-sand-500 tabular-nums">
              {progressLabel}
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-sand-100 pt-4">
          <TierLadder tiers={rewardState.tiers} />
        </div>
      </div>

      {/* Reward grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {rewardState.goodies.map((goodie) => (
          <RewardCard
            key={goodie.id}
            goodie={goodie}
            onClaim={setClaimTarget}
          />
        ))}
      </div>

      <p className="text-[11px] font-semibold text-sand-500">
        Points are your eco-impact progress — completing verified challenges
        unlocks goodies. Claims are saved to your account.
      </p>

      {/* Claim confirmation modal */}
      {claimTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="claim-modal-title"
          className="fixed inset-0 z-[70] grid place-items-center bg-forest-950/50 p-4 backdrop-blur-sm"
          onClick={() => !confirming && setClaimTarget(null)}
        >
          <div
            className="w-full max-w-sm animate-scale-in rounded-2xl border border-sand-200 bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  id="claim-modal-title"
                  className="flex items-center gap-2 text-base font-black text-forest-950"
                >
                  <PartyPopper className="h-4 w-4 text-primary-600" />
                  Claim your {claimTarget.name}?
                </h3>
                <p className="mt-1 text-xs font-medium text-sand-600">
                  Unlock and claim this goodie with your eco-impact progress.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClaimTarget(null)}
                className="rounded-lg p-1 text-sand-400 transition-colors hover:bg-sand-100 hover:text-forest-900"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-sand-200 bg-sand-50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={claimTarget.image}
                alt=""
                className="h-16 w-16 rounded-lg border border-sand-200 object-cover"
              />
              <div className="min-w-0 text-xs">
                <p className="font-bold text-forest-950">{claimTarget.name}</p>
                <p className="mt-0.5 font-semibold text-sand-600">
                  Points required:{" "}
                  <span className="tabular-nums">
                    {claimTarget.pointsRequired}
                  </span>
                </p>
                <p className="mt-0.5 font-semibold text-sand-500">
                  Your points:{" "}
                  <span className="tabular-nums">
                    {rewardState.points.toLocaleString("en-IN")}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setClaimTarget(null)}
                disabled={confirming}
                className="rounded-xl border border-sand-200 bg-white px-4 py-2 text-[11px] font-bold text-forest-900 transition-colors hover:bg-sand-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClaim}
                disabled={confirming}
                className="inline-flex items-center gap-1.5 rounded-xl bg-forest-800 px-4 py-2 text-[11px] font-bold text-white transition-colors hover:bg-forest-900 disabled:opacity-60"
              >
                {confirming ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    Claiming…
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Confirm Claim
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
