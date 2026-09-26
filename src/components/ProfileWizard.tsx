"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, buttonClasses } from "@/components/Button";
import ChatMessage from "@/components/ChatMessage";
import CheckboxGroup from "@/components/CheckboxGroup";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";
import PreferenceSlider from "@/components/PreferenceSlider";
import ProgressIndicator, { type Stage } from "@/components/ProgressIndicator";
import SelectionsRail from "@/components/SelectionsRail";
import TextAreaField from "@/components/TextAreaField";
import {
  COMPLETION_SUMMARY,
  INTRO_MESSAGES,
  STEP_SCRIPT,
  fallbackNote,
  labelSelections,
  type QuestionKey,
} from "@/lib/assistant";
import {
  DIETARY_OPTIONS,
  HEARING_OPTIONS,
  MOBILITY_OPTIONS,
  PREFERENCE_META,
  TRAVELER_TYPE_OPTIONS,
  VISUAL_OPTIONS,
  type PreferenceKey,
} from "@/lib/profile-options";
import type { ProfileData } from "@/lib/profile-service";

type Answers = {
  travelerTypes: string[];
  requirements: { mobility: string[]; visual: string[]; hearing: string[] };
  details: { mobility: string; dietary: string };
  dietary: string[];
  preferences: Record<PreferenceKey, number>;
  specialRequirement: string;
};

type ChatEntry = { id: string; role: "assistant" | "user"; text: string };

const STEP_KEYS: QuestionKey[] = [
  "travelers",
  "mobility",
  "visual",
  "hearing",
  "dietary",
  "preferences",
  "special",
];

/** Every completed step appends exactly three transcript entries. */
const ENTRIES_PER_STEP = 3;

const SKIPPABLE: QuestionKey[] = [
  "mobility",
  "visual",
  "hearing",
  "dietary",
  "special",
];

/** Stage labels for the pinned tracker — six stages, `special` folds into 6. */
const STAGES: Stage[] = [
  { label: "Travelling with", title: "Who you're travelling with" },
  { label: "Mobility", title: "Mobility & accessibility" },
  { label: "Visual", title: "Visual accessibility" },
  { label: "Hearing", title: "Hearing accessibility" },
  { label: "Dietary", title: "Dietary requirements" },
  { label: "Priorities", title: "Travel preferences" },
];

/** How long the completion panel stays up before the dashboard redirect. */
const REDIRECT_DELAY_MS = 3000;

export default function ProfileWizard({
  initialProfile,
  userName,
}: {
  initialProfile: ProfileData;
  userName: string;
}) {
  const router = useRouter();

  const [answers, setAnswers] = useState<Answers>(() => ({
    travelerTypes: initialProfile.travelerTypes,
    requirements: {
      mobility: initialProfile.requirements.mobility,
      visual: initialProfile.requirements.visual,
      hearing: initialProfile.requirements.hearing,
    },
    details: { ...initialProfile.details },
    dietary: initialProfile.dietary,
    preferences: { ...initialProfile.preferences },
    specialRequirement: initialProfile.specialRequirement,
  }));

  const [view, setView] = useState<"intro" | "steps" | "done">("intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [transcript, setTranscript] = useState<ChatEntry[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepWarning, setStepWarning] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const idCounter = useRef(0);
  const nextId = useCallback(() => {
    idCounter.current += 1;
    return `entry-${idCounter.current}`;
  }, []);

  const activeKey = STEP_KEYS[stepIndex];
  const script = activeKey ? STEP_SCRIPT[activeKey] : null;
  const currentStage = view === "intro" ? 1 : (script?.stepNumber ?? 1);

  const liveProfile: ProfileData = useMemo(
    () => ({
      completed: false,
      travelerTypes: answers.travelerTypes,
      requirements: answers.requirements,
      details: answers.details,
      dietary: answers.dietary,
      preferences: answers.preferences,
      specialRequirement: answers.specialRequirement,
      updatedAt: null,
    }),
    [answers],
  );

  /* ---------------------------------------------------------------- */
  /* Keep the newest turn in view — never the page itself              */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [transcript.length, stepIndex, view, pending]);

  /* ---------------------------------------------------------------- */
  /* Auto-redirect to the dashboard once the profile is saved          */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (view !== "done") return;
    const timer = setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [view, router]);

  /* ---------------------------------------------------------------- */
  /* Selection helpers                                                 */
  /* ---------------------------------------------------------------- */

  const toggleInList = useCallback(
    (key: "travelerTypes" | "dietary", value: string) => {
      setAnswers((prev) => {
        const list = prev[key];
        return {
          ...prev,
          [key]: list.includes(value)
            ? list.filter((item) => item !== value)
            : [...list, value],
        };
      });
    },
    [],
  );

  const toggleRequirement = useCallback(
    (category: "mobility" | "visual" | "hearing", value: string) => {
      setAnswers((prev) => {
        const list = prev.requirements[category];
        return {
          ...prev,
          requirements: {
            ...prev.requirements,
            [category]: list.includes(value)
              ? list.filter((item) => item !== value)
              : [...list, value],
          },
        };
      });
    },
    [],
  );

  const setPreference = useCallback((key: PreferenceKey, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value },
    }));
  }, []);

  /* ---------------------------------------------------------------- */
  /* Persistence                                                       */
  /* ---------------------------------------------------------------- */

  const persist = useCallback(
    async (complete: boolean): Promise<boolean> => {
      setPending(true);
      setError(null);
      try {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...answers, complete }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/auth?reason=session");
            return false;
          }
          const data = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(
            data.error ??
              "We couldn't save your answers just now. Please try again.",
          );
          return false;
        }
        return true;
      } catch {
        setError(
          "We couldn't reach the server. Your answers are still here — please try again.",
        );
        return false;
      } finally {
        setPending(false);
      }
    },
    [answers, router],
  );

  /* ---------------------------------------------------------------- */
  /* Navigation                                                        */
  /* ---------------------------------------------------------------- */

  const startQuestionnaire = useCallback(() => {
    setView("steps");
    setStepIndex(0);
    setTranscript([]);
    setError(null);
  }, []);

  const currentLabels = useCallback((): string[] => {
    if (activeKey === "preferences") {
      return [...PREFERENCE_META]
        .sort(
          (a, b) => answers.preferences[b.key] - answers.preferences[a.key],
        )
        .slice(0, 3)
        .map((meta) => meta.label);
    }
    if (activeKey === "special") {
      const text = answers.specialRequirement.trim();
      return text ? [text.slice(0, 140)] : [];
    }
    return labelSelections(activeKey, {
      travelerTypes: answers.travelerTypes,
      mobility: answers.requirements.mobility,
      visual: answers.requirements.visual,
      hearing: answers.requirements.hearing,
      dietary: answers.dietary,
    });
  }, [activeKey, answers]);

  const handleContinue = useCallback(async () => {
    if (!script) return;

    if (activeKey === "travelers" && answers.travelerTypes.length === 0) {
      setStepWarning(
        "Select at least one option so we can personalize your trip.",
      );
      return;
    }
    setStepWarning(null);

    const labels = currentLabels();
    const isLast = stepIndex === STEP_KEYS.length - 1;

    setTranscript((prev) => [
      ...prev,
      { id: nextId(), role: "assistant", text: script.prompt },
      {
        id: nextId(),
        role: "user",
        text: labels.length > 0 ? labels.join(", ") : "Nothing to add",
      },
    ]);

    const saved = await persist(isLast);
    if (!saved) return;

    setTranscript((prev) => [
      ...prev,
      { id: nextId(), role: "assistant", text: fallbackNote(activeKey, labels) },
    ]);

    if (isLast) {
      setView("done");
    } else {
      setStepIndex((index) => index + 1);
    }
  }, [
    activeKey,
    answers.travelerTypes.length,
    currentLabels,
    nextId,
    persist,
    script,
    stepIndex,
  ]);

  const handleSkip = useCallback(() => {
    setStepWarning(null);
    setStepIndex((index) => Math.min(index + 1, STEP_KEYS.length - 1));
  }, []);

  const handleBack = useCallback(() => {
    setStepWarning(null);
    setError(null);
    setStepIndex((index) => {
      const next = Math.max(0, index - 1);
      setTranscript((prev) => prev.slice(0, next * ENTRIES_PER_STEP));
      return next;
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /* Optional AI flourish on completion (never blocking)               */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (view !== "done") return;
    let cancelled = false;

    const selections = [
      ...answers.travelerTypes,
      ...answers.requirements.mobility,
      ...answers.requirements.visual,
      ...answers.requirements.hearing,
      ...answers.dietary,
    ];

    fetch("/api/ai/message", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        step: "their accessibility, dietary and travel preference profile",
        selections,
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { note?: string | null } | null) => {
        if (!cancelled && data?.note) setAiNote(data.note);
      })
      .catch(() => {
        /* AI is optional — ignore failures entirely. */
      });

    return () => {
      cancelled = true;
    };
  }, [view, answers]);

  const isDone = view === "done";

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <Header userName={userName} currentStage={currentStage} />

      <div className="flex min-h-0 flex-1">
        {/* Conversation column */}
        <section
          aria-label="Conversation with the travel assistant"
          className="flex min-w-0 flex-1 flex-col"
        >
          <div
            ref={scrollRef}
            data-scroll-region="conversation"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-5 sm:px-6">
              {!isDone && (
                <>
                  {INTRO_MESSAGES.map((message) => (
                    <ChatMessage key={message} role="assistant">
                      {message}
                    </ChatMessage>
                  ))}

                  {transcript.map((entry) => (
                    <ChatMessage key={entry.id} role={entry.role}>
                      {entry.text}
                    </ChatMessage>
                  ))}

                  {view === "steps" && script && (
                    <>
                      <ChatMessage role="assistant">
                        {script.prompt}
                      </ChatMessage>

                      <div className="pl-11">
                        <div
                          className="rounded-2xl rounded-tl-md border border-ink-200 bg-surface p-4 shadow-soft sm:p-5"
                          role="group"
                          aria-label={script.title}
                        >
                          <StepFields
                            stepKey={activeKey}
                            answers={answers}
                            onToggleTraveler={(value) =>
                              toggleInList("travelerTypes", value)
                            }
                            onToggleDietary={(value) =>
                              toggleInList("dietary", value)
                            }
                            onToggleRequirement={toggleRequirement}
                            onSetPreference={setPreference}
                            onSetDetail={(key, value) =>
                              setAnswers((prev) => ({
                                ...prev,
                                details: { ...prev.details, [key]: value },
                              }))
                            }
                            onSetSpecial={(value) =>
                              setAnswers((prev) => ({
                                ...prev,
                                specialRequirement: value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {pending && <ChatMessage role="assistant" typing />}
                </>
              )}

              {isDone && <CompletionPanel userName={userName} aiNote={aiNote} />}
            </div>
          </div>

          {/* Pinned composer */}
          {!isDone && (
            <div
              data-composer="actions"
              className="shrink-0 border-t border-ink-200 bg-surface/95 backdrop-blur"
            >
              <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6">
                {(stepWarning || error) && (
                  <p
                    role="alert"
                    className={`mb-3 flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm ${
                      error
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-sand-200 bg-sand-50 text-sand-700"
                    }`}
                  >
                    <Icon name="alert" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                    {error ?? stepWarning}
                  </p>
                )}

                {view === "intro" ? (
                  <div className="flex justify-center">
                    <Button size="lg" onClick={startQuestionnaire}>
                      Let&apos;s get started
                      <Icon name="arrowRight" className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={stepIndex === 0 || pending}
                      className={buttonClasses({
                        variant: "ghost",
                        size: "md",
                        className: "!px-3",
                      })}
                    >
                      <Icon name="chevronLeft" className="h-4.5 w-4.5" />
                      <span className="hidden sm:inline">Back</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {SKIPPABLE.includes(activeKey) &&
                        stepIndex < STEP_KEYS.length - 1 && (
                          <button
                            type="button"
                            onClick={handleSkip}
                            disabled={pending}
                            className={buttonClasses({
                              variant: "ghost",
                              size: "md",
                            })}
                          >
                            Skip
                          </button>
                        )}

                      <Button
                        size="md"
                        onClick={handleContinue}
                        disabled={pending}
                      >
                        {pending
                          ? "Saving…"
                          : stepIndex === STEP_KEYS.length - 1
                            ? "Finish & save"
                            : "Continue"}
                        {!pending && (
                          <Icon name="arrowRight" className="h-4.5 w-4.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Live selections rail — bounded, never scrolls. */}
        <aside className="hidden w-80 shrink-0 overflow-hidden border-l border-ink-200 bg-surface/60 p-4 lg:flex lg:flex-col xl:w-[21rem]">
          <SelectionsRail profile={liveProfile} />
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header with the pinned stage tracker                                */
/* ------------------------------------------------------------------ */

function Header({
  userName,
  currentStage,
}: {
  userName: string;
  currentStage: number;
}) {
  return (
    <header className="shrink-0 border-b border-ink-200 bg-surface">
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-1.5 sm:px-6">
        <Logo href="/" />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-ink-500 sm:inline">
            {userName}
          </span>
          <LogoutButton />
        </div>
      </div>

      <div className="mx-auto w-full px-4 pb-2 sm:px-6">
        <ProgressIndicator current={currentStage} stages={STAGES} />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Step fields                                                         */
/* ------------------------------------------------------------------ */

function StepFields({
  stepKey,
  answers,
  onToggleTraveler,
  onToggleDietary,
  onToggleRequirement,
  onSetPreference,
  onSetDetail,
  onSetSpecial,
}: {
  stepKey: QuestionKey;
  answers: Answers;
  onToggleTraveler: (value: string) => void;
  onToggleDietary: (value: string) => void;
  onToggleRequirement: (
    category: "mobility" | "visual" | "hearing",
    value: string,
  ) => void;
  onSetPreference: (key: PreferenceKey, value: number) => void;
  onSetDetail: (key: "mobility" | "dietary", value: string) => void;
  onSetSpecial: (value: string) => void;
}) {
  switch (stepKey) {
    case "travelers":
      return (
        <CheckboxGroup
          legend="Who you will be travelling with"
          description="Select all that apply."
          options={TRAVELER_TYPE_OPTIONS}
          selected={answers.travelerTypes}
          onToggle={onToggleTraveler}
          columns={2}
          compact
        />
      );

    case "mobility":
      return (
        <div className="space-y-5">
          <CheckboxGroup
            legend="Mobility and accessibility needs"
            description="Select all that apply."
            options={MOBILITY_OPTIONS}
            selected={answers.requirements.mobility}
            onToggle={(value) => onToggleRequirement("mobility", value)}
            columns={2}
            compact
          />
          <TextAreaField
            id="mobility-detail"
            label="Is there anything else we should know?"
            placeholder="I cannot walk continuously for more than 10 minutes..."
            value={answers.details.mobility}
            onChange={(value) => onSetDetail("mobility", value)}
            rows={2}
          />
        </div>
      );

    case "visual":
      return (
        <CheckboxGroup
          legend="Visual accessibility preferences"
          options={VISUAL_OPTIONS}
          selected={answers.requirements.visual}
          onToggle={(value) => onToggleRequirement("visual", value)}
          columns={2}
          compact
        />
      );

    case "hearing":
      return (
        <CheckboxGroup
          legend="Hearing accessibility preferences"
          options={HEARING_OPTIONS}
          selected={answers.requirements.hearing}
          onToggle={(value) => onToggleRequirement("hearing", value)}
          columns={2}
          compact
        />
      );

    case "dietary":
      return (
        <div className="space-y-5">
          <CheckboxGroup
            legend="Dietary requirements"
            options={DIETARY_OPTIONS}
            selected={answers.dietary}
            onToggle={onToggleDietary}
            columns={2}
            compact
          />
          <TextAreaField
            id="dietary-detail"
            label="Tell us anything specific"
            placeholder="I follow a strict Jain diet with no root vegetables..."
            value={answers.details.dietary}
            onChange={(value) => onSetDetail("dietary", value)}
            rows={2}
          />
        </div>
      );

    case "preferences":
      return (
        <div className="space-y-3">
          {PREFERENCE_META.map((meta) => (
            <PreferenceSlider
              key={meta.key}
              meta={meta}
              value={answers.preferences[meta.key]}
              onChange={(value) => onSetPreference(meta.key, value)}
            />
          ))}
        </div>
      );

    case "special":
      return (
        <TextAreaField
          id="special-requirement"
          label="Anything else you'd like us to consider?"
          placeholder="Tell us anything that wasn't covered..."
          value={answers.specialRequirement}
          onChange={onSetSpecial}
          rows={4}
          optional={false}
        />
      );

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Completion panel (chat-native, auto-redirects)                      */
/* ------------------------------------------------------------------ */

function CompletionPanel({
  userName,
  aiNote,
}: {
  userName: string;
  aiNote: string | null;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-full items-center justify-center py-6">
      <div className="w-full animate-[fade-up_0.45s_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="mx-auto max-w-xl rounded-[var(--radius-xl2)] border border-ink-200 bg-surface p-6 text-center shadow-lift sm:p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-soft">
            <Icon name="check" className="h-7 w-7" strokeWidth={2.6} />
          </span>

          <h2 className="mt-5 text-2xl font-semibold">You&apos;re all set!</h2>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-600">
            We&apos;ve created your personalized travel profile
            {userName ? `, ${userName.split(" ")[0]}` : ""}.
          </p>

          {aiNote && (
            <p className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-800">
              {aiNote}
            </p>
          )}

          <ul className="mt-6 grid gap-2 text-left sm:grid-cols-2">
            {COMPLETION_SUMMARY.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-canvas px-3 py-2"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                  <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <span className="text-xs font-medium text-ink-700">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <p className="flex items-center justify-center gap-2 text-xs font-medium text-ink-500">
              <Icon name="sparkles" className="h-4 w-4 text-brand-500" />
              Taking you to your dashboard…
            </p>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                style={{
                  animation: `progress-fill ${REDIRECT_DELAY_MS}ms linear both`,
                }}
              />
            </div>

            <Button
              size="lg"
              className="mt-5"
              onClick={() => {
                router.push("/dashboard");
                router.refresh();
              }}
            >
              Explore My Dashboard
              <Icon name="arrowRight" className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
