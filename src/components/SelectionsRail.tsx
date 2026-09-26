import Icon from "@/components/Icon";
import {
  DIETARY_LABELS,
  HEARING_LABELS,
  MOBILITY_LABELS,
  PREFERENCE_META,
  TRAVELER_TYPE_LABELS,
  VISUAL_LABELS,
  weightToLabel,
} from "@/lib/profile-options";
import type { ProfileData } from "@/lib/profile-service";
import type { IconName } from "@/lib/icons";

type RailRow = {
  key: string;
  label: string;
  icon: IconName;
  count: number;
  summary: string;
  highlight?: string;
};

function join(values: string[]): string {
  return values.join(" · ");
}

/**
 * Compact, always-visible summary of the traveller's answers.
 *
 * Deliberately bounded: values are rendered as clamped text rather than
 * wrapping chips, so this panel never grows past the viewport and never
 * needs its own scrollbar.
 */
export default function SelectionsRail({
  profile,
}: {
  profile: ProfileData;
}) {
  const toLabels = (values: string[], map: Record<string, string>) =>
    values.map((value) => map[value] ?? value);

  const travellers = toLabels(profile.travelerTypes, TRAVELER_TYPE_LABELS);
  const accessibility = [
    ...toLabels(profile.requirements.mobility, MOBILITY_LABELS),
    ...toLabels(profile.requirements.visual, VISUAL_LABELS),
    ...toLabels(profile.requirements.hearing, HEARING_LABELS),
  ];
  const dietary = toLabels(profile.dietary, DIETARY_LABELS);

  const topPreference = [...PREFERENCE_META].sort(
    (a, b) => profile.preferences[b.key] - profile.preferences[a.key],
  )[0];

  const rows: RailRow[] = [
    {
      key: "travellers",
      label: "Travelling with",
      icon: "users",
      count: travellers.length,
      summary: join(travellers),
    },
    {
      key: "accessibility",
      label: "Accessibility",
      icon: "accessibility",
      count: accessibility.length,
      summary: join(accessibility),
    },
    {
      key: "dietary",
      label: "Dietary",
      icon: "utensils",
      count: dietary.length,
      summary: join(dietary),
    },
    {
      key: "priority",
      label: "Top priority",
      icon: topPreference?.icon ?? "compass",
      count: 0,
      summary: topPreference?.label ?? "",
      highlight: topPreference
        ? weightToLabel(profile.preferences[topPreference.key])
        : undefined,
    },
    {
      key: "comfort",
      label: "Comfort",
      icon: "sofa",
      count: 0,
      summary: "",
      highlight: weightToLabel(profile.preferences.comfort),
    },
  ];

  const answered = rows.filter(
    (row) => row.count > 0 || Boolean(row.summary) || Boolean(row.highlight),
  ).length;

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Your selections</h2>
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">
          {answered}/{rows.length}
        </span>
      </div>

      <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
        Saved as structured data, not chat.
      </p>

      <ul className="mt-4 space-y-3.5">
        {rows.map((row) => {
          const hasContent = row.count > 0 || Boolean(row.summary) || Boolean(row.highlight);

          return (
            <li key={row.key}>
              <div className="flex items-center gap-2">
                <span
                  className={
                    hasContent
                      ? "grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"
                      : "grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-400"
                  }
                >
                  <Icon name={row.icon} className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
                  {row.label}
                </span>
                {row.count > 0 && (
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600">
                    {row.count}
                  </span>
                )}
              </div>

              <div className="mt-1 pl-8">
                {hasContent ? (
                  <>
                    {row.highlight && (
                      <p className="text-sm font-semibold text-brand-700">
                        {row.highlight}
                      </p>
                    )}
                    {row.summary && (
                      <p className="line-clamp-2 text-xs leading-relaxed text-ink-600">
                        {row.summary}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-ink-300">Not set yet</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {profile.specialRequirement && (
        <div className="mt-4 min-h-0 rounded-xl border border-sand-200 bg-sand-50 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-sand-700 uppercase">
            <Icon name="note" className="h-3.5 w-3.5" />
            Special requirements
          </p>
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-ink-700">
            {profile.specialRequirement}
          </p>
        </div>
      )}
    </div>
  );
}
