import DigitalTwinView from "@/components/twin/DigitalTwinView";
import { destinationToTwinEntity } from "@/lib/twin-entities";
import { fetchSocialSignals } from "@/lib/social-signals";
import { listDestinations } from "@/lib/travello-service";
import { fetchWeather, type WeatherSnapshot } from "@/lib/weather";
import type { TwinEntity } from "@/lib/digital-twin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Digital Twin" };

/**
 * Weather-Driven Digital Twin.
 *
 * This is not a standalone app: it loads the same destination catalogue the rest
 * of Travello renders, pulls live weather (Open-Meteo) and public social signals,
 * and simulates how weather propagates through those exact entities. The live
 * system is only ever read — the what-if scenarios are simulated on the client.
 */
export default async function TwinPage() {
  let entities: TwinEntity[] = [];
  try {
    const destinations = await listDestinations();
    entities = destinations.map(destinationToTwinEntity);
  } catch (error) {
    console.error("[twin] could not load catalogue:", error);
  }

  const [weatherEntries, socials] = await Promise.all([
    Promise.all(
      entities.map(
        async (entity) =>
          [entity.id, await fetchWeather({ lat: entity.lat, lon: entity.lon })] as const,
      ),
    ),
    fetchSocialSignals("India travel weather monsoon", "monsoon"),
  ]);

  const weather: Record<string, WeatherSnapshot> = {};
  for (const [id, snapshot] of weatherEntries) weather[id] = snapshot;

  return (
    <DigitalTwinView entities={entities} weather={weather} socials={socials} />
  );
}
