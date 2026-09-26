"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, Compass, Sparkles } from "lucide-react";

import { useApp } from "@/components/travello/AppProvider";
import { cn } from "@/lib/format";

/** Saved destinations strip + "plan a trip" entry point on Explore. */
export function SavedDestinationsBar() {
  const { destinations, savedDestinationIds, toggleSaveDestination } = useApp();

  const saved = destinations.filter((destination) =>
    savedDestinationIds.includes(destination.id),
  );

  return (
    <div className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-forest-950">
            <BookmarkCheck className="h-4 w-4 text-emerald-600" />
            Saved Destinations
          </h2>
          <p className="mt-0.5 text-xs text-sand-600">
            {saved.length === 0
              ? "Nothing saved yet — bookmark a destination to keep it here."
              : `${saved.length} saved · stored on your account`}
          </p>
        </div>
        <Link
          href="/plan"
          className="inline-flex items-center gap-2 rounded-2xl bg-forest-800 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-forest-900"
        >
          <Sparkles className="h-4 w-4 text-emerald-300" />
          Plan a Trip
        </Link>
      </div>

      {saved.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2.5">
          {saved.map((destination) => (
            <li
              key={destination.id}
              className="flex items-center gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 py-1.5 pr-2 pl-3"
            >
              <Link
                href={`/explore/${destination.id}`}
                className="text-xs font-bold text-forest-900"
              >
                {destination.name}
              </Link>
              <button
                type="button"
                onClick={() => toggleSaveDestination(destination.id)}
                aria-label={`Remove ${destination.name} from saved`}
                className="rounded-lg p-1 text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <BookmarkCheck className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Save/unsave toggle used on the destination hub. */
export function SaveDestinationButton({ destinationId }: { destinationId: string }) {
  const { savedDestinationIds, toggleSaveDestination, destinations } = useApp();
  const destination = destinations.find((item) => item.id === destinationId);
  const saved = savedDestinationIds.includes(destinationId);

  if (!destination) {
    return (
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-xs font-bold text-sand-700"
      >
        <Compass className="h-3.5 w-3.5" /> Back to Explore
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleSaveDestination(destinationId)}
      aria-pressed={saved}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all",
        saved
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-sand-200 bg-white text-sand-700 hover:border-forest-300",
      )}
    >
      {saved ? (
        <>
          <BookmarkCheck className="h-4 w-4" /> Saved to your trips
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" /> Save this destination
        </>
      )}
    </button>
  );
}
