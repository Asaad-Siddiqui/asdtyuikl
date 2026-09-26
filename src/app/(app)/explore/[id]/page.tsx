import DestinationHubPage from "@/components/travello/pages/DestinationHubPage";
import { SaveDestinationButton } from "@/components/travello/SavedDestinationsBar";

export const dynamic = "force-dynamic";

export const metadata = { title: "Destination" };

/** Destination hub — ZIP 2's layout, catalogue + challenges from Neon. */
export default async function ExploreDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex justify-end">
        <SaveDestinationButton destinationId={id} />
      </div>
      <DestinationHubPage />
    </div>
  );
}
