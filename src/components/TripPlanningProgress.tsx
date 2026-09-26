"use client";

import { useEffect, useState } from "react";

import Icon from "@/components/Icon";

/**
 * Intentional loading experience — a sequence of plain-language status lines
 * rather than a bare spinner. The messages are informational, so they stay
 * readable when animations are reduced.
 */
const MESSAGES = [
  "Understanding your preferences…",
  "Fetching your accessibility profile…",
  "Finding accessible options…",
  "Comparing lower-impact routes…",
  "Building your itinerary…",
  "Checking your trip details…",
  "Preparing your personalized journey…",
];

export default function TripPlanningProgress({
  title = "Planning your journey…",
  subtitle = "Finding routes, stays and experiences that fit your preferences.",
}: {
  title?: string;
  subtitle?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((value) => (value + 1) % MESSAGES.length);
    }, 1700);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex w-full max-w-xl flex-col items-center rounded-[var(--radius-xl2)] border border-ink-200 bg-surface p-8 text-center shadow-lift"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
        <Icon name="leaf" className="h-7 w-7" />
      </span>

      <h2 className="mt-5 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">{subtitle}</p>

      <p className="mt-6 text-sm font-medium text-brand-700">
        {MESSAGES[index]}
      </p>

      <ul className="mt-6 w-full space-y-2 text-left">
        {MESSAGES.slice(0, 4).map((message, position) => (
          <li
            key={message}
            className="flex items-center gap-2.5 text-xs text-ink-400"
          >
            <span
              className={
                position <= index % 4
                  ? "grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"
                  : "grid h-4 w-4 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-300"
              }
            >
              <Icon name="check" className="h-3 w-3" strokeWidth={3} />
            </span>
            {message}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-xs text-ink-400">
        This can take a little while — we&apos;re comparing real options for you.
      </p>
    </div>
  );
}
