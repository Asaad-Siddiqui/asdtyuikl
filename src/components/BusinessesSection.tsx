import Icon from "@/components/Icon";
import { ButtonLink } from "@/components/Button";

const POINTS = [
  "Showcase verified accessibility features",
  "Demonstrate sustainability commitments",
  "Reach travellers whose needs you actually meet",
];

export default function BusinessesSection() {
  return (
    <section
      id="businesses"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="relative overflow-hidden rounded-[var(--radius-xl2)] bg-gradient-to-br from-brand-800 via-brand-700 to-ink-900 px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl"
        />

        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-wide text-brand-200 uppercase">
              For businesses
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Be the stay travellers can count on
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-50/85">
              A hospitality dashboard for sustainability and accessibility
              reporting is on the roadmap. Register your interest and help shape
              it.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                href="/auth?mode=signup"
                size="lg"
                className="!bg-white !text-brand-800 hover:!bg-brand-50"
              >
                Register interest
                <Icon name="arrowRight" className="h-4.5 w-4.5" />
              </ButtonLink>
              <ButtonLink
                href="#how-it-works"
                variant="ghost"
                size="lg"
                className="!text-white hover:!bg-white/10"
              >
                See how it works
              </ButtonLink>
            </div>
          </div>

          <ul className="space-y-3">
            {POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 backdrop-blur-sm"
              >
                <Icon
                  name="check"
                  className="mt-0.5 h-5 w-5 shrink-0 text-brand-200"
                />
                <span className="text-sm leading-relaxed text-brand-50/90">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
