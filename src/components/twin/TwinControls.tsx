"use client";

import Icon from "@/components/Icon";
import {
  SCENARIO_PRESETS,
  type ScenarioPreset,
  type TwinConditions,
} from "@/lib/digital-twin";

const SLIDERS: {
  key: keyof TwinConditions;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}[] = [
  { key: "rainfallMm", label: "Rainfall intensity", min: 0, max: 80, step: 1, unit: "mm/h" },
  { key: "tempC", label: "Temperature", min: -5, max: 50, step: 1, unit: "°C" },
  { key: "windKph", label: "Wind speed", min: 0, max: 120, step: 1, unit: "km/h" },
  { key: "durationHours", label: "Storm duration", min: 0, max: 48, step: 1, unit: "h" },
];

/**
 * What-if controls for the Digital Twin. Changing any parameter re-runs the
 * simulation instantly — the real system is never touched, only its simulated
 * state.
 */
export default function TwinControls({
  conditions,
  onChange,
  activePreset,
  onPreset,
  liveLabel,
  onUseLive,
}: {
  conditions: TwinConditions;
  onChange: (next: TwinConditions) => void;
  activePreset: string | null;
  onPreset: (preset: ScenarioPreset) => void;
  liveLabel?: string;
  onUseLive: () => void;
}) {
  return (
    <section aria-label="What-if weather scenario" className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Icon name="bolt" className="h-4.5 w-4.5" />
            </span>
            What-if simulator
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600">
            Move a weather parameter and watch the twin re-estimate demand,
            movement, capacity and availability. The live system is never
            affected.
          </p>
        </div>
        {liveLabel && (
          <button
            type="button"
            onClick={onUseLive}
            className="inline-flex items-center gap-1.5 rounded-xl border border-forest-200 bg-forest-50 px-3 py-2 text-xs font-bold text-forest-800 transition-colors hover:bg-forest-100"
          >
            <Icon name="leaf" className="h-3.5 w-3.5" />
            Use live conditions ({liveLabel})
          </button>
        )}
      </div>

      {/* Presets */}
      <div className="mt-4 flex flex-wrap gap-2">
        {SCENARIO_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => onPreset(preset)}
            aria-pressed={activePreset === preset.key}
            title={preset.description}
            className={
              activePreset === preset.key
                ? "rounded-xl border border-brand-700 bg-brand-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm"
                : "rounded-xl border border-sand-200 bg-white px-3.5 py-2 text-xs font-bold text-sand-700 transition-colors hover:bg-sand-50"
            }
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Sliders */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {SLIDERS.map((slider) => (
          <label key={slider.key} className="block">
            <span className="flex items-center justify-between text-xs font-semibold text-ink-600">
              {slider.label}
              <span className="font-bold text-forest-800">
                {conditions[slider.key]}
                {slider.unit}
              </span>
            </span>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={conditions[slider.key]}
              onChange={(event) =>
                onChange({
                  ...conditions,
                  [slider.key]: Number(event.target.value),
                })
              }
              className="mt-2 w-full accent-forest-700"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
