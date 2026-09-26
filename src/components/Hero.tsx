import Icon from "@/components/Icon";
import { ButtonLink } from "@/components/Button";

const SIGNALS = [
  "Accessibility-aware",
  "Lower-impact options",
  "Built for real needs",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_15%_-10%,var(--color-brand-100),transparent),radial-gradient(45rem_30rem_at_95%_10%,var(--color-sand-100),transparent)]"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24 lg:px-8">
        <div className="animate-[fade-up_0.6s_cubic-bezier(0.22,1,0.36,1)_both]">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand-700 uppercase">
            <Icon name="sparkles" className="h-4 w-4" />
            Sustainable · Accessible · Personalized
          </span>

          <h1 className="mt-6 text-4xl leading-[1.08] font-semibold sm:text-5xl lg:text-6xl">
            Travel that works for you.{" "}
            <span className="bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
              Better for the planet.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
            Discover destinations, stays and experiences personalized to your
            accessibility needs, preferences and sustainability goals.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/auth?mode=signup" size="lg">
              Get Started
              <Icon name="arrowRight" className="h-4.5 w-4.5" />
            </ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary" size="lg">
              How It Works
            </ButtonLink>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2">
            {SIGNALS.map((signal) => (
              <li
                key={signal}
                className="flex items-center gap-2 text-sm font-medium text-ink-500"
              >
                <Icon name="check" className="h-4 w-4 text-brand-500" />
                {signal}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.1s_both]">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}

/** A small, static product preview — no interactivity, purely visual. */
function HeroPreview() {
  const rows = [
    { label: "Accessibility match", value: 92, tone: "brand" as const },
    { label: "Sustainability score", value: 84, tone: "sand" as const },
  ];

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="card p-5 shadow-lift sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-ink-400 uppercase">
              Recommended for you
            </p>
            <p className="mt-1 text-xl font-semibold text-ink-950">
              Mahabaleshwar
            </p>
            <p className="text-sm text-ink-500">Maharashtra, India</p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <Icon name="mapPin" />
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-600">{row.label}</span>
                <span className="font-semibold text-ink-900">{row.value}%</span>
              </div>
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100"
                role="img"
                aria-label={`${row.label}: ${row.value}%`}
              >
                <div
                  className={
                    row.tone === "brand"
                      ? "h-full rounded-full bg-brand-500"
                      : "h-full rounded-full bg-sand-400"
                  }
                  style={{ width: `${row.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {["Step-free access", "Minimal walking", "Quiet stays"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="card absolute -bottom-6 -left-4 hidden w-52 p-4 sm:block">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Icon name="accessibility" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">Profile saved</p>
            <p className="text-xs text-ink-500">Stored securely</p>
          </div>
        </div>
      </div>
    </div>
  );
}
