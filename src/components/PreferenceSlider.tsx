"use client";

import Icon from "@/components/Icon";
import { weightToLabel, type PreferenceMeta } from "@/lib/profile-options";

export default function PreferenceSlider({
  meta,
  value,
  onChange,
}: {
  meta: PreferenceMeta;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-surface p-4">
      <div className="flex items-start gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icon name={meta.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label
              htmlFor={`pref-${meta.key}`}
              className="text-sm font-semibold text-ink-900"
            >
              {meta.label}
            </label>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              {weightToLabel(value)}
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
            {meta.description}
          </p>

          <input
            id={`pref-${meta.key}`}
            type="range"
            min={0}
            max={100}
            step={5}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            aria-valuetext={`${weightToLabel(value)} (${value} out of 100)`}
            className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-100 accent-brand-600"
          />

          <div className="mt-1.5 flex justify-between text-[11px] font-medium text-ink-400">
            <span>{meta.low}</span>
            <span>{meta.high}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
