"use client";

import { Link, useNavigate } from '@/lib/router'
import {
  Accessibility,
  ArrowRight,
  Leaf,
  MapPin,
  Navigation,
  Play,
  Star,
  Users,
} from 'lucide-react'
import {
  DifferenceSection,
  ExploreOptionsSection,
  JourneySection,
} from '@/components/travello/pages/LandingSections'
import { HowItWorksSection } from '@/components/travello/pages/HowItWorksSection'

/**
 * Public landing page — rebuilt to match `materials/image copy.png`:
 *
 *   1. Full-bleed hero            "Travel with a greater purpose."
 *   2. Trust strip                Sustainable Travel / Accessible Journeys / …
 *   3. How a trip comes together   step selector + live product preview
 *   4. See the difference         ┐
 *   5. One thoughtful journey     ├─ ported verbatim from the supplied zip
 *   6. Explore your options       ┘
 *
 * All copy here is placeholder-friendly and safe to reword; the animations and
 * layout are the part that was ported. Motion is plain CSS + SVG (no GSAP).
 */

const HERO_ART =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1200&fit=crop&auto=format'
const CARD_ART =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=320&h=320&fit=crop&auto=format'

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
]

/* ── 2. Trust strip ────────────────────────────────────────────────── */

const stripItems = [
  { icon: Leaf, title: 'Sustainable Travel', copy: 'Lower your footprint' },
  { icon: Accessibility, title: 'Accessible Journeys', copy: 'Travel for everyone' },
  { icon: Users, title: 'Support Local', copy: 'Empower communities' },
  { icon: Leaf, title: 'Real Impact', copy: 'Track your positive change' },
]

/* ── Hero featured card ────────────────────────────────────────────── */

const cardChips = [
  { icon: Leaf, label: 'Low Crowd Level' },
  { icon: Users, label: 'Accessible Trails' },
  { icon: Leaf, label: 'Lower Carbon Impact' },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing-surface overflow-x-hidden">

      {/* ── 1. HERO ─────────────────────────────────────────────────── */}
      <section className="hero-shell grain">
        <img src={HERO_ART} alt="" aria-hidden="true" className="hero-photo" />
        <div className="hero-wash" aria-hidden="true" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.02fr_.98fr] lg:gap-10 lg:px-8 lg:py-24">
          {/* Headline column */}
          <div className="relative z-10">
            <span className="hero-badge">
              <Leaf className="size-4" />
              Green &amp; Inclusive Travel Platform
            </span>

            <h1 className="mt-7 text-balance font-serif text-[2.05rem] font-bold leading-[1.08] tracking-tight text-forest-950 sm:text-[2.9rem] lg:text-[2.85rem] xl:text-[3.7rem]">
              Travel with
              <br />
              <span className="italic text-primary">a greater purpose.</span>
            </h1>

            <p className="mt-6 max-w-[27rem] text-pretty text-base leading-relaxed text-ink-600 sm:text-lg">
              Discover breathtaking destinations, plan accessible journeys, complete eco-challenges and make a real
              positive impact — for people, places and the planet.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link to="/plan" className="hero-cta hero-cta-primary group">
                Plan Your Trip
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <button type="button" onClick={() => navigate('/explore/matheran')} className="hero-cta hero-cta-ghost group">
                <span className="grid size-7 place-items-center rounded-full bg-forest-900 text-white transition-transform group-hover:scale-110">
                  {/* nudged 1px right so the triangle reads as centred */}
                  <Play className="size-3 translate-x-px fill-current" />
                </span>
                Watch Demo
              </button>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <div className="flex items-center -space-x-2.5">
                {AVATARS.map((src) => (
                  <img key={src} src={src} alt="" className="size-9 rounded-full object-cover ring-2 ring-white" />
                ))}
                <div className="grid size-9 place-items-center rounded-full bg-emerald-800 text-xs font-bold text-white ring-2 ring-white">
                  12K+
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-forest-950">4.9/5</span>
                </div>
                <p className="mt-0.5 text-xs font-medium text-ink-500">
                  Trusted by conscious travelers &amp; 45+ travel partners
                </p>
              </div>
            </div>
          </div>

          {/* Featured destination column */}
          <div className="relative z-10 lg:pl-2">
            <div className="hero-card">
              <div className="flex items-start gap-4">
                <img
                  src={CARD_ART}
                  alt="Banff National Park"
                  className="h-[92px] w-[92px] flex-none rounded-xl object-cover sm:h-[104px] sm:w-[104px]"
                />

                <div className="min-w-0 flex-1">
                  <p className="hero-card-chip">
                    <Leaf className="size-3.5 flex-none text-primary" />
                    Featured Destination
                  </p>
                  <h2 className="mt-2 font-display text-lg font-bold leading-tight text-forest-950 sm:text-xl">
                    Banff National Park
                  </h2>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4 flex-none text-primary" />
                    Canada
                  </p>
                </div>

                <div className="grid h-[74px] w-[74px] flex-none place-items-center rounded-full bg-primary-50 text-center sm:h-[86px] sm:w-[86px]">
                  <div>
                    <Leaf className="mx-auto size-4 text-primary" />
                    <span className="mt-0.5 block font-display text-xl font-bold leading-none tabular-nums text-forest-950">
                      92
                    </span>
                    <span className="mt-1 block text-[10px] font-semibold leading-none text-primary">Eco Score</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4">
                {cardChips.map(({ icon: Icon, label }) => (
                  <span key={label} className="hero-card-chip">
                    <Icon className="size-3.5 flex-none text-primary" />
                    {label}
                  </span>
                ))}
                <Link
                  to="/explore/manali"
                  aria-label="Open this featured destination"
                  className="ml-auto grid size-8 flex-none place-items-center rounded-full border border-border text-primary transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Decorative route leaving the card towards a quieter stop. */}
            <svg className="hero-route-svg" viewBox="0 0 300 280" fill="none" aria-hidden="true">
              <path className="hero-route-line" d="M4 8 C96 44 150 118 168 182 C184 240 216 264 286 270" />
              <circle className="hero-route-dot" cx="286" cy="270" r="7" />
            </svg>

            <div className="route-pill">
              <Navigation className="size-3.5" />
              <span>
                <strong className="block text-[11px] font-bold leading-none">Lake Louise</strong>
                <span className="mt-1 block text-[9px] leading-none opacity-85">Lower impact route</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. TRUST STRIP ──────────────────────────────────────────── */}
      <section className="strip-section">
        <div className="section-shell grid gap-0 py-8 lg:grid-cols-4 lg:gap-6">
          {stripItems.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="strip-item flex items-center gap-3.5 lg:px-2">
              <span className="strip-icon">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-forest-950">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. HOW A TRIP COMES TOGETHER ───────────────────────────── */}
      <HowItWorksSection />

      {/* ── 4-6. Ported from the supplied zip ──────────────────────── */}
      <DifferenceSection />
      <JourneySection />
      <ExploreOptionsSection />
    </div>
  )
}

export default LandingPage;
