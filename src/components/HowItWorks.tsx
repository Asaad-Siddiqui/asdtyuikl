import Icon from "@/components/Icon";
import type { IconName } from "@/lib/icons";

const STEPS: { number: string; title: string; body: string; icon: IconName }[] = [
  {
    number: "01",
    title: "Create your profile",
    body: "Sign up in seconds — no lengthy forms, just the essentials.",
    icon: "user",
  },
  {
    number: "02",
    title: "Tell us what you need",
    body: "A short, guided conversation covers accessibility, dietary and travel preferences.",
    icon: "accessibility",
  },
  {
    number: "03",
    title: "Get personalized travel recommendations",
    body: "See destinations ranked against your own needs and sustainability goals.",
    icon: "compass",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Three steps to travel that fits
        </h2>
        <p className="mt-4 text-lg text-ink-600">
          Your needs are stored as structured preferences, so every
          recommendation actually reflects them.
        </p>
      </div>

      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.number}
            className="card relative flex flex-col gap-4 p-6"
            style={{
              animation: `fade-up 0.55s cubic-bezier(0.22,1,0.36,1) ${index * 0.08}s both`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-widest text-brand-500">
                {step.number}
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-50 text-ink-500">
                <Icon name={step.icon} className="h-5 w-5" />
              </span>
            </div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-sm leading-relaxed text-ink-600">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
