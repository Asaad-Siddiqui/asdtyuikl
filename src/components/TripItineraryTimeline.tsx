"use client";

import Icon from "@/components/Icon";
import type { IconName } from "@/lib/icons";
import { formatCo2, formatINR } from "@/lib/trip-options";
import {
  resolveMode,
  type ItineraryOption,
  type TripDay,
} from "@/lib/trip-schema";

const MODE_ICONS: Record<string, IconName> = {
  train: "train",
  bus: "bus",
  car: "car",
  ev: "bolt",
  walk: "footsteps",
  mixed: "compass",
};

function dayLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function TripItineraryTimeline({
  option,
}: {
  option: ItineraryOption;
}) {
  return (
    <section aria-label="Day-by-day itinerary" className="space-y-7">
      {option.days.map((day) => (
        <DayBlock key={day.day} day={day} />
      ))}
    </section>
  );
}

/**
 * One day of the itinerary, with its activities on a timeline.
 * Exported so the saved-trip page can drop it inside a collapsible row.
 */
export function DayBlock({ day }: { day: TripDay }) {
  return (
    <div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h4 className="text-base font-semibold">
              Day {day.day}
              <span className="ml-2 text-sm font-normal text-ink-500">
                {dayLabel(day.date)}
              </span>
            </h4>
            {day.title && (
              <p className="text-sm font-medium text-brand-700">{day.title}</p>
            )}
          </div>
          {day.summary && (
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
              {day.summary}
            </p>
          )}

          <ol className="mt-4 space-y-0 border-l border-ink-200 pl-5">
            {day.activities.map((activity, index) => {
              const mode = activity.transport
                ? resolveMode(activity.transport)
                : null;

              return (
                <li
                  key={`${day.day}-${index}-${activity.title}`}
                  className="relative pb-5 last:pb-0"
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 -left-[26px] grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-brand-500 bg-surface"
                  />

                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <time
                      dateTime={activity.time}
                      className="text-sm font-semibold text-ink-900"
                    >
                      {activity.time}
                    </time>
                    <h5 className="text-sm font-medium text-ink-800">
                      {activity.title}
                    </h5>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {activity.location && (
                      <Chip icon="mapPin">{activity.location}</Chip>
                    )}
                    {mode && (
                      <Chip icon={MODE_ICONS[mode] ?? "compass"}>
                        {activity.transport}
                      </Chip>
                    )}
                    {activity.cost > 0 && (
                      <Chip icon="wallet">{formatINR(activity.cost)}</Chip>
                    )}
                    {activity.co2Kg > 0 && (
                      <Chip icon="leaf">
                        {formatCo2(activity.co2Kg)} estimated CO₂
                      </Chip>
                    )}
                  </div>

                  {(activity.accessibility || activity.sustainability) && (
                    <dl className="mt-2 space-y-1">
                      {activity.accessibility && (
                        <div className="flex items-start gap-2 text-xs leading-relaxed text-ink-500">
                          <dt className="flex shrink-0 items-center gap-1 font-medium text-ink-600">
                            <Icon name="accessibility" className="h-3.5 w-3.5" />
                            Accessibility
                          </dt>
                          <dd>{activity.accessibility}</dd>
                        </div>
                      )}
                      {activity.sustainability && (
                        <div className="flex items-start gap-2 text-xs leading-relaxed text-ink-500">
                          <dt className="flex shrink-0 items-center gap-1 font-medium text-ink-600">
                            <Icon name="leaf" className="h-3.5 w-3.5" />
                            Sustainability
                          </dt>
                          <dd>{activity.sustainability}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </li>
              );
            })}
          </ol>
    </div>
  );
}

function Chip({
  icon,
  children,
}: {
  icon: IconName;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-600">
      <Icon name={icon} className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}
