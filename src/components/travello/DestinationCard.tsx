"use client";

import { useState } from "react";
import { Link } from "@/lib/router";
import {
  ArrowRight,
  Heart,
  Leaf,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useApp } from "@/components/travello/AppProvider";
import { cn, getScoreColor } from "@/lib/format";
import type { Destination } from "@/types";

interface DestinationCardProps {
  destination: Destination;
  className?: string;
  /** Highlighted when Senior + Accessibility mode is on and the place qualifies. */
  seniorFriendly?: boolean;
}

/**
 * One destination in the catalogue grid.
 *
 * The whole card is one link; the save button sits above it on its own layer so
 * a click on the heart never opens the destination. The card reads the saved
 * list from the app provider, so it always agrees with the saved-destinations
 * bar elsewhere.
 */
export function DestinationCard({
  destination,
  className,
  seniorFriendly,
}: DestinationCardProps) {
  const { toggleSaveDestination, savedDestinationIds } = useApp();
  const [imgError, setImgError] = useState(false);

  const gradientMap: Record<string, string> = {
    matheran: "from-emerald-600 to-teal-800",
    goa: "from-sky-500 to-blue-700",
    manali: "from-indigo-600 to-purple-800",
  };

  const hasImage = Boolean(destination.image) && !imgError;
  const saved = savedDestinationIds.includes(destination.id);
  const busy =
    destination.visitorPressure === "High" ||
    destination.visitorPressure === "Very High";

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-sand-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-forest-200 hover:shadow-lg",
        className,
      )}
    >
      <Link
        to={`/explore/${destination.id}`}
        className="absolute inset-0 z-10 rounded-2xl"
        aria-label={`Open ${destination.name}`}
      />

      <div
        className={cn(
          "relative h-44 shrink-0 overflow-hidden bg-sand-100",
          !hasImage && "bg-gradient-to-br",
          !hasImage && (gradientMap[destination.id] || "from-forest-600 to-forest-800"),
        )}
      >
        {hasImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={destination.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-forest-950/20 to-transparent" />

        <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-forest-950/55 px-2.5 py-1 text-[10.5px] font-bold text-white backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-300" />
            Verified eco hub
          </span>
          {seniorFriendly && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-sky-500/90 px-2.5 py-1 text-[10.5px] font-bold text-white backdrop-blur-md">
              Step-free friendly
            </span>
          )}
        </div>

        <span
          className={cn(
            "absolute top-3 right-3 z-20 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-black backdrop-blur-md",
            getScoreColor(destination.sustainabilityScore),
          )}
        >
          <Leaf className="h-3 w-3" />
          {destination.sustainabilityScore}/100
        </span>

        <button
          type="button"
          onClick={() => toggleSaveDestination(destination.id)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${destination.name} from saved` : `Save ${destination.name}`}
          className={cn(
            "absolute bottom-3 right-3 z-20 grid h-9 w-9 place-items-center rounded-full border backdrop-blur-md transition-all duration-200 hover:scale-110",
            saved
              ? "border-rose-200 bg-rose-500 text-white"
              : "border-white/25 bg-forest-950/45 text-white hover:bg-forest-950/70",
          )}
        >
          <Heart className={cn("h-4 w-4", saved && "fill-current")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[1.05rem] leading-snug font-black tracking-tight text-forest-950 transition-colors group-hover:text-forest-700">
          {destination.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-sand-600">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-sand-400" />
          {destination.region}, {destination.country}
        </p>

        <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-sand-700">
          {destination.description}
        </p>

        <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-xl border border-sand-200/70 bg-sand-50/70 p-2.5">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 shrink-0 text-sand-500" />
            <div className="min-w-0">
              <span className="block text-[10px] leading-none font-bold text-sand-500">
                Crowd pressure
              </span>
              <span
                className={cn(
                  "mt-0.5 block text-[11px] font-bold",
                  busy
                    ? "text-rose-600"
                    : destination.visitorPressure === "Medium"
                      ? "text-amber-600"
                      : "text-primary-700",
                )}
              >
                {destination.visitorPressure}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Leaf className="h-3.5 w-3.5 shrink-0 text-sand-500" />
            <div className="min-w-0">
              <span className="block text-[10px] leading-none font-bold text-sand-500">
                Sensitivity
              </span>
              <span className="mt-0.5 block text-[11px] font-bold text-forest-700">
                {destination.environmentalSensitivity}
              </span>
            </div>
          </div>
        </div>

        {busy && (
          <p className="mt-2 text-[10.5px] font-bold text-primary-700">
            Less-crowded picks inside →
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-sand-100 pt-3">
          <div className="flex flex-wrap gap-1.5">
            {destination.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-sand-100/90 px-2 py-0.5 text-[10.5px] font-semibold text-sand-700 capitalize"
              >
                {tag.replace("-", " ")}
              </span>
            ))}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-forest-700 transition-transform duration-200 group-hover:translate-x-0.5">
            Explore
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
