import { coordsOrCenter } from "@/lib/geo";
import type { TwinEntity } from "@/lib/digital-twin";
import type { Destination } from "@/types";

/**
 * Adapter: the Travello catalogue's `Destination` → the Digital Twin's
 * `TwinEntity`. Keeps the twin decoupled from any one data source, and gives
 * every entity the coordinates it needs for the map and weather.
 */
export function destinationToTwinEntity(destination: Destination): TwinEntity {
  const coord = coordsOrCenter(destination.name);
  return {
    id: destination.id,
    name: destination.name,
    region: destination.region,
    lat: coord.lat,
    lon: coord.lon,
    sustainabilityScore: destination.sustainabilityScore,
    crowdLevel: destination.crowdLevel,
    visitorPressure: destination.visitorPressure,
    environmentalSensitivity: destination.environmentalSensitivity,
    accessibility: {
      stepFreeRoutes: destination.accessibility.stepFreeRoutes,
      lowWalkingRequirement: destination.accessibility.lowWalkingRequirement,
      accessibleToilets: destination.accessibility.accessibleToilets,
      wheelchairAccessible: destination.accessibility.wheelchairAccessible,
      elevator: destination.accessibility.elevator,
      accessibleParking: destination.accessibility.accessibleParking,
      trailDifficulty: destination.accessibility.trailDifficulty,
    },
    tags: destination.tags,
  };
}
