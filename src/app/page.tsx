import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { AppProvider } from "@/components/travello/AppProvider";
import LandingPage from "@/components/travello/pages/LandingPage";
import { getCurrentUser } from "@/lib/auth";
import { listChallenges, listDestinations } from "@/lib/travello-service";
import type { AppData } from "@/lib/travello-service";

export const dynamic = "force-dynamic";

/**
 * Public landing page — the Travello hero from ZIP 1, kept intact.
 *
 * It renders inside a read-only provider so the featured destinations and the
 * daily challenge come from the real catalogue, while every call-to-action
 * routes a signed-out visitor to authentication (the protected routes redirect
 * there anyway).
 */
export default async function HomePage() {
  const user = await getCurrentUser();

  let destinations: AppData["destinations"] = [];
  let challenges: AppData["challenges"] = [];

  try {
    [destinations, challenges] = await Promise.all([
      listDestinations(),
      listChallenges(),
    ]);
  } catch (error) {
    console.error("[landing] could not load catalogue:", error);
  }

  const guestData: AppData = {
    user: {
      id: "guest",
      displayName: user?.name ?? "Guest",
      username: "",
      avatarUrl: "",
      bio: "",
      role: "traveler",
      impactPoints: 0,
      challengesCompleted: 0,
      destinationsVisited: 0,
      badgesEarned: 0,
      co2Avoided: 0,
    },
    stats: {
      points: 0,
      challengesCompleted: 0,
      challengesInProgress: 0,
      destinationsVisited: 0,
      badgesEarned: 0,
      co2Avoided: 0,
      approvedReports: 0,
    },
    destinations,
    challenges,
    completions: [],
    reports: [],
    posts: [],
    savedDestinationIds: [],
    trips: [],
    // The public landing page has no hospitality data to show.
    businesses: [],
  };

  return (
    <>
      <Navbar userName={user?.name ?? null} />

      <main id="main" className="flex-1">
        <AppProvider initial={guestData} guest>
          <LandingPage />
        </AppProvider>
      </main>

      <Footer />
    </>
  );
}
