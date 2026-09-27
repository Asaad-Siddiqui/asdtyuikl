"use client";

import { Link } from '@/lib/router'
import { useApp } from '@/components/travello/AppProvider'
import { cn } from '@/lib/format'
import {
  Accessibility,
  Award,
  BarChart3,
  ChevronRight,
  ClipboardList,
  MapPin,
  Sparkles,
  TreePine,
  Trophy,
  Zap,
} from 'lucide-react'
import { PageHero, heroArt } from '@/components/travello/ui/PageKit'

const FALLBACK_ART =
  'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&h=600&fit=crop&auto=format'

export function ProfilePage() {
  const { user, destinations } = useApp()

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-5">
      
      <PageHero
        eyebrow="Your account"
        eyebrowIcon={Sparkles}
        title={`${user.displayName}`}
        subtitle="Your profile drives every itinerary we build — the places, the pace and the access needs all come from here."
        pills={[
          { icon: Zap, label: `${user.impactPoints.toLocaleString('en-IN')} impact points` },
          { icon: Award, label: `${user.badgesEarned} badges earned` },
        ]}
        image={heroArt(destinations, ['matheran', 'munnar', 'manali'], FALLBACK_ART)}
        scriptLines={['Travel Well', 'Travel Kind']}
        action={{ href: '/impact', label: 'See my impact' }}
      />

      {/* ── Profile Header Card ── */}
      <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-20 h-20 bg-gradient-to-br from-forest-700 to-forest-900 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-md shrink-0 ring-4 ring-emerald-500/20">
            {user.displayName.charAt(0)}
          </div>
          <div className="flex-1 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold mb-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Verified Eco Traveler • Level 3
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-forest-900">{user.displayName}</h1>
            <p className="text-xs sm:text-sm font-semibold text-emerald-700">{user.username}</p>
            <p className="text-xs sm:text-sm text-sand-600 pt-1 leading-relaxed">{user.bio}</p>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Impact Points', value: user.impactPoints, icon: Zap, color: 'text-amber-700 bg-amber-50' },
          { label: 'Badges Earned', value: user.badgesEarned, icon: Award, color: 'text-emerald-700 bg-emerald-50' },
          { label: 'Completed Missions', value: user.challengesCompleted, icon: Trophy, color: 'text-blue-700 bg-blue-50' },
          { label: 'Destinations', value: user.destinationsVisited, icon: MapPin, color: 'text-purple-700 bg-purple-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-sand-200 p-4 shadow-sm flex flex-col justify-between">
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2', stat.color)}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-forest-900">{stat.value}</div>
              <div className="text-xs font-bold text-sand-500 mt-0.5">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Navigation Menu ── */}
      <div className="bg-white rounded-3xl border border-sand-200 overflow-hidden shadow-sm">
        {[
          { label: 'My Impact & Leaderboard', path: '/impact', icon: BarChart3, sub: 'View badges & environmental impact' },
          { label: 'Eco Challenges & Missions', path: '/challenges', icon: Trophy, sub: 'Take action & earn rewards' },
          { label: 'Incident Reports & Telemetry', path: '/reports', icon: ClipboardList, sub: 'Report trail and waste issues' },
          { label: 'AI Smart Trip Planner', path: '/plan', icon: Sparkles, sub: 'Generate sustainable travel itineraries' },
          { label: 'Explore Verified Hubs', path: '/explore', icon: TreePine, sub: 'Inspect sustainability scores' },
          { label: 'Accessibility & Needs Profile', path: '/accessibility', icon: Accessibility, sub: 'Update the needs we plan around' },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-4 px-6 py-4.5 hover:bg-sand-50/80 transition-all border-b border-sand-100 last:border-0"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary-100 bg-primary-50 text-primary-700">
              <item.icon className="h-4.5 w-4.5" />
            </span>
            <div className="flex-1">
              <span className="text-sm sm:text-base font-bold text-forest-900 block">{item.label}</span>
              <span className="text-xs text-sand-500 font-medium">{item.sub}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-sand-400" />
          </Link>
        ))}
      </div>

      {/* Accessibility profile lives on its own screen so the questionnaire
          keeps its full-height conversational layout. */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-forest-700">
            <Accessibility className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-forest-950">
              Your accessibility & needs profile
            </h2>
            <p className="text-xs sm:text-sm text-sand-700 mt-0.5">
              These answers drive every itinerary we build for you. Update them any
              time — we plan around the latest version.
            </p>
          </div>
        </div>
        <Link
          to="/accessibility"
          className="shrink-0 px-5 py-3 bg-forest-800 hover:bg-forest-900 text-white rounded-xl text-xs font-bold text-center transition-colors"
        >
          Review my answers
        </Link>
      </div>
    </div>
  )
}

export default ProfilePage;
