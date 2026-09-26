import { redirect } from "next/navigation";

import TripPlanner from "@/components/TripPlanner";
import { getCurrentUser } from "@/lib/auth";
import { getProfileData } from "@/lib/profile-service";
import type { PlannerProfile } from "@/lib/trip-options";

export const dynamic = "force-dynamic";

export const metadata = { title: "Plan my trip" };

export default async function PlanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?reason=session");

  // The planner needs the stored accessibility profile, so it is fetched
  // server-side from Neon — the traveller never re-enters it.
  const profile = await getProfileData(user.id);
  if (!profile.completed) redirect("/accessibility");

  const plannerProfile: PlannerProfile = {
    completed: profile.completed,
    travelerTypes: profile.travelerTypes,
    mobility: profile.requirements.mobility,
    visual: profile.requirements.visual,
    hearing: profile.requirements.hearing,
    dietary: profile.dietary,
    mobilityDetail: profile.details.mobility,
    dietaryDetail: profile.details.dietary,
    specialRequirement: profile.specialRequirement,
    priorities: profile.preferences,
  };

  return (
    <>
      <main id="main" className="flex-1">
        <TripPlanner profile={plannerProfile} userName={user.name} />
      </main>
    </>
  );
}
