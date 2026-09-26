import { clsx } from "clsx";

import Icon from "@/components/Icon";

export type Stage = {
  /** Short label shown inside the desktop pill. */
  label: string;
  /** Full question title, used for the mobile summary and the a11y label. */
  title: string;
};

/**
 * Stage tracker for the guided profile conversation.
 *
 * - Desktop: a numbered pill per stage, completed ones ticked.
 * - Mobile: a compact "Step X of Y" line with a progress bar, so the tracker
 *   never eats the vertical space the conversation needs.
 */
export default function ProgressIndicator({
  current,
  stages,
  hint,
}: {
  current: number;
  stages: Stage[];
  hint?: string;
}) {
  const total = stages.length;
  const safeCurrent = Math.min(Math.max(current, 1), total);
  const active = stages[safeCurrent - 1];
  const percent = Math.round((safeCurrent / total) * 100);

  return (
    <div aria-label="Profile progress">
      {/* Screen readers get a single, clear summary. */}
      <p className="sr-only" aria-live="polite">
        Step {safeCurrent} of {total}: {active?.title}
      </p>

      {/* Mobile / tablet: compact. */}
      <div className="lg:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-semibold text-ink-800">
            Step {safeCurrent} of {total}
          </p>
          <p className="truncate text-xs font-medium text-ink-500">
            {active?.title}
          </p>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-[width] duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Desktop: full stage list. */}
      <ol className="hidden items-center gap-1.5 lg:flex">
        {stages.map((stage, index) => {
          const number = index + 1;
          const isComplete = number < safeCurrent;
          const isCurrent = number === safeCurrent;

          return (
            <li key={stage.label} className="flex min-w-0 flex-1 items-center gap-1.5">
              <div
                className={clsx(
                  "flex min-w-0 items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 transition-colors",
                  isCurrent && "bg-brand-50",
                )}
              >
                <span
                  className={clsx(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors",
                    isComplete && "bg-brand-600 text-white",
                    isCurrent && "bg-brand-600 text-white",
                    !isComplete && !isCurrent && "bg-ink-100 text-ink-400",
                  )}
                >
                  {isComplete ? (
                    <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    number
                  )}
                </span>
                <span
                  className={clsx(
                    "hidden truncate text-xs font-medium xl:block",
                    isCurrent ? "text-brand-800" : "text-ink-400",
                  )}
                >
                  {stage.label}
                </span>
              </div>

              {number < total && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    "h-px min-w-2 flex-1 rounded-full",
                    isComplete ? "bg-brand-300" : "bg-ink-200",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {hint && (
        <p className="mt-2 hidden text-xs text-ink-400 lg:block">{hint}</p>
      )}
    </div>
  );
}
