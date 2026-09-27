"use client";

import { useParams, Link, useNavigate } from '@/lib/router'
import { useApp } from '@/components/travello/AppProvider'
import { SustainabilityScore } from '@/components/travello/SustainabilityScore'
import { PressureBadge } from '@/components/travello/PressureBadge'
import { ChallengeCard } from '@/components/travello/ChallengeCard'
import { SeniorModeToggle, useSeniorMode } from '@/components/travello/SeniorModeToggle'
import { attractions as attractionCatalogue } from '@/lib/travello-data'
import {
  bestVisitWindow,
  crowdTone,
  lessCrowdedAlternative,
  seniorAccessibility,
  crowdStatus,
  isCrowded,
} from '@/lib/recommend'
import { cn, getScoreColor } from '@/lib/format'
import { MapPin, AlertTriangle, Sparkles, ArrowLeft, ChevronRight, Shield, CheckCircle2, XCircle, Accessibility, Store, Users, TrendingDown, Clock, Leaf, Star, Hotel } from 'lucide-react'

export function DestinationHubPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { seniorMode } = useSeniorMode()
  const { destinations, challenges, businesses, completions, reports, setSelectedDestination } = useApp()

  const destination = destinations.find((d) => d.id === id)
  if (!destination) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-forest-800 mb-2">Destination not found</h2>
        <Link to="/explore" className="text-forest-600 hover:underline">Browse destinations</Link>
      </div>
    )
  }

  const destChallenges = challenges.filter((c) => c.destinationId === id)
  const destBusinesses = businesses.filter((b) => b.destinationId === id)
  const destReports = reports.filter((r) => r.destinationId === id)

  const senior = seniorAccessibility(destination)

  // Attractions for this destination, quieter ones first when the mode is on.
  const destAttractions = attractionCatalogue
    .filter((attraction) => attraction.destinationId === id)
    .sort((a, b) =>
      seniorMode
        ? b.accessibilityScore - a.accessibilityScore
        : a.crowdLevel.localeCompare(b.crowdLevel),
    )

  const completedIds = completions
    .filter((c) => c.status === 'completed')
    .map((c) => c.challengeId)

  const gradientMap: Record<string, string> = {
    matheran: 'from-emerald-800 to-teal-900',
    goa: 'from-sky-700 to-blue-900',
    manali: 'from-indigo-700 to-purple-900',
  }

  const handleStartJourney = () => {
    setSelectedDestination(destination)
    navigate('/plan')
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {/* ── Hero Banner ── */}
      <div className={cn('relative overflow-hidden rounded-2xl border border-sand-200/70 bg-gradient-to-br text-white shadow-sm', gradientMap[id || ''] || 'from-forest-800 to-forest-950')}>
        {destination.heroImageUrl && (
          <img
            src={destination.heroImageUrl}
            alt={destination.name}
            className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        
        <div className="relative px-5 py-6 sm:px-8 sm:py-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white text-sm font-semibold mb-6 transition-all border border-white/15"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explore
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 backdrop-blur-md text-emerald-300 rounded-full text-xs font-bold border border-emerald-400/30">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {destination.region}, {destination.country}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
                {destination.name}
              </h1>
              <p className="text-forest-100/90 text-base sm:text-lg leading-relaxed max-w-2xl">
                {destination.description}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-5 border border-white/20 text-center shadow-2xl flex flex-col items-center">
                <SustainabilityScore score={destination.sustainabilityScore} size="lg" />
                <span className="text-xs font-bold text-white/90 mt-1">Verified Eco Health</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4 sm:space-y-5">
        
        {/* ── Quick Action Bar ── */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleStartJourney}
            className="flex items-center gap-2 px-6 py-3.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg shadow-forest-800/20"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            Plan Sustainable Itinerary
          </button>
          <Link
            to="/challenges"
            className="flex items-center gap-2 px-6 py-3.5 bg-white border border-sand-200 text-forest-800 rounded-xl font-bold text-sm hover:bg-forest-50 transition-all shadow-2xs"
          >
            <Shield className="w-4 h-4 text-forest-600" />
            Browse Challenges ({destChallenges.length})
          </Link>
          <Link
            to="/reports"
            className="flex items-center gap-2 px-6 py-3.5 bg-white border border-red-200 text-red-700 rounded-xl font-bold text-sm hover:bg-red-50 transition-all shadow-2xs"
          >
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Report Issue
          </Link>
          <SeniorModeToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Sustainability Snapshot */}
            <section className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-forest-900">Sustainability Factor Breakdown</h2>
                <p className="text-sm text-sand-600 mt-1 leading-relaxed">
                  {destination.sustainabilityScore >= 80
                    ? `${destination.name} exhibits superior ecological health, though visitor flow management remains essential.`
                    : `${destination.name} maintains good sustainability practices with ongoing focus on waste and mobility balancing.`}
                </p>
              </div>

              {/* Granular Factors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {destination.factors.map((factor) => (
                  <div key={factor.factor} className="bg-sand-50/80 rounded-2xl p-4 border border-sand-200/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{factor.icon}</span>
                        <span className={cn('text-sm font-black px-2 py-0.5 rounded-md bg-white border shadow-2xs', getScoreColor(factor.score))}>
                          {factor.score}/100
                        </span>
                      </div>
                      <div className="text-xs font-bold text-forest-900 mb-1">{factor.factor}</div>
                      <div className="text-xs text-sand-600 leading-snug">{factor.explanation}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Current Pressure Status Indicators */}
              <div>
                <h3 className="text-base font-bold text-forest-900 mb-3">Live Environmental & Crowd Telemetry</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <PressureBadge label="Crowd Level" level={destination.crowdLevel} />
                  <PressureBadge label="Waste Pressure" level={destination.wastePressure} />
                  <PressureBadge label="Water Strain" level={destination.waterPressure} />
                  <PressureBadge label="Habitat Sensitivity" level={destination.environmentalSensitivity} />
                </div>
              </div>
            </section>

            {/* Key Issues & Directives */}
            <section className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-forest-900">Mindful Travel Guidelines</h2>
              <div className="space-y-3">
                {destination.visitorPressure === 'High' || destination.visitorPressure === 'Very High' ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4.5">
                    <div className="flex items-start gap-3.5">
                      <span className="text-2xl shrink-0">👥</span>
                      <div>
                        <p className="font-bold text-amber-900 text-sm sm:text-base">High Visitor Density Zone</p>
                        <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
                          Avoid peak hours (11:00 AM - 4:00 PM). Follow marked forest routes and consider less-crowded alternative trails.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {destination.wastePressure !== 'Low' ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4.5">
                    <div className="flex items-start gap-3.5">
                      <span className="text-2xl shrink-0">♻️</span>
                      <div>
                        <p className="font-bold text-orange-900 text-sm sm:text-base">Zero-Waste Directives</p>
                        <p className="text-xs sm:text-sm text-orange-800 mt-1 leading-relaxed">
                          Carry reusable water bottles. Use verified refill stations across town to earn Refill Champion badges.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4.5">
                  <div className="flex items-start gap-3.5">
                    <span className="text-2xl shrink-0">🌱</span>
                    <div>
                      <p className="font-bold text-emerald-900 text-sm sm:text-base">Protected Biodiversity Zone</p>
                      <p className="text-xs sm:text-sm text-emerald-800 mt-1 leading-relaxed">
                        Natural canopy and wildlife sanctuaries are thriving. Help protect local ecology by respecting noise and speed guidelines.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Attractions & Less-Crowded Alternatives */}
            <section className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-forest-900">Attractions &amp; Crowd Outlook</h2>
                  <p className="text-xs sm:text-sm text-sand-600 mt-1 leading-relaxed">
                    Live crowd bands for each highlight, with a calmer option wherever a
                    point gets busy.
                  </p>
                </div>
                {seniorMode ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                    <Accessibility className="w-3.5 h-3.5" /> Sorted by accessibility
                  </span>
                ) : null}
              </div>

              <div className="space-y-3.5">
                {destAttractions.map((attraction) => {
                  const alternative = lessCrowdedAlternative(attraction, attractionCatalogue)
                  return (
                    <div
                      key={attraction.id}
                      className="rounded-2xl border border-sand-200/70 bg-sand-50/50 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-forest-950">{attraction.name}</p>
                          <p className="text-xs text-sand-600 mt-0.5 leading-relaxed">
                            {attraction.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-semibold text-sand-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {attraction.travelTime}
                            </span>
                            <span className={cn('font-black', getScoreColor(attraction.accessibilityScore))}>
                              Accessibility {attraction.accessibilityScore}/100
                            </span>
                            <span>
                              {attraction.estimatedCost > 0
                                ? `₹${attraction.estimatedCost}`
                                : 'Free'}
                            </span>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold',
                            crowdTone(attraction.crowdLevel)
                          )}
                        >
                          <Users className="w-3.5 h-3.5" />
                          {attraction.crowdLevel} crowd
                        </span>
                      </div>

                      {alternative ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 shrink-0 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <TrendingDown className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-emerald-900">
                                Less-crowded alternative → {alternative.to.name}
                              </p>
                              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                                {alternative.reasons[0]}
                              </p>
                              {alternative.reasons.length > 1 ? (
                                <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
                                  {alternative.reasons[1]}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] font-semibold text-emerald-700">
                          {isCrowded(attraction.crowdLevel)
                            ? `No quieter option nearby yet — best time: ${bestVisitWindow(attraction.crowdLevel).toLowerCase()}.`
                            : 'Comfortably quiet — a good pick at any time today.'}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Destination Challenges */}
            <section className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-forest-900">Destination Eco Challenges</h2>
                  <p className="text-xs sm:text-sm text-sand-600">Complete tasks at this destination to earn rewards.</p>
                </div>
                <Link to="/challenges" className="text-sm font-bold text-forest-700 hover:text-forest-800 flex items-center gap-1">
                  View all ({destChallenges.length}) <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {destChallenges.slice(0, 3).map((challenge, i) => (
                  <ChallengeCard
                    key={challenge.id}
                    id={challenge.id}
                    title={challenge.title}
                    description={challenge.description}
                    image={destination?.image || undefined}
                    category={challenge.category}
                    difficulty={challenge.difficulty}
                    points={challenge.points}
                    estimatedMinutes={challenge.estimatedMinutes}
                    destinationName={destination?.name}
                    isCompleted={completedIds.includes(challenge.id)}
                    isRecommended={i === 0}
                  />
                ))}
              </div>
            </section>

          </div>

          {/* Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Senior + Accessibility verdict */}
            <section className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-sand-100 pb-3">
                <div className="flex items-center gap-2">
                  <Accessibility className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-forest-900">Senior &amp; Accessibility</h3>
                </div>
                <span
                  className={cn(
                    'text-xs font-black px-2.5 py-0.5 rounded-full',
                    senior.friendly
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-amber-700 bg-amber-50'
                  )}
                >
                  {senior.friendly ? 'Senior-friendly' : 'Plan with care'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'text-2xl font-black px-3 py-1.5 rounded-xl border bg-white shadow-2xs',
                    getScoreColor(senior.score)
                  )}
                >
                  {senior.score}
                </span>
                <p className="text-xs text-sand-600 leading-relaxed">
                  Senior &amp; accessibility score out of 100, from step-free routes, walking
                  distance, toilets, lifts and parking.
                </p>
              </div>

              {senior.reasons.length > 0 ? (
                <ul className="space-y-1.5">
                  {senior.reasons.slice(0, 4).map((reason) => (
                    <li key={reason} className="flex items-start gap-2 text-xs text-emerald-800 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      {reason}
                    </li>
                  ))}
                </ul>
              ) : null}

              {senior.caution.length > 0 ? (
                <ul className="space-y-1.5 border-t border-sand-100 pt-3">
                  {senior.caution.slice(0, 3).map((note) => (
                    <li key={note} className="flex items-start gap-2 text-xs text-amber-800 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      {note}
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="text-[11px] text-blue-900 bg-blue-50/60 border border-blue-100 rounded-xl p-3 leading-relaxed font-medium">
                Crowd outlook: <strong>{crowdStatus(destination.crowdLevel)}</strong> right now.
                Best time to visit — {bestVisitWindow(destination.crowdLevel).toLowerCase()}.
              </p>
            </section>

            {/* Accessibility Audit */}
            <section className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-sand-100 pb-3">
                <div className="flex items-center gap-2">
                  <Accessibility className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-forest-900">Accessibility Audit</h3>
                </div>
                <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  Audited
                </span>
              </div>

              <div className="space-y-2.5">
                {Object.entries(destination.accessibility)
                  .filter(([key]) => !['notes'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm py-1 border-b border-sand-50 last:border-0">
                      <span className="text-sand-700 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      {typeof value === 'boolean' ? (
                        value ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2 py-0.5 rounded-md">
                            <XCircle className="w-3.5 h-3.5 text-red-500" /> Limited
                          </span>
                        )
                      ) : (
                        <span className="text-forest-900 font-bold text-xs bg-sand-100 px-2 py-0.5 rounded-md">{String(value)}</span>
                      )}
                    </div>
                  ))}
              </div>

              {destination.accessibility.notes && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed font-medium">
                  ℹ️ {destination.accessibility.notes}
                </div>
              )}
            </section>

            {/* Sustainable Businesses in Area */}
            <section className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-sand-100 pb-3">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-forest-600" />
                  <h3 className="text-base font-bold text-forest-900">Eco Businesses</h3>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Verified Local
                </span>
              </div>

              <div className="space-y-3">
                {destBusinesses.map((biz) => {
                  const businessScore = biz.assessment?.overall ?? null;
                  return (
                    <div key={biz.id} className="bg-sand-50/80 rounded-2xl p-4 border border-sand-200/60 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="block text-sm font-bold text-forest-900">{biz.name}</span>
                          {biz.locality ? (
                            <span className="mt-0.5 block text-[11px] text-sand-500">{biz.locality}</span>
                          ) : null}
                        </div>
                        {businessScore !== null ? (
                          <span
                            className={cn(
                              'shrink-0 inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-md bg-white border shadow-2xs',
                              getScoreColor(businessScore)
                            )}
                          >
                            <Leaf className="w-3 h-3" />
                            Sustainability: {businessScore}/100
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-md border border-sand-200 bg-white px-2 py-0.5 text-[11px] font-bold text-sand-500">
                            Not yet assessed
                          </span>
                        )}
                      </div>

                      {businessScore !== null ? (
                        <p className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sustainability assessed
                        </p>
                      ) : null}

                      <p className="text-xs text-sand-500 capitalize">{biz.type} • {biz.priceRange}</p>

                      {biz.traveller ? (
                        <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          Traveller rating {biz.traveller.average.toFixed(1)}/5
                          <span className="font-semibold text-sand-500">
                            ({biz.traveller.count})
                          </span>
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {biz.sustainabilityPractices.slice(0, 3).map((p) => (
                          <span key={p} className="px-2 py-0.5 bg-emerald-100/80 text-emerald-800 text-xs rounded-md font-medium">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {destBusinesses.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-sand-200 bg-sand-50/60 px-4 py-6 text-center text-xs text-sand-500">
                    No hospitality businesses listed here yet.
                  </p>
                ) : null}
              </div>

              <Link
                to="/hospitality"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-forest-200 bg-forest-50 px-4 py-2.5 text-xs font-bold text-forest-800 transition-colors hover:bg-forest-100"
              >
                <Hotel className="w-3.5 h-3.5" />
                Run a sustainability self-assessment
              </Link>
            </section>

          </div>

        </div>
      </div>
    </div>
  )
}

export default DestinationHubPage;
