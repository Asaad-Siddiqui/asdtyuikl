"use client";

/**
 * "How a trip comes together" — a vertical step selector on the left driving a
 * live preview panel on the right.
 *
 * This replaces the dotted-route step row that used to sit here: that layout
 * was a near-duplicate of the "One thoughtful journey" route further down the
 * page. This one is asymmetric, interactive and shows the product instead of
 * repeating a diagram.
 *
 * Keyboard: the selector is a real tablist with a roving tabindex, so arrow
 * keys, Home and End all work.
 */

import { useRef, useState } from "react";
import { Bus, Compass, Leaf, Route, ShieldCheck, TrendingDown } from "lucide-react";

const COAST = "/images/goa-coast-map.jpg";
const BUS = "/images/electric-bus-road.jpg";
const MOUNTAIN =
  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=200&h=200&fit=crop&auto=format";

type Row = {
  image?: string;
  title: string;
  sub: string;
  figure: string;
  tone?: "good" | "alert";
};

type Step = {
  id: string;
  title: string;
  copy: string;
  panel: {
    icon: typeof Compass;
    label: string;
    chip: string;
    rows: Row[];
    meter?: { percent: number; caption: string };
    foot: string;
  };
};

const STEPS: Step[] = [
  {
    id: "discover",
    title: "Discover",
    copy: "Browse eco-verified places with live crowd pressure, the best season and step-free access — sorted so the quieter option wins.",
    panel: {
      icon: Compass,
      label: "Explore · Goa",
      chip: "12 places match",
      rows: [
        { image: COAST, title: "Morjim Beach", sub: "Low pressure · step-free sand ramp", figure: "86", tone: "good" },
        { image: MOUNTAIN, title: "Matheran Eco-Zone", sub: "Quiet trails · assisted viewpoints", figure: "82", tone: "good" },
        { image: BUS, title: "Baga Beach", sub: "Crowded 5–8 PM · stairs at the north end", figure: "41", tone: "alert" },
      ],
      foot: "Sorted by lowest crowd pressure",
    },
  },
  {
    id: "plan",
    title: "Plan",
    copy: "The planner drafts the trip around your mobility profile, pace and budget, then scores every leg of it.",
    panel: {
      icon: Route,
      label: "Draft itinerary · 2 days",
      chip: "Step-free route",
      rows: [
        { image: COAST, title: "Day 1 · 08:30", sub: "Coastal trail to the Aguada watchtower", figure: "1.4 kg", tone: "good" },
        { image: MOUNTAIN, title: "Day 1 · 14:00", sub: "Shared-table lunch in Anjuna", figure: "0.4 kg", tone: "good" },
        { image: BUS, title: "Day 2 · 09:15", sub: "Electric bus out to Morjim", figure: "4.2 kg", tone: "good" },
      ],
      foot: "6.0 kg CO₂e in total · 79% below the same trip by air",
    },
  },
  {
    id: "track",
    title: "Go, then track it",
    copy: "Complete challenges as you travel, file what you find, and watch the carbon you avoided stack up.",
    panel: {
      icon: TrendingDown,
      label: "Your impact · this trip",
      chip: "+50 points earned",
      rows: [
        { title: "Carbon avoided", sub: "Against the flight option", figure: "22.4 kg", tone: "good" },
        { title: "Challenges completed", sub: "Refill run, plastic-free picnic", figure: "2 of 4", tone: "good" },
        { title: "Reports approved", sub: "Broken ramp, blocked step-free path", figure: "3", tone: "good" },
      ],
      meter: { percent: 68, caption: "68% of the way to Green Explorer" },
      foot: "Updated every time you finish a challenge",
    },
  },
];

export function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const step = STEPS[active];
  const PanelIcon = step.panel.icon;

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const last = STEPS.length - 1;
    let next: number | null = null;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      next = active === last ? 0 : active + 1;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      next = active === 0 ? last : active - 1;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = last;
    }

    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className="how-section" aria-labelledby="how-title">
      <div className="section-shell grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,.88fr)_minmax(0,1.12fr)] lg:items-center lg:gap-14">
        {/* ── Left: the steps ── */}
        <div>
          <p className="eyebrow">HOW A TRIP COMES TOGETHER</p>
          <h2
            id="how-title"
            className="mt-3 text-balance font-serif text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl"
          >
            From a saved link to a finished itinerary.
          </h2>
          <p className="mt-4 max-w-md text-pretty text-sm leading-6 text-muted-foreground">
            No spreadsheets and no guessing. Every trip is scored for carbon, crowd pressure and step-free access before
            you commit to it.
          </p>

          <div className="how-steps" role="tablist" aria-orientation="vertical" aria-label="How a trip comes together" onKeyDown={onKeyDown}>
            {STEPS.map((item, index) => {
              const selected = index === active;
              return (
                <button
                  key={item.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`how-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls={`how-panel-${item.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(index)}
                  className={`how-step${selected ? " how-step-active" : ""}`}
                >
                  <span className="how-step-num">{String(index + 1).padStart(2, "0")}</span>
                  <span className="how-step-body">
                    <span className="how-step-title">{item.title}</span>
                    {selected && <span className="how-step-copy animate-fade-in">{item.copy}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: the live preview ── */}
        <div
          role="tabpanel"
          id={`how-panel-${step.id}`}
          aria-labelledby={`how-tab-${step.id}`}
          tabIndex={0}
          key={step.id}
          className="how-panel animate-fade-in"
        >
          <div className="how-panel-head">
            <span className="how-panel-label">
              <PanelIcon className="size-3.5" />
              {step.panel.label}
            </span>
            <span className="how-panel-chip">{step.panel.chip}</span>
          </div>

          <div className="how-rows">
            {step.panel.rows.map((row) => (
              <div key={row.title} className="how-row">
                {row.image && <img src={row.image} alt="" />}
                <span className="how-row-main">
                  <span className="how-row-title">{row.title}</span>
                  <span className="how-row-sub">{row.sub}</span>
                </span>
                <span className={`how-row-figure how-row-figure-${row.tone ?? "good"}`}>{row.figure}</span>
              </div>
            ))}
          </div>

          {step.panel.meter && (
            <div className="mt-4">
              <div
                className="how-bar"
                role="progressbar"
                aria-valuenow={step.panel.meter.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={step.panel.meter.caption}
              >
                <span style={{ width: `${step.panel.meter.percent}%` }} />
              </div>
              <p className="mt-2 text-[0.68rem] text-muted-foreground">{step.panel.meter.caption}</p>
            </div>
          )}

          <p className="how-panel-foot">
            {step.id === "discover" ? (
              <Leaf className="size-3.5" />
            ) : step.id === "plan" ? (
              <ShieldCheck className="size-3.5" />
            ) : (
              <Bus className="size-3.5" />
            )}
            {step.panel.foot}
          </p>
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
