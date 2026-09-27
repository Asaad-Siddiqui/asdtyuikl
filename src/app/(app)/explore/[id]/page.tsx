import DestinationHubPage from "@/components/travello/pages/DestinationHubPage";
import { SaveDestinationButton } from "@/components/travello/SavedDestinationsBar";
import WeatherStrip from "@/components/twin/WeatherStrip";
import { destinationToTwinEntity } from "@/lib/twin-entities";
import { listDestinations } from "@/lib/travello-service";
import type { TwinEntity } from "@/lib/digital-twin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Destination" };

/** Destination hub — ZIP 2's layout, catalogue + challenges from Neon. */
export default async function ExploreDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Load the catalogue entity so the live weather strip can show what weather
  // is doing to *this* destination via the Digital Twin.
  let entity: TwinEntity | undefined;
  try {
    const destinations = await listDestinations();
    const match = destinations.find((destination) => destination.id === id);
    if (match) entity = destinationToTwinEntity(match);
  } catch (error) {
    console.error("[explore] could not load destination for twin:", error);
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <div className="mb-5 flex justify-end">
        <SaveDestinationButton destinationId={id} />
      </div>
      <div className="mb-6">
        <WeatherStrip place={entity?.name ?? id} entity={entity} />
      </div>
      <DestinationHubPage />
    </div>
  );
}
