"use client";

import { cn } from '@/lib/format'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon = '🌍', title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-forest-800 mb-2">{title}</h3>
      <p className="text-sm text-sand-600 max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-forest-600 text-white rounded-xl text-sm font-semibold hover:bg-forest-700 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
