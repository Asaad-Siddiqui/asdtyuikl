"use client";

import { cn } from '@/lib/format'
import { Clock, AlertTriangle, Recycle, Users, Accessibility, Wrench, Droplets } from 'lucide-react';import { formatDistanceToNow } from 'date-fns'

interface ReportCardProps {
  id: string
  category: string
  description: string
  status: string
  priority: string
  createdAt: string
  className?: string
}

const categoryConfig: Record<string, { icon: typeof AlertTriangle; label: string; color: string }> = {
  waste: { icon: Recycle, label: 'Waste Management', color: 'bg-amber-100/80 text-amber-800 border-amber-200' },
  overcrowding: { icon: Users, label: 'Overcrowding', color: 'bg-orange-100/80 text-orange-800 border-orange-200' },
  accessibility: { icon: Accessibility, label: 'Accessibility', color: 'bg-blue-100/80 text-blue-800 border-blue-200' },
  infrastructure: { icon: Wrench, label: 'Infrastructure', color: 'bg-purple-100/80 text-purple-800 border-purple-200' },
  environmental_damage: { icon: AlertTriangle, label: 'Environmental', color: 'bg-red-100/80 text-red-800 border-red-200' },
  water: { icon: Droplets, label: 'Water Issue', color: 'bg-cyan-100/80 text-cyan-800 border-cyan-200' },
}

const statusColors: Record<string, string> = {
  submitted: 'bg-sand-100 text-sand-700 border-sand-200',
  under_review: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-amber-100 text-amber-800 border-amber-200',
  in_progress: 'bg-orange-100 text-orange-800 border-orange-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

const priorityColors: Record<string, string> = {
  low: 'bg-sand-100 text-sand-700 border-sand-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
}

export function ReportCard({ id, category, description, status, priority, createdAt, className }: ReportCardProps) {
  const cat = categoryConfig[category] || { icon: AlertTriangle, label: category.replace('_', ' '), color: 'bg-gray-100 text-gray-800 border-gray-200' }
  const Icon = cat.icon

  return (
    <div className={cn('bg-white rounded-2xl border border-sand-200 p-4.5 hover:shadow-md transition-all duration-200', className)}>
      <div className="flex items-start gap-3.5">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border', cat.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={cn('px-2.5 py-0.5 rounded-md text-xs font-bold border', cat.color)}>
              {cat.label}
            </span>
            <span className={cn('px-2.5 py-0.5 rounded-md text-xs font-semibold border capitalize', statusColors[status] || 'bg-gray-100 text-gray-700 border-gray-200')}>
              {status.replace('_', ' ')}
            </span>
            <span className={cn('px-2.5 py-0.5 rounded-md text-xs font-semibold border uppercase', priorityColors[priority] || 'bg-sand-100 text-sand-700 border-sand-200')}>
              {priority} Priority
            </span>
          </div>
          <p className="text-sm text-sand-800 leading-relaxed line-clamp-2 mb-2.5">{description}</p>
          <div className="flex items-center gap-3 text-xs text-sand-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sand-400" />
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
            <span className="font-mono text-sand-500 bg-sand-100/80 px-2 py-0.5 rounded text-[11px] font-semibold">#{id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
