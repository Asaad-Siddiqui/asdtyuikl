"use client";

import { cn, getPressureColor } from '@/lib/format'

interface PressureBadgeProps {
  label: string
  level: string
  className?: string
}

export function PressureBadge({ label, level, className }: PressureBadgeProps) {
  return (
    <div className={cn('flex items-center justify-between p-3 bg-white rounded-xl border border-sand-200', className)}>
      <span className="text-sm font-medium text-sand-700">{label}</span>
      <span
        className={cn(
          'px-3 py-1 rounded-full text-xs font-semibold',
          getPressureColor(level)
        )}
      >
        {level.toUpperCase()}
      </span>
    </div>
  )
}
