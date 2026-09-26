"use client";

import { Link } from '@/lib/router'
import { cn } from '@/lib/format';import { Clock, Zap, ChevronRight, CheckCircle2, Sparkles, Users } from 'lucide-react';interface ChallengeCardProps {
  id: string
  title: string
  description: string
  icon: string
  category?: string
  difficulty: string
  points: number
  estimatedMinutes: number
  isCompleted?: boolean
  isRecommended?: boolean
  className?: string
}

export function ChallengeCard({
  id,
  title,
  description,
  icon,
  category,
  difficulty,
  points,
  estimatedMinutes,
  isCompleted,
  isRecommended,
  className,
}: ChallengeCardProps) {
  // Deterministic fake completed count for high-end feel
  const explorerCount = (title.length * 37) % 800 + 240

  return (
    <Link
      to={`/challenges/${id}`}
      className={cn(
        'group relative block bg-white rounded-3xl border border-sand-200/90 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden',
        isCompleted && 'bg-emerald-50/40 border-emerald-200/80 shadow-xs',
        isRecommended && 'ring-2 ring-emerald-500/80 ring-offset-2 shadow-md shadow-emerald-600/10',
        className
      )}
    >
      {/* Decorative top accent line */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all',
          isCompleted
            ? 'from-emerald-500 via-teal-400 to-emerald-600'
            : difficulty.toLowerCase() === 'easy'
            ? 'from-emerald-400 to-teal-500'
            : difficulty.toLowerCase() === 'medium'
            ? 'from-amber-400 to-orange-500'
            : 'from-purple-500 to-indigo-600'
        )}
      />

      <div className="flex items-start gap-4 sm:gap-6">
        
        {/* Dynamic Icon Badge Container */}
        <div
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-md group-hover:scale-105 transition-all duration-300 border',
            isCompleted
              ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-emerald-400'
              : difficulty.toLowerCase() === 'easy'
              ? 'bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-800 border-emerald-200'
              : difficulty.toLowerCase() === 'medium'
              ? 'bg-gradient-to-br from-amber-50 to-orange-100 text-amber-900 border-amber-200'
              : 'bg-gradient-to-br from-purple-50 to-indigo-100 text-purple-900 border-purple-200'
          )}
        >
          {icon}
        </div>

        {/* Challenge Info */}
        <div className="flex-1 min-w-0 space-y-2">
          
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif font-bold text-forest-950 text-lg group-hover:text-emerald-700 transition-colors">
              {title}
            </h3>

            {isRecommended && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-xs font-black rounded-full border border-emerald-300 shadow-2xs">
                <Sparkles className="w-3 h-3 text-amber-500" /> Recommended Mission
              </span>
            )}

            {isCompleted && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Completed
              </span>
            )}
          </div>

          <p className="text-sm text-sand-700 leading-relaxed line-clamp-2">
            {description}
          </p>

          {/* Meta Tags */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap pt-1">
            
            {/* Difficulty Badge */}
            <span
              className={cn(
                'px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] border shadow-2xs',
                difficulty.toLowerCase() === 'easy'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : difficulty.toLowerCase() === 'medium'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-purple-100 text-purple-900 border-purple-300'
              )}
            >
              {difficulty}
            </span>

            {/* Estimated Minutes */}
            <span className="flex items-center gap-1.5 text-sand-700 font-semibold bg-sand-100/80 px-3 py-1 rounded-full border border-sand-200">
              <Clock className="w-3.5 h-3.5 text-sand-500" />
              {estimatedMinutes} mins
            </span>

            {/* Impact Points Gold Chip */}
            <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-forest-950 font-black text-xs rounded-full shadow-xs">
              <Zap className="w-3.5 h-3.5 fill-current text-forest-950" />
              +{points} Impact Pts
            </span>

            {/* Explorer Count */}
            <span className="hidden md:flex items-center gap-1 text-sand-500 font-medium text-[11px] ml-auto">
              <Users className="w-3.5 h-3.5 text-sand-400" /> {explorerCount} Explorers Completed
            </span>
          </div>

        </div>

        {/* Right Action Button Arrow */}
        <div className="w-10 h-10 rounded-2xl bg-sand-100 group-hover:bg-emerald-600 group-hover:text-white text-sand-600 flex items-center justify-center transition-all duration-300 shrink-0 self-center shadow-xs">
          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </div>

      </div>
    </Link>
  )
}
