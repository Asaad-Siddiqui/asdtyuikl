"use client";

import { useState } from 'react'
import { useParams, useNavigate, Link } from '@/lib/router'
import { useApp } from '@/components/travello/AppProvider'
import { cn } from '@/lib/format'
import { Camera, MapPin, Clock, Upload, CheckCircle, XCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';type Step = 'upload' | 'review' | 'verifying' | 'result'

export function EvidencePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { challenges, completeChallenge } = useApp()

  const challenge = challenges.find((c) => c.id === id)
  const [step, setStep] = useState<Step>('upload')
  const [photoUploaded, setPhotoUploaded] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    passed: boolean
    checks: { label: string; passed: boolean }[]
  } | null>(null)

  if (!challenge) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-forest-800 mb-2">Challenge not found</h2>
        <Link to="/challenges" className="text-forest-600 hover:underline">Browse challenges</Link>
      </div>
    )
  }

  const handleUpload = () => {
    setPhotoUploaded(true)
    setStep('review')
  }

  const handleSubmit = () => {
    setStep('verifying')
    setTimeout(() => {
      const checks = [
        { label: 'Image visual content aligns with challenge objectives', passed: true },
        { label: 'GPS coordinates verify location within sanctuary zone', passed: true },
        { label: 'Live device timestamp authenticated', passed: true },
        { label: 'Photo clarity & anti-spoof checks passed', passed: true },
      ]
      setVerificationResult({ passed: true, checks })
      setStep('result')
      completeChallenge(challenge.id, {
        photoUrl: 'mock-photo.jpg',
        latitude: 18.9847,
        longitude: 73.2653,
        capturedAt: new Date().toISOString(),
      })
    }, 2500)
  }

  const now = new Date()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-sand-200 text-sand-700 hover:text-forest-900 rounded-xl text-sm font-semibold shadow-2xs transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Progress Stepper */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-sand-200 p-4 shadow-2xs">
        {['Upload', 'Review', 'Verify', 'Reward'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all',
              step === ['upload', 'review', 'verifying', 'result'][i]
                ? 'bg-forest-800 text-white shadow-sm'
                : i < ['upload', 'review', 'verifying', 'result'].indexOf(step)
                ? 'bg-emerald-600 text-white'
                : 'bg-sand-100 text-sand-500'
            )}>
              {i < ['upload', 'review', 'verifying', 'result'].indexOf(step) ? '✓' : i + 1}
            </div>
            <span className="text-xs sm:text-sm font-bold text-forest-900 hidden sm:block">{s}</span>
            {i < 3 && <div className="flex-1 h-1 bg-sand-100 rounded-full mx-1" />}
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-forest-900">Upload Challenge Evidence</h2>
            <p className="text-sm text-sand-600 mt-1">
              Target Challenge: <strong>{challenge.title}</strong> (+{challenge.points} pts)
            </p>
          </div>

          <div className="space-y-4">
            {/* Photo Upload Area */}
            <div
              onClick={handleUpload}
              className="border-2 border-dashed border-sand-300 rounded-3xl p-10 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
            >
              {photoUploaded ? (
                <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
              ) : (
                <div className="bg-sand-100 group-hover:bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors">
                  <Camera className="w-8 h-8 text-sand-600 group-hover:text-emerald-700 transition-colors" />
                </div>
              )}
              <p className="font-bold text-forest-900 text-base sm:text-lg">
                {photoUploaded ? 'Evidence Photo Attached!' : 'Tap to Take Photo or Choose File'}
              </p>
              <p className="text-xs sm:text-sm text-sand-500 mt-1">
                {photoUploaded ? 'evidence-capture.jpg (Verified EXIF)' : 'Geo-tagging and timestamp will be embedded automatically'}
              </p>
            </div>

            {/* Simulated Telemetry info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-sand-50/80 rounded-2xl p-4 border border-sand-200/60 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-sand-400 block uppercase">GPS Position</span>
                  <span className="text-xs sm:text-sm font-bold text-forest-900">18.9847° N, 73.2653° E</span>
                </div>
              </div>

              <div className="bg-sand-50/80 rounded-2xl p-4 border border-sand-200/60 flex items-center gap-3">
                <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-sand-400 block uppercase">Capture Time</span>
                  <span className="text-xs sm:text-sm font-bold text-forest-900">
                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Today
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('review')}
              disabled={!photoUploaded}
              className="w-full py-4 bg-forest-800 hover:bg-forest-900 text-white rounded-2xl font-bold text-base shadow-md disabled:opacity-40 transition-all cursor-pointer"
            >
              Continue to Review →
            </button>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-forest-900">Review Submission</h2>
            <p className="text-sm text-sand-600 mt-1">Please confirm details before AI verification.</p>
          </div>

          <div className="space-y-3">
            <div className="bg-sand-50/80 rounded-2xl p-4 border border-sand-200/60 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 shrink-0">
                <Camera className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-bold text-forest-900">Mission Photograph</p>
                <p className="text-xs text-sand-500">evidence-capture.jpg (High-Res 12MP)</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="bg-sand-50/80 rounded-2xl p-4 border border-sand-200/60 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-bold text-forest-900">Location Verification</p>
                <p className="text-xs text-sand-500">Matheran Eco-Zone Boundary (Passed)</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="bg-sand-50/80 rounded-2xl p-4 border border-sand-200/60 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-bold text-forest-900">Timestamp</p>
                <p className="text-xs text-sand-500">{now.toLocaleDateString()} {now.toLocaleTimeString()}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-5 h-5" />
            Run AI Verification & Claim +{challenge.points} Points
          </button>
        </div>
      )}

      {/* Step: Verifying */}
      {step === 'verifying' && (
        <div className="bg-white rounded-3xl border border-sand-200 p-12 text-center shadow-sm space-y-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-2">
            <Loader2 className="w-10 h-10 text-emerald-700 animate-spin" />
          </div>
          <h2 className="text-2xl font-black text-forest-900">AI Verification in Progress</h2>
          <p className="text-sm text-sand-600 max-w-sm mx-auto">
            Analyzing computer vision feature vectors, geospatial boundary markers, and camera metadata...
          </p>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && verificationResult && (
        <div className="bg-white rounded-3xl border border-sand-200 overflow-hidden shadow-sm">
          <div className={cn(
            'p-8 text-center',
            verificationResult.passed ? 'bg-emerald-50' : 'bg-red-50'
          )}>
            {verificationResult.passed ? (
              <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-3" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
            )}
            <h2 className="text-2xl sm:text-3xl font-black text-forest-900 mb-1">
              {verificationResult.passed ? 'Mission Approved & Verified!' : 'Verification Incomplete'}
            </h2>
            <p className="text-sm sm:text-base text-sand-700">
              {verificationResult.passed
                ? `You earned +${challenge.points} impact points toward your Level 3 badge!`
                : 'Evidence could not be authenticated. Please recapture photo on location.'}
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span className="text-base font-bold text-forest-900">Verification Inspection Log</span>
            </div>

            <div className="space-y-2.5">
              {verificationResult.checks.map((check) => (
                <div key={check.label} className="flex items-center gap-3 p-3 bg-sand-50/80 rounded-xl border border-sand-200/60 text-xs sm:text-sm">
                  {check.passed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  )}
                  <span className="font-semibold text-forest-900">{check.label}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                to="/challenges"
                className="py-3.5 bg-forest-800 hover:bg-forest-900 text-white rounded-xl font-bold text-sm text-center shadow-md transition-all"
              >
                Browse Next Challenge
              </Link>
              <Link
                to="/impact"
                className="py-3.5 bg-sand-100 hover:bg-sand-200 text-forest-900 rounded-xl font-bold text-sm text-center transition-all"
              >
                View Impact Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EvidencePage;
