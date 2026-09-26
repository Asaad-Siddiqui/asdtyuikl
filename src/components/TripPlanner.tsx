"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

import { Button, buttonClasses } from "@/components/Button";
import Icon from "@/components/Icon";
import ProgressIndicator, { type Stage } from "@/components/ProgressIndicator";
import TripExperienceView from "@/components/TripExperienceView";
import TripDayAccordion from "@/components/TripDayAccordion";
import TripOptionCard from "@/components/TripOptionCard";
import TripPlanningProgress from "@/components/TripPlanningProgress";
import {
  BUDGET_MAX,
  BUDGET_MIN,
  BUDGET_OPTIONS,
  CHILD_NEED_OPTIONS,
  DESTINATION_SUGGESTIONS,
  ELDERLY_PRIORITY_OPTIONS,
  MOBILITY_NEED_OPTIONS,
  ORIGIN_SUGGESTIONS,
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  TRANSPORT_LABELS,
  TRANSPORT_OPTIONS,
  daysBetween,
  defaultPriorities,
  formatCo2,
  formatDateRange,
  formatINR,
  MAX_PRIORITIES,
  nightsBetween,
  type Option,
  type PlannerProfile,
} from "@/lib/trip-options";
import {
  MODE_LABELS,
  environmentalImpact,
  greenestCo2,
  pickRecommended,
  type Co2Assumption,
  type ItineraryOption,
  type OptionId,
  type TripRequestSummary,
} from "@/lib/trip-schema";
import { DIETARY_LABELS } from "@/lib/profile-options";

/* ------------------------------------------------------------------ */
/* Flow definition                                                     */
/* ------------------------------------------------------------------ */

type StepKey =
  | "from"
  | "to"
  | "dates"
  | "travelers"
  | "elderly"
  | "mobility"
  | "children"
  | "dietary"
  | "priorities"
  | "transport"
  | "budget"
  | "notes";

const ALL_STEPS: StepKey[] = [
  "from",
  "to",
  "dates",
  "travelers",
  "elderly",
  "mobility",
  "children",
  "dietary",
  "priorities",
  "transport",
  "budget",
  "notes",
];

const STEP_META: Record<
  StepKey,
  { chip: string; title: string; prompt: string; hint?: string }
> = {
  from: {
    chip: "From",
    title: "Starting point",
    prompt: "Where are you starting from?",
    hint: "Pick a suggestion or type your own city.",
  },
  to: {
    chip: "To",
    title: "Destination",
    prompt: "Nice! Where are you heading?",
    hint: "Any city or region works — we'll adapt the plan.",
  },
  dates: {
    chip: "Dates",
    title: "Travel dates",
    prompt: "When are you thinking of going?",
    hint: "We plan every day between these dates.",
  },
  travelers: {
    chip: "Travellers",
    title: "Who's coming along",
    prompt: "Who's coming along?",
    hint: "Adjust the numbers — including anyone who needs mobility support.",
  },
  elderly: {
    chip: "Elderly care",
    title: "Elderly traveller priorities",
    prompt: "Since an elderly traveller is joining, what should we prioritise?",
    hint: "Pick everything that applies.",
  },
  mobility: {
    chip: "Mobility",
    title: "Accessibility focus",
    prompt: "Anything specific we should keep accessible?",
    hint: "We already have your saved profile — this is for this trip only.",
  },
  children: {
    chip: "Children",
    title: "Travelling with children",
    prompt: "What would make the trip easier with children?",
    hint: "Pick everything that applies.",
  },
  dietary: {
    chip: "Food",
    title: "Food preferences",
    prompt: "Should we prioritise food that matches your saved preferences?",
    hint: "Your stored dietary requirements are shown below.",
  },
  priorities: {
    chip: "Priorities",
    title: "Trip style",
    prompt: "What kind of trip are you looking for?",
    hint: `Pick up to ${MAX_PRIORITIES}.`,
  },
  transport: {
    chip: "Getting there",
    title: "Transport preference",
    prompt: "How would you like to travel?",
    hint: "We'll adapt this to what's practical for your route.",
  },
  budget: {
    chip: "Budget",
    title: "Comfortable budget",
    prompt: "What's your comfortable budget?",
    hint: "For the whole trip, including everyone.",
  },
  notes: {
    chip: "Anything else",
    title: "Anything else",
    prompt: "Anything else we should know?",
    hint: "Optional — tell us anything that would make this trip work better.",
  },
};

type Answers = {
  from: string;
  to: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  elderly: number;
  mobilitySupport: number;
  priorities: string[];
  transportPreference: string;
  budget: number;
  tripNeeds: string[];
  dietaryChoice: "yes" | "no" | "";
  additionalPreferences: string;
};

type PlanState = {
  options: ItineraryOption[];
  assumptions: Record<string, Co2Assumption[]>;
  comparisons: Record<string, string[]>;
  engine: "ai" | "prototype";
  note: string | null;
  request: TripRequestSummary;
};

type View =
  | "questions"
  | "loading"
  | "options"
  | "experience"
  | "detail"
  | "modify"
  | "saving";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Sensible, pre-selected answers.
 *
 * The ten questions still appear exactly as they do for a real traveller — but
 * every one of them opens already answered, so the flow can be walked through by
 * pressing Continue alone. Touching any answer simply overrides the default.
 */
function demoAnswers(profile: PlannerProfile): Answers {
  const start = new Date();
  start.setDate(start.getDate() + 21);
  const end = new Date(start);
  end.setDate(end.getDate() + 3);
  const seededPriorities = defaultPriorities(profile.priorities);

  return {
    from: "Mumbai",
    to: "Mahabaleshwar",
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    adults: 2,
    children: 0,
    elderly: 0,
    mobilitySupport: 1,
    priorities:
      seededPriorities.length > 0
        ? seededPriorities
        : ["low_impact", "accessible"],
    transportPreference: "public_transport",
    budget: 25000,
    tripNeeds: ["step_free_routes", "accessible_transport"],
    dietaryChoice: profile.dietary.length > 0 ? "yes" : "no",
    additionalPreferences:
      "Keep walking low for my father's knees, and prefer quiet, less crowded places.",
  };
}

export default function TripPlanner({
  profile,
  userName,
}: {
  profile: PlannerProfile;
  userName: string;
}) {
  const router = useRouter();

  const [answers, setAnswers] = useState<Answers>(() => demoAnswers(profile));

  const [view, setView] = useState<View>("questions");
  const [stepIndex, setStepIndex] = useState(0);
  const [plan, setPlan] = useState<PlanState | null>(null);
  const [selectedId, setSelectedId] = useState<OptionId | null>(null);
  const [modification, setModification] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const topRef = useRef<HTMLDivElement | null>(null);

  /* ---------------------------------------------------------------- */
  /* Adaptive step list                                                */
  /* ---------------------------------------------------------------- */

  const mobilityRelevant =
    answers.mobilitySupport > 0 ||
    profile.mobility.length > 0 ||
    profile.travelerTypes.includes("wheelchair_user");

  const activeSteps = useMemo(
    () =>
      ALL_STEPS.filter((key) => {
        if (key === "elderly") return answers.elderly > 0;
        if (key === "mobility") return mobilityRelevant;
        if (key === "children") return answers.children > 0;
        if (key === "dietary") return profile.dietary.length > 0;
        return true;
      }),
    [
      answers.elderly,
      answers.children,
      mobilityRelevant,
      profile.dietary.length,
    ],
  );

  const safeIndex = Math.min(stepIndex, activeSteps.length - 1);
  const activeKey = activeSteps[safeIndex] ?? "from";
  const meta = STEP_META[activeKey];

  const stages: Stage[] = useMemo(
    () =>
      activeSteps.map((key) => ({
        label: STEP_META[key].chip,
        title: STEP_META[key].title,
      })),
    [activeSteps],
  );

  const scrollToTop = useCallback(() => {
    const element = topRef.current;
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /* ---------------------------------------------------------------- */
  /* Answer helpers                                                    */
  /* ---------------------------------------------------------------- */

  const patch = useCallback((values: Partial<Answers>) => {
    setAnswers((previous) => ({ ...previous, ...values }));
    setStepError(null);
  }, []);

  const toggleIn = useCallback(
    (key: "priorities" | "tripNeeds", value: string, limit?: number) => {
      setAnswers((previous) => {
        const list = previous[key];
        if (list.includes(value)) {
          return { ...previous, [key]: list.filter((item) => item !== value) };
        }
        if (limit && list.length >= limit) return previous;
        return { ...previous, [key]: [...list, value] };
      });
      setStepError(null);
    },
    [],
  );

  /* ---------------------------------------------------------------- */
  /* Per-step validation                                               */
  /* ---------------------------------------------------------------- */

  const validateStep = useCallback(
    (key: StepKey): string | null => {
      switch (key) {
        case "from":
          if (answers.from.trim().length < 2)
            return "Add a starting point so we can plan the route.";
          return null;
        case "to":
          if (answers.to.trim().length < 2)
            return "Add a destination so we can plan the route.";
          if (
            answers.from.trim().toLowerCase() ===
            answers.to.trim().toLowerCase()
          )
            return "Your destination should be different from where you start.";
          return null;
        case "dates": {
          if (!ISO_DATE.test(answers.startDate) || !ISO_DATE.test(answers.endDate))
            return "Choose both a start and end date.";
          const start = new Date(`${answers.startDate}T00:00:00`).getTime();
          const end = new Date(`${answers.endDate}T00:00:00`).getTime();
          if (end < start) return "The return date can't be before you leave.";
          if (daysBetween(answers.startDate, answers.endDate) > 30)
            return "Please plan a trip of 30 days or fewer.";
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (start < today.getTime() - 86_400_000)
            return "Pick a date from today onwards.";
          return null;
        }
        case "travelers":
          if (answers.adults + answers.children + answers.elderly < 1)
            return "Add at least one traveller.";
          return null;
        case "priorities":
          if (answers.priorities.length === 0)
            return "Pick at least one so we can tailor your plan.";
          return null;
        case "transport":
          if (!answers.transportPreference)
            return "Choose how you'd like to travel.";
          return null;
        case "budget":
          if (
            !Number.isFinite(answers.budget) ||
            answers.budget < BUDGET_MIN ||
            answers.budget > BUDGET_MAX
          )
            return `Enter a budget between ${formatINR(BUDGET_MIN)} and ${formatINR(BUDGET_MAX)}.`;
          return null;
        default:
          return null;
      }
    },
    [answers],
  );

  /* ---------------------------------------------------------------- */
  /* Navigation                                                        */
  /* ---------------------------------------------------------------- */

  /* ---------------------------------------------------------------- */
  /* Payload + network                                                 */
  /* ---------------------------------------------------------------- */

  const buildPayload = useCallback(() => {
    const dietaryNote =
      profile.dietary.length === 0
        ? ""
        : answers.dietaryChoice === "no"
          ? "For this trip, do not prioritise my stored dietary preferences."
          : "For this trip, prioritise my stored dietary preferences.";

    return {
      from: answers.from.trim(),
      to: answers.to.trim(),
      startDate: answers.startDate,
      endDate: answers.endDate,
      adults: answers.adults,
      children: answers.children,
      elderly: answers.elderly,
      mobilitySupport: answers.mobilitySupport,
      budget: Math.round(answers.budget),
      transportPreference: answers.transportPreference,
      priorities: answers.priorities,
      tripNeeds: answers.tripNeeds,
      additionalPreferences: [answers.additionalPreferences.trim(), dietaryNote]
        .filter((value) => value.length > 0)
        .join(" "),
    };
  }, [answers, profile.dietary.length]);

  const buildPlan = useCallback(async () => {
    setError(null);
    setStepError(null);
    setNotice(null);
    setView("loading");
    scrollToTop();

    const startedAt = Date.now();
    try {
      const response = await fetch("/api/trips/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ request: buildPayload() }),
      });

      if (response.status === 401) {
        router.replace("/auth?reason=session");
        return;
      }

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        options?: ItineraryOption[];
        assumptions?: Record<string, Co2Assumption[]>;
        comparisons?: Record<string, string[]>;
        engine?: "ai" | "prototype";
        note?: string | null;
        request?: TripRequestSummary;
      };

      if (!response.ok || !data.options || !data.request) {
        setError(
          data.error ??
            "Your trip planner hit a small bump. Let's try that again in a moment.",
        );
        setView("questions");
        return;
      }

      // Keep the loading state on screen long enough to read it.
      const elapsed = Date.now() - startedAt;
      if (elapsed < 2200) await new Promise((r) => setTimeout(r, 2200 - elapsed));

      setPlan({
        options: data.options,
        assumptions: data.assumptions ?? {},
        comparisons: data.comparisons ?? {},
        engine: data.engine ?? "prototype",
        note: data.note ?? null,
        request: data.request,
      });
      setSelectedId(null);
      setView("options");
      scrollToTop();
    } catch {
      setError(
        "We couldn't reach the server just now. Your answers are still here — please try again.",
      );
      setView("questions");
    }
  }, [buildPayload, router, scrollToTop]);

  /* ---------------------------------------------------------------- */
  /* Navigation (declared after buildPlan so the order is correct)      */
  /* ---------------------------------------------------------------- */

  const goNext = () => {
    const problem = validateStep(activeKey);
    if (problem) {
      setStepError(problem);
      return;
    }
    if (safeIndex >= activeSteps.length - 1) {
      void buildPlan();
      return;
    }
    setStepIndex(safeIndex + 1);
    setStepError(null);
    scrollToTop();
  };

  const goBack = () => {
    setStepError(null);
    setError(null);
    setStepIndex(Math.max(0, safeIndex - 1));
    scrollToTop();
  };

  const applyModification = useCallback(async () => {
    if (!plan || !selectedId) return;
    const selected = plan.options.find((option) => option.optionId === selectedId);
    if (!selected) return;
    if (modification.trim().length < 3) {
      setError("Tell us what you'd like to change.");
      return;
    }

    setError(null);
    setView("saving");
    scrollToTop();

    const startedAt = Date.now();
    try {
      const response = await fetch("/api/trips/modify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          request: plan.request,
          option: selected,
          modification: modification.trim(),
        }),
      });

      if (response.status === 401) {
        router.replace("/auth?reason=session");
        return;
      }

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        option?: ItineraryOption;
        assumptions?: Co2Assumption[];
        note?: string | null;
      };

      if (!response.ok || !data.option) {
        setError(
          data.error ??
            "Your trip planner hit a small bump. Let's try that again.",
        );
        setView("detail");
        return;
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < 1800) await new Promise((r) => setTimeout(r, 1800 - elapsed));

      const updated = data.option;
      setPlan((previous) =>
        previous
          ? {
              ...previous,
              options: previous.options.map((option) =>
                option.optionId === updated.optionId ? updated : option,
              ),
              assumptions: {
                ...previous.assumptions,
                [updated.optionId]: data.assumptions ?? [],
              },
            }
          : previous,
      );
      setNotice(data.note ?? null);
      setModification("");
      setView("detail");
      scrollToTop();
    } catch {
      setError(
        "We couldn't reach the server just now. Please try again in a moment.",
      );
      setView("detail");
    }
  }, [modification, plan, router, scrollToTop, selectedId]);

  const confirmTrip = useCallback(async () => {
    if (!plan || !selectedId) return;
    const selected = plan.options.find((option) => option.optionId === selectedId);
    if (!selected) return;

    setError(null);
    setView("saving");
    scrollToTop();

    try {
      const response = await fetch("/api/trips/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          request: plan.request,
          option: selected,
          engine: plan.engine,
          assumptions: plan.assumptions[selectedId] ?? [],
        }),
      });

      if (response.status === 401) {
        router.replace("/auth?reason=session");
        return;
      }

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        tripId?: string;
      };

      if (!response.ok || !data.tripId) {
        setError(
          data.error ??
            "We couldn't save your trip just now. Please try again in a moment.",
        );
        setView("detail");
        return;
      }

      router.push(`/trips/${data.tripId}`);
    } catch {
      setError(
        "We couldn't reach the server just now. Please try again in a moment.",
      );
      setView("detail");
    }
  }, [plan, router, scrollToTop, selectedId]);

  const selectedOption =
    plan && selectedId
      ? (plan.options.find((option) => option.optionId === selectedId) ?? null)
      : null;

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  const totalTravelers = answers.adults + answers.children + answers.elderly;
  const isQuestions = view === "questions";
  const recommendedId = useMemo(
    () => (plan ? pickRecommended(plan.options) : null),
    [plan],
  );
  const greenest = useMemo(
    () => (plan ? greenestCo2(plan.options) : undefined),
    [plan],
  );

  return (
    <div
      ref={topRef}
      className={clsx(
        "mx-auto w-full px-4 py-8 sm:px-6 lg:px-8",
        isQuestions ? "max-w-6xl" : "max-w-5xl",
      )}
    >
      <header className={isQuestions ? "mb-6 lg:mb-8" : "mb-8"}>
        <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase">
          Plan my trip
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold sm:text-4xl">
          {view === "questions"
            ? "Plan your next journey"
            : view === "options"
              ? "Four options, built for you"
              : view === "experience"
                ? "Comfort & experience"
                : selectedOption
                  ? selectedOption.title
                  : "Planning your journey"}
        </h1>
        {view === "questions" && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">
            Let&apos;s build a trip that actually fits you
            {userName ? `, ${userName.split(" ")[0]}` : ""}. Ten quick
            questions, and your accessibility profile is already saved, so we
            won&apos;t ask for it again.
          </p>
        )}
      </header>

      {error && (
        <p
          role="alert"
          className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <Icon name="alert" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          {error}
        </p>
      )}

      {notice && !error && (
        <p className="mb-6 flex items-start gap-2 rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm text-sand-700">
          <Icon name="sparkles" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          {notice}
        </p>
      )}

      {view === "loading" && <TripPlanningProgress />}
      {view === "saving" && (
        <TripPlanningProgress
          title="Applying your changes…"
          subtitle="Updating the itinerary and re-checking accessibility."
        />
      )}

      {isQuestions && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-stretch">
          <div className="min-w-0">
            <div className="lg:hidden">
              <ProgressIndicator current={safeIndex + 1} stages={stages} />
            </div>
            <QuestionCard
              meta={meta}
              answers={answers}
              profile={profile}
              stepKey={activeKey}
              error={stepError}
              isLast={safeIndex >= activeSteps.length - 1}
              onPatch={patch}
              onToggle={toggleIn}
              onBack={goBack}
              onNext={goNext}
              canGoBack={safeIndex > 0}
              totalTravelers={totalTravelers}
              stepNumber={safeIndex + 1}
              stepCount={activeSteps.length}
            />
          </div>

          <JourneyPanel
            steps={activeSteps}
            answers={answers}
            profile={profile}
            currentIndex={safeIndex}
            onJump={(index) => {
              setStepIndex(index);
              setStepError(null);
              scrollToTop();
            }}
          />
        </div>
      )}

      {view === "options" && plan && (
        <section aria-label="Your four itinerary options">
          {plan.note && (
            <p className="mb-5 flex items-start gap-2 rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 text-sm text-sand-700">
              <Icon name="sparkles" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              {plan.note}
            </p>
          )}

          <p className="mb-5 text-sm text-ink-600">
            {plan.request.from} → {plan.request.to} ·{" "}
            {formatDateRange(plan.request.startDate, plan.request.endDate)} ·{" "}
            {plan.request.travelers} traveller
            {plan.request.travelers === 1 ? "" : "s"} · budget{" "}
            {formatINR(plan.request.budget)}
          </p>

          <p className="mb-5 flex items-start gap-2 rounded-2xl border border-forest-200 bg-forest-50/70 px-4 py-3 text-sm text-forest-900">
            <Icon name="leaf" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-forest-600" />
            <span>
              Every plan below keeps a <strong>low or moderate environmental
              impact</strong>. That is the constant you choose on, while cost,
              accessibility, sustainability and time are the trade-offs. We have
              marked the one that balances them best.
            </span>
          </p>

          {/* One option per row: full-width cards read top-to-bottom with
              far less scrolling than a cramped two-up grid. */}
          <div className="grid grid-cols-1 gap-5">
            {plan.options.map((option) => (
              <TripOptionCard
                key={option.optionId}
                option={option}
                labels={plan.comparisons[option.optionId] ?? []}
                impact={environmentalImpact(
                  option.summary.co2Kg,
                  plan.request.travelers,
                  greenest,
                )}
                recommended={recommendedId === option.optionId}
                onSelect={() => {
                  setSelectedId(option.optionId);
                  setView("experience");
                  scrollToTop();
                }}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => setView("questions")}>
              <Icon name="chevronLeft" className="h-4.5 w-4.5" />
              Change trip details
            </Button>
            <Button variant="ghost" onClick={() => void buildPlan()}>
              <Icon name="sparkles" className="h-4.5 w-4.5" />
              Generate again
            </Button>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-ink-400">
            The recommended badge is our suggestion based on your saved
            priorities, not a claim that the others are wrong. All figures are
            prototype estimates.
          </p>
        </section>
      )}

      {view === "experience" && selectedOption && plan && (
        <TripExperienceView
          option={selectedOption}
          options={plan.options}
          impact={environmentalImpact(
            selectedOption.summary.co2Kg,
            plan.request.travelers,
            greenest,
          )}
          recommended={recommendedId === selectedOption.optionId}
          travelers={plan.request.travelers}
          onBack={() => {
            setSelectedId(null);
            setView("options");
            scrollToTop();
          }}
          onContinue={() => {
            setView("detail");
            scrollToTop();
          }}
        />
      )}

      {view === "detail" && selectedOption && plan && (
        <DetailView
          option={selectedOption}
          onBack={() => {
            setSelectedId(null);
            setView("options");
            scrollToTop();
          }}
          onModify={() => {
            setModification("");
            setNotice(null);
            setError(null);
            setView("modify");
            scrollToTop();
          }}
          onConfirm={() => void confirmTrip()}
        />
      )}

      {view === "modify" && selectedOption && (
        <section
          aria-label="Modify itinerary"
          className="card p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold">
            What would you like to change? ✨
          </h2>
          <p className="mt-1.5 text-sm text-ink-600">
            Tell us in your own words — we&apos;ll rebuild the itinerary and
            validate it again before showing it.
          </p>

          <label htmlFor="modification" className="sr-only">
            Your change request
          </label>
          <textarea
            id="modification"
            rows={4}
            value={modification}
            onChange={(event) => setModification(event.target.value)}
            placeholder="Make Day 2 less tiring and add more nature activities."
            className="field mt-4 resize-y leading-relaxed"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Reduce walking",
              "Make it cheaper",
              "Add more sustainable experiences",
              "Give us more rest time",
              "Use public transport instead",
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setModification(example)}
                className="rounded-full border border-ink-200 bg-surface px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                {example}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={() => void applyModification()}>
              Apply changes
              <Icon name="arrowRight" className="h-4.5 w-4.5" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setView("detail");
                scrollToTop();
              }}
            >
              Cancel
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One-question card                                                   */
/* ------------------------------------------------------------------ */

function QuestionCard({
  meta,
  stepKey,
  answers,
  profile,
  error,
  isLast,
  onPatch,
  onToggle,
  onBack,
  onNext,
  canGoBack,
  totalTravelers,
  stepNumber,
  stepCount,
}: {
  meta: (typeof STEP_META)[StepKey];
  stepKey: StepKey;
  answers: Answers;
  profile: PlannerProfile;
  error: string | null;
  isLast: boolean;
  onPatch: (values: Partial<Answers>) => void;
  onToggle: (key: "priorities" | "tripNeeds", value: string, limit?: number) => void;
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  totalTravelers: number;
  stepNumber: number;
  stepCount: number;
}) {
  return (
    <section
      aria-label={meta.title}
      className="card animate-[fade-up_0.35s_cubic-bezier(0.22,1,0.36,1)_both] flex min-h-[26rem] flex-col p-5 sm:min-h-[30rem] sm:p-7 lg:min-h-[34rem]"
    >
      <p className="text-[11px] font-bold tracking-wide text-forest-600 uppercase">
        Question {stepNumber} of {stepCount}
      </p>
      <h2 className="mt-1.5 text-2xl font-semibold sm:text-3xl">
        {meta.prompt}
      </h2>
      {meta.hint && (
        <p className="mt-2.5 text-sm leading-relaxed text-ink-500">
          {meta.hint}
        </p>
      )}

      <div className="mt-6 flex-1">
        <Fields
          stepKey={stepKey}
          answers={answers}
          profile={profile}
          onPatch={onPatch}
          onToggle={onToggle}
          totalTravelers={totalTravelers}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-2.5 text-sm text-sand-700"
        >
          <Icon name="alert" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-sand-100 pt-5">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className={buttonClasses({
            variant: "ghost",
            size: "md",
            className: "!px-3",
          })}
        >
          <Icon name="chevronLeft" className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <Button onClick={onNext}>
          {isLast ? "Build my trip" : "Continue"}
          <Icon name={isLast ? "sparkles" : "arrowRight"} className="h-4.5 w-4.5" />
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Per-step fields                                                     */
/* ------------------------------------------------------------------ */

function Fields({
  stepKey,
  answers,
  profile,
  onPatch,
  onToggle,
  totalTravelers,
}: {
  stepKey: StepKey;
  answers: Answers;
  profile: PlannerProfile;
  onPatch: (values: Partial<Answers>) => void;
  onToggle: (key: "priorities" | "tripNeeds", value: string, limit?: number) => void;
  totalTravelers: number;
}) {
  switch (stepKey) {
    case "from":
      return (
        <PlaceField
          id="trip-from"
          value={answers.from}
          suggestions={ORIGIN_SUGGESTIONS}
          placeholder="Mumbai"
          onChange={(value) => onPatch({ from: value, to: value === answers.to ? "" : answers.to })}
        />
      );

    case "to":
      return (
        <PlaceField
          id="trip-to"
          value={answers.to}
          suggestions={DESTINATION_SUGGESTIONS}
          placeholder="Mahabaleshwar"
          onChange={(value) => onPatch({ to: value })}
        />
      );

    case "dates": {
      const nights = nightsBetween(answers.startDate, answers.endDate);
      const days = daysBetween(answers.startDate, answers.endDate);
      return (
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="trip-start"
                className="block text-sm font-medium text-ink-700"
              >
                Leaving on
              </label>
              <input
                id="trip-start"
                type="date"
                min={todayIso()}
                value={answers.startDate}
                onChange={(event) => onPatch({ startDate: event.target.value })}
                className="field mt-2"
              />
            </div>
            <div>
              <label
                htmlFor="trip-end"
                className="block text-sm font-medium text-ink-700"
              >
                Returning on
              </label>
              <input
                id="trip-end"
                type="date"
                min={answers.startDate || todayIso()}
                value={answers.endDate}
                onChange={(event) => onPatch({ endDate: event.target.value })}
                className="field mt-2"
              />
            </div>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-ink-500">
            <Icon name="calendar" className="h-4 w-4" />
            {formatDateRange(answers.startDate, answers.endDate)} · {days} day
            {days === 1 ? "" : "s"}, {nights} night{nights === 1 ? "" : "s"}
          </p>
        </div>
      );
    }

    case "travelers":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Counter
            icon="user"
            label="Adults"
            description="18 and over"
            value={answers.adults}
            min={0}
            onChange={(value) => onPatch({ adults: value })}
          />
          <Counter
            icon="users"
            label="Children"
            description="Under 18"
            value={answers.children}
            min={0}
            onChange={(value) => onPatch({ children: value })}
          />
          <Counter
            icon="users"
            label="Elderly"
            description="Older adults joining"
            value={answers.elderly}
            min={0}
            onChange={(value) => onPatch({ elderly: value })}
          />
          <Counter
            icon="accessibility"
            label="Mobility support"
            description="Needs step-free help"
            value={answers.mobilitySupport}
            min={0}
            onChange={(value) => onPatch({ mobilitySupport: value })}
          />
          <p className="text-sm text-ink-500 sm:col-span-2">
            {totalTravelers} traveller{totalTravelers === 1 ? "" : "s"} in total.
            Your saved accessibility profile is already applied.
          </p>
        </div>
      );

    case "elderly":
      return (
        <MultiSelect
          options={ELDERLY_PRIORITY_OPTIONS}
          selected={answers.tripNeeds}
          onToggle={(value) => onToggle("tripNeeds", value)}
          legend="Elderly traveller priorities"
        />
      );

    case "mobility":
      return (
        <MultiSelect
          options={MOBILITY_NEED_OPTIONS}
          selected={answers.tripNeeds}
          onToggle={(value) => onToggle("tripNeeds", value)}
          legend="Accessibility priorities for this trip"
        />
      );

    case "children":
      return (
        <MultiSelect
          options={CHILD_NEED_OPTIONS}
          selected={answers.tripNeeds}
          onToggle={(value) => onToggle("tripNeeds", value)}
          legend="Travelling with children"
        />
      );

    case "dietary":
      return (
        <div>
          <ul className="flex flex-wrap gap-1.5">
            {profile.dietary.map((value) => (
              <li
                key={value}
                className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
              >
                {DIETARY_LABELS[value] ?? value}
              </li>
            ))}
          </ul>

          <fieldset className="mt-5">
            <legend className="sr-only">Dietary preference</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { value: "yes", label: "Yes, prioritise these", icon: "utensils" },
                  { value: "no", label: "Not for this trip", icon: "x" },
                ] as const
              ).map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  onClick={() => onPatch({ dietaryChoice: choice.value })}
                  aria-pressed={answers.dietaryChoice === choice.value}
                  className={clsx(
                    "flex items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition-colors",
                    answers.dietaryChoice === choice.value
                      ? "border-brand-400 bg-brand-50 text-brand-800"
                      : "border-ink-200 bg-surface text-ink-800 hover:border-brand-300",
                  )}
                >
                  <span
                    className={clsx(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                      answers.dietaryChoice === choice.value
                        ? "bg-brand-600 text-white"
                        : "bg-ink-100 text-ink-500",
                    )}
                  >
                    <Icon name={choice.icon} className="h-4.5 w-4.5" />
                  </span>
                  {choice.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      );

    case "priorities":
      return (
        <div>
          <MultiSelect
            options={PRIORITY_OPTIONS}
            selected={answers.priorities}
            onToggle={(value) => onToggle("priorities", value, MAX_PRIORITIES)}
            legend="Trip style"
          />
          <p className="mt-3 text-xs text-ink-400">
            {answers.priorities.length} of {MAX_PRIORITIES} selected
          </p>
        </div>
      );

    case "transport":
      return (
        <fieldset>
          <legend className="sr-only">Transport preference</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {TRANSPORT_OPTIONS.map((option) => {
              const selected = answers.transportPreference === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onPatch({ transportPreference: option.value })}
                  aria-pressed={selected}
                  className={clsx(
                    "flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-colors",
                    selected
                      ? "border-brand-400 bg-brand-50 shadow-soft"
                      : "border-ink-200 bg-surface hover:border-brand-300",
                  )}
                >
                  <span
                    className={clsx(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                      selected ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-500",
                    )}
                  >
                    <Icon name={option.icon ?? "compass"} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink-900">
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="mt-0.5 block text-xs text-ink-500">
                        {option.description}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      );

    case "budget":
      return (
        <div>
          <div className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onPatch({ budget: option.value })}
                aria-pressed={answers.budget === option.value}
                className={clsx(
                  "min-h-11 rounded-full border px-5 text-sm font-semibold transition-colors",
                  answers.budget === option.value
                    ? "border-brand-400 bg-brand-50 text-brand-800"
                    : "border-ink-200 bg-surface text-ink-700 hover:border-brand-300",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-4 max-w-xs">
            <label
              htmlFor="trip-budget"
              className="block text-sm font-medium text-ink-700"
            >
              Or enter your own budget
            </label>
            <div className="mt-2 flex items-center gap-2">
              <span aria-hidden="true" className="text-sm text-ink-500">
                ₹
              </span>
              <input
                id="trip-budget"
                type="number"
                inputMode="numeric"
                min={BUDGET_MIN}
                max={BUDGET_MAX}
                step={500}
                value={Number.isFinite(answers.budget) ? answers.budget : ""}
                onChange={(event) =>
                  onPatch({ budget: Number(event.target.value) })
                }
                className="field"
              />
            </div>
          </div>
        </div>
      );

    case "notes":
      return (
        <div>
          <label htmlFor="trip-notes" className="sr-only">
            Anything else we should know
          </label>
          <textarea
            id="trip-notes"
            rows={4}
            value={answers.additionalPreferences}
            onChange={(event) =>
              onPatch({ additionalPreferences: event.target.value })
            }
            placeholder="Keep walking low because my father has knee problems. Prefer quiet places."
            className="field resize-y leading-relaxed"
          />
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {[
              "Prefer quiet places",
              "Need frequent rest stops",
              "Would like vegetarian food",
              "Prefer nature and less crowded places",
            ].map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() =>
                    onPatch({
                      additionalPreferences: `${answers.additionalPreferences} ${example}.`.trim(),
                    })
                  }
                  className="rounded-full border border-ink-200 bg-surface px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  + {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      );

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function PlaceField({
  id,
  value,
  suggestions,
  placeholder,
  onChange,
}: {
  id: string;
  value: string;
  suggestions: string[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onChange(suggestion)}
            aria-pressed={value === suggestion}
            className={clsx(
              "min-h-10 rounded-full border px-4 text-sm font-medium transition-colors",
              value === suggestion
                ? "border-brand-400 bg-brand-50 text-brand-800"
                : "border-ink-200 bg-surface text-ink-700 hover:border-brand-300",
            )}
          >
            {suggestion}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange("")}
          className="min-h-10 rounded-full border border-dashed border-ink-300 px-4 text-sm font-medium text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-700"
        >
          Other destination
        </button>
      </div>
    </div>
  );
}

function MultiSelect({
  options,
  selected,
  onToggle,
  legend,
}: {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  legend: string;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              aria-pressed={isSelected}
              className={clsx(
                "flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-colors",
                isSelected
                  ? "border-brand-400 bg-brand-50 shadow-soft"
                  : "border-ink-200 bg-surface hover:border-brand-300",
              )}
            >
              <span
                className={clsx(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  isSelected ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-500",
                )}
              >
                <Icon name={option.icon ?? "check"} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink-900">
                  {option.label}
                </span>
                {option.description && (
                  <span className="mt-0.5 block text-xs text-ink-500">
                    {option.description}
                  </span>
                )}
              </span>
              <span
                aria-hidden="true"
                className={clsx(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                  isSelected
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-ink-300 bg-surface",
                )}
              >
                {isSelected && (
                  <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Counter({
  icon,
  label,
  description,
  value,
  min,
  onChange,
}: {
  icon: "user" | "users" | "accessibility";
  label: string;
  description: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-surface p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-500">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900">{label}</p>
          <p className="text-xs text-ink-500">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Remove one ${label}`}
          className="grid h-10 w-10 place-items-center rounded-full border border-ink-200 bg-surface text-ink-700 transition-colors hover:border-brand-300 disabled:opacity-40"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
        <span
          aria-live="polite"
          className="w-8 text-center text-base font-semibold text-ink-900"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Add one ${label}`}
          className="grid h-10 w-10 place-items-center rounded-full border border-ink-200 bg-surface text-ink-700 transition-colors hover:border-brand-300"
        >
          <Icon name="plus" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Detailed itinerary + confirm/modify                                 */
/* ------------------------------------------------------------------ */

function DetailView({
  option,
  onBack,
  onModify,
  onConfirm,
}: {
  option: ItineraryOption;
  onBack: () => void;
  onModify: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition-colors hover:text-brand-700"
      >
        <Icon name="chevronLeft" className="h-4.5 w-4.5" />
        Back to all four options
      </button>

      {/* Summary on the left, the collapsible day list on the right, so the
          full itinerary stays glanceable instead of a long scroll. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <section aria-label="Itinerary summary" className="card p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-ink-600">
          {option.description}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryTile label="Estimated cost" value={formatINR(option.summary.cost)} />
          <SummaryTile label="Travel time" value={option.summary.duration} />
          <SummaryTile
            label="Estimated CO₂"
            value={`${formatCo2(option.summary.co2Kg)}*`}
          />
          <SummaryTile
            label="Accessibility"
            value={`${option.summary.accessibilityScore}%`}
            hint="Estimated"
          />
          <SummaryTile
            label="Sustainability"
            value={`${option.summary.sustainabilityScore}/100`}
            hint="Prototype"
          />
        </dl>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-ink-200 bg-canvas p-4">
            <p className="text-xs font-semibold tracking-wide text-ink-400 uppercase">
              Transport
            </p>
            <p className="mt-1.5 text-sm font-semibold text-ink-900">
              {option.transport.label || MODE_LABELS[option.transport.mode]}
            </p>
            <p className="mt-1 text-xs text-ink-500">
              {option.transport.duration} · ~{option.transport.distanceKm} km each
              way · {option.transport.co2Kg} kg estimated CO₂
            </p>
          </div>
          <div className="rounded-2xl border border-ink-200 bg-canvas p-4">
            <p className="text-xs font-semibold tracking-wide text-ink-400 uppercase">
              Stay
            </p>
            <p className="mt-1.5 text-sm font-semibold text-ink-900">
              {option.stay.name}
            </p>
            <p className="mt-1 text-xs text-ink-500">
              {formatINR(option.stay.costPerNight)} / night · accessibility{" "}
              {option.stay.accessibilityScore}% · sustainability{" "}
              {option.stay.sustainabilityScore}/100
            </p>
          </div>
        </div>

        {option.safetyNotes && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800">
            <Icon name="accessibility" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            {option.safetyNotes}
          </p>
        )}
      </section>

      <section aria-label="Day-by-day itinerary" className="card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Icon name="calendar" className="h-4.5 w-4.5" />
          </span>
          Your day-by-day itinerary
        </h2>
        <p className="mt-1.5 text-xs text-ink-500">
          Day one is open. Tap any other day to expand it.
        </p>
        <div className="mt-4">
          <TripDayAccordion option={option} />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-400">
          * Estimated CO₂ is a prototype calculation, not a verified
          environmental measurement.
        </p>
      </section>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={onConfirm}>
          <Icon name="check" className="h-4.5 w-4.5" />
          Confirm itinerary
        </Button>
        <Button variant="secondary" size="lg" onClick={onModify}>
          <Icon name="edit" className="h-4.5 w-4.5" />
          Modify itinerary
        </Button>
      </div>
      <p className="text-xs text-ink-400">
        Nothing is saved until you confirm — you can modify as many times as you
        like.
      </p>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-canvas px-3.5 py-3">
      <dt className="text-[11px] font-medium text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-ink-900">
        {value}
        {hint && (
          <span className="ml-1 text-[10px] font-medium text-ink-400">
            ({hint})
          </span>
        )}
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The full-height question panel                                      */
/* ------------------------------------------------------------------ */

/** A one-line, human summary of what each question currently holds. */
function stepSummary(
  key: StepKey,
  answers: Answers,
  profile: PlannerProfile,
): string {
  switch (key) {
    case "from":
      return answers.from || "Not set yet";
    case "to":
      return answers.to || "Not set yet";
    case "dates":
      return formatDateRange(answers.startDate, answers.endDate);
    case "travelers": {
      const total =
        answers.adults + answers.children + answers.elderly;
      return `${total} traveller${total === 1 ? "" : "s"} · ${answers.adults} adult${
        answers.adults === 1 ? "" : "s"
      }`;
    }
    case "elderly":
    case "children":
    case "mobility":
      return answers.tripNeeds.length > 0
        ? `${answers.tripNeeds.length} selected`
        : "Nothing selected";
    case "dietary":
      return answers.dietaryChoice === "yes"
        ? `${profile.dietary.length} saved preference${
            profile.dietary.length === 1 ? "" : "s"
          } prioritised`
        : "Not prioritised this trip";
    case "priorities":
      return (
        answers.priorities
          .map((value) => PRIORITY_LABELS[value] ?? value)
          .join(", ") || "None selected"
      );
    case "transport":
      return (
        TRANSPORT_LABELS[answers.transportPreference] ?? "Not set yet"
      );
    case "budget":
      return formatINR(answers.budget);
    case "notes":
      return answers.additionalPreferences.trim().length > 0
        ? "Notes added"
        : "Nothing extra";
    default:
      return "";
  }
}

/**
 * The right-hand rectangle: every question in the flow, one after another, with
 * the current one highlighted. It doubles as navigation — tapping a step jumps
 * straight to it — so the panel earns its space instead of decorating it.
 */
function JourneyPanel({
  steps,
  answers,
  profile,
  currentIndex,
  onJump,
}: {
  steps: StepKey[];
  answers: Answers;
  profile: PlannerProfile;
  currentIndex: number;
  onJump: (index: number) => void;
}) {
  const total = steps.length;
  const percent = Math.round(((currentIndex + 1) / total) * 100);

  return (
    <aside
      aria-label="All trip questions"
      className="card flex flex-col overflow-hidden lg:sticky lg:top-24 lg:h-[calc(100dvh-7.5rem)]"
    >
      <div className="border-b border-sand-100 bg-gradient-to-br from-forest-50 to-warm-100 p-5">
        <p className="text-[11px] font-bold tracking-wide text-forest-700 uppercase">
          Your trip in {total} answers
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
          Every question is pre-filled with a sensible default. Sort out any you
          want, then keep pressing Continue.
        </p>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <p className="text-xs font-bold text-forest-800">
            Step {currentIndex + 1} of {total}
          </p>
          <p className="text-xs font-semibold text-sand-600">
            {percent}% complete
          </p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-forest-500 to-forest-700 transition-[width] duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ol className="flex-1 space-y-1 overflow-y-auto p-3">
        {steps.map((key, index) => {
          const status =
            index < currentIndex
              ? "done"
              : index === currentIndex
                ? "current"
                : "pending";
          const isCurrent = status === "current";

          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onJump(index)}
                aria-current={isCurrent ? "step" : undefined}
                className={clsx(
                  "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors duration-200",
                  isCurrent
                    ? "bg-forest-700 shadow-sm shadow-forest-800/20"
                    : "hover:bg-forest-50",
                )}
              >
                <span
                  className={clsx(
                    "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                    isCurrent
                      ? "bg-white/20 text-white"
                      : status === "done"
                        ? "bg-forest-600 text-white"
                        : "bg-sand-100 text-sand-500",
                  )}
                >
                  {status === "done" ? (
                    <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={clsx(
                      "block text-sm font-semibold",
                      isCurrent ? "text-white" : "text-ink-800",
                    )}
                  >
                    {STEP_META[key].chip}
                  </span>
                  <span
                    className={clsx(
                      "mt-0.5 block truncate text-xs",
                      isCurrent ? "text-emerald-100" : "text-ink-500",
                    )}
                  >
                    {stepSummary(key, answers, profile)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-sand-100 bg-sand-50/60 p-4">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-sand-600">
          <Icon
            name="sparkles"
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600"
          />
          Auto-filled so you can move through all {total} questions with
          Continue alone. Tap any step to jump straight to it.
        </p>
      </div>
    </aside>
  );
}
