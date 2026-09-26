"use client";

import { useState } from "react";

import Icon from "@/components/Icon";
import type { ScoredDestination } from "@/lib/destinations";

function SceneArt({ scene }: { scene: ScoredDestination["destination"]["scene"] }) {
  const common =
    "pointer-events-none absolute inset-0 h-full w-full object-cover";

  if (scene === "coast") {
    return (
      <svg
        className={common}
        viewBox="0 0 400 150"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <circle cx="330" cy="40" r="20" fill="rgba(255,255,255,0.22)" />
        <path
          d="M0 108c40-12 80 12 120 0s80-12 120 0 80 12 160 0v42H0z"
          fill="rgba(255,255,255,0.16)"
        />
        <path
          d="M0 128c46-10 86 10 126 0s84-10 124 0 78 10 150 0v22H0z"
          fill="rgba(255,255,255,0.22)"
        />
      </svg>
    );
  }

  if (scene === "forest") {
    return (
      <svg
        className={common}
        viewBox="0 0 400 150"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 132l24-38 24 38zM56 132l30-48 30 48zM124 132l26-42 26 42zM186 132l32-52 32 52zM262 132l26-40 26 40zM324 132l30-46 30 46z"
          fill="rgba(255,255,255,0.18)"
        />
        <rect y="132" width="400" height="18" fill="rgba(255,255,255,0.14)" />
      </svg>
    );
  }

  if (scene === "lake") {
    return (
      <svg
        className={common}
        viewBox="0 0 400 150"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 96l74-46 62 46 70-58 78 58 50-32 66 44z"
          fill="rgba(255,255,255,0.16)"
        />
        <rect y="102" width="400" height="48" fill="rgba(255,255,255,0.12)" />
        <path
          d="M20 118h60M110 130h70M210 116h54"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // hills (default)
  return (
    <svg
      className={common}
      viewBox="0 0 400 150"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <circle cx="72" cy="38" r="18" fill="rgba(255,255,255,0.2)" />
      <path
        d="M0 112l76-58 58 56 72-66 74 66 46-34 74 50v24H0z"
        fill="rgba(255,255,255,0.14)"
      />
      <path
        d="M0 134l92-48 78 48 88-54 78 52 64-28v26H0z"
        fill="rgba(255,255,255,0.2)"
      />
    </svg>
  );
}

export default function DestinationCard({ scored }: { scored: ScoredDestination }) {
  const { destination, accessibilityMatch, sustainabilityScore, matchedRequirements, unmetRequirements } =
    scored;
  const [exploreNote, setExploreNote] = useState(false);

  return (
    <article className="card card-hover flex flex-col overflow-hidden">
      <div
        className={`relative h-36 bg-gradient-to-br ${destination.gradient}`}
      >
        <SceneArt scene={destination.scene} />

        <span className="absolute top-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-ink-800 shadow-soft">
          {scored.overallMatch}% match
        </span>

        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-lg font-semibold text-white drop-shadow-sm">
            {destination.name}
          </h3>
          <p className="flex items-center gap-1.5 text-xs font-medium text-white/85">
            <Icon name="mapPin" className="h-3.5 w-3.5" />
            {destination.region}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-relaxed text-ink-600">
          {destination.description}
        </p>

        <dl className="mt-4 space-y-3">
          <ScoreRow
            label="Accessibility"
            value={accessibilityMatch}
            barClassName="bg-brand-500"
          />
          <ScoreRow
            label="Sustainability"
            value={sustainabilityScore}
            barClassName="bg-sand-400"
          />
        </dl>

        {matchedRequirements.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
              Matches your needs
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {matchedRequirements.map((requirement) => (
                <li
                  key={requirement}
                  className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                >
                  {requirement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {unmetRequirements.length > 0 && (
          <p className="mt-3 text-xs text-ink-400">
            {unmetRequirements.length} requirement
            {unmetRequirements.length > 1 ? "s" : ""} not confirmed here yet.
          </p>
        )}

        <div className="mt-auto pt-5">
          <button
            type="button"
            onClick={() => setExploreNote(true)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-ink-200 bg-surface px-5 text-sm font-medium text-ink-800 transition-colors hover:border-brand-300 hover:text-brand-700"
          >
            Explore
            <Icon name="arrowRight" className="h-4.5 w-4.5" />
          </button>

          {exploreNote && (
            <p
              role="status"
              className="mt-3 flex items-start gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-xs text-ink-500"
            >
              <Icon name="sparkles" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Full trip planning for {destination.name} arrives in Phase 2 —
              your profile is already set up for it.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function ScoreRow({
  label,
  value,
  barClassName,
}: {
  label: string;
  value: number;
  barClassName: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <dt className="font-medium text-ink-500">{label}</dt>
        <dd className="font-semibold text-ink-900">{value}%</dd>
      </div>
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100"
        role="img"
        aria-label={`${label} score: ${value} percent`}
      >
        <div
          className={`h-full rounded-full ${barClassName}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
