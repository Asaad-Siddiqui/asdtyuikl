"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bus,
  ClipboardCheck,
  Droplets,
  Hotel,
  Info,
  Leaf,
  Loader2,
  MessageSquareQuote,
  Recycle,
  Sparkles,
  Star,
  TrendingUp,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { useApp } from "@/components/travello/AppProvider";
import {
  CalloutBar,
  EmptyNote,
  PageHero,
  SectionCard,
  StatTiles,
  heroArt,
} from "@/components/travello/ui/PageKit";
import { cn, getScoreColor } from "@/lib/format";
import {
  HOSPITALITY_CATEGORIES,
  TOTAL_QUESTIONS,
  countChecked,
} from "@/lib/hospitality";
import type { AssessmentAnswers } from "@/lib/hospitality";
import type { Business } from "@/types";

/**
 * Sustainable Hospitality.
 *
 * Two flows on one screen, because they are two sides of the same idea and
 * neither is big enough to justify its own page:
 *
 *   Business  -> checklist -> submit -> score -> what to fix next
 *   Traveller -> see the score -> rate the place 1-5
 *
 * The two numbers are never combined. A business's score comes from its own
 * checklist; the traveller number comes from visitor feedback, and both are
 * labelled so nobody has to guess which is which.
 *
 * The page wears the same six pieces as every other section (hero, stat tiles,
 * section cards, chips, callout) so it reads as part of the product rather than
 * a bolt-on.
 */

/** Category artwork, drawn from the project's single icon family. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  food: UtensilsCrossed,
  water: Droplets,
  energy: Zap,
  transport: Bus,
  waste: Recycle,
};

function emptyAnswers(): AssessmentAnswers {
  const answers: AssessmentAnswers = {};
  for (const category of HOSPITALITY_CATEGORIES) {
    answers[category.key] = {};
    for (const question of category.questions) {
      answers[category.key]![question.key] = false;
    }
  }
  return answers;
}

const FALLBACK_ART =
  "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1600&h=600&fit=crop&auto=format";

export function HospitalityPage() {
  const { businesses, destinations } = useApp();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  /** Locally-updated copies, so the page is correct the moment the API replies. */
  const [overrides, setOverrides] = useState<Record<string, Business>>({});
  const list = useMemo(
    () => businesses.map((business) => overrides[business.id] ?? business),
    [businesses, overrides],
  );

  /**
   * Open on an assessed business when there is one, so the score is visible at
   * a glance. Used only to seed the first render — afterwards `selectedId` and
   * the server refresh own the selection.
   */
  const initialBusiness =
    businesses.find((business) => business.assessment) ?? businesses[0];

  const [selectedId, setSelectedId] = useState(initialBusiness?.id ?? "");
  const [answers, setAnswers] = useState<AssessmentAnswers>(emptyAnswers);
  const [error, setError] = useState<string | null>(null);
  const [justScored, setJustScored] = useState(false);

  const [rating, setRating] = useState(initialBusiness?.traveller?.myRating ?? 0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingSaved, setRatingSaved] = useState(false);

  const selected = list.find((business) => business.id === selectedId) ?? list[0];
  const checked = countChecked(answers);
  const assessment = selected?.assessment ?? null;

  const assessedCount = list.filter((business) => business.assessment).length;
  const ratingCount = list.reduce(
    (total, business) => total + (business.traveller?.count ?? 0),
    0,
  );

  const heroImage = heroArt(destinations, ["munnar", "matheran", "goa"], FALLBACK_ART);

  function selectBusiness(id: string) {
    setSelectedId(id);
    // A checklist belongs to one business, so switching starts a fresh one.
    setAnswers(emptyAnswers());
    setError(null);
    setJustScored(false);
    setRatingSaved(false);
    setRatingError(null);
    setComment("");
    setRating(overrides[id]?.traveller?.myRating ?? 0);
  }

  function toggle(categoryKey: string, questionKey: string) {
    setAnswers((previous) => ({
      ...previous,
      [categoryKey]: {
        ...previous[categoryKey as keyof AssessmentAnswers],
        [questionKey]: !previous[categoryKey as keyof AssessmentAnswers]?.[questionKey],
      },
    }));
  }

  async function submitAssessment() {
    if (!selected || checked === 0) {
      setError("Tick at least one item before submitting.");
      return;
    }

    setError(null);
    try {
      const response = await fetch("/api/hospitality/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: selected.id, answers }),
      });
      const data = (await response.json().catch(() => null)) as
        | { business?: Business; error?: string }
        | null;

      if (!response.ok || !data?.business) {
        setError(data?.error ?? "We couldn't save that assessment. Please try again.");
        return;
      }

      setOverrides((previous) => ({ ...previous, [data.business!.id]: data.business! }));
      setJustScored(true);
      startTransition(() => router.refresh());
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    }
  }

  async function submitRating() {
    if (!selected) return;
    if (rating < 1) {
      setRatingError("Pick a star rating first.");
      return;
    }

    setRatingError(null);
    try {
      const response = await fetch("/api/hospitality/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: selected.id, rating, comment }),
      });
      const data = (await response.json().catch(() => null)) as
        | { business?: Business; error?: string }
        | null;

      if (!response.ok || !data?.business) {
        setRatingError(data?.error ?? "We couldn't save your rating. Please try again.");
        return;
      }

      setOverrides((previous) => ({ ...previous, [data.business!.id]: data.business! }));
      setRatingSaved(true);
      startTransition(() => router.refresh());
    } catch {
      setRatingError("We couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHero
        eyebrow="For Hospitality Businesses"
        eyebrowIcon={Hotel}
        title="Sustainable Hospitality"
        subtitle="A ten-point checklist for hotels, resorts, homestays and restaurants. Answer it honestly and Travello scores where you stand today — then points at the one or two things worth fixing next."
        pills={[
          { icon: ClipboardCheck, label: `${TOTAL_QUESTIONS}-point checklist` },
          { icon: TrendingUp, label: "Scored out of 100" },
          { icon: BadgeCheck, label: "Ratings kept separate" },
        ]}
        image={heroImage}
        scriptLines={["Assess Honestly", "Improve Steadily"]}
      />

      <StatTiles
        tiles={[
          {
            label: "Checklist items",
            value: String(TOTAL_QUESTIONS),
            note: "Across five categories",
            icon: ClipboardCheck,
          },
          {
            label: "Businesses listed",
            value: String(list.length),
            note: "In the catalogue",
            icon: Hotel,
          },
          {
            label: "Sustainability scores",
            value: String(assessedCount),
            note: "Assessed so far",
            icon: BadgeCheck,
          },
          {
            label: "Traveller ratings",
            value: String(ratingCount),
            note: "Left after visits",
            icon: Star,
          },
        ]}
      />

      {/* ── The workbench: checklist on the left, score on the right ── */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionCard title="Business self-assessment" icon={ClipboardCheck}>
            <label className="mt-4 block">
              <span className="text-[11px] font-bold tracking-wide text-sand-500 uppercase">
                Which business are you assessing?
              </span>
              <select
                value={selected?.id ?? ""}
                onChange={(event) => selectBusiness(event.target.value)}
                className="mt-2 w-full cursor-pointer rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm font-bold text-forest-900 shadow-xs transition-colors hover:border-sand-300 focus:border-forest-500 focus:outline-none"
              >
                {list.length > 0 ? (
                  list.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name} — {business.locality}
                    </option>
                  ))
                ) : (
                  <option value="">No businesses available yet</option>
                )}
              </select>
            </label>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {HOSPITALITY_CATEGORIES.map((category, index) => {
                const CategoryIcon = CATEGORY_ICONS[category.key] ?? Leaf;
                const categoryChecked = category.questions.filter(
                  (question) => answers[category.key]?.[question.key],
                ).length;
                const isLast = index === HOSPITALITY_CATEGORIES.length - 1;

                return (
                  <fieldset
                    key={category.key}
                    className={cn(
                      "rounded-2xl border border-sand-200/80 bg-sand-50/60 p-4 transition-colors hover:border-sand-300",
                      isLast && "sm:col-span-2",
                    )}
                  >
                    <legend className="sr-only">{category.label}</legend>

                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-primary-100 bg-primary-50 text-primary-700">
                        <CategoryIcon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-bold text-forest-950">
                        {category.label}
                      </span>
                      <span className="shrink-0 rounded-full border border-sand-200 bg-white px-2 py-0.5 text-[10.5px] font-bold text-sand-500 tabular-nums">
                        {categoryChecked}/{category.questions.length}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {category.questions.map((question) => (
                        <label
                          key={question.key}
                          className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-transparent bg-white/70 px-2.5 py-2 transition-colors hover:border-sand-200 hover:bg-white focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/20"
                        >
                          <input
                            type="checkbox"
                            checked={answers[category.key]?.[question.key] ?? false}
                            onChange={() => toggle(category.key, question.key)}
                            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-forest-700"
                          />
                          <span className="text-xs leading-relaxed font-medium text-sand-700">
                            {question.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700"
              >
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-3 border-t border-sand-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-sand-500">
                <span className="font-black text-forest-900 tabular-nums">
                  {checked}
                </span>{" "}
                of {TOTAL_QUESTIONS} answered
              </p>
              <button
                type="button"
                onClick={submitAssessment}
                disabled={isPending || checked === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-800 px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ClipboardCheck className="h-3.5 w-3.5" />
                )}
                Submit assessment
              </button>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4 sm:space-y-5 lg:col-span-5">
          <SectionCard title="Sustainability score" icon={Leaf}>
            {!assessment ? (
              <div className="mt-4">
                <EmptyNote>
                  {selected
                    ? `${selected.name} hasn't been assessed yet. Fill in the checklist and submit to get a score.`
                    : "No businesses are available yet."}
                </EmptyNote>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-[11px] font-bold tracking-wide text-sand-500 uppercase">
                  {selected.name} · {selected.locality}
                </p>

                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <span
                    className={cn(
                      "text-[2.2rem] leading-none font-black tabular-nums sm:text-[2.6rem]",
                      getScoreColor(assessment.overall),
                    )}
                  >
                    {assessment.overall}
                  </span>
                  <span className="pb-1 text-sm font-bold text-sand-500">/100</span>
                  <span
                    className={cn(
                      "mb-1 ml-auto rounded-full px-2.5 py-1 text-[10.5px] font-black",
                      assessment.band === "strong"
                        ? "bg-green-100 text-green-700"
                        : assessment.band === "fair"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700",
                    )}
                  >
                    {assessment.band === "strong"
                      ? "Leading"
                      : assessment.band === "fair"
                        ? "Progressing"
                        : "Needs work"}
                  </span>
                </div>

                {justScored && (
                  <p className="mt-3 flex items-center gap-1.5 rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-[11px] font-bold text-primary-700">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Assessment saved. This is your score from the answers above.
                  </p>
                )}

                <ul className="mt-4 space-y-2.5">
                  {assessment.categories.map((category) => (
                    <li key={category.key}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-sand-700">
                          {category.label}
                        </span>
                        <span className="text-xs font-black text-forest-950 tabular-nums">
                          {category.score}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand-100">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            category.score >= 80
                              ? "bg-green-500"
                              : category.score >= 60
                                ? "bg-amber-500"
                                : "bg-red-500",
                          )}
                          style={{ width: `${category.score}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 border-t border-sand-100 pt-3 text-[10.5px] leading-relaxed text-sand-500">
                  Assessed {new Date(assessment.submittedAt).toLocaleDateString()}. The
                  score is calculated from the checklist — change an answer and it changes.
                </p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="What to fix next" icon={Sparkles}>
            {!assessment || assessment.suggestions.length === 0 ? (
              <div className="mt-4">
                <EmptyNote>
                  {assessment
                    ? "Nothing to flag — every category scored 100. Keep the monitoring going."
                    : "Submit the checklist to get the two things worth fixing next."}
                </EmptyNote>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {assessment.suggestions.map((suggestion) => (
                  <li
                    key={suggestion.category}
                    className="rounded-2xl border border-primary-100 bg-primary-50/70 p-4"
                  >
                    <p className="flex items-center gap-1.5 text-xs font-black text-primary-800">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      {suggestion.title}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed font-medium text-forest-900">
                      {suggestion.advice}
                    </p>
                  </li>
                ))}
                <p className="text-[10.5px] text-sand-500">
                  Chosen from your two lowest-scoring categories.
                </p>
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      {/* ── Traveller view ── */}
      <SectionCard title="Traveller rating" icon={MessageSquareQuote}>
        <p className="mt-2 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-[11px] leading-relaxed font-medium text-blue-900">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          The business score and the traveller rating are shown side by side but never
          averaged together — one is a self-assessment, the other is what visitors
          actually found.
        </p>

        {!selected ? (
          <div className="mt-4">
            <EmptyNote>No businesses to rate yet.</EmptyNote>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-2">
            <div className="grid gap-4 rounded-2xl border border-sand-200/80 bg-sand-50/70 p-5 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold tracking-wide text-sand-500 uppercase">
                  Business Score
                </p>
                <p className="mt-2 text-2xl font-black text-forest-950 tabular-nums">
                  {assessment ? `${assessment.overall}/100` : "Not assessed"}
                </p>
                <p className="mt-1 text-[11px] text-sand-500">
                  From {selected.name}&apos;s own checklist.
                </p>
              </div>

              <div className="sm:border-l sm:border-sand-200/70 sm:pl-4">
                <p className="text-[11px] font-bold tracking-wide text-sand-500 uppercase">
                  Traveller Rating
                </p>
                {selected.traveller ? (
                  <>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-black text-forest-950">
                      <Star className="h-5 w-5 shrink-0 fill-amber-400 text-amber-400" />
                      {selected.traveller.average.toFixed(1)}
                      <span className="text-sm font-bold text-sand-500">/5</span>
                    </p>
                    <p className="mt-1 text-[11px] text-sand-500">
                      From {selected.traveller.count} traveller{" "}
                      {selected.traveller.count === 1 ? "rating" : "ratings"}.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-base font-bold text-sand-500">
                      No ratings yet
                    </p>
                    <p className="mt-1 text-[11px] text-sand-500">
                      Be the first to rate this place.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-sand-200/80 p-5">
              <h3 className="text-sm font-bold text-forest-950">
                How sustainable did you find this place?
              </h3>
              <p className="mt-1 text-[11px] text-sand-500">
                Rate {selected.name} after your visit.
              </p>

              <div
                className="mt-4 flex flex-wrap items-center gap-1"
                role="radiogroup"
                aria-label="Sustainability rating from 1 to 5 stars"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} out of 5`}
                    onClick={() => {
                      setRating(value);
                      setRatingError(null);
                    }}
                    className="cursor-pointer rounded-lg p-1 transition-transform duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
                  >
                    <Star
                      className={cn(
                        "h-6 w-6 transition-colors",
                        value <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-sand-300 hover:text-amber-300",
                      )}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-xs font-bold text-sand-600 tabular-nums">
                    {rating}/5
                  </span>
                )}
              </div>

              <label className="mt-4 block">
                <span className="text-[11px] font-bold tracking-wide text-sand-500 uppercase">
                  Comment (optional)
                </span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={3}
                  maxLength={600}
                  placeholder="What did they do well, and what could be better?"
                  className="mt-2 w-full resize-none rounded-xl border border-sand-200 bg-white px-3.5 py-2.5 text-xs font-medium text-forest-900 shadow-xs transition-colors placeholder:text-sand-400 hover:border-sand-300 focus:border-forest-500 focus:outline-none"
                />
              </label>

              {ratingError && (
                <p
                  role="alert"
                  className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700"
                >
                  {ratingError}
                </p>
              )}

              {ratingSaved && !ratingError && (
                <p className="mt-3 flex items-center gap-1.5 rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-[11px] font-bold text-primary-700">
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
                  Thanks — your rating is saved
                  {selected.traveller?.myRating ? ". You can update it any time." : "."}
                </p>
              )}

              <button
                type="button"
                onClick={submitRating}
                disabled={isPending}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-800 px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Star className="h-3.5 w-3.5" />
                )}
                {selected.traveller?.myRating ? "Update my rating" : "Submit rating"}
              </button>

              {selected.traveller?.myRating && !ratingSaved && (
                <p className="mt-2 text-[10.5px] text-sand-500">
                  You rated this place {selected.traveller.myRating}/5.
                </p>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      <CalloutBar
        title="Scored, explained, and kept honest"
        subtitle="The business score comes from the checklist; the traveller score comes from visitors. They are never averaged."
        action={{ href: "/explore", label: "See it on Explore" }}
        icon={Hotel}
      />
    </div>
  );
}

export default HospitalityPage;
