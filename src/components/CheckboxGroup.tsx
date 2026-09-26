"use client";

import { clsx } from "clsx";

import SelectionCard from "@/components/SelectionCard";
import type { Option } from "@/lib/profile-options";

export default function CheckboxGroup({
  legend,
  description,
  options,
  selected,
  onToggle,
  columns = 2,
  compact = false,
}: {
  legend: string;
  description?: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  columns?: 1 | 2 | 3;
  compact?: boolean;
}) {
  const gridClass =
    columns === 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : columns === 2
        ? "sm:grid-cols-2"
        : "grid-cols-1";

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      {description && (
        <p className="mb-3 text-sm text-ink-500">{description}</p>
      )}
      <div className={clsx("grid gap-3", gridClass, compact && "gap-2.5")}>
        {options.map((option) => (
          <SelectionCard
            key={option.value}
            option={option}
            selected={selected.includes(option.value)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </fieldset>
  );
}
