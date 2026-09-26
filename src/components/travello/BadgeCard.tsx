"use client";

import { cn } from '@/lib/format'
import type { Badge } from '@/types'

interface BadgeCardProps {
  badge: Badge
  className?: string
}

export function BadgeCard({ badge, className }: BadgeCardProps) {
  return (
    <div
      className={cn(
        'group flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-300 text-center',
        badge.earned
          ? 'bg-white border-forest-200/80 shadow-sm hover:shadow-md hover:border-forest-300'
          : 'bg-sand-50/70 border-sand-200 opacity-60 grayscale hover:opacity-80',
        className
      )}
    >
      <div className="text-3.5xl mb-1.5 group-hover:scale-110 transition-transform duration-300">
        {badge.icon}
      </div>
      <span className="text-xs font-bold text-forest-900 leading-tight mb-1">
        {badge.name}
      </span>
      {badge.earned ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
          Earned
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-sand-100 text-sand-500">
          Locked
        </span>
      )}
    </div>
  )
}
