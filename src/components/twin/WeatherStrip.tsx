import Link from "next/link";

import Icon from "@/components/Icon";
import { coordsOrCenter } from "@/lib/geo";
import { fetchWeather } from "@/lib/weather";
import { simulateTwin, type TwinEntity } from "@/lib/digital-twin";

const STATUS_TONE: Record<string, string> = {
  Normal: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Watch: "bg-amber-100 text-amber-800 border-amber-200",
  Disrupted: "bg-orange-100 text-orange-800 border-orange-200",
  Severe: "bg-red-100 text-red-700 border-red-200",
};

/**
 * Live weather + Digital Twin outlook for one destination hub.
 *
 * Server-rendered: fetches Open-Meteo and (when the catalogue entity is passed)
 * runs the same twin simulation the `/twin` page uses, so the hub can show what
 * weather is doing to *this* place right now.
 */
export default async function WeatherStrip({
  place,
  entity,
}: {
  place: string;
  entity?: TwinEntity;
}) {
  const weather = await fetchWeather(coordsOrCenter(place));

  const twin = entity
    ? simulateTwin(entity, {
        rainfallMm: weather.current.precipitationMm,
        tempC: weather.current.tempC,
        windKph: weather.current.windKph,
        durationHours: 0,
      })
    : null;

  return (
    <section
      aria-label="Live weather and twin outlook"
      className="card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-forest-950">
          <Icon name="leaf" className="h-4 w-4 text-emerald-600" />
          Live weather &amp; twin outlook
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-sand-200 bg-sand-50 px-2.5 py-1 text-[10px] font-bold text-sand-600">
            {weather.source === "open-meteo" ? "Open-Meteo · live" : "Sample data"}
          </span>
          {twin && (
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${STATUS_TONE[twin.status]}`}
            >
              Twin: {twin.status} · impact {twin.impact}/100
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            {weather.current.icon}
          </span>
          <div>
            <p className="text-xl font-black text-forest-950">
              {Math.round(weather.current.tempC)}°C
            </p>
            <p className="text-xs font-semibold text-sand-600">
              {weather.current.condition}
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
          <div>
            <dt className="text-sand-500">Rain now</dt>
            <dd className="font-bold text-forest-900">
              {weather.current.precipitationMm} mm/h
            </dd>
          </div>
          <div>
            <dt className="text-sand-500">Wind</dt>
            <dd className="font-bold text-forest-900">
              {Math.round(weather.current.windKph)} km/h
            </dd>
          </div>
          <div>
            <dt className="text-sand-500">Humidity</dt>
            <dd className="font-bold text-forest-900">
              {Math.round(weather.current.humidity)}%
            </dd>
          </div>
        </dl>

        <div className="flex gap-1.5 overflow-x-auto">
          {weather.daily.slice(0, 5).map((day) => (
            <span
              key={day.date}
              className="shrink-0 rounded-lg border border-sand-200 bg-white px-2 py-1 text-[10px] font-semibold text-sand-600"
            >
              {day.date.slice(5)} · {Math.round(day.minC)}–{Math.round(day.maxC)}°
            </span>
          ))}
        </div>
      </div>

      {twin && (
        <div className="mt-4 rounded-2xl border border-forest-200 bg-forest-50/70 p-3.5">
          <p className="text-sm font-semibold text-forest-900">{twin.headline}</p>
          <p className="mt-1 text-xs leading-relaxed text-forest-800/90">
            {twin.recommendations[0]}
          </p>
          <Link
            href="/twin"
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:text-forest-900"
          >
            Open the Digital Twin simulator
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {weather.note && <p className="mt-3 text-[11px] text-amber-700">{weather.note}</p>}
      <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
        Weather is live from Open-Meteo; the twin outlook is a prototype
        simulation, not a verified forecast.
      </p>
    </section>
  );
}
