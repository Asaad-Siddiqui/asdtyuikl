"use client";

import { useState } from 'react'
import { Link, useNavigate } from '@/lib/router'
import { useApp } from '@/components/travello/AppProvider'
import { Leaf, Users, Droplets, Accessibility, Sprout, ArrowRight, Play, Star, ChevronRight, Compass, Building2, AlertTriangle, Trophy, Eye, Bot, MapPin, Bus, Utensils, Car, Check, Building, Mountain, BarChart3, ArrowUpRight } from 'lucide-react';import { cn } from '@/lib/format'
import { destinations } from '@/lib/travello-data'

export function LandingPage() {
  const { user, challenges, startChallenge } = useApp()
  const navigate = useNavigate()
  const [challengeStarted, setChallengeStarted] = useState(false)

  const todayChallenge = challenges[0] || {
    id: 'c1',
    title: 'Carry & use a reusable bag',
    description: 'Avoid single-use plastic.',
    points: 20,
    estimatedMinutes: 5,
    difficulty: 'easy',
  }

  const handleStartChallenge = () => {
    if (todayChallenge?.id) {
      startChallenge(todayChallenge.id)
      setChallengeStarted(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f2f6f3] via-[#f7f9f7] to-[#eef3ef] py-6 sm:py-10 px-3 sm:px-6 lg:px-8 font-sans-ui text-forest-950">
      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-14">

        {/* ── 1. HERO SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
          
          {/* Left Column: Purpose Headline & CTAs */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 pr-0 lg:pr-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Green & Inclusive Travel Platform
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-forest-950 leading-[1.15]">
                Travel with purpose.{' '}
                <span className="text-emerald-700 block font-normal italic">
                  Leave a lighter footprint behind.
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-sand-700 max-w-xl leading-relaxed font-normal">
                Discover destinations with real-time sustainability insights, plan accessible journeys, complete eco-challenges and support local communities.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/plan"
                className="px-6 py-3.5 bg-forest-800 hover:bg-forest-900 text-white font-bold rounded-xl shadow-lg shadow-forest-900/20 hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-sm sm:text-base group"
              >
                Plan Your Trip
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={() => navigate('/explore/matheran')}
                className="px-6 py-3.5 bg-white/90 border border-sand-300/80 hover:bg-white text-forest-900 font-bold rounded-xl transition-all duration-200 flex items-center gap-2 text-sm sm:text-base shadow-2xs hover:shadow-md"
              >
                <Play className="w-4 h-4 fill-forest-900 text-forest-900" />
                Explore Live Demo
              </button>
            </div>

            {/* Rating / Social Proof */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center -space-x-2.5">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                  alt="Explorer"
                  className="w-9 h-9 rounded-full ring-2 ring-white object-cover shadow-xs"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                  alt="Explorer"
                  className="w-9 h-9 rounded-full ring-2 ring-white object-cover shadow-xs"
                />
                <img
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
                  alt="Explorer"
                  className="w-9 h-9 rounded-full ring-2 ring-white object-cover shadow-xs"
                />
                <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-xs">
                  12K+
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm font-black text-forest-950">4.9/5</span>
                </div>
                <p className="text-xs text-sand-600 font-medium mt-0.5">
                  Trusted by 12,000+ conscious explorers & 45 park authorities
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Featured Destination Live Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="absolute -top-6 right-0 sm:-right-6 w-32 h-32 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-6 left-0 sm:-left-6 w-36 h-36 bg-forest-300/30 rounded-full blur-2xl pointer-events-none" />

            {/* Main Featured Hero Card */}
            <div className="relative rounded-3xl overflow-hidden border border-emerald-900/10 shadow-2xl bg-forest-950 text-white">
              
              <div className="relative h-[340px] sm:h-[380px] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1000&h=700&fit=crop&auto=format"
                  alt="Matheran Eco-Zone"
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/40 to-black/20" />

                <div className="absolute top-4 left-4">
                  <div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-forest-950 text-xs font-bold flex items-center gap-2 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Health Monitoring
                  </div>
                </div>

                <div className="absolute bottom-28 left-6 right-6 space-y-1">
                  <span className="text-[10px] font-extrabold tracking-widest text-emerald-300 uppercase">
                    FEATURED DESTINATION
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Matheran Eco-Zone
                  </h2>
                  <p className="text-xs sm:text-sm text-sand-200/90 font-medium">
                    Maharashtra, India • Asia&apos;s only automobile-free hill station
                  </p>
                </div>
              </div>

              {/* Integrated Metrics Overlay Panel */}
              <div className="p-4 sm:p-5 bg-forest-900/95 backdrop-blur-xl border-t border-white/10 space-y-3">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  
                  {/* Eco Score */}
                  <div className="bg-forest-950/80 rounded-2xl p-2.5 sm:p-3 border border-emerald-500/20 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">ECO SCORE</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black ring-1 ring-emerald-400/40">
                        82
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-white block leading-none">82</span>
                        <span className="text-[10px] font-semibold text-emerald-400 block">Excellent</span>
                      </div>
                    </div>
                  </div>

                  {/* Crowd Status */}
                  <div className="bg-forest-950/80 rounded-2xl p-2.5 sm:p-3 border border-amber-500/20 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">CROWD STATUS</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-white block leading-none">Moderate</span>
                        <span className="text-[10px] font-semibold text-amber-300 block">68%</span>
                      </div>
                    </div>
                  </div>

                  {/* Impact Points */}
                  <div className="bg-forest-950/80 rounded-2xl p-2.5 sm:p-3 border border-emerald-500/20 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">IMPACT POINTS</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">
                        <Sprout className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-white block leading-none">+50</span>
                        <span className="text-[10px] font-semibold text-emerald-300 block">Today</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-950/90 rounded-2xl p-3 border border-emerald-500/30 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-emerald-100/90 leading-relaxed">
                    <strong className="text-emerald-300 font-bold">AI Recommendation:</strong>{' '}
                    Sunset Point is crowded (+200 visitors). Head to Panorama Trail for a 42% lower footfall & +30 impact points
                  </div>
                </div>
              </div>

              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 px-3 shadow-xl border border-sand-200 flex items-center gap-2 animate-bounce-slow">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                  🏆
                </div>
                <div>
                  <p className="text-xs font-bold text-forest-950 leading-tight">Refill Champion</p>
                  <p className="text-[10px] font-extrabold text-emerald-600">+50 Impact Points Earned</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── 2. TODAY AT A GLANCE & QUICK ACTIONS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9 space-y-3">
            <h3 className="text-base font-bold text-forest-950 tracking-tight">Today at a Glance</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-sand-600">Eco Score</p>
                  <p className="text-2xl font-black text-forest-950 tracking-tight">82</p>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">Excellent</p>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-sand-600">Crowd Status</p>
                  <p className="text-2xl font-black text-forest-950 tracking-tight">Moderate</p>
                  <p className="text-xs font-bold text-amber-700 mt-0.5">68%</p>
                </div>
              </div>

              <div className="bg-sky-50/70 border border-sky-200/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-2">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-sand-600">Waste Pressure</p>
                  <p className="text-2xl font-black text-forest-950 tracking-tight">Low</p>
                  <p className="text-xs font-bold text-sky-700 mt-0.5">32%</p>
                </div>
              </div>

              <div className="bg-purple-50/70 border border-purple-200/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                  <Accessibility className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-sand-600">Accessibility</p>
                  <p className="text-2xl font-black text-forest-950 tracking-tight">Good</p>
                  <p className="text-xs font-bold text-purple-700 mt-0.5">76%</p>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-sand-600">Your Impact</p>
                  <p className="text-2xl font-black text-forest-950 tracking-tight">{user.impactPoints || 350}</p>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">Points</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-base font-bold text-forest-950 tracking-tight">Quick Actions</h3>
            
            <div className="bg-white rounded-2xl border border-sand-200/80 p-3 shadow-2xs space-y-1.5">
              <Link
                to="/plan"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/80 text-xs font-bold text-forest-950 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <span>Plan Accessible Trip</span>
                </div>
                <ChevronRight className="w-4 h-4 text-sand-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/explore"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/80 text-xs font-bold text-forest-950 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Find Accessible Stay</span>
                </div>
                <ChevronRight className="w-4 h-4 text-sand-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/reports"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/80 text-xs font-bold text-forest-950 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <span>Report an Issue</span>
                </div>
                <ChevronRight className="w-4 h-4 text-sand-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/challenges"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/80 text-xs font-bold text-forest-950 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <span>Join Eco-Challenge</span>
                </div>
                <ChevronRight className="w-4 h-4 text-sand-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── 3. MIDDLE 3-COLUMN SECTION ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Your Upcoming Trip */}
          <div className="bg-white rounded-3xl border border-sand-200/80 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-forest-950">Your Upcoming Trip</h3>
                <Link to="/plan" className="text-xs font-bold text-forest-700 hover:text-forest-900">
                  View Details
                </Link>
              </div>

              <div className="flex items-start gap-3">
                <img
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop"
                  alt="Matheran"
                  className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-2xs"
                />
                <div>
                  <h4 className="text-sm font-extrabold text-forest-950">Matheran, Maharashtra</h4>
                  <p className="text-xs text-sand-600 font-medium">2 Days • Family Trip • Accessible</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                      Eco-Friendly
                    </span>
                    <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md text-[10px] font-bold">
                      Wheelchair Accessible
                    </span>
                    <span className="px-2 py-0.5 bg-sand-100 text-sand-700 rounded-md text-[10px] font-bold">
                      18-19 May 2025
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-sand-500 uppercase tracking-wider">Itinerary Overview</p>
                <div className="space-y-2.5 relative pl-4 border-l-2 border-emerald-200">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-forest-950">Panorama Point ♿</p>
                        <p className="text-[11px] text-sand-500">Low crowd • Scenic View</p>
                      </div>
                      <span className="text-[11px] text-sand-400 font-semibold">9:00 AM</span>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-forest-950">Local Community Cafe</p>
                        <p className="text-[11px] text-sand-500">Support Local • Vegetarian</p>
                      </div>
                      <span className="text-[11px] text-sand-400 font-semibold">1:00 PM</span>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-forest-950">Accessible Nature Trail</p>
                        <p className="text-[11px] text-sand-500">Step-free • Easy</p>
                      </div>
                      <span className="text-[11px] text-sand-400 font-semibold">4:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/80 rounded-2xl p-3 border border-emerald-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 text-lg">
                  💧
                </div>
                <div>
                  <p className="text-xs font-bold text-forest-950">Sustainable Tip</p>
                  <p className="text-[11px] text-sand-700 leading-snug">
                    Carry a reusable bottle. Water demand is High in this area.
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/plan"
              className="w-full py-2.5 bg-sand-100 hover:bg-sand-200 text-forest-950 font-bold rounded-xl text-xs text-center transition-colors flex items-center justify-center gap-1.5"
            >
              View Full Itinerary <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Column 2: Eco-Challenge */}
          <div className="bg-white rounded-3xl border border-sand-200/80 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-forest-950">Eco-Challenge</h3>
                <Link to="/challenges" className="text-xs font-bold text-forest-700 hover:text-forest-900">
                  View All
                </Link>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-sand-500 uppercase tracking-wider">Today&apos;s Challenge</p>
                <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200/80 space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      🛍️
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-forest-950 leading-snug">
                        {todayChallenge.title}
                      </h4>
                      <p className="text-[11px] text-sand-600">{todayChallenge.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2 py-0.5 bg-emerald-200/70 text-emerald-900 font-extrabold rounded-md text-[10px]">
                      +{todayChallenge.points} Points
                    </span>
                    <span className="px-2 py-0.5 bg-white text-sand-700 font-bold rounded-md text-[10px] border border-sand-200">
                      ⏱ Easy
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-sand-500 uppercase tracking-wider">Your Progress</p>
                <div className="flex items-center gap-4 bg-sand-50/80 p-3 rounded-2xl border border-sand-200/60">
                  <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="28" cy="28" r="22" stroke="#e5e1d5" strokeWidth="4" fill="transparent" />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        stroke="#16a34a"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray="138"
                        strokeDashoffset="55"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-black text-forest-950">3/5</span>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-forest-950">+120 Points Earned</p>
                    <div className="flex items-center gap-1 text-[11px] text-sand-600 font-medium mt-0.5">
                      <span>🏆</span>
                      <span>Next Badge: <strong>Green Explorer</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartChallenge}
              disabled={challengeStarted}
              className={cn(
                'w-full py-3 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2',
                challengeStarted
                  ? 'bg-emerald-100 text-emerald-800 cursor-default'
                  : 'bg-forest-800 hover:bg-forest-900 text-white'
              )}
            >
              {challengeStarted ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" /> Challenge Active
                </>
              ) : (
                'Start Challenge'
              )}
            </button>
          </div>

          {/* Column 3: Recent Activity */}
          <div className="bg-white rounded-3xl border border-sand-200/80 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-forest-950">Recent Activity</h3>
                <Link to="/community" className="text-xs font-bold text-forest-700 hover:text-forest-900">
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-sand-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-forest-950 leading-tight">You earned +20 points</p>
                    <p className="text-[11px] text-sand-500 truncate">Reusable Bag Challenge</p>
                  </div>
                  <span className="text-[10px] font-semibold text-sand-400 shrink-0">2h ago</span>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-sand-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-forest-950 leading-tight">Reported an issue</p>
                    <p className="text-[11px] text-sand-500 truncate">Broken ramp at Market Area</p>
                  </div>
                  <span className="text-[10px] font-semibold text-sand-400 shrink-0">5h ago</span>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-sand-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-forest-950 leading-tight">Badge Unlocked</p>
                    <p className="text-[11px] text-sand-500 truncate">Refill Champion</p>
                  </div>
                  <span className="text-[10px] font-semibold text-sand-400 shrink-0">1d ago</span>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-sand-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-forest-950 leading-tight">Your report is under review</p>
                    <p className="text-[11px] text-sand-500 truncate">Waste overflow at Trail 2</p>
                  </div>
                  <span className="text-[10px] font-semibold text-sand-400 shrink-0">1d ago</span>
                </div>
              </div>
            </div>

            <Link
              to="/community"
              className="w-full py-2.5 bg-sand-100 hover:bg-sand-200 text-forest-950 font-bold rounded-xl text-xs text-center transition-colors block"
            >
              View Activity Feed
            </Link>
          </div>
        </div>

        {/* ── 4. ACCESSIBILITY & HOSPITALITY SECTION ── */}
        <div className="bg-white rounded-3xl border border-sand-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-forest-950 tracking-tight">
                Accessibility & Hospitality
              </h3>
              <p className="text-xs sm:text-sm text-sand-600 mt-0.5">
                Verified eco-friendly stays, accessible transit, and dining spots
              </p>
            </div>
            <Link
              to="/explore"
              className="text-xs sm:text-sm font-bold text-forest-700 hover:text-forest-900"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-sand-50/80 border border-sand-200/60 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-forest-950">Stay</p>
                <p className="text-xs font-extrabold text-purple-700 mt-0.5">85% Accessible</p>
                <p className="text-[11px] text-sand-500 mt-0.5">18 Verified</p>
              </div>
            </div>

            <div className="bg-sand-50/80 border border-sand-200/60 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <Mountain className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-forest-950">Attractions</p>
                <p className="text-xs font-extrabold text-emerald-700 mt-0.5">78% Accessible</p>
                <p className="text-[11px] text-sand-500 mt-0.5">24 Verified</p>
              </div>
            </div>

            <div className="bg-sand-50/80 border border-sand-200/60 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
                <Bus className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-forest-950">Transport</p>
                <p className="text-xs font-extrabold text-sky-700 mt-0.5">72% Accessible</p>
                <p className="text-[11px] text-sand-500 mt-0.5">12 Verified</p>
              </div>
            </div>

            <div className="bg-sand-50/80 border border-sand-200/60 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-forest-950">Food & Dining</p>
                <p className="text-xs font-extrabold text-amber-700 mt-0.5">80% Accessible</p>
                <p className="text-[11px] text-sand-500 mt-0.5">16 Verified</p>
              </div>
            </div>

            <div className="bg-sand-50/80 border border-sand-200/60 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3 text-sm font-black">
                🚽
              </div>
              <div>
                <p className="text-xs font-bold text-forest-950">Toilets</p>
                <p className="text-xs font-extrabold text-teal-700 mt-0.5">65% Accessible</p>
                <p className="text-[11px] text-sand-500 mt-0.5">09 Verified</p>
              </div>
            </div>

            <div className="bg-sand-50/80 border border-sand-200/60 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-forest-950">Parking</p>
                <p className="text-xs font-extrabold text-indigo-700 mt-0.5">70% Accessible</p>
                <p className="text-[11px] text-sand-500 mt-0.5">11 Verified</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. FEATURED DESTINATIONS ── */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                Live Destination Profiles
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-forest-950 tracking-tight">
                Know The Real Impact Before You Travel
              </h2>
            </div>
            <Link
              to="/explore"
              className="text-sm font-bold text-forest-700 hover:text-forest-900 shrink-0"
            >
              Browse All Destinations →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {destinations.map((dest) => (
              <div
                key={dest.id}
                className="group bg-white rounded-3xl border border-sand-200/80 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-black/40 backdrop-blur-md text-white text-[11px] font-bold rounded-full border border-white/20">
                      {dest.region}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h4 className="text-xl font-black">{dest.name}</h4>
                    <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-400" /> {dest.country}
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs text-sand-600 leading-relaxed line-clamp-2">
                    {dest.description}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-sand-100 text-xs">
                    <span className="text-sand-500 font-semibold">Eco Score</span>
                    <span className="font-extrabold text-emerald-700">{dest.sustainabilityScore}/100</span>
                  </div>
                  <Link
                    to={`/explore/${dest.id}`}
                    className="w-full py-2.5 bg-forest-800 hover:bg-forest-900 text-white rounded-xl font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5"
                  >
                    View Destination Hub <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 6. CALL TO ACTION ── */}
        <div className="bg-gradient-to-br from-forest-800 to-forest-950 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="max-w-2xl mx-auto space-y-5">
            <span className="text-4xl">🌱</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Ready to travel responsibly?
            </h2>
            <p className="text-sm sm:text-base text-forest-200/90 leading-relaxed">
              Join thousands of eco-conscious travelers preserving ecosystems and supporting local communities worldwide.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/plan"
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-forest-950 rounded-xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                Plan Your Trip
              </Link>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-4 h-4 text-emerald-300" />
                Manager Dashboard
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default LandingPage;
