"use client";

import { useMemo, useState } from "react";
import {
  Accessibility,
  Bus,
  CheckCircle2,
  Compass,
  Flag,
  Leaf,
  Mountain,
  Recycle,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

import { ChallengeCard } from "@/components/travello/ChallengeCard";
import { useApp } from "@/components/travello/AppProvider";
import { EcoRewards } from "@/components/travello/EcoRewards";
import {
  CalloutBar,
  ChipRow,
  PageHero,
  SelectControl,
  StatTiles,
  Toolbar,
  heroArt,
} from "@/components/travello/ui/PageKit";

/**
 * Challenges — the mission board.
 *
 * Filtering, difficulty and destination selection are unchanged. The tiles now
 * read only real numbers (points come from the points ledger, not a padded
 * default), and each row shows the traveller's actual step progress.
 *
 * Eco Rewards sits between the stats and the mission list: complete a mission
 * → points rise → reward progress updates → claim unlocked goodies.
 */

const FALLBACK_ART =
  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&h=600&fit=crop&auto=format";

export function ChallengesPage() {
  const { challenges, completions, destinations, stats } = useApp();
  const [search, setSearch] = useState("");
  const [selectedDest, setSelectedDest] = useState("all");
  const [sort, setSort] = useState("popular");

  const completedIds = completions
    .filter((completion) => completion.status === "completed")
    .map((completion) => completion.challengeId);

  const progressByChallenge = useMemo(() => {
    const map = new Map<string, number>();
    for (const completion of completions) {
      map.set(completion.challengeId, completion.progress);
    }
    return map;
  }, [completions]);

  const inProgressCount = completions.filter(
    (completion) => completion.status === "in_progress",
  ).length;

  const categories = [
    { key: "all", label: "All challenges", icon: Flag },
    { key: "transport", label: "Eco travel", icon: Bus },
    { key: "community", label: "Local support", icon: Users },
    { key: "waste", label: "Waste reduction", icon: Recycle },
    { key: "conservation", label: "Conservation", icon: Mountain },
    { key: "accessibility", label: "Accessibility", icon: Accessibility },
  ];
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  const destinationName = (id: string) =>
    destinations.find((destination) => destination.id === id)?.name;
  const destinationImage = (id: string) => {
    const match = destinations.find((destination) => destination.id === id);
    return match?.image || match?.heroImageUrl || undefined;
  };

  const filtered = useMemo(() => {
    const matched = challenges.filter((challenge) => {
      const matchesSearch =
        challenge.title.toLowerCase().includes(search.toLowerCase()) ||
        challenge.description.toLowerCase().includes(search.toLowerCase());
      const matchesDest = selectedDest === "all" || challenge.destinationId === selectedDest;
      const matchesCat =
        selectedCategory === "all" ||
        challenge.category?.toLowerCase().includes(selectedCategory) ||
        challenge.title.toLowerCase().includes(selectedCategory);
      const matchesDifficulty =
        selectedDifficulty === "all" ||
        challenge.difficulty.toLowerCase() === selectedDifficulty;
      return matchesSearch && matchesDest && matchesCat && matchesDifficulty;
    });

    if (sort === "points") {
      return [...matched].sort((a, b) => b.points - a.points);
    }
    if (sort === "quick") {
      return [...matched].sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
    }
    // "popular" keeps the catalogue's own order but floats unfinished missions up.
    return [
      ...matched.filter((challenge) => progressByChallenge.has(challenge.id) && !completedIds.includes(challenge.id)),
      ...matched.filter((challenge) => !progressByChallenge.has(challenge.id)),
      ...matched.filter((challenge) => completedIds.includes(challenge.id)),
    ];
  }, [
    challenges,
    search,
    selectedDest,
    selectedCategory,
    selectedDifficulty,
    sort,
    progressByChallenge,
    completedIds,
  ]);

  const heroImage = heroArt(destinations, ["manali", "munnar", "matheran"], FALLBACK_ART);

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHero
        eyebrow="Small actions. Big impact."
        eyebrowIcon={Sparkles}
        title="Take on Challenges, Make a Difference"
        subtitle="Pick a mission, verify it on the ground, and earn impact points you can put behind real park projects — every mission is tied to a place we actually work with."
        pills={[
          { icon: Leaf, label: "Greener choices" },
          { icon: Trophy, label: "Verified impact" },
        ]}
        image={heroImage}
        scriptLines={["Travel Better", "Do Better"]}
        action={{ href: "/impact", label: "See my impact" }}
      />

      <StatTiles
        tiles={[
          {
            label: "Total challenges",
            value: String(challenges.length),
            note: `${inProgressCount} in progress`,
            icon: Flag,
          },
          {
            label: "Completed",
            value: String(completedIds.length),
            note: `${stats.approvedReports} reports verified`,
            icon: CheckCircle2,
            href: "/impact",
          },
          {
            label: "Impact points",
            value: stats.points.toLocaleString("en-IN"),
            note: "Earned so far",
            rising: stats.points > 0,
            icon: Zap,
            href: "/impact",
          },
          {
            label: "Badges earned",
            value: String(stats.badgesEarned),
            note: "Keep going to unlock more",
            icon: Trophy,
            href: "/impact",
          },
        ]}
      />

      {/*
       * Your Eco Rewards — derived live from the same points and completions
       * the tiles above show; claiming is persisted server-side.
       */}
      <EcoRewards />

      <div className="space-y-3">
        <Toolbar
          value={search}
          onChange={setSearch}
          placeholder="Search missions, e.g. refill, plastic-free, train route, step-free…"
        >
          <div className="flex items-center gap-2">
            <SelectControl
              label="Destination"
              value={selectedDest}
              onChange={setSelectedDest}
              options={[
                { value: "all", label: "All destinations" },
                ...destinations.map((destination) => ({
                  value: destination.id,
                  label: destination.name,
                })),
              ]}
            />
            <SelectControl
              label="Sort missions"
              value={sort}
              onChange={setSort}
              options={[
                { value: "popular", label: "Popular" },
                { value: "points", label: "Most points" },
                { value: "quick", label: "Quickest" },
              ]}
            />
          </div>
        </Toolbar>

        <ChipRow
          options={categories}
          value={selectedCategory}
          onChange={setSelectedCategory}
        />

        <ChipRow
          options={[
            { key: "all", label: "All difficulties" },
            { key: "easy", label: "Easy" },
            { key: "medium", label: "Medium" },
            { key: "hard", label: "Hard" },
          ]}
          value={selectedDifficulty}
          onChange={setSelectedDifficulty}
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[0.95rem] font-bold text-forest-950">
            <Compass className="h-4 w-4 text-primary-600" />
            Available missions
            <span className="text-sand-400">({filtered.length})</span>
          </h2>
          <span className="text-[11px] font-semibold text-sand-500">
            Prototype catalogue — every mission lists what it needs as evidence
          </span>
        </div>

        <div className="space-y-3">
          {filtered.map((challenge, index) => (
            <ChallengeCard
              key={challenge.id}
              id={challenge.id}
              title={challenge.title}
              description={challenge.description}
              image={destinationImage(challenge.destinationId)}
              category={challenge.category}
              difficulty={challenge.difficulty}
              points={challenge.points}
              estimatedMinutes={challenge.estimatedMinutes}
              destinationName={destinationName(challenge.destinationId)}
              isCompleted={completedIds.includes(challenge.id)}
              isRecommended={index === 0}
              progress={progressByChallenge.get(challenge.id) ?? 0}
              progressTotal={challenge.instructions.length}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-12 text-center">
            <Trophy className="mx-auto h-7 w-7 text-forest-500" />
            <h3 className="mt-3 text-lg font-bold text-forest-950">
              No missions found
            </h3>
            <p className="mt-1 text-sm text-sand-600">
              Try another keyword, or clear the destination and category filters.
            </p>
          </div>
        )}
      </div>

      <CalloutBar
        title="Small steps. Big impact."
        subtitle="Every verified mission feeds the destination telemetry the rangers act on."
        action={{ href: "/impact", label: "View my impact" }}
      />
    </div>
  );
}

export default ChallengesPage;
