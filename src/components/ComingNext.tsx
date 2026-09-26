import Icon from "@/components/Icon";
import type { IconName } from "@/lib/icons";

const UPCOMING: { title: string; body: string; icon: IconName }[] = [
  {
    title: "Carbon Footprint",
    body: "See the emissions behind each trip option.",
    icon: "leaf",
  },
  {
    title: "Sustainable Stays",
    body: "Discover eco-certified, accessible accommodation.",
    icon: "mapPin",
  },
  {
    title: "Smart Itineraries",
    body: "Optimized routes that respect your pace and needs.",
    icon: "compass",
  },
  {
    title: "Accessibility Scores",
    body: "Verified accessibility ratings for places and stays.",
    icon: "accessibility",
  },
];

export default function ComingNext() {
  return (
    <section
      id="explore"
      className="scroll-mt-20 border-y border-ink-200 bg-surface/60"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-sand-600 uppercase">
            Coming next
          </p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
            The roadmap after Phase 1
          </h2>
          <p className="mt-4 text-lg text-ink-600">
            Phase 1 gives you a personalized profile and dashboard. These
            capabilities build on the same foundation.
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {UPCOMING.map((item) => (
            <li
              key={item.title}
              className="relative rounded-[var(--radius-card)] border border-dashed border-ink-300 bg-canvas p-5"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-100 text-ink-400">
                <Icon name={item.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink-700">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                {item.body}
              </p>
              <span className="mt-4 inline-block rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
                Coming soon
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
