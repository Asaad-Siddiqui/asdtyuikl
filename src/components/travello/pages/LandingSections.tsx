"use client";

/**
 * Three sections ported from the Lovable "greener journeys" landing, mounted
 * directly below the Travello hero:
 *
 *   1. See the difference      — airplane hovering Baga Beach -> Morjim Beach
 *   2. One thoughtful journey  — dotted route with floating stop cards
 *   3. Explore your options    — live transport / cost / carbon switcher
 *
 * Only these sections were requested; every other Lovable section is omitted.
 */

import { useState } from "react";
import { Bus, Car, Leaf, Plane, TrainFront } from "lucide-react";

const coastImage = "/images/goa-coast-map.jpg";
const busImage = "/images/electric-bus-road.jpg";

type Transport = "Flight" | "Train" | "Bus" | "Car";

const transportData: Record<Transport, { cost: string; carbon: string; time: string; access: string }> = {
  Flight: { cost: "₹4,800", carbon: "86 kg", time: "1h 10m", access: "Good" },
  Train: { cost: "₹620", carbon: "5.8 kg", time: "8h 20m", access: "Assisted" },
  Bus: { cost: "₹300", carbon: "4.2 kg", time: "9h 05m", access: "Step-free" },
  Car: { cost: "₹1,850", carbon: "28 kg", time: "7h 40m", access: "Flexible" },
};

/* ── 1. See the difference ─────────────────────────────────────────── */

const DIFFERENCE_PATH = "M135 115 C225 70 255 210 365 220 S520 105 638 148";

function MapAnimation() {
  return (
    <div className="map-stage" aria-label="Animated route from Baga Beach to quieter Morjim Beach">
      <img src={coastImage} width={1920} height={1024} alt="Aerial view of Goa's green coastline" className="map-photo" />
      <div className="map-shade" />
      <svg className="route-map" viewBox="0 0 760 430" role="img" aria-label="Moving route between the two beaches">
        <path id="routePath" d={DIFFERENCE_PATH} fill="none" />
        <path className="route-halo" d={DIFFERENCE_PATH} />
        <path className="route-dots" d={DIFFERENCE_PATH} />
        <circle cx="135" cy="115" r="9" className="route-stop route-stop-alert" />
        <circle cx="638" cy="148" r="9" className="route-stop route-stop-green" />
        <g className="plane-runner">
          <Plane className="route-plane" x="-13" y="-13" width="26" height="26" />
          <animateMotion dur="8s" repeatCount="indefinite" rotate="auto">
            <mpath href="#routePath" />
          </animateMotion>
        </g>
      </svg>
      <div className="place-card place-card-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Baga Beach</p>
            <span className="mt-2 inline-flex rounded-full bg-destructive px-2 py-1 text-[10px] font-bold text-destructive-foreground">
              HIGH PRESSURE
            </span>
          </div>
          <strong className="text-destructive">
            87<small>/100</small>
          </strong>
        </div>
        <ul>
          <li>
            <span className="dot-alert" />
            Very crowded (5–8 PM)
          </li>
          <li>
            <span className="dot-alert" />
            Higher carbon impact
          </li>
          <li>
            <span className="dot-alert" />
            Limited accessibility
          </li>
        </ul>
      </div>
      <div className="place-card place-card-right">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Morjim Beach</p>
            <span className="mt-2 inline-flex rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
              LOW PRESSURE
            </span>
          </div>
          <strong className="text-primary">
            36<small>/100</small>
          </strong>
        </div>
        <ul>
          <li>
            <span className="dot-green" />
            34% less crowded
          </li>
          <li>
            <span className="dot-green" />
            21% lower impact
          </li>
          <li>
            <span className="dot-green" />
            Step-free access
          </li>
        </ul>
      </div>
      <div className="route-time">
        <Car className="size-3.5" />
        12 km · 15 min
      </div>
    </div>
  );
}

export function DifferenceSection() {
  return (
    <section id="difference" className="pt-16">
      <div className="section-shell grid min-h-[690px] items-center gap-10 py-16 lg:grid-cols-[.52fr_1.48fr]">
        <div className="max-w-sm animate-fade-in">
          <p className="eyebrow">CROWD-AWARE TRAVEL</p>
          <h2 className="mt-4 text-balance font-serif text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl">
            See the
            <br />
            difference.
          </h2>
          <p className="mt-6 text-pretty text-sm leading-6 text-muted-foreground">
            Popular destinations aren&apos;t always the best choice. We show you the bigger picture — crowd levels, impact,
            accessibility and better alternatives.
          </p>
          <div className="mt-8 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-destructive" />
              High pressure
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              Greener option
            </span>
          </div>
        </div>
        <MapAnimation />
      </div>
    </section>
  );
}

/* ── 2. One thoughtful journey ─────────────────────────────────────── */

/**
 * The dotted route and the five stop nodes share these coordinates, so every
 * node sits exactly on the dotted line. `Local Food` (818, 295) was the one
 * off the path before — it is now a point on the second curve, not its control
 * point. Each card is anchored to its node (see `.journey-card-anchor`), so the
 * label hovers right above its dot instead of drifting across the stage.
 */
const JOURNEY_PATH = "M82 245 C160 120 250 330 365 220 S555 105 655 205 S825 335 1018 228";

const journeyStops = [
  { name: "Eco Resort", day: "Day 1", detail: "Forest check-in", image: coastImage, x: 82, y: 245 },
  { name: "Aguada Temple", day: "Day 2", detail: "Culture walk", image: busImage, x: 365, y: 220 },
  { name: "Nebula Hills", day: "Day 4", detail: "Nature trail", image: coastImage, x: 655, y: 205 },
  { name: "Local Food", day: "Day 3", detail: "Shared table", image: busImage, x: 818, y: 295 },
  { name: "Beach Stay", day: "Stay 1", detail: "Low-impact stay", image: coastImage, x: 1018, y: 228 },
];

export function JourneySection() {
  return (
    <section className="journey-section" aria-labelledby="journey-title">
      <div className="section-shell py-20">
        <div className="journey-heading">
          <p className="eyebrow">YOUR GREEN ROUTE</p>
          <h2 id="journey-title" className="mt-3 text-balance font-serif text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl">
            One thoughtful journey.
          </h2>
          <p className="mt-3 text-pretty text-sm text-muted-foreground">
            Each stop connects into one lighter, accessible trip.
          </p>
        </div>
        <div className="journey-stage">
          <img src={coastImage} alt="" className="journey-map-texture" aria-hidden="true" />
          <svg
            className="journey-route"
            viewBox="0 0 1100 420"
            role="img"
            aria-label="An animated plane traces a dotted route through five green travel stops"
          >
            <path id="journeyPath" d={JOURNEY_PATH} fill="none" />
            <path className="journey-route-line" d={JOURNEY_PATH} />
            {journeyStops.map((stop, index) => (
              <g key={stop.name}>
                <circle
                  cx={stop.x}
                  cy={stop.y}
                  r="13"
                  className="journey-node-ring"
                  style={{ animationDelay: `${index * 0.25}s` }}
                />
                <circle cx={stop.x} cy={stop.y} r="5" className="journey-node" />
              </g>
            ))}
            <g className="journey-plane-runner">
              <Plane className="journey-plane" x="-15" y="-15" width="30" height="30" />
              <animateMotion dur="11s" repeatCount="indefinite" rotate="auto">
                <mpath href="#journeyPath" />
              </animateMotion>
            </g>
          </svg>
          {journeyStops.map((stop) => (
            <div
              key={stop.name}
              className="journey-card-anchor"
              style={{ left: `${(stop.x / 1100) * 100}%`, top: `${(stop.y / 420) * 100}%` }}
            >
              <article className="journey-card">
                <img src={stop.image} alt="" />
                <div>
                  <strong>{stop.name}</strong>
                  <span>{stop.day}</span>
                  <small>
                    <Leaf />
                    {stop.detail}
                  </small>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 3. Explore your options ───────────────────────────────────────── */

function ImpactMetric({ label, value, positive = true }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={positive ? "text-primary" : "text-destructive"}>
        {positive ? "↓" : "↑"} {value}
      </strong>
    </div>
  );
}

export function ExploreOptionsSection() {
  const [mode, setMode] = useState<Transport>("Bus");
  const data = transportData[mode];
  const modes = [
    { name: "Flight" as const, icon: Plane },
    { name: "Train" as const, icon: TrainFront },
    { name: "Bus" as const, icon: Bus },
    { name: "Car" as const, icon: Car },
  ];

  return (
    <section id="explore" className="relative overflow-hidden border-y border-border bg-card">
      <img
        src={busImage}
        width={1920}
        height={1024}
        loading="lazy"
        alt="Electric bus travelling through Goa's green hills"
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="explore-overlay" />
      <div className="section-shell relative grid min-h-[460px] items-center gap-10 py-20 lg:grid-cols-[.72fr_1.25fr_.58fr]">
        <div>
          <p className="eyebrow">WHAT IF?</p>
          <h2 className="mt-3 text-balance font-serif text-3xl font-semibold leading-[1.1] tracking-tight">
            Explore your options.
          </h2>
          <p className="mt-4 max-w-sm text-pretty text-sm leading-6 text-muted-foreground">
            Change your transport, time, stay or destination and see how it affects cost, carbon and accessibility — in
            real time.
          </p>
        </div>
        <div className="transport-panel">
          <p className="text-xs text-muted-foreground">Change transport to</p>
          <div className="mt-3 grid grid-cols-4 gap-2" role="tablist" aria-label="Transport mode">
            {modes.map(({ name, icon: Icon }) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={mode === name}
                onClick={() => setMode(name)}
                className={`transport-tab${mode === name ? " transport-tab-active" : ""}`}
              >
                <Icon />
                {name}
              </button>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 border-t border-border pt-5 sm:grid-cols-4">
            <ImpactMetric label="Cost" value={data.cost} positive={mode !== "Flight"} />
            <ImpactMetric label="Carbon" value={data.carbon} positive={mode !== "Flight" && mode !== "Car"} />
            <ImpactMetric label="Time" value={data.time} positive={mode === "Flight"} />
            <ImpactMetric label="Accessibility" value={data.access} positive={mode !== "Flight"} />
          </div>
        </div>
        <div className="hand-note">
          Small
          <br />
          changes.
          <br />
          Big impact.
          <svg viewBox="0 0 100 70">
            <path d="M90 5 C75 10 90 45 35 45 C20 45 10 52 8 64" />
            <path d="M2 54 L8 65 L20 58" />
          </svg>
        </div>
      </div>
    </section>
  );
}
