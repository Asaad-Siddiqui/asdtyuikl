import ProfilePage from "@/components/travello/pages/ProfilePage";
import { ProfileEditor } from "@/components/travello/ProfileEditor";

export const dynamic = "force-dynamic";

export const metadata = { title: "Profile" };

/** Profile — ZIP 1's layout, populated from the signed-in account. */
export default function TravellerProfilePage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <ProfileEditor />
      </div>
      <ProfilePage />
    </div>
  );
}
