"use client";

import { useApp } from '@/components/travello/AppProvider'
import { SustainabilityScore } from '@/components/travello/SustainabilityScore'
import { BadgeCard } from '@/components/travello/BadgeCard'
import { cn } from '@/lib/format';import { badges as allBadges } from '@/lib/travello-data';import { Zap, MapPin, Trophy, Leaf, Shield, Award, Flame } from 'lucide-react';export function ImpactPage() {
  const { user, completions, reports } = useApp()

  const recentActivity = [
    ...completions
      .filter((c) => c.status === 'completed')
      .map((c) => ({
        type: 'challenge' as const,
        icon: '🏆',
        text: `Completed Challenge`,
        points: c.pointsAwarded,
        date: c.completedAt || c.startedAt,
      })),
    ...reports.slice(0, 3).map((r) => ({
      type: 'report' as const,
      icon: '📋',
      text: `Reported ${r.category.replace('_', ' ')} observation`,
      points: 0,
      date: r.createdAt,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* ── Page Header ── */}
      <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-800">
            <Trophy className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-forest-900 tracking-tight">
            My Environmental & Community Impact
          </h1>
        </div>
        <p className="text-sm sm:text-base text-sand-600">
          Track your verified sustainability contributions, earned badges, and community leaderboard ranking.
        </p>
      </div>

      {/* ── Impact Hero Profile Card ── */}
      <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-center text-center shrink-0">
            <div className="relative mb-2">
              <SustainabilityScore score={Math.min(100, Math.round(user.impactPoints / 5))} size="lg" />
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Rank #2 Conscious Traveler
            </span>
          </div>

          <div className="flex-1 w-full space-y-5">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-black text-forest-900">{user.displayName}</h2>
                <span className="px-2.5 py-0.5 bg-forest-100 text-forest-800 rounded-full text-xs font-bold">
                  Level 3 Guardian
                </span>
              </div>
              <p className="text-sm text-sand-600 mt-1 leading-relaxed">{user.bio}</p>
            </div>

            {/* Quick 4 Stat Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Impact Points', value: user.impactPoints, icon: Zap, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                { label: 'Badges Earned', value: user.badgesEarned, icon: Award, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { label: 'Verified Missions', value: user.challengesCompleted, icon: Shield, color: 'text-blue-700 bg-blue-50 border-blue-200' },
                { label: 'CO₂ Diverted', value: `${user.co2Avoided} kg`, icon: Leaf, color: 'text-green-700 bg-green-50 border-green-200' },
              ].map((stat, i) => (
                <div key={i} className="bg-sand-50/80 rounded-2xl p-4 border border-sand-200/60 flex flex-col justify-between">
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2 border shadow-2xs', stat.color)}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-forest-900">{stat.value}</div>
                    <div className="text-xs font-bold text-sand-600 mt-0.5">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Content (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Impact Breakdown Cards */}
          <section className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-black text-forest-900">Contribution Breakdown</h2>
              <p className="text-sm text-sand-600 mt-0.5">Tangible environmental actions verified on-site.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Destinations Visited', value: user.destinationsVisited, icon: '🗺️', sub: 'Eco hubs logged' },
                { label: 'Local Businesses', value: 5, icon: '🏘️', sub: 'Homestays & guides' },
                { label: 'Reports Submitted', value: reports.length, icon: '📋', sub: 'Ranger notifications' },
                { label: 'Waste Actions', value: 3, icon: '♻️', sub: 'Cleanups & refills' },
                { label: 'Low-Impact Hikes', value: 3, icon: '🚶', sub: 'Zero-emission legs' },
                { label: 'Accessibility Audits', value: 1, icon: '♿', sub: 'Wheelchair verification' },
              ].map((item, i) => (
                <div key={i} className="bg-sand-50/80 rounded-2xl p-4.5 border border-sand-200/60 text-center flex flex-col items-center justify-center">
                  <span className="text-3xl mb-1">{item.icon}</span>
                  <div className="text-2xl font-black text-forest-900">{item.value}</div>
                  <div className="text-xs font-bold text-forest-800 mt-0.5">{item.label}</div>
                  <div className="text-[11px] text-sand-500">{item.sub}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Activity Timeline */}
          <section className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-forest-900">Recent Verified Activities</h2>
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-sand-200">
              {recentActivity.map((activity, i) => (
                <div key={i} className="relative flex items-center gap-4">
                  <div className="absolute -left-6 w-6 h-6 bg-white border-2 border-emerald-500 rounded-full flex items-center justify-center text-xs shrink-0 shadow-sm">
                    {activity.icon}
                  </div>
                  <div className="flex-1 bg-sand-50/80 rounded-2xl p-4 border border-sand-200/60 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-forest-900">{activity.text}</p>
                      <p className="text-xs text-sand-500 mt-0.5">
                        {new Date(activity.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    {activity.points > 0 && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
                        +{activity.points} pts
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {recentActivity.length === 0 && (
                <p className="text-sm text-sand-500 text-center py-6">No activity recorded yet.</p>
              )}
            </div>
          </section>

        </div>

        {/* Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Badges Showcase */}
          <section className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-sand-100 pb-3">
              <h3 className="text-base font-bold text-forest-900">Eco Badges ({allBadges.filter(b => b.earned).length}/{allBadges.length})</h3>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                Unlocked
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {allBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </section>

          {/* Regional Leaderboard */}
          <section className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-sand-100 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-forest-900">Regional Leaderboard</h3>
              </div>
              <span className="text-xs font-bold text-sand-500">Maharashtra</span>
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'Sneha Patel', points: 650, rank: 1, avatar: 'SP' },
                { name: user.displayName, points: user.impactPoints, rank: 2, isUser: true, avatar: 'AS' },
                { name: 'Arjun Mehta', points: 380, rank: 3, avatar: 'AM' },
                { name: 'Riya Gupta', points: 290, rank: 4, avatar: 'RG' },
                { name: 'Karan Singh', points: 210, rank: 5, avatar: 'KS' },
              ].map((entry) => (
                <div
                  key={entry.rank}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-2xl border transition-all',
                    entry.isUser
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-sand-50/60 border-sand-200/60 hover:bg-sand-50'
                  )}
                >
                  <span className={cn(
                    'w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black',
                    entry.rank === 1 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                    entry.rank === 2 ? 'bg-emerald-600 text-white shadow-xs' :
                    entry.rank === 3 ? 'bg-orange-400 text-orange-950 shadow-xs' :
                    'bg-sand-200 text-sand-700'
                  )}>
                    {entry.rank}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-forest-900 truncate">
                      {entry.name} {entry.isUser && '(You)'}
                    </p>
                  </div>

                  <span className="text-xs font-black text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-sand-200 shrink-0">
                    {entry.points} pts
                  </span>
                </div>
              ))}
            </div>
          </section>

        </div>

      </div>
    </div>
  )
}

export default ImpactPage;
