"use client";

import { cn, getScoreColor, getScoreBg } from '@/lib/format'

interface SustainabilityScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function SustainabilityScore({
  score,
  size = 'md',
  showLabel = true,
  className,
}: SustainabilityScoreProps) {
  const circumference = 2 * Math.PI * 36
  const strokeDashoffset = circumference - (score / 100) * circumference

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-sand-200"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              'transition-all duration-1000 ease-out',
              score >= 80 ? 'text-green-500' :
              score >= 60 ? 'text-amber-500' :
              score >= 40 ? 'text-orange-500' : 'text-red-500'
            )}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', textSizes[size], getScoreColor(score))}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getScoreBg(score))}>
          Sustainability
        </span>
      )}
    </div>
  )
}
