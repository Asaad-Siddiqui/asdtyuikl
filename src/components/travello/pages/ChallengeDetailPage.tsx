"use client";

import { useParams, useNavigate, Link } from '@/lib/router'
import { useApp } from '@/components/travello/AppProvider'
import { cn, getDifficultyColor } from '@/lib/format'
import { ArrowLeft, Clock, Zap, CheckCircle, Camera, AlertCircle, Sparkles } from 'lucide-react';export function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { challenges, completions, startChallenge, destinations } = useApp()

  const challenge = challenges.find((c) => c.id === id)
  const completion = completions.find((c) => c.challengeId === id)
  const destination = challenge ? destinations.find((d) => d.id === challenge.destinationId) : null

  if (!challenge) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-forest-800 mb-2">Challenge not found</h2>
        <Link to="/challenges" className="text-forest-600 hover:underline">Browse challenges</Link>
      </div>
    )
  }

  const isCompleted = completion?.status === 'completed'
  const isInProgress = completion?.status === 'in_progress'

  const handleStart = () => {
    startChallenge(challenge.id)
    navigate(`/challenges/${id}/evidence`)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-sand-200 text-sand-700 hover:text-forest-900 rounded-xl text-sm font-semibold shadow-2xs transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Challenges
      </button>

      {/* Challenge Card */}
      <div className="bg-white rounded-3xl border border-sand-200 overflow-hidden shadow-sm">
        
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl p-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                  {challenge.icon}
                </span>
                {destination && (
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/30">
                    📍 {destination.name}, {destination.region}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">{challenge.title}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className={cn('px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider', getDifficultyColor(challenge.difficulty))}>
                {challenge.difficulty}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                {challenge.estimatedMinutes} mins
              </span>
              <span className="flex items-center gap-1 px-3 py-1 bg-amber-400 text-forest-950 rounded-full text-xs font-black shadow-sm">
                <Zap className="w-3.5 h-3.5 fill-current" />
                +{challenge.points} pts
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Why It Matters */}
          <section className="bg-sand-50/80 rounded-2xl p-5 border border-sand-200/60 space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-sand-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Why This Matters For Destination Health
            </h2>
            <p className="text-sm sm:text-base text-forest-900 leading-relaxed font-medium">
              {challenge.whyItMatters}
            </p>
          </section>

          {/* Description */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-forest-900">Mission Overview</h2>
            <p className="text-sm sm:text-base text-sand-700 leading-relaxed">{challenge.description}</p>
          </section>

          {/* Instructions */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-forest-900">Step-by-Step Instructions</h2>
            <div className="space-y-2.5">
              {challenge.instructions.map((instruction, i) => (
                <div key={i} className="flex items-start gap-3.5 bg-sand-50/80 rounded-2xl p-4 border border-sand-200/60">
                  <span className="w-7 h-7 bg-forest-800 text-white rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                    {i + 1}
                  </span>
                  <span className="text-sm sm:text-base text-sand-800 font-medium leading-relaxed">{instruction}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Evidence Requirements Banner */}
          {challenge.evidenceRequired && (
            <section className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5">
              <div className="flex items-start gap-3.5">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-amber-900">Verification Protocol</h3>
                  <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                    You&apos;ll be prompted to upload a geo-tagged photo with timestamp when completing this challenge. Our anti-fraud verification checks that evidence is captured on location.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Action Trigger */}
          <div className="pt-4 border-t border-sand-100">
            {isCompleted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-1">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-lg font-black text-emerald-900">Mission Verified & Completed!</p>
                <p className="text-sm text-emerald-700">You earned +{challenge.points} impact points.</p>
              </div>
            ) : isInProgress ? (
              <Link
                to={`/challenges/${id}/evidence`}
                className="block w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-base text-center shadow-lg shadow-emerald-600/20 transition-all"
              >
                Submit Mission Evidence →
              </Link>
            ) : (
              <button
                onClick={handleStart}
                className="w-full py-4 bg-forest-800 hover:bg-forest-900 text-white rounded-2xl font-bold text-base shadow-lg shadow-forest-800/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-5 h-5 text-emerald-300" />
                Accept & Start Challenge (+{challenge.points} pts)
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default ChallengeDetailPage;
