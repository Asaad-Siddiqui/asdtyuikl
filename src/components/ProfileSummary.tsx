import Icon from "@/components/Icon";
import { buildSummarySections } from "@/lib/profile-summary";
import type { ProfileData } from "@/lib/profile-service";

export default function ProfileSummary({
  profile,
  title = "Your profile at a glance",
  hint,
}: {
  profile: ProfileData;
  title?: string;
  hint?: string;
}) {
  const sections = buildSummarySections(profile);
  const notes = [
    { label: "Mobility notes", content: profile.details.mobility },
    { label: "Dietary notes", content: profile.details.dietary },
    { label: "Special requirements", content: profile.specialRequirement },
  ].filter((note) => note.content.trim().length > 0);
  const hasAnything =
    profile.travelerTypes.length > 0 ||
    profile.requirements.mobility.length > 0 ||
    profile.requirements.visual.length > 0 ||
    profile.requirements.hearing.length > 0 ||
    profile.dietary.length > 0;

  return (
    <section
      aria-label={title}
      className="card p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Icon name="sparkles" className="h-4 w-4" />
        </span>
      </div>

      {hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}

      {!hasAnything && (
        <p className="mt-4 rounded-2xl border border-dashed border-ink-300 bg-canvas px-4 py-3 text-sm text-ink-500">
          Nothing selected yet — your answers will appear here as you go.
        </p>
      )}

      <dl className="mt-5 space-y-4">
        {sections.map((section) => {
          const isEmpty = section.values.length === 0 && !section.highlight;

          return (
            <div key={section.key}>
              <dt className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                <Icon name={section.icon} className="h-4 w-4" />
                {section.label}
              </dt>
              <dd className="mt-1.5">
                {section.highlight && (
                  <p className="text-sm font-semibold text-brand-700">
                    {section.highlight}
                  </p>
                )}
                {section.values.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {section.values.map((value) => (
                      <li
                        key={value}
                        className="rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700"
                      >
                        {value}
                      </li>
                    ))}
                  </ul>
                )}
                {isEmpty && (
                  <p className="text-sm text-ink-400">{section.emptyHint}</p>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {notes.length > 0 && (
        <div className="mt-5 space-y-3">
          {notes.map((note) => (
            <div
              key={note.label}
              className="rounded-2xl border border-sand-200 bg-sand-50 p-4"
            >
              <p className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-sand-700 uppercase">
                <Icon name="note" className="h-4 w-4" />
                {note.label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
