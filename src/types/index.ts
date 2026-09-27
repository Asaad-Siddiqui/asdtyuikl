export type UserRole = 'traveler' | 'creator' | 'manager'

export interface User {
  id: string
  displayName: string
  username: string
  avatarUrl: string
  bio: string
  role: UserRole
  impactPoints: number
  challengesCompleted: number
  destinationsVisited: number
  badgesEarned: number
  co2Avoided: number
}

export interface DestinationFactor {
  factor: string
  score: number
  explanation: string
  icon: string
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean
  stepFreeRoutes: boolean
  accessibleToilets: boolean
  elevator: boolean
  accessibleParking: boolean
  lowWalkingRequirement: boolean
  trailDifficulty: string
  notes: string
}

export interface Destination {
  id: string
  name: string
  region: string
  country: string
  description: string
  heroImageUrl: string
  sustainabilityScore: number
  visitorPressure: 'Low' | 'Medium' | 'High' | 'Very High' | 'Very High'
  wastePressure: 'Low' | 'Medium' | 'High'
  waterPressure: 'Low' | 'Medium' | 'High'
  environmentalSensitivity: 'Low' | 'Medium' | 'High'
  crowdLevel: 'Low' | 'Medium' | 'High' | 'Very High'
  accessibilitySummary: string
  factors: DestinationFactor[]
  accessibility: AccessibilityInfo
  tags: string[]
  image: string
}

export interface Attraction {
  id: string
  destinationId: string
  name: string
  description: string
  crowdLevel: 'Low' | 'Medium' | 'High' | 'Very High'
  sustainabilityScore: number
  accessibilityScore: number
  estimatedCost: number
  travelTime: string
  image: string
  alternativeId?: string
}

export interface Business {
  id: string
  destinationId: string
  name: string
  type: string
  description: string
  imageUrl: string
  sustainabilityScore: number
  accessibilitySummary: string
  sustainabilityPractices: string[]
  accessibilityFeatures: { feature: string; available: boolean }[]
  priceRange: string
  rating: number
  reviews: number
}

export interface Challenge {
  id: string
  destinationId: string
  title: string
  description: string
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  points: number
  estimatedMinutes: number
  instructions: string[]
  evidenceRequired: boolean
  whyItMatters: string
  icon: string
}

export interface ChallengeCompletion {
  id: string
  userId: string
  challengeId: string
  status: 'in_progress' | 'completed' | 'verified'
  startedAt: string
  completedAt?: string
  pointsAwarded: number
  /** Steps completed so far, shown against the challenge's instruction count. */
  progress: number
  evidence?: Evidence
}

export interface Evidence {
  photoUrl: string
  latitude: number
  longitude: number
  capturedAt: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  verificationConfidence: number
  checks: { label: string; passed: boolean }[]
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  ruleKey: string
  earned: boolean
  earnedAt?: string
}

export interface Report {
  id: string
  userId: string
  destinationId: string
  category: string
  description: string
  latitude: number
  longitude: number
  status: 'submitted' | 'under_review' | 'confirmed' | 'in_progress' | 'resolved'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  photoUrl?: string
}

export interface AIInsight {
  id: string
  destinationId: string
  type: 'hotspot' | 'trend' | 'recommendation' | 'alert'
  title: string
  description: string
  reportCount?: number
  trend?: string
  recommendation: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface Recommendation {
  attractionId: string
  score: number
  reasons: string[]
  sustainabilityImpact: string
  accessibilityNote: string
  crowdReduction: string
  costDifference: string
  timeDifference: string
}

export interface TripPlan {
  id: string
  destinationId: string
  days: TripDay[]
  totalEstimatedCost: number
  totalTravelTime: string
  sustainabilityScore: number
}

export interface TripDay {
  day: number
  activities: TripActivity[]
}

export interface TripActivity {
  time: string
  attractionId: string
  name: string
  type: string
  sustainabilityImpact: string
  accessibility: string
  crowdLevel: string
  estimatedCost: number
  travelTime: string
  whyRecommended: string
}

export interface SocialPost {
  id: string
  userId: string
  destinationId: string
  caption: string
  imageUrl: string
  likes: number
  comments: number
  createdAt: string
  challengeCompletion?: {
    challengeName: string
    points: number
  }
  author: {
    name: string
    avatar: string
    username: string
  }
  destination: string
}

export interface Creator {
  id: string
  name: string
  handle: string
  avatar: string
  followers: number
  campaigns: number
  bio: string
}

export interface Campaign {
  id: string
  creatorId: string
  destinationId: string
  title: string
  description: string
  coverImageUrl: string
  participants: number
  challengeCount: number
  status: 'active' | 'upcoming' | 'completed'
}

export interface Notification {
  id: string
  type: 'challenge' | 'report' | 'badge' | 'campaign' | 'system'
  title: string
  body: string
  read: boolean
  createdAt: string
}
