"use client";

import { clsx } from "clsx";

import Icon from "@/components/Icon";
import type { Option } from "@/lib/profile-options";

export default function SelectionCard({
  option,
  selected,
  onToggle,
}: {
  option: Option;
  selected: boolean;
  onToggle: (value: string) => void;
}) {
  return (
    <label
      className={clsx(
        "group relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-all duration-200",
        selected
          ? "border-brand-400 bg-brand-50/70 shadow-soft"
          : "border-ink-200 bg-surface hover:border-brand-300 hover:bg-brand-50/30",
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(option.value)}
        className="peer sr-only"
      />

      <span
        className={clsx(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors",
          selected
            ? "bg-brand-600 text-white"
            : "bg-ink-100 text-ink-500 group-hover:bg-brand-100 group-hover:text-brand-700",
        )}
      >
        <Icon name={option.icon ?? "check"} className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink-900">
          {option.label}
        </span>
        {option.description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
            {option.description}
          </span>
        )}
      </span>

      <span
        aria-hidden="true"
        className={clsx(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors",
          selected
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-ink-300 bg-surface",
        )}
      >
        {selected && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} />}
      </span>
    </label>
  );
}
