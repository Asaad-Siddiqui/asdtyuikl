"use client";

import { useState } from 'react'
import { useApp } from '@/components/travello/AppProvider'
import { ChallengeCard } from '@/components/travello/ChallengeCard'
import { Search, Trophy, Filter, ShieldCheck, Zap, Flame, Award, Compass, ArrowUpRight, TrendingUp } from 'lucide-react';import { cn } from '@/lib/format'

export function ChallengesPage() {
  const { challenges, completions, destinations } = useApp()
  const [search, setSearch] = useState('')
  const [selectedDest, setSelectedDest] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const completedIds = completions
    .filter((c) => c.status === 'completed')
    .map((c) => c.challengeId)

  const inProgressIds = completions
    .filter((c) => c.status === 'in_progress')
    .map((c) => c.challengeId)

  const totalPoints = completions.reduce((sum, c) => sum + (c.pointsAwarded || 0), 1450)

  const categories = [
    { id: 'all', label: 'All Missions' },
    { id: 'waste', label: ' Zero Waste' },
    { id: 'transport', label: ' Low Carbon Transit' },
    { id: 'accessibility', label: ' Accessibility Audit' },
    { id: 'community', label: ' Local Support' },
  ]

  const filtered = challenges.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    const matchesDest = selectedDest === 'all' || c.destinationId === selectedDest
    const matchesDiff = selectedDifficulty === 'all' || c.difficulty.toLowerCase() === selectedDifficulty
    const matchesCat =
      selectedCategory === 'all' ||
      c.category?.toLowerCase().includes(selectedCategory) ||
      c.title.toLowerCase().includes(selectedCategory)
    return matchesSearch && matchesDest && matchesDiff && matchesCat
  })

  return (
    <div className="min-h-screen bg-[#f4f7f4] py-8 px-4 sm:px-6 lg:px-8 font-sans-ui text-forest-950">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ── 🌟 High-End Dark Forest Glass Hero Header ── */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-forest-950 via-forest-900 to-forest-950 text-white p-8 sm:p-10 shadow-xl border border-forest-800">
          
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                <Trophy className="w-4 h-4 text-amber-400" />
                Gamified Eco-Missions & Verified Impact
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                Eco-Challenges & Impact Quests
              </h1>

              <p className="text-sm sm:text-base text-forest-200/90 leading-relaxed">
                Complete location-specific sustainability missions, photo-verify trail improvements, earn impact points, and redeem exclusive local rewards.
              </p>
            </div>

            {/* User Level & Points Status Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/15 shadow-xl space-y-4 shrink-0 max-w-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-forest-950 flex items-center justify-center font-black text-xl shadow-md">
                    👑
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">TRAVELER RANK</span>
                    <h4 className="text-base font-bold text-white">Level 4 Eco Champion</h4>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-forest-200 font-semibold block">TOTAL IMPACT</span>
                  <span className="text-xl font-black text-amber-400">+{totalPoints.toLocaleString()} PTS</span>
                </div>
              </div>

              {/* Progress bar to next level */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-forest-200 font-medium">
                  <span>Level 4 Progress</span>
                  <span className="font-bold text-emerald-300">1,450 / 2,000 Pts</span>
                </div>
                <div className="w-full bg-forest-950/60 h-2.5 rounded-full overflow-hidden p-0.5 border border-forest-700">
                  <div className="bg-gradient-to-r from-emerald-400 to-amber-400 h-full rounded-full w-[72.5%] shadow-xs" />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── 📊 Vibrant Status KPI Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1 */}
          <div className="bg-white rounded-3xl border border-sand-200/80 p-6 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center border border-emerald-200 shrink-0">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-forest-950">{completedIds.length}</div>
              <div className="text-xs font-bold text-sand-600">Completed Missions</div>
              <div className="text-[11px] font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +2 Completed this week
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl border border-sand-200/80 p-6 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-amber-100/80 text-amber-900 flex items-center justify-center border border-amber-200 shrink-0">
              <Zap className="w-7 h-7 text-amber-600 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-black text-forest-950">+{totalPoints.toLocaleString()}</div>
              <div className="text-xs font-bold text-sand-600">Impact Points Earned</div>
              <div className="text-[11px] font-semibold text-amber-700 mt-0.5">Top 5% Eco Travelers</div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl border border-sand-200/80 p-6 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-orange-100/80 text-orange-900 flex items-center justify-center border border-orange-200 shrink-0">
              <Flame className="w-7 h-7 text-orange-600 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-black text-forest-950">7 Days</div>
              <div className="text-xs font-bold text-sand-600">Active Eco Streak</div>
              <div className="text-[11px] font-semibold text-orange-700 mt-0.5">🔥 2x Points Active</div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-3xl border border-sand-200/80 p-6 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-purple-100/80 text-purple-900 flex items-center justify-center border border-purple-200 shrink-0">
              <Award className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-forest-950">#14</div>
              <div className="text-xs font-bold text-sand-600">Global Leaderboard</div>
              <div className="text-[11px] font-semibold text-purple-700 mt-0.5">Matheran Sanctuary Hub</div>
            </div>
          </div>

        </div>

        {/* ── 🔍 Search & Category Filters Bar ── */}
        <div className="bg-white rounded-3xl border border-sand-200/80 p-6 sm:p-7 shadow-xs space-y-5">
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
              <input
                type="text"
                placeholder="Search eco-missions e.g. refill, plastic-free, train route, step-free..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-sand-50 border border-sand-200 rounded-2xl text-sm font-semibold text-forest-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
            </div>

            {/* Destination Selector */}
            <select
              value={selectedDest}
              onChange={(e) => setSelectedDest(e.target.value)}
              className="w-full md:w-auto px-4 py-3.5 bg-sand-50 border border-sand-200 rounded-2xl text-sm font-bold text-forest-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shrink-0"
            >
              <option value="all">📍 All Eco Destinations</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>📍 {d.name} ({d.region})</option>
              ))}
            </select>

          </div>

          {/* Difficulty & Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-sand-100 pt-4">
            
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                    selectedCategory === cat.id
                      ? 'bg-forest-900 text-white shadow-xs'
                      : 'bg-sand-100/70 text-sand-700 hover:bg-sand-200 hover:text-forest-950'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Difficulty Tabs */}
            <div className="flex items-center gap-1.5 shrink-0">
              {['all', 'easy', 'medium', 'hard'].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer',
                    selectedDifficulty === d
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-sand-50 border-sand-200 text-sand-700 hover:bg-sand-100'
                  )}
                >
                  {d === 'all' ? 'All Difficulties' : d}
                </button>
              ))}
            </div>

          </div>

        </div>

        {/* ── 🚀 Dynamic Challenge Cards Grid ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-base font-bold text-forest-950 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600" />
              Available Missions ({filtered.length})
            </h3>
            <span className="text-xs text-sand-500 font-semibold">
              Showing verified active sanctuary quests
            </span>
          </div>

          <div className="space-y-4">
            {filtered.map((challenge, index) => (
              <ChallengeCard
                key={challenge.id}
                id={challenge.id}
                title={challenge.title}
                description={challenge.description}
                icon={challenge.icon}
                category={challenge.category}
                difficulty={challenge.difficulty}
                points={challenge.points}
                estimatedMinutes={challenge.estimatedMinutes}
                isCompleted={completedIds.includes(challenge.id)}
                isRecommended={index === 0}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-sand-200/80 p-8 shadow-xs space-y-3">
              <div className="text-5xl mb-2">🏆</div>
              <h3 className="text-xl font-bold text-forest-950">No Missions Found</h3>
              <p className="text-sm text-sand-600 max-w-md mx-auto">
                Try adjusting your search criteria or switching target destinations.
              </p>
            </div>
          )}
        </div>

        {/* ── 🎁 Gamified Rewards Banner ── */}
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 rounded-3xl border border-amber-300/60 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-forest-950 flex items-center justify-center text-2xl font-black shadow-md shrink-0">
              🎖️
            </div>
            <div>
              <h4 className="font-serif text-lg font-bold text-forest-950">
                Unlock &ldquo;Eco Guardian&rdquo; Badge at 2,000 Impact Points
              </h4>
              <p className="text-xs text-sand-600 mt-0.5">
                Earn 550 more points to claim 20% off eco-homestays & free park electric shuttle passes.
              </p>
            </div>
          </div>

          <button
            onClick={() => alert('Redeeming impact points for park benefits...')}
            className="px-6 py-3 bg-forest-900 hover:bg-forest-950 text-white rounded-2xl font-bold text-xs shadow-md transition-all shrink-0 flex items-center gap-1.5"
          >
            View Reward Perks <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>

      </div>
    </div>
  )
}

export default ChallengesPage;
