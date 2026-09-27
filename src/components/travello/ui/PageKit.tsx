"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Leaf,
  Search,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type { Destination } from "@/types";
import { cn } from "@/lib/format";

/**
 * The shared page vocabulary.
 *
 * Every page wears the same six pieces, so the product reads as one design no
 * matter which screen you land on:
 *
 *   PageHero     the photo banner (eyebrow, title, subtitle, trust pills)
 *   StatTiles    the row of four number tiles
 *   Toolbar      search plus whatever control the page needs
 *   ChipRow      the filter chips
 *   SectionCard  the white card every block of content sits in
 *   CalloutBar   the closing strip with one clear next step
 *
 * Colours, radii and shadows all come from the project's existing theme tokens
 * (`forest`, `sand`, `primary`, `canvas`), so nothing here invents a palette.
 */

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export type HeroPill = { icon: LucideIcon; label: string };

export function PageHero({
  eyebrow,
  eyebrowIcon: EyebrowIcon = Leaf,
  title,
  subtitle,
  pills = [],
  image,
  scriptLines,
  photos,
  action,
}: {
  eyebrow: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  subtitle: string;
  pills?: HeroPill[];
  /** Banner artwork — a destination photo from the catalogue, never a random URL. */
  image: string;
  /** Two short lines of hand-written-style type on the right of the banner. */
  scriptLines?: [string, string];
  /** Optional one or two small overlapping photos, as on the Explore banner. */
  photos?: string[];
  action?: { href: string; label: string };
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-sand-200/70 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-forest-950/94 via-forest-950/74 to-forest-950/25" />

      <div className="relative flex flex-col justify-between gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:flex-row lg:items-center">
        <div className="w-full max-w-[38rem]">
          <p className="flex items-center gap-2 text-[11px] font-black tracking-[0.14em] text-primary-200 uppercase">
            <EyebrowIcon className="h-3.5 w-3.5" />
            {eyebrow}
          </p>

          <h1 className="font-sans-ui mt-2.5 text-[clamp(1.65rem,2.6vw,2.35rem)] leading-[1.12] font-black tracking-tight text-white">
            {title}
          </h1>

          <p className="mt-2.5 max-w-xl text-[0.86rem] leading-relaxed font-medium text-white/80 sm:text-[0.95rem]">
            {subtitle}
          </p>

          {(pills.length > 0 || action) && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {pills.map((pill) => (
                <span
                  key={pill.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm"
                >
                  <pill.icon className="h-3.5 w-3.5 text-primary-200" />
                  {pill.label}
                </span>
              ))}

              {action && (
                <Link
                  href={action.href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-black text-forest-900 transition-transform duration-200 hover:-translate-y-px"
                >
                  {action.label}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-6 lg:flex">
          {photos && photos.length > 0 && (
            <div className="relative h-28 w-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[0]}
                alt=""
                className="absolute top-0 left-0 h-24 w-28 -rotate-6 rounded-xl border-2 border-white/70 object-cover shadow-lg transition-transform duration-500 hover:rotate-0"
              />
              {photos[1] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photos[1]}
                  alt=""
                  className="absolute top-5 left-8 h-24 w-28 rotate-6 rounded-xl border-2 border-white/70 object-cover shadow-lg transition-transform duration-500 hover:rotate-0"
                />
              )}
            </div>
          )}

          {scriptLines && (
            <p className="font-serif text-2xl leading-tight font-semibold text-white/85 italic">
              {scriptLines[0]}
              <br />
              {scriptLines[1]}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stat tiles                                                          */
/* ------------------------------------------------------------------ */

export type StatTile = {
  label: string;
  value: string;
  note?: string;
  rising?: boolean;
  icon: LucideIcon;
  href?: string;
};

export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      {tiles.map((tile) => {
        const body = (
          <>
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-primary-100 bg-primary-50 text-primary-700">
              <tile.icon className="h-4 w-4" />
            </span>
            <p className="mt-3.5 text-2xl leading-none font-black tracking-tight text-forest-950 sm:text-[1.75rem]">
              {tile.value}
            </p>
            <p className="mt-1.5 text-xs font-bold text-sand-600">{tile.label}</p>
            {tile.note && (
              <p
                className={cn(
                  "mt-2.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold",
                  tile.rising
                    ? "border-primary-100 bg-primary-50 text-primary-700"
                    : "border-sand-200 bg-sand-50 text-sand-600",
                )}
              >
                {tile.rising ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <ArrowUpRight className="h-3 w-3" />
                )}
                {tile.note}
              </p>
            )}
          </>
        );

        const shell =
          "group relative flex flex-col overflow-hidden rounded-2xl border border-sand-200/80 bg-white p-4 shadow-xs transition-all duration-300 sm:p-5";

        return tile.href ? (
          <Link
            key={tile.label}
            href={tile.href}
            className={cn(shell, "hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-md")}
          >
            {body}
          </Link>
        ) : (
          <div key={tile.label} className={shell}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toolbar + chips                                                     */
/* ------------------------------------------------------------------ */

export function Toolbar({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="relative block flex-1">
        <span className="sr-only">{placeholder}</span>
        <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-sand-400" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-sand-200 bg-white py-3 pr-4 pl-11 text-sm font-medium text-forest-900 shadow-xs transition-colors placeholder:text-sand-400 hover:border-sand-300 focus:border-forest-500 focus:outline-none"
        />
      </label>
      {children}
    </div>
  );
}

export function SelectControl({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <label className="relative block shrink-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full cursor-pointer appearance-none rounded-xl border border-sand-200 bg-white py-3 pr-10 pl-4 text-xs font-bold text-forest-900 shadow-xs transition-colors hover:border-sand-300 focus:border-forest-500 focus:outline-none sm:w-auto"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ArrowUpRight className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 rotate-45 text-sand-400" />
    </label>
  );
}

export function ChipRow({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string; icon?: LucideIcon }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="scrollbar-hide -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1">
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            aria-pressed={active}
            className={cn(
              "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all",
              active
                ? "border-forest-800 bg-forest-800 text-white shadow-xs"
                : "border-sand-200 bg-white text-sand-700 hover:bg-sand-50 hover:text-forest-900",
            )}
          >
            {option.icon && <option.icon className="h-3.5 w-3.5" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

export function SectionCard({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  action?: { href: string; label: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-sand-200/80 bg-white p-5 shadow-xs sm:p-6",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[0.95rem] font-bold text-forest-950">
          {Icon && <Icon className="h-4 w-4 text-primary-600" />}
          {title}
        </h2>
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 transition-colors hover:text-forest-900"
          >
            {action.label} <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function CalloutBar({
  title,
  subtitle,
  action,
  icon: Icon = Leaf,
}: {
  title: string;
  subtitle: string;
  action: { href: string; label: string };
  icon?: LucideIcon;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-sand-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary-100 bg-primary-50 text-primary-700">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-[0.95rem] font-bold text-forest-950">{title}</h2>
          <p className="mt-0.5 text-[11px] text-sand-500">{subtitle}</p>
        </div>
      </div>

      <Link
        href={action.href}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-forest-800 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-forest-900"
      >
        {action.label}
        <ArrowUpRight className="h-3.5 w-3.5 text-primary-300" />
      </Link>
    </section>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-sand-300 bg-sand-50/60 px-4 py-6 text-center text-xs font-semibold text-sand-600">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Banner artwork                                                      */
/* ------------------------------------------------------------------ */

/**
 * Picks banner artwork from the real catalogue.
 *
 * Pages ask for the destinations whose photographs suit them (a coastline for
 * Explore, mountains for Challenges) and we use the first one that actually
 * exists, so the hero always shows a photo the catalogue already ships and never
 * a guessed image URL.
 */
export function heroArt(
  destinations: Destination[],
  preferredIds: string[],
  fallback: string,
): string {
  for (const id of preferredIds) {
    const match = destinations.find((destination) => destination.id === id);
    const art = match?.heroImageUrl || match?.image;
    if (art) return art;
  }
  const anyArt = destinations.find(
    (destination) => destination.heroImageUrl || destination.image,
  );
  return anyImage(anyArt) ?? fallback;
}

function anyImage(destination: Destination | undefined): string | null {
  if (!destination) return null;
  return destination.heroImageUrl || destination.image || null;
}
