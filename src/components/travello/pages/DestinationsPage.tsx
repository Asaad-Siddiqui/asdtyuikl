"use client";

import { useState } from 'react'
import { useApp } from '@/components/travello/AppProvider'
import { DestinationCard } from '@/components/travello/DestinationCard'
import { Search, Filter, Compass } from 'lucide-react';import { cn } from '@/lib/format'

export function DestinationsPage() {
  const { destinations } = useApp()
  const [search, setSearch] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  const filters = [
    { key: 'all', label: 'All Destinations' },
    { key: 'hill-station', label: '🌲 Hill Stations' },
    { key: 'beach', label: '🏖️ Coastal & Beaches' },
    { key: 'mountains', label: '⛰️ Mountain Hubs' },
    { key: 'accessible', label: '♿ Step-Free Accessible' },
    { key: 'eco', label: '🌱 High Eco-Score (75+)' },
  ]

  const filteredDestinations = destinations.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.region.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      selectedFilter === 'all' ||
      d.tags.some((t) => t.toLowerCase().includes(selectedFilter.toLowerCase())) ||
      (selectedFilter === 'accessible' && d.accessibility.wheelchairAccessible) ||
      (selectedFilter === 'eco' && d.sustainabilityScore >= 75)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800">
            <Compass className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-forest-900 tracking-tight">
            Explore Eco-Verified Destinations
          </h1>
        </div>
        <p className="text-sm sm:text-base text-sand-600 max-w-3xl leading-relaxed">
          Discover certified travel hubs graded with real-time visitor pressure, waste management efficiency, water strain, and accessibility infrastructure.
        </p>
      </div>

      {/* Search and Filter Chips */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
          <input
            type="text"
            placeholder="Search by destination name, state, ecosystem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-sand-200 rounded-2xl text-sm sm:text-base text-forest-900 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-forest-500 shadow-sm transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setSelectedFilter(f.key)}
              className={cn(
                'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border cursor-pointer',
                selectedFilter === f.key
                  ? 'bg-forest-800 text-white border-forest-800 shadow-sm'
                  : 'bg-white border-sand-200 text-sand-700 hover:bg-sand-50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Destination Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDestinations.map((dest, i) => (
          <div key={dest.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <DestinationCard destination={dest} />
          </div>
        ))}
      </div>

      {filteredDestinations.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-sand-200 p-8 shadow-sm">
          <div className="text-5xl mb-3">🌍</div>
          <h3 className="text-xl font-bold text-forest-900 mb-1">No destinations match your criteria</h3>
          <p className="text-sm text-sand-600">Try adjusting your keyword search or clearing your active filter.</p>
        </div>
      )}
    </div>
  )
}

export default DestinationsPage;
