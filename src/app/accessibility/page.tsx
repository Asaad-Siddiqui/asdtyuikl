import { redirect } from "next/navigation";

import ProfileWizard from "@/components/ProfileWizard";
import { getCurrentUser } from "@/lib/auth";
import { getProfileData } from "@/lib/profile-service";

export const dynamic = "force-dynamic";

export const metadata = { title: "Your accessibility profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?reason=session");

  const profile = await getProfileData(user.id);

  // Always render — a completed profile is opened in review/edit mode from
  // the Profile screen, so "Review my answers" actually shows the answers.

  // Fixed-height app shell: the conversation scrolls, the page never does.
  return (
    <main id="main" className="flex h-dvh flex-col overflow-hidden">
      <ProfileWizard initialProfile={profile} userName={user.name} />
    </main>
  );
}
