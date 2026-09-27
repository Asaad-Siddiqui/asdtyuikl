"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import Icon from "@/components/Icon";
import NugenAdvisor from "@/components/twin/NugenAdvisor";
import TwinControls from "@/components/twin/TwinControls";
import { buildAdvisorContext } from "@/lib/twin-advisor";
import {
  SCENARIO_PRESETS,
  simulateTwin,
  twinSummary,
  type ScenarioPreset,
  type TwinConditions,
  type TwinEntity,
  type TwinState,
} from "@/lib/digital-twin";
import type { WeatherSnapshot } from "@/lib/weather";
import type { SocialSignalResult } from "@/lib/social-signals";

const DigitalTwinMap = dynamic(() => import("@/components/twin/DigitalTwinMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[380px] w-full place-items-center rounded-3xl border border-sand-200 bg-white text-sm text-sand-500 sm:h-[440px]">
      Loading interactive map…
    </div>
  ),
});

const STATUS_TONE: Record<TwinState["status"], string> = {
  Normal: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Watch: "bg-amber-100 text-amber-800 border-amber-200",
  Disrupted: "bg-orange-100 text-orange-800 border-orange-200",
  Severe: "bg-red-100 text-red-700 border-red-200",
};

const RISK_KEYS = new Set(["crowdPressure", "sustainabilityRisk", "accessibilityRisk"]);

function conditionsFromWeather(weather: WeatherSnapshot | undefined): TwinConditions | null {
  if (!weather) return null;
  return {
    rainfallMm: Math.round(weather.current.precipitationMm),
    tempC: Math.round(weather.current.tempC),
    windKph: Math.round(weather.current.windKph),
    durationHours: 0,
  };
}

export default function DigitalTwinView({
  entities,
  weather: initialWeather,
  socials: initialSocials,
}: {
  entities: TwinEntity[];
  weather: Record<string, WeatherSnapshot>;
  socials: SocialSignalResult;
}) {
  const [weather, setWeather] = useState(initialWeather);
  const [socials, setSocials] = useState(initialSocials);
  const [selectedId, setSelectedId] = useState<string | null>(entities[0]?.id ?? null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [conditions, setConditions] = useState<TwinConditions>(
    () => conditionsFromWeather(initialWeather[entities[0]?.id ?? ""]) ?? SCENARIO_PRESETS[0].conditions,
  );
  const [refreshing, setRefreshing] = useState(false);

  // The twin: one simulated state per entity for the current scenario.
  const states = useMemo(() => {
    const map: Record<string, TwinState> = {};
    for (const entity of entities) map[entity.id] = simulateTwin(entity, conditions);
    return map;
  }, [entities, conditions]);

  const summary = useMemo(() => twinSummary(Object.values(states)), [states]);
  const selected = entities.find((entity) => entity.id === selectedId) ?? entities[0] ?? null;
  const selectedState = selected ? states[selected.id] : null;
  const selectedWeather = selected ? weather[selected.id] : undefined;

  const handlePreset = useCallback((preset: ScenarioPreset) => {
    setConditions(preset.conditions);
    setActivePreset(preset.key);
  }, []);

  const handleChange = useCallback((next: TwinConditions) => {
    setConditions(next);
    setActivePreset(null);
  }, []);

  const handleUseLive = useCallback(() => {
    const live = conditionsFromWeather(selectedWeather);
    if (live) {
      setConditions(live);
      setActivePreset(null);
    }
  }, [selectedWeather]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const entries = await Promise.all(
        entities.map(async (entity) => {
          try {
            const response = await fetch(
              `/api/weather?lat=${entity.lat}&lon=${entity.lon}`,
            );
            if (!response.ok) return null;
            const data = (await response.json()) as { weather?: WeatherSnapshot };
            return data.weather ? ([entity.id, data.weather] as const) : null;
          } catch {
            return null;
          }
        }),
      );
      const next: Record<string, WeatherSnapshot> = { ...weather };
      for (const entry of entries) if (entry) next[entry[0]] = entry[1];
      setWeather(next);

      const query = `${selected?.name ?? "India"} rain`;
      const socialResponse = await fetch(
        `/api/social-signals?q=${encodeURIComponent(query)}&tag=monsoon`,
      );
      if (socialResponse.ok) {
        const data = (await socialResponse.json()) as SocialSignalResult;
        setSocials(data);
      }
    } finally {
      setRefreshing(false);
    }
  }, [entities, selected?.name, weather]);

  const weatherSource = Object.values(weather)[0]?.source ?? "sample";

  // The state the Nugen-aligned advisory model reasons over.
  const advisorContext = useMemo(() => {
    if (!selected || !selectedState) return null;
    const preset = SCENARIO_PRESETS.find((item) => item.key === activePreset);
    return buildAdvisorContext({
      entity: selected,
      state: selectedState,
      scenarioLabel: preset?.label ?? "Custom",
      conditions,
      weather: selectedWeather,
      signals: socials.signals,
    });
  }, [selected, selectedState, activePreset, conditions, selectedWeather, socials.signals]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-800">
            <Icon name="sparkles" className="h-3.5 w-3.5" />
            Weather-Driven Digital Twin
          </span>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-forest-950 sm:text-4xl">
            Digital Twin
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-sand-700">
            A live, continuously-updating model of the Travello ecosystem under
            changing weather. Drag a parameter to simulate a future state — the
            real system is never affected.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              weatherSource === "open-meteo"
                ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                : "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800"
            }
          >
            {weatherSource === "open-meteo" ? "● Live weather" : "● Sample weather"}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl bg-forest-800 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-forest-900 disabled:opacity-60"
          >
            <Icon name="leaf" className="h-4 w-4 text-emerald-300" />
            {refreshing ? "Refreshing…" : "Refresh live data"}
          </button>
        </div>
      </header>

      {/* Controls */}
      <TwinControls
        conditions={conditions}
        onChange={handleChange}
        activePreset={activePreset}
        onPreset={handlePreset}
        liveLabel={
          selectedWeather
            ? `${Math.round(selectedWeather.current.tempC)}°C · ${selectedWeather.current.condition}`
            : undefined
        }
        onUseLive={handleUseLive}
      />

      {/* Map + summary */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          <DigitalTwinMap
            entities={entities.map((entity) => ({
              id: entity.id,
              name: entity.name,
              region: entity.region,
              lat: entity.lat,
              lon: entity.lon,
            }))}
            states={states}
            weather={Object.fromEntries(
              Object.entries(weather).map(([id, snapshot]) => [
                id,
                {
                  icon: snapshot.current.icon,
                  condition: snapshot.current.condition,
                  tempC: snapshot.current.tempC,
                  precipitationMm: snapshot.current.precipitationMm,
                },
              ]),
            )}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <p className="text-xs leading-relaxed text-ink-400">
            Locations are approximate city centroids. Weather from Open-Meteo;
            map tiles © OpenStreetMap contributors. Impact rings show simulated
            propagation, not confirmed conditions.
          </p>
        </div>

        {/* Selected entity twin */}
        {selected && selectedState && (
          <section aria-label="Selected twin state" className="card space-y-4 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-forest-950">
                  {selected.name}
                </h2>
                <p className="text-xs font-medium text-sand-500">
                  {selected.region} · twin of the destination hub
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${STATUS_TONE[selectedState.status]}`}
              >
                {selectedState.status}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-ink-600">
              {selectedState.headline}
            </p>

            <dl className="grid grid-cols-3 gap-2">
              <MiniStat label="Severity" value={`${Math.round(selectedState.severity * 100)}%`} />
              <MiniStat label="Impact" value={`${selectedState.impact}/100`} />
              <MiniStat label="Crowd now" value={selectedState.weatherAdjustedCrowd} />
            </dl>

            <div className="rounded-2xl border border-forest-200 bg-forest-50/70 p-3.5">
              <p className="flex items-center gap-2 text-xs font-bold text-forest-800">
                <Icon name="leaf" className="h-3.5 w-3.5" />
                Weather-adjusted recommendations
              </p>
              <ul className="mt-2 space-y-1.5">
                {selectedState.recommendations.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-forest-900">
                    <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>

      {/* Network summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Entities modelled" value={String(entities.length)} icon="mapPin" />
        <Kpi label="Average impact" value={`${summary.averageImpact}/100`} icon="bolt" />
        <Kpi label="Non-normal" value={String(summary.affected)} icon="alert" />
        <Kpi label="Worst hit" value={summary.worst?.entityName ?? "—"} icon="users" />
      </div>

      {/* Metrics + propagation + predictions */}
      {selectedState && (
        <div className="grid gap-6 lg:grid-cols-3">
          <section aria-label="Twin metrics" className="card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-forest-950">
              Simulated state vs calm baseline
            </h2>
            <ul className="mt-4 space-y-3.5">
              {selectedState.metrics.map((metric) => {
                const worsening = RISK_KEYS.has(metric.key)
                  ? metric.direction === "up"
                  : metric.direction === "down";
                const deltaTone =
                  metric.direction === "steady"
                    ? "text-sand-500"
                    : worsening
                      ? "text-red-600"
                      : "text-emerald-700";
                return (
                  <li key={metric.key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-700">{metric.label}</span>
                      <span className={`font-bold ${deltaTone}`}>
                        {Math.round(metric.value)}
                        <span className="text-ink-400">
                          {" "}
                          (base {Math.round(metric.baseline)})
                        </span>
                      </span>
                    </div>
                    <div className="relative mt-1.5 h-2.5 overflow-hidden rounded-full bg-sand-100">
                      <div
                        className="h-full rounded-full bg-forest-700"
                        style={{ width: `${Math.max(2, Math.min(100, metric.value))}%` }}
                      />
                      <span
                        className="absolute top-0 h-full w-0.5 bg-ink-900/50"
                        style={{ left: `${Math.max(2, Math.min(100, metric.baseline))}%` }}
                        aria-hidden
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-sand-500">{metric.description}</p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-label="Cascading propagation" className="card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-forest-950">
              Cascading propagation
            </h2>
            <p className="mt-1 text-xs text-sand-500">
              Direct → secondary → higher-order effects through the system.
            </p>
            <div className="mt-4 space-y-4">
              {[1, 2, 3].map((order) => {
                const steps = selectedState.propagation.filter((step) => step.order === order);
                if (steps.length === 0) return null;
                return (
                  <div key={order}>
                    <p className="text-[10px] font-black tracking-wider text-sand-500 uppercase">
                      {order === 1
                        ? "Direct (1st order)"
                        : order === 2
                          ? "Secondary (2nd order)"
                          : "Higher-order (3rd order)"}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {steps.map((step) => (
                        <li
                          key={`${step.from}-${step.to}`}
                          className="rounded-2xl border border-ink-200 bg-canvas p-3"
                        >
                          <p className="flex items-center gap-1.5 text-[11px] font-bold text-forest-700">
                            {step.from}
                            <Icon name="arrowRight" className="h-3 w-3" />
                            {step.to}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-ink-600">
                            {step.effect}
                          </p>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand-100">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{ width: `${Math.round(step.magnitude * 100)}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {selectedState.propagation.length === 0 && (
                <p className="text-xs text-sand-500">
                  No adverse propagation under these conditions.
                </p>
              )}
            </div>
          </section>

          <section aria-label="Probabilistic predictions" className="card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-forest-950">
              Probabilistic predictions
            </h2>
            <p className="mt-1 text-xs text-sand-500">
              Estimated change vs calm, with uncertainty bands.
            </p>
            <ul className="mt-4 space-y-3.5">
              {selectedState.predictions.map((prediction) => {
                const span = Math.max(1, Math.abs(prediction.high - prediction.low));
                return (
                  <li key={prediction.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-700">{prediction.label}</span>
                      <span
                        className={
                          prediction.direction === "up"
                            ? "font-bold text-amber-700"
                            : "font-bold text-blue-700"
                        }
                      >
                        {prediction.low}% to {prediction.high}%
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-sand-100">
                        <div
                          className="absolute h-full rounded-full bg-blue-400/70"
                          style={{
                            left: `${prediction.direction === "up" ? 50 : 50 - Math.min(48, span)}%`,
                            width: `${Math.min(48, span)}%`,
                          }}
                        />
                        <span className="absolute left-1/2 top-0 h-full w-0.5 bg-ink-900/40" aria-hidden />
                      </div>
                      <span className="w-16 shrink-0 text-right text-[10px] font-semibold text-sand-500">
                        {Math.round(prediction.confidence * 100)}% conf.
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}

      {/* Nugen-aligned advisory model */}
      {advisorContext && <NugenAdvisor context={advisorContext} />}

      {/* Live weather + social signals */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Live weather" className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-forest-950">
            <Icon name="leaf" className="h-4 w-4 text-emerald-600" />
            Live weather input
          </h2>
          <p className="mt-1 text-xs text-sand-500">
            Open-Meteo current conditions and 5-day forecast per destination.
          </p>
          <ul className="mt-4 space-y-3">
            {entities.map((entity) => {
              const snapshot = weather[entity.id];
              if (!snapshot) return null;
              return (
                <li
                  key={entity.id}
                  className="rounded-2xl border border-ink-200 bg-canvas p-3.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-forest-950">{entity.name}</p>
                      <p className="text-[11px] text-sand-500">
                        {snapshot.current.icon} {snapshot.current.condition} ·{" "}
                        {Math.round(snapshot.current.tempC)}°C · wind{" "}
                        {Math.round(snapshot.current.windKph)} km/h ·{" "}
                        {snapshot.current.precipitationMm} mm/h
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-sand-500">
                      {snapshot.source === "open-meteo" ? "LIVE" : "SAMPLE"}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
                    {snapshot.daily.slice(0, 5).map((day) => (
                      <span
                        key={day.date}
                        className="shrink-0 rounded-lg border border-sand-200 bg-white px-2 py-1 text-[10px] font-semibold text-sand-600"
                      >
                        {day.date.slice(5)} · {Math.round(day.minC)}–{Math.round(day.maxC)}°
                      </span>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          {Object.values(weather)[0]?.note && (
            <p className="mt-3 text-[11px] text-amber-700">{Object.values(weather)[0]?.note}</p>
          )}
        </section>

        <section aria-label="Social signals" className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-forest-950">
              <Icon name="users" className="h-4 w-4 text-amber-600" />
              Real-world social signals
            </h2>
            <span className="rounded-full border border-sand-200 bg-sand-50 px-2.5 py-1 text-[10px] font-bold text-sand-600">
              {socials.source === "live" ? "LIVE FEED" : "SAMPLE FEED"}
            </span>
          </div>
          <p className="mt-1 text-xs text-sand-500">
            Public traveller chatter on Reddit + Mastodon, feeding the twin&apos;s
            observed state. Query: “{socials.query}”.
          </p>
          <ul className="mt-4 space-y-3">
            {socials.signals.slice(0, 6).map((signal) => (
              <li key={signal.id} className="rounded-2xl border border-ink-200 bg-canvas p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={signal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs font-bold text-forest-800 hover:underline"
                  >
                    {signal.title}
                  </a>
                  <span
                    className={
                      signal.sentiment === "negative"
                        ? "shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700"
                        : signal.sentiment === "positive"
                          ? "shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                          : "shrink-0 rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-bold text-sand-600"
                    }
                  >
                    {signal.sentiment}
                  </span>
                </div>
                {signal.text && (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-600">
                    {signal.text}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-sand-500">
                    {signal.source} · {signal.author}
                  </span>
                  {signal.weatherRelevance.slice(0, 3).map((term) => (
                    <span
                      key={term}
                      className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          {socials.note && <p className="mt-3 text-[11px] text-amber-700">{socials.note}</p>}
        </section>
      </div>

      <p className="text-xs leading-relaxed text-ink-400">
        The Digital Twin is a prototype simulation. Metrics, propagation and
        prediction bands are model estimates derived from the catalogue and
        weather inputs, not verified forecasts or measurements.
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-canvas px-3 py-2.5">
      <dt className="text-[10px] font-semibold tracking-wide text-ink-400 uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-bold text-ink-900">{value}</dd>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: "mapPin" | "bolt" | "alert" | "users";
}) {
  return (
    <div className="rounded-3xl border border-sand-200/80 bg-white p-5 shadow-xs">
      <span className="mb-3 grid h-9 w-9 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <p className="truncate text-lg font-black tracking-tight text-forest-950">{value}</p>
      <p className="mt-0.5 text-xs font-bold text-sand-600">{label}</p>
    </div>
  );
}
