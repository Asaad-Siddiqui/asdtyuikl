"use client";

import { Link } from "@/lib/router";
import {
  Accessibility,
  ArrowRight,
  Bus,
  CheckCircle2,
  Clock,
  Droplets,
  Leaf,
  MapPin,
  Recycle,
  TreePine,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/format";

/**
 * One mission, as a row.
 *
 * Progress is real: it is the step count stored on the traveller's completion
 * measured against the mission's own instruction list. There is no invented
 * "explorers completed" figure — anything the card states it can point at.
 */

export const CHALLENGE_CATEGORIES: Record<
  string,
  { label: string; icon: LucideIcon; tone: string }
> = {
  transport: {
    label: "Eco travel",
    icon: Bus,
    tone: "border-primary-200 bg-primary-50 text-primary-800",
  },
  environment: {
    label: "Conservation",
    icon: Leaf,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  conservation: {
    label: "Conservation",
    icon: TreePine,
    tone: "border-violet-200 bg-violet-50 text-violet-800",
  },
  community: {
    label: "Local support",
    icon: Users,
    tone: "border-amber-200 bg-amber-50 text-amber-800",
  },
  waste: {
    label: "Waste reduction",
    icon: Recycle,
    tone: "border-sky-200 bg-sky-50 text-sky-800",
  },
  water: {
    label: "Water care",
    icon: Droplets,
    tone: "border-cyan-200 bg-cyan-50 text-cyan-800",
  },
  accessibility: {
    label: "Accessibility",
    icon: Accessibility,
    tone: "border-indigo-200 bg-indigo-50 text-indigo-800",
  },
  infrastructure: {
    label: "Trail care",
    icon: Wrench,
    tone: "border-sand-300 bg-sand-100 text-sand-800",
  },
};

interface ChallengeCardProps {
  id: string;
  title: string;
  description: string;
  /** Destination photo for the row thumbnail. */
  image?: string;
  category?: string;
  difficulty: string;
  points: number;
  estimatedMinutes: number;
  destinationName?: string;
  isCompleted?: boolean;
  isRecommended?: boolean;
  /** Steps completed so far, and how many steps the mission has. */
  progress?: number;
  progressTotal?: number;
  className?: string;
}

export function ChallengeCard({
  id,
  title,
  description,
  image,
  category,
  difficulty,
  points,
  estimatedMinutes,
  destinationName,
  isCompleted,
  isRecommended,
  progress = 0,
  progressTotal = 0,
  className,
}: ChallengeCardProps) {
  const meta = CHALLENGE_CATEGORIES[category ?? ""] ?? CHALLENGE_CATEGORIES.transport;
  const Icon = meta.icon;

  const started = progress > 0 && !isCompleted;
  const total = Math.max(progressTotal, 1);
  const done = Math.min(progress, total);
  const percent = isCompleted ? 100 : Math.round((done / total) * 100);
  const label = isCompleted ? "Completed" : started ? "Continue" : "Start";

  return (
    <Link
      to={`/challenges/${id}`}
      className={cn(
        "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-sand-200/80 bg-white p-3 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-md sm:flex-row sm:items-center",
        isCompleted && "border-primary-200/80 bg-primary-50/40",
        className,
      )}
    >
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-sand-100 sm:h-24 sm:w-32">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <span className="grid h-full w-full place-items-center bg-forest-50 text-forest-500">
            <Icon className="h-5 w-5" />
          </span>
        )}
        {isRecommended && !isCompleted && (
          <span className="absolute top-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[9.5px] font-black tracking-wide text-forest-800 uppercase">
            Recommended
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-wide uppercase",
              meta.tone,
            )}
          >
            <meta.icon className="h-3 w-3" />
            {meta.label}
          </span>
          <span className="rounded-full border border-sand-200 bg-sand-50 px-2.5 py-0.5 text-[10px] font-bold text-sand-600 capitalize">
            {difficulty}
          </span>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-forest-800 px-2.5 py-0.5 text-[10px] font-bold text-white">
              <CheckCircle2 className="h-3 w-3 text-primary-300" />
              Verified
            </span>
          )}
        </div>

        <h3 className="mt-2 text-[0.95rem] leading-snug font-bold text-forest-950 transition-colors group-hover:text-forest-700">
          {title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-sand-600">
          {description}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-sand-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 text-sand-400" />
            {destinationName ?? "Any destination"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-sand-400" />
            {Math.max(1, Math.round(estimatedMinutes / 60))} hrs
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4 sm:w-40 sm:flex-col sm:items-stretch sm:gap-2.5">
        <span className="inline-flex items-center gap-1 text-xs font-black text-forest-800">
          <Leaf className="h-3.5 w-3.5 text-primary-600" />
          {points} pts
        </span>

        <div className="min-w-0 flex-1 sm:flex-none">
          <span className="block text-right text-[10.5px] font-bold text-sand-500">
            {isCompleted ? "Done" : `${done}/${total}`}
          </span>
          <span
            className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-sand-200/80"
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full bg-forest-500 transition-all duration-700 ease-out group-hover:bg-forest-600"
              style={{ width: `${percent}%` }}
            />
          </span>
        </div>

        <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-forest-800 px-4 py-2 text-[11px] font-bold text-white transition-colors group-hover:bg-forest-900">
          {label}
          <ArrowRight className="h-3.5 w-3.5 text-primary-300" />
        </span>
      </div>
    </Link>
  );
}
