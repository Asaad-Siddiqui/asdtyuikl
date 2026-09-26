import DestinationsPage from "@/components/travello/pages/DestinationsPage";
import { SavedDestinationsBar } from "@/components/travello/SavedDestinationsBar";

export const dynamic = "force-dynamic";

export const metadata = { title: "Explore" };

/** Explore — ZIP 2's destination catalogue, driven by the seeded Neon catalogue. */
export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-0 py-8">
      <div className="px-4 sm:px-6">
        <SavedDestinationsBar />
      </div>
      <DestinationsPage />
    </div>
  );
}
