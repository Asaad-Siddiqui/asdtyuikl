/**
 * Live weather via Open-Meteo.
 *
 * Open-Meteo is free and requires **no API key**, so the Digital Twin can pull
 * live conditions and forecasts without a secret to configure. Every call is
 * time-boxed and falls back to a clearly-labelled sample snapshot, so the twin
 * always renders — mirroring the app's existing "degrade, never break" approach
 * used for the AI planner.
 *
 * Only a small, stable slice of the provider response is normalised, so a
 * provider change cannot ripple through the UI.
 */

import type { Coord } from "@/lib/geo";

export type WeatherSource = "open-meteo" | "sample";

export type WeatherCurrent = {
  time: string;
  tempC: number;
  humidity: number;
  precipitationMm: number;
  windKph: number;
  code: number;
  condition: string;
  /** A single emoji, used by compact strips and map popups. */
  icon: string;
  isDay: boolean;
};

export type WeatherHour = {
  time: string;
  tempC: number;
  precipitationMm: number;
  precipProbability: number;
  windKph: number;
  code: number;
};

export type WeatherDay = {
  date: string;
  code: number;
  minC: number;
  maxC: number;
  precipitationMm: number;
  precipProbability: number;
};

export type WeatherSnapshot = {
  source: WeatherSource;
  fetchedAt: string;
  timezone: string;
  latitude: number;
  longitude: number;
  /** Present when the live call failed — explains the fallback. */
  note?: string;
  current: WeatherCurrent;
  hourly: WeatherHour[];
  daily: WeatherDay[];
};

/* ------------------------------------------------------------------ */
/* WMO weather codes                                                   */
/* ------------------------------------------------------------------ */

const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy drizzle", icon: "🌧️" },
  56: { label: "Freezing drizzle", icon: "🌧️" },
  57: { label: "Freezing drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌦️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  66: { label: "Freezing rain", icon: "🌧️" },
  67: { label: "Freezing rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "🌨️" },
  75: { label: "Heavy snow", icon: "❄️" },
  77: { label: "Snow grains", icon: "🌨️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Rain showers", icon: "🌧️" },
  82: { label: "Violent showers", icon: "⛈️" },
  85: { label: "Snow showers", icon: "🌨️" },
  86: { label: "Snow showers", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with hail", icon: "⛈️" },
  99: { label: "Thunderstorm with hail", icon: "⛈️" },
};

export function weatherCondition(code: number): { label: string; icon: string } {
  return WMO[code] ?? { label: "Unknown", icon: "🌡️" };
}

/* ------------------------------------------------------------------ */
/* Fetch                                                               */
/* ------------------------------------------------------------------ */

const API = "https://api.open-meteo.com/v1/forecast";
const TIMEOUT_MS = 3500;

function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** A plausible fallback so the twin demos even with no network. */
export function sampleWeather(
  coord: Coord,
  note = "Live weather unavailable — showing a sample snapshot.",
): WeatherSnapshot {
  const now = new Date();
  const iso = (offset: number) =>
    new Date(now.getTime() + offset * 3_600_000).toISOString();
  return {
    source: "sample",
    fetchedAt: now.toISOString(),
    timezone: "Asia/Kolkata",
    latitude: coord.lat,
    longitude: coord.lon,
    note,
    current: {
      time: now.toISOString(),
      tempC: 27.4,
      humidity: 68,
      precipitationMm: 1.2,
      windKph: 14,
      code: 63,
      condition: "Rain",
      icon: "🌧️",
      isDay: true,
    },
    hourly: Array.from({ length: 24 }, (_, index) => ({
      time: iso(index),
      tempC: Math.round((26 + Math.sin(index / 4) * 3) * 10) / 10,
      precipitationMm: Math.round(Math.max(0, Math.sin(index / 5)) * 4 * 10) / 10,
      precipProbability: Math.round(40 + Math.sin(index / 5) * 40),
      windKph: 12 + (index % 5) * 3,
      code: index % 6 < 3 ? 63 : 3,
    })),
    daily: Array.from({ length: 5 }, (_, index) => ({
      date: new Date(now.getTime() + index * 86_400_000).toISOString().slice(0, 10),
      code: index % 2 === 0 ? 63 : 2,
      minC: 22 + index,
      maxC: 29 + index,
      precipitationMm: 6 + index * 2,
      precipProbability: 55 + index * 5,
    })),
  };
}

/**
 * Fetches current + hourly + 5-day forecast for a coordinate.
 * Never throws: on any failure it returns `sampleWeather()`.
 */
export async function fetchWeather(
  coord: Coord,
  options: { revalidateSeconds?: number } = {},
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: coord.lat.toFixed(4),
    longitude: coord.lon.toFixed(4),
    current:
      "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day",
    hourly:
      "temperature_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "5",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API}?${params.toString()}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      next: { revalidate: options.revalidateSeconds ?? 600 },
    });
    if (!response.ok) throw new Error(`weather ${response.status}`);

    const data = (await response.json()) as Record<string, unknown>;
    const current = (data.current ?? {}) as Record<string, unknown>;
    const hourly = (data.hourly ?? {}) as Record<string, unknown[]>;
    const daily = (data.daily ?? {}) as Record<string, unknown[]>;

    const code = num(current.weather_code, 0);
    const condition = weatherCondition(code);

    const hourTimes = (hourly.time ?? []) as string[];

    return {
      source: "open-meteo",
      fetchedAt: new Date().toISOString(),
      timezone: String(data.timezone ?? "UTC"),
      latitude: num(data.latitude, coord.lat),
      longitude: num(data.longitude, coord.lon),
      current: {
        time: String(current.time ?? new Date().toISOString()),
        tempC: num(current.temperature_2m),
        humidity: num(current.relative_humidity_2m),
        precipitationMm: num(current.precipitation),
        windKph: num(current.wind_speed_10m),
        code,
        condition: condition.label,
        icon: condition.icon,
        isDay: num(current.is_day, 1) === 1,
      },
      hourly: hourTimes.slice(0, 24).map((time, index) => ({
        time,
        tempC: num((hourly.temperature_2m ?? [])[index]),
        precipitationMm: num((hourly.precipitation ?? [])[index]),
        precipProbability: num((hourly.precipitation_probability ?? [])[index]),
        windKph: num((hourly.wind_speed_10m ?? [])[index]),
        code: num((hourly.weather_code ?? [])[index]),
      })),
      daily: ((daily.time ?? []) as string[]).slice(0, 5).map((date, index) => ({
        date,
        code: num((daily.weather_code ?? [])[index]),
        minC: num((daily.temperature_2m_min ?? [])[index]),
        maxC: num((daily.temperature_2m_max ?? [])[index]),
        precipitationMm: num((daily.precipitation_sum ?? [])[index]),
        precipProbability: num((daily.precipitation_probability_max ?? [])[index]),
      })),
    };
  } catch (error) {
    console.warn("[weather] falling back to sample snapshot:", error);
    return sampleWeather(
      coord,
      "Live weather unavailable — showing a sample snapshot.",
    );
  } finally {
    clearTimeout(timer);
  }
}
