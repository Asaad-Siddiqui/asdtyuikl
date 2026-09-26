"use client";

import Icon from "@/components/Icon";
import { DayBlock } from "@/components/TripItineraryTimeline";
import type { ItineraryOption } from "@/lib/trip-schema";

function dayLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Collapsible day-by-day list.
 *
 * Day one opens automatically; every other day sits as a single concise row
 * until the traveller asks for the detail. Uses native <details> so keyboard
 * support and reduced-motion come for free.
 */
export default function TripDayAccordion({
  option,
}: {
  option: ItineraryOption;
}) {
  return (
    <div className="space-y-2.5">
      {option.days.map((day, index) => (
        <details
          key={day.day}
          open={index === 0}
          className="group overflow-hidden rounded-2xl border border-sand-200 bg-surface transition-colors open:border-forest-300 open:bg-forest-50/40"
        >
          <summary className="flex cursor-pointer list-none items-center gap-3.5 p-4 [&::-webkit-details-marker]:hidden">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest-700 text-xs font-bold text-white">
              D{day.day}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink-900">
                {day.title || `Day ${day.day}`}
              </span>
              <span className="mt-0.5 block text-xs text-ink-500">
                {dayLabel(day.date)} · {day.activities.length} activit
                {day.activities.length === 1 ? "y" : "ies"}
              </span>
            </span>
            <span className="hidden text-xs font-semibold text-forest-700 sm:block">
              {index === 0 ? "" : "View details"}
            </span>
            <Icon
              name="chevronLeft"
              className="h-4 w-4 shrink-0 -rotate-90 text-sand-500 transition-transform duration-200 group-open:rotate-90"
            />
          </summary>

          <div className="border-t border-sand-100 px-4 py-4 sm:px-5">
            <DayBlock day={day} />
          </div>
        </details>
      ))}
    </div>
  );
}
