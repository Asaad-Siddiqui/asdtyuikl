"use client";

import { useState } from 'react'
import { useApp } from '@/components/travello/AppProvider'
import { SustainabilityScore } from '@/components/travello/SustainabilityScore'
import { ReportCard } from '@/components/travello/ReportCard'
import { cn } from '@/lib/format';import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Line, AreaChart, Area } from 'recharts';import { LayoutDashboard, AlertTriangle, TrendingUp, Sparkles, CheckCircle2, ChevronRight, Filter, ShieldCheck, Download } from 'lucide-react';const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4']

export function DashboardPage() {
  const { destinations, reports, aiInsights, challenges, completions } = useApp()
  const [selectedDest, setSelectedDest] = useState('matheran')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')

  const destination = destinations.find((d) => d.id === selectedDest)
  const destReports = reports.filter((r) => r.destinationId === selectedDest)
  const destInsights = aiInsights.filter((i) => i.destinationId === selectedDest)

  const filteredReports = destReports.filter((r) =>
    selectedCategoryFilter === 'all' ? true : r.category === selectedCategoryFilter
  )

  const categoryData = destReports.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(categoryData).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }))

  const trendData = [
    { day: 'Mon', reports: 4, resolved: 3, visitors: 420 },
    { day: 'Tue', reports: 6, resolved: 5, visitors: 480 },
    { day: 'Wed', reports: 3, resolved: 4, visitors: 390 },
    { day: 'Thu', reports: 8, resolved: 6, visitors: 560 },
    { day: 'Fri', reports: 5, resolved: 5, visitors: 710 },
    { day: 'Sat', reports: 12, resolved: 8, visitors: 1250 },
    { day: 'Sun', reports: 9, resolved: 9, visitors: 980 },
  ]

  const openCount = destReports.filter((r) => r.status !== 'resolved').length
  const resolvedCount = destReports.filter((r) => r.status === 'resolved').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* ── Top Dashboard Header & Controls ── */}
      <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 bg-forest-100 rounded-xl flex items-center justify-center text-forest-700">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-forest-900 tracking-tight">
              Destination Management Dashboard
            </h1>
          </div>
          <p className="text-sm sm:text-base text-sand-600">
            Real-time environmental telemetry, visitor density telemetry, and incident response.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedDest}
              onChange={(e) => setSelectedDest(e.target.value)}
              className="pl-4 pr-10 py-3 bg-sand-50 border border-sand-200 rounded-xl text-sm font-bold text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-500 shadow-2xs appearance-none cursor-pointer"
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  📍 {d.name} ({d.region})
                </option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-sand-500 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
          </div>

          <button
            onClick={() => alert('Executive destination sustainability report exported (PDF/CSV ready).')}
            className="px-4 py-3 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Telemetry
          </button>
        </div>
      </div>

      {destination && (
        <div className="space-y-8">
          
          {/* ── Key Metrics KPI Grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Sustainability Score KPI */}
            <div className="bg-white rounded-2xl border border-sand-200 p-5 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1 shadow-sm">
              <SustainabilityScore score={destination.sustainabilityScore} size="md" />
              <p className="text-xs font-bold text-sand-600 mt-2">Overall Eco Health</p>
            </div>

            {[
              {
                label: 'Active Open Issues',
                value: openCount,
                sub: 'Requires Ranger Review',
                icon: AlertTriangle,
                color: 'text-red-600',
                bg: 'bg-red-50 border-red-100',
              },
              {
                label: 'Issues Resolved',
                value: resolvedCount,
                sub: `${Math.round((resolvedCount / (destReports.length || 1)) * 100)}% resolution rate`,
                icon: CheckCircle2,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50 border-emerald-100',
              },
              {
                label: 'Verified Actions',
                value: completions.filter((c) => c.status === 'completed').length,
                sub: 'Completed by Travelers',
                icon: ShieldCheck,
                color: 'text-blue-600',
                bg: 'bg-blue-50 border-blue-100',
              },
              {
                label: 'Active AI Insights',
                value: destInsights.length,
                sub: 'Crowd & Waste alerts',
                icon: Sparkles,
                color: 'text-purple-600',
                bg: 'bg-purple-50 border-purple-100',
              },
            ].map((stat, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-2xl border p-5 bg-white shadow-sm flex flex-col justify-between transition-all hover:shadow-md'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', stat.bg)}>
                    <stat.icon className={cn('w-5 h-5', stat.color)} />
                  </div>
                  <span className="text-xs font-bold text-sand-400">Live</span>
                </div>
                <div>
                  <div className="text-3xl font-black text-forest-900 tracking-tight">{stat.value}</div>
                  <div className="text-sm font-bold text-forest-800 mt-0.5">{stat.label}</div>
                  <div className="text-xs text-sand-500 mt-0.5">{stat.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Main Content & Visual Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left 8 Cols: Charts & Incident Feed */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Category Distribution Chart */}
                <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-forest-900">Issue Category Breakdown</h3>
                      <p className="text-xs text-sand-500">Aggregated traveler reports</p>
                    </div>
                  </div>

                  {pieData.length > 0 ? (
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                            label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          >
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: '12px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e1d5',
                              fontSize: '13px',
                              fontWeight: '600',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-sm text-sand-500">
                      No reports registered
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-sand-100">
                    {pieData.map((entry, i) => (
                      <span key={entry.name} className="flex items-center gap-1.5 text-xs text-sand-600 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {entry.name} ({entry.value})
                      </span>
                    ))}
                  </div>
                </div>

                {/* 7-Day Trend Line Chart */}
                <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-forest-900">Weekly Incident vs Resolution</h3>
                      <p className="text-xs text-sand-500">Daily telemetry trends</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                      +14% vs Last Wk
                    </span>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f2f0ea" />
                        <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6c5e4e', fontWeight: 600 }} />
                        <YAxis tick={{ fontSize: 12, fill: '#6c5e4e', fontWeight: 600 }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e1d5',
                            fontSize: '13px',
                          }}
                        />
                        <Area type="monotone" dataKey="reports" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReports)" name="Reports Submitted" />
                        <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorResolved)" name="Issues Resolved" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center justify-between text-xs text-sand-500 pt-2 border-t border-sand-100">
                    <span className="flex items-center gap-1.5 text-red-600 font-bold">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full" /> Reports Logged
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Ranger Action Taken
                    </span>
                  </div>
                </div>

              </div>

              {/* Recent Incident Reports Feed */}
              <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-forest-900">Recent Incident Reports</h3>
                    <p className="text-sm text-sand-600">Crowdsourced traveler feedback with GPS coordinates</p>
                  </div>

                  {/* Filter chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {['all', 'waste', 'overcrowding', 'infrastructure', 'accessibility'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={cn(
                          'px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all',
                          selectedCategoryFilter === cat
                            ? 'bg-forest-800 text-white'
                            : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3.5">
                  {filteredReports.map((report) => (
                    <ReportCard
                      key={report.id}
                      id={report.id}
                      category={report.category}
                      description={report.description}
                      status={report.status}
                      priority={report.priority}
                      createdAt={report.createdAt}
                    />
                  ))}

                  {filteredReports.length === 0 && (
                    <div className="text-center py-12 bg-sand-50 rounded-2xl border border-sand-200/60">
                      <p className="text-sm font-semibold text-sand-600">No reports found for this filter.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right 4 Cols: AI Insights & Recommended Authority Actions */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* AI Insights Panel */}
              <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-forest-900">AI Intelligence Insights</h3>
                    <p className="text-xs text-sand-500">Autonomous pattern recognition</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {destInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className={cn(
                        'rounded-2xl p-4.5 border transition-all',
                        insight.severity === 'critical'
                          ? 'bg-red-50/70 border-red-200'
                          : insight.severity === 'high'
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-blue-50/70 border-blue-200'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider',
                          insight.severity === 'critical' ? 'bg-red-200 text-red-900' :
                          insight.severity === 'high' ? 'bg-amber-200 text-amber-900' :
                          'bg-blue-200 text-blue-900'
                        )}>
                          {insight.type.replace('_', ' ')}
                        </span>
                        {insight.reportCount && (
                          <span className="text-xs font-bold text-sand-500">
                            {insight.reportCount} reports
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-forest-900 mb-1 leading-snug">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-sand-700 leading-relaxed mb-3">
                        {insight.description}
                      </p>

                      {insight.trend && (
                        <p className="text-xs font-bold text-sand-600 mb-2.5 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-forest-600" />
                          Trend: {insight.trend}
                        </p>
                      )}

                      <div className="bg-white/90 rounded-xl p-3 border border-sand-200/60 shadow-2xs">
                        <p className="text-xs font-bold text-forest-900 mb-0.5">💡 Recommended Directive:</p>
                        <p className="text-xs text-forest-700 font-medium leading-relaxed">
                          {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}

                  {destInsights.length === 0 && (
                    <p className="text-sm text-sand-500 text-center py-6">All systems normal. No active anomalies.</p>
                  )}
                </div>
              </div>

              {/* Recommended Authority Actions */}
              <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-forest-900">Priority Action Items</h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Ranger Queue
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { text: 'Increase waste collection near Sunset Point & Echo Point viewpoints', priority: 'high' },
                    { text: 'Broadcast push notification to promote Forest View Trail alternative', priority: 'medium' },
                    { text: 'Audit accessibility ramp and tactile path at north toy train entrance', priority: 'high' },
                    { text: 'Deploy water refill station maintenance unit near market center', priority: 'medium' },
                  ].map((action, i) => (
                    <div key={i} className="p-3.5 bg-sand-50 hover:bg-sand-100/80 rounded-2xl border border-sand-200/60 flex items-start gap-3 transition-colors">
                      <span className={cn(
                        'w-2.5 h-2.5 rounded-full mt-1.5 shrink-0',
                        action.priority === 'high' ? 'bg-red-500' : 'bg-amber-500'
                      )} />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-forest-900 leading-snug">{action.text}</p>
                        <span className="text-[11px] font-bold text-sand-400 capitalize mt-1 inline-block">
                          {action.priority} Priority
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Challenge & Traveler Engagement Impact */}
              <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-forest-900">Community Engagement</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-sand-100 text-sm">
                    <span className="font-medium text-sand-600">Active Challenges</span>
                    <span className="font-bold text-forest-900">{challenges.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-sand-100 text-sm">
                    <span className="font-medium text-sand-600">Verified Completions</span>
                    <span className="font-bold text-emerald-600">{completions.filter((c) => c.status === 'completed').length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-sand-100 text-sm">
                    <span className="font-medium text-sand-600">Impact Points Distributed</span>
                    <span className="font-bold text-amber-600">
                      {completions.reduce((sum, c) => sum + c.pointsAwarded, 0)} pts
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage;
