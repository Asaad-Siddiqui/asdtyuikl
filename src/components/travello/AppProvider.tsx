"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { aiInsights } from "@/lib/travello-data";
import type {
  AIInsight,
  Business,
  Challenge,
  ChallengeCompletion,
  Destination,
  Report,
  User as TravelloUser,
} from "@/types";
import type {
  AppData,
  CommunityPostView,
  ReportView,
  TravellerStats,
} from "@/lib/travello-service";
import type { ClaimedReward } from "@/lib/rewards";

/**
 * Client-side data layer.
 *
 * The ported Travello pages were written against `useApp()`. This provider
 * keeps that exact API so the pages stay recognisably the prototypes, but every
 * value now comes from Postgres (server-loaded through `initial`) and every
 * mutation goes through an authenticated API route. Optimistic updates keep the
 * UI instant; `router.refresh()` then re-syncs the server components so the
 * dashboard, profile, impact and reports pages can never disagree.
 */

export type SavedTripView = AppData["trips"][number];

/** Everything the app shell needs, loaded once on the server per request. */
export type InitialTravelloData = AppData;

export type AppState = {
  user: TravelloUser;
  stats: TravellerStats;
  destinations: Destination[];
  challenges: Challenge[];
  businesses: Business[];
  aiInsights: AIInsight[];
  completions: ChallengeCompletion[];
  reports: ReportView[];
  posts: CommunityPostView[];
  savedDestinationIds: string[];
  rewardClaims: ClaimedReward[];
  claimReward: (rewardId: string) => Promise<void>;
  trips: SavedTripView[];
  selectedDestination: Destination | null;
  setSelectedDestination: (destination: Destination | null) => void;
  startChallenge: (challengeId: string) => void;
  completeChallenge: (challengeId: string, evidence?: unknown) => void;
  submitReport: (input: {
    destinationId: string;
    category: string;
    description: string;
    priority?: string;
  }) => Promise<void>;
  createPost: (input: {
    content: string;
    imageUrl?: string;
    destinationId?: string;
    challengeId?: string;
  }) => Promise<void>;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, content: string) => Promise<void>;
  toggleSaveDestination: (destinationId: string) => void;
  updateTraveller: (input: {
    name?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    role?: string;
  }) => Promise<void>;
  isPending: boolean;
};

const GUEST_USER: TravelloUser = {
  id: "guest",
  displayName: "Guest",
  username: "@guest",
  avatarUrl: "",
  bio: "",
  role: "traveler",
  impactPoints: 0,
  challengesCompleted: 0,
  destinationsVisited: 0,
  badgesEarned: 0,
  co2Avoided: 0,
};

const GUEST_STATS: TravellerStats = {
  points: 0,
  challengesCompleted: 0,
  challengesInProgress: 0,
  destinationsVisited: 0,
  badgesEarned: 0,
  co2Avoided: 0,
  approvedReports: 0,
};

/**
 * Signed-out default. The public landing page reads from this, so every screen
 * works without a session and `startChallenge` simply does nothing.
 */
const GUEST_STATE: AppState = {
  user: GUEST_USER,
  stats: GUEST_STATS,
  destinations: [],
  challenges: [],
  businesses: [],
  aiInsights,
  completions: [],
  reports: [],
  posts: [],
  savedDestinationIds: [],
  rewardClaims: [],
  claimReward: async () => {},
  trips: [],
  selectedDestination: null,
  setSelectedDestination: () => {},
  startChallenge: () => {},
  completeChallenge: () => {},
  submitReport: async () => {},
  createPost: async () => {},
  toggleLike: () => {},
  addComment: async () => {},
  toggleSaveDestination: () => {},
  updateTraveller: async () => {},
  isPending: false,
};

const AppContext = createContext<AppState>(GUEST_STATE);

export function useApp(): AppState {
  return useContext(AppContext);
}

async function postJson(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!response.ok) {
    throw new Error(
      (data?.error as string) ?? "Something went wrong. Please try again.",
    );
  }
  return data ?? {};
}

export function AppProvider({
  initial,
  guest = false,
  children,
}: {
  initial: InitialTravelloData;
  /**
   * Public marketing pages render inside the provider for its read-only data
   * (catalogue), but must not attempt authenticated writes.
   */
  guest?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [user, setUser] = useState(initial.user);
  const [stats, setStats] = useState(initial.stats);
  const [completions, setCompletions] = useState(initial.completions);
  const [reports, setReports] = useState<ReportView[]>(initial.reports);
  const [posts, setPosts] = useState<CommunityPostView[]>(initial.posts);
  const [savedDestinationIds, setSavedDestinationIds] = useState(
    initial.savedDestinationIds,
  );
  const [rewardClaims, setRewardClaims] = useState(initial.rewardClaims);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const notifyError = useCallback((message: string) => {
    setError(message);
    console.warn("[travello]", message);
  }, []);

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const startChallenge = useCallback(
    (challengeId: string) => {
      setCompletions((previous) => {
        if (previous.some((item) => item.challengeId === challengeId)) {
          return previous;
        }
        return [
          ...previous,
          {
            id: `pending-${challengeId}`,
            userId: user.id,
            challengeId,
            status: "in_progress",
            startedAt: new Date().toISOString(),
            pointsAwarded: 0,
            progress: 0,
          },
        ];
      });

      void postJson("/api/challenges/start", { challengeId })
        .then(() => refresh())
        .catch((cause: Error) => notifyError(cause.message));
    },
    [notifyError, refresh, user.id],
  );

  const completeChallenge = useCallback(
    (challengeId: string, _evidence?: unknown) => {
      const challenge = initial.challenges.find((item) => item.id === challengeId);
      const points = challenge?.points ?? 0;

      setCompletions((previous) => {
        const next = previous.filter(
          (item) => !(item.challengeId === challengeId && item.status === "in_progress"),
        );
        return [
          ...next,
          {
            id: `pending-${challengeId}`,
            userId: user.id,
            challengeId,
            status: "completed",
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            pointsAwarded: points,
            progress: challenge?.instructions.length ?? 0,
          },
        ];
      });
      setUser((previous) => ({
        ...previous,
        impactPoints: previous.impactPoints + points,
        challengesCompleted: previous.challengesCompleted + 1,
      }));
      setStats((previous) => ({
        ...previous,
        points: previous.points + points,
        challengesCompleted: previous.challengesCompleted + 1,
      }));

      void postJson("/api/challenges/complete", { challengeId })
        .then((data) => {
          const nextStats = data.stats as TravellerStats | undefined;
          if (nextStats) {
            setStats(nextStats);
            setUser((previous) => ({
              ...previous,
              impactPoints: nextStats.points,
              challengesCompleted: nextStats.challengesCompleted,
              destinationsVisited: nextStats.destinationsVisited,
              badgesEarned: nextStats.badgesEarned,
              co2Avoided: nextStats.co2Avoided,
            }));
          }
          refresh();
        })
        .catch((cause: Error) => notifyError(cause.message));
    },
    [initial.challenges, notifyError, refresh, user.id],
  );

  const submitReport = useCallback(
    async (input: {
      destinationId: string;
      category: string;
      description: string;
      priority?: string;
    }) => {
      const data = await postJson("/api/reports", input);
      if (Array.isArray(data.reports)) {
        setReports(data.reports as ReportView[]);
      }
      refresh();
    },
    [refresh],
  );

  const createPost = useCallback(
    async (input: {
      content: string;
      imageUrl?: string;
      destinationId?: string;
      challengeId?: string;
    }) => {
      const data = await postJson("/api/community/posts", input);
      if (Array.isArray(data.posts)) {
        setPosts(data.posts as CommunityPostView[]);
      }
      refresh();
    },
    [refresh],
  );

  const toggleLike = useCallback(
    (postId: string) => {
      setPosts((previous) =>
        previous.map((post) =>
          post.id === postId
            ? {
                ...post,
                likedByMe: !post.likedByMe,
                likes: post.likedByMe ? post.likes - 1 : post.likes + 1,
              }
            : post,
        ),
      );

      void postJson(`/api/community/posts/${postId}/like`)
        .catch((cause: Error) => {
          notifyError(cause.message);
          setPosts((previous) =>
            previous.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    likedByMe: !post.likedByMe,
                    likes: post.likedByMe ? post.likes - 1 : post.likes + 1,
                  }
                : post,
            ),
          );
        });
    },
    [notifyError],
  );

  const addComment = useCallback(
    async (postId: string, content: string) => {
      const data = await postJson(`/api/community/posts/${postId}/comments`, {
        content,
      });
      if (Array.isArray(data.posts)) {
        setPosts(data.posts as CommunityPostView[]);
      }
      refresh();
    },
    [refresh],
  );

  const toggleSaveDestination = useCallback(
    (destinationId: string) => {
      setSavedDestinationIds((previous) =>
        previous.includes(destinationId)
          ? previous.filter((id) => id !== destinationId)
          : [...previous, destinationId],
      );
      void postJson(`/api/destinations/${destinationId}/save`).catch(
        (cause: Error) => notifyError(cause.message),
      );
    },
    [notifyError],
  );

  /**
   * Claims an unlocked goodie. Optimistic: the badge flips immediately, then
   * the server confirms. On failure the claim is rolled back and the error
   * toast is shown, exactly like the other mutations in this provider.
   */
  const claimReward = useCallback(
    async (rewardId: string) => {
      const previousClaims = rewardClaims;
      setRewardClaims((current) =>
        current.some((claim) => claim.rewardId === rewardId)
          ? current
          : [
              { rewardId, claimedAt: new Date().toISOString() },
              ...current,
            ],
      );

      try {
        await postJson("/api/rewards/claim", { rewardId });
        refresh();
      } catch (cause) {
        setRewardClaims(previousClaims);
        notifyError(
          cause instanceof Error ? cause.message : "Could not claim that reward.",
        );
      }
    },
    [notifyError, refresh, rewardClaims],
  );

  const updateTraveller = useCallback(
    async (input: {
      name?: string;
      username?: string;
      bio?: string;
      avatarUrl?: string;
      role?: string;
    }) => {
      const response = await fetch("/api/profile/traveller", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "Could not save your profile.");
      }
      setUser((previous) => ({
        ...previous,
        displayName: input.name?.trim() || previous.displayName,
        username: input.username?.trim() || previous.username,
        bio: input.bio?.trim() || previous.bio,
        avatarUrl: input.avatarUrl?.trim() || previous.avatarUrl,
        role: (input.role as TravelloUser["role"]) ?? previous.role,
      }));
      refresh();
    },
    [refresh],
  );

  const value = useMemo<AppState>(() => {
    const readOnly = {
      user,
      stats,
      destinations: initial.destinations,
      challenges: initial.challenges,
      businesses: initial.businesses,
      aiInsights,
      completions,
      reports,
      posts,
      savedDestinationIds,
      rewardClaims,
      trips: initial.trips,
      selectedDestination,
      setSelectedDestination,
    };

    // Guest mode: real catalogue, no authenticated writes.
    if (guest) return { ...GUEST_STATE, ...readOnly };

    return {
      ...readOnly,
      startChallenge,
      completeChallenge,
      submitReport,
      createPost,
      toggleLike,
      addComment,
      toggleSaveDestination,
      claimReward,
      updateTraveller,
      isPending,
    };
  }, [
      guest,
      user,
      stats,
      initial.destinations,
      initial.challenges,
      initial.trips,
      completions,
      reports,
      posts,
      savedDestinationIds,
      selectedDestination,
      startChallenge,
      completeChallenge,
      submitReport,
      createPost,
      toggleLike,
      addComment,
      toggleSaveDestination,
      rewardClaims,
      claimReward,
      updateTraveller,
      isPending,
    ]);

  return (
    <AppContext.Provider value={value}>
      {error && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[60] w-[min(92vw,26rem)] -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-semibold text-amber-900 shadow-lg lg:bottom-6"
        >
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </AppContext.Provider>
  );
}

export type { Report, CommunityPostView, TravellerStats };
