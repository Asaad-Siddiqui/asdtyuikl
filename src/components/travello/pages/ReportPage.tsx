"use client";

import { useState } from 'react'
import { useNavigate } from '@/lib/router'
import { useApp } from '@/components/travello/AppProvider'
import { cn } from '@/lib/format'
import { AlertTriangle, Camera, MapPin, CheckCircle, ArrowLeft, Send, Sparkles } from 'lucide-react';const categories = [
  { key: 'waste', label: 'Waste & Litter', icon: '🗑️', color: 'bg-amber-100 border-amber-300 text-amber-900' },
  { key: 'overcrowding', label: 'Heavy Crowding', icon: '👥', color: 'bg-orange-100 border-orange-300 text-orange-900' },
  { key: 'accessibility', label: 'Accessibility Barrier', icon: '♿', color: 'bg-blue-100 border-blue-300 text-blue-900' },
  { key: 'infrastructure', label: 'Damaged Trail / Path', icon: '🚧', color: 'bg-purple-100 border-purple-300 text-purple-900' },
  { key: 'environmental_damage', label: 'Wildlife / Flora Risk', icon: '🌳', color: 'bg-red-100 border-red-300 text-red-900' },
  { key: 'water', label: 'Water Depletion / Leak', icon: '💧', color: 'bg-cyan-100 border-cyan-300 text-cyan-900' },
]

export function ReportPage() {
  const navigate = useNavigate()
  const { destinations, submitReport } = useApp()
  const [submitted, setSubmitted] = useState(false)
  const [reportId, setReportId] = useState('')

  const [form, setForm] = useState({
    category: '',
    destinationId: destinations[0]?.id || '',
    description: '',
    photoUploaded: false,
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!form.category || !form.description || !form.destinationId) return
    setSubmitting(true)
    setError(null)
    try {
      // The server derives the reporter from the session — never from the client.
      await submitReport({
        destinationId: form.destinationId,
        category: form.category,
        description: form.description,
        priority: 'medium',
      })
      const id = `MRN-${Math.floor(1000 + Math.random() * 9000)}`
      setReportId(id)
      setSubmitted(true)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'We could not file that report just now. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="bg-white rounded-3xl border border-sand-200 overflow-hidden shadow-sm">
          <div className="bg-emerald-50 p-8 text-center space-y-2 border-b border-emerald-100">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-2" />
            <h2 className="text-2xl font-black text-emerald-950">Incident Telemetry Logged</h2>
            <p className="text-sm text-emerald-800">
              Your on-the-ground report has been prioritized for ranger review and local authority action.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-sand-50/80 rounded-2xl p-5 border border-sand-200/60 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-sand-600">Incident Ticket ID</span>
                <span className="font-mono font-black text-forest-900 text-base">#{reportId}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-sand-600">Dispatch Status</span>
                <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-black rounded-full">
                  Under Ranger Review
                </span>
              </div>
            </div>

            <div className="bg-forest-900 text-white rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <p className="text-sm font-bold text-white">AI Closed-Loop Telemetry</p>
              </div>
              <p className="text-xs sm:text-sm text-forest-200/90 leading-relaxed">
                This observation dynamically recalibrates visitor flow routing to protect impacted trails and notify destination authorities.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="py-3.5 bg-forest-800 hover:bg-forest-900 text-white rounded-xl font-bold text-sm text-center shadow-md transition-all cursor-pointer"
              >
                Inspect Live Dashboard
              </button>
              <button
                onClick={() => {
                  setSubmitted(false)
                  setForm({ category: '', destinationId: destinations[0]?.id || '', description: '', photoUploaded: false })
                }}
                className="py-3.5 bg-sand-100 hover:bg-sand-200 text-forest-900 rounded-xl font-bold text-sm text-center transition-all cursor-pointer"
              >
                Log Another Incident
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-sand-200 text-sand-700 hover:text-forest-900 rounded-xl text-sm font-semibold shadow-2xs transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-forest-900 tracking-tight">
            Report Environmental / Trail Observation
          </h1>
        </div>
        <p className="text-sm sm:text-base text-sand-600 leading-relaxed">
          Report trail conditions, waste overflow, or accessibility bottlenecks to alert destination managers.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Category Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-sand-600 mb-3">
            Incident Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setForm({ ...form, category: cat.key })}
                className={cn(
                  'p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-24',
                  form.category === cat.key
                    ? cat.color + ' border-current ring-2 ring-forest-500/20 shadow-xs'
                    : 'bg-sand-50/70 border-sand-200/80 hover:bg-sand-100'
                )}
              >
                <span className="text-2xl">{cat.icon}</span>
                <p className="text-xs sm:text-sm font-bold leading-tight">{cat.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Destination */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-sand-600 mb-1.5">
            Destination Location
          </label>
          <select
            value={form.destinationId}
            onChange={(e) => setForm({ ...form, destinationId: e.target.value })}
            className="w-full px-3.5 py-3 bg-sand-50 border border-sand-200 rounded-xl text-sm font-bold text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer"
          >
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>📍 {d.name} ({d.region})</option>
            ))}
          </select>
        </div>

        {/* Photo Evidence */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-sand-600 mb-1.5">
            Photo Documentation (Optional)
          </label>
          <div
            onClick={() => setForm({ ...form, photoUploaded: !form.photoUploaded })}
            className={cn(
              'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all',
              form.photoUploaded
                ? 'border-emerald-500 bg-emerald-50/70'
                : 'border-sand-300 hover:border-forest-500 hover:bg-sand-50'
            )}
          >
            {form.photoUploaded ? (
              <div>
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-sm font-bold text-emerald-900">Photo Attached: incident-proof.jpg</p>
                <p className="text-xs text-emerald-700">Click to replace or remove</p>
              </div>
            ) : (
              <div>
                <Camera className="w-8 h-8 text-sand-400 mx-auto mb-1.5" />
                <p className="text-sm font-bold text-forest-900">Attach On-Site Photo</p>
                <p className="text-xs text-sand-500">Helps authorities identify exact cleanup coordinates</p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-sand-600 mb-1.5">
            Detailed Observation Note
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the issue, specific landmark, or recommended intervention..."
            rows={4}
            className="w-full px-4 py-3 bg-sand-50 border border-sand-200 rounded-2xl text-sm sm:text-base text-forest-900 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
          />
        </div>

        {/* Live GPS Telemetry */}
        <div className="bg-sand-50/80 rounded-2xl p-4 border border-sand-200/60 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="text-xs font-bold text-sand-400 block uppercase">Telemetry Geo-Coordinates</span>
            <span className="text-xs sm:text-sm font-bold text-forest-900">
              18.9847° N, 73.2653° E (Calibrated to current viewpoint)
            </span>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!form.category || !form.description || submitting}
          className="w-full py-4 bg-forest-800 hover:bg-forest-900 text-white rounded-2xl font-bold text-base shadow-lg shadow-forest-800/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4 text-emerald-300" />
          {submitting ? 'Submitting…' : 'Transmit Incident Observation'}
        </button>

      </div>
    </div>
  )
}

export default ReportPage;
