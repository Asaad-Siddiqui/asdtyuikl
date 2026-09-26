"use client";

import { useState } from 'react'
import { Link } from '@/lib/router'
import { MapPin, Users, Leaf, ArrowRight, ShieldCheck } from 'lucide-react'
import { cn, getScoreColor } from '@/lib/format'
import type { Destination } from '@/types'

interface DestinationCardProps {
  destination: Destination
  className?: string
}

export function DestinationCard({ destination, className }: DestinationCardProps) {
  const [imgError, setImgError] = useState(false)

  const gradientMap: Record<string, string> = {
    matheran: 'from-emerald-600 to-teal-800',
    goa: 'from-sky-500 to-blue-700',
    manali: 'from-indigo-600 to-purple-800',
  }

  const hasImage = destination.image && !imgError

  return (
    <Link
      to={`/explore/${destination.id}`}
      className={cn(
        'group flex flex-col bg-white rounded-2xl border border-sand-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
        className
      )}
    >
      {/* Image Banner */}
      <div className={cn(
        'h-52 relative overflow-hidden bg-sand-100',
        !hasImage && 'bg-gradient-to-br',
        !hasImage && (gradientMap[destination.id] || 'from-forest-600 to-forest-800')
      )}>
        {hasImage && (
          <img
            src={destination.image}
            alt={destination.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        
        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-1 bg-black/40 backdrop-blur-md text-white/95 rounded-full text-xs font-semibold border border-white/20 flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified Eco Hub
          </span>
          <span className={cn(
            'px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-xs font-bold shadow-md flex items-center gap-1',
            getScoreColor(destination.sustainabilityScore)
          )}>
            🌱 {destination.sustainabilityScore}/100
          </span>
        </div>

        {/* Bottom Destination Info */}
        <div className="absolute bottom-3.5 left-4 right-4 text-white">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-0.5 drop-shadow-md">{destination.name}</h3>
          <div className="flex items-center gap-1.5 text-white/90 text-sm font-medium drop-shadow">
            <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>{destination.region}, {destination.country}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-sm text-sand-700 leading-relaxed line-clamp-2 mb-4">
            {destination.description}
          </p>

          {/* Condition Indicators */}
          <div className="grid grid-cols-2 gap-2 p-2.5 bg-sand-50/80 rounded-xl border border-sand-200/60 mb-4">
            <div className="flex items-center gap-2 text-xs">
              <Users className="w-4 h-4 text-sand-500 shrink-0" />
              <div>
                <span className="text-sand-500 block leading-none mb-0.5">Crowd Pressure</span>
                <span className={cn(
                  'font-semibold',
                  destination.visitorPressure === 'High' || destination.visitorPressure === 'Very High'
                    ? 'text-red-600'
                    : destination.visitorPressure === 'Medium'
                    ? 'text-amber-600'
                    : 'text-green-600'
                )}>
                  {destination.visitorPressure}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Leaf className="w-4 h-4 text-sand-500 shrink-0" />
              <div>
                <span className="text-sand-500 block leading-none mb-0.5">Sensitivity</span>
                <span className="font-semibold text-forest-700">
                  {destination.environmentalSensitivity}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tags and CTA */}
        <div className="pt-2 border-t border-sand-100 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {destination.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2.5 py-0.5 bg-sand-100/90 text-sand-700 text-xs rounded-lg font-medium capitalize">
                {tag.replace('-', ' ')}
              </span>
            ))}
          </div>

          <span className="text-xs font-bold text-forest-600 group-hover:text-forest-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
            Explore <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
