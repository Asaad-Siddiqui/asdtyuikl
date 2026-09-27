/**
 * Geospatial reference data.
 *
 * The catalogue stores no coordinates (the prototype was city/region based), so
 * the Digital Twin and the map resolve a place name to an approximate
 * lat/lon here. Values are city/region centroids — accurate enough for weather
 * and for placing a pin, and clearly labelled "approximate" wherever they are
 * shown. Keyed by lower-case name; lookups fall back to the region, then to the
 * centre of India.
 */

export type Coord = { lat: number; lon: number };

/** Approximate centroids for the seeded destinations and common trip cities. */
export const PLACE_COORDS: Record<string, Coord> = {
  // Seeded destinations
  matheran: { lat: 18.9866, lon: 73.271 },
  goa: { lat: 15.2993, lon: 74.124 },
  manali: { lat: 32.2432, lon: 77.1892 },
  munnar: { lat: 10.0889, lon: 77.0595 },

  // Popular origins / destinations
  mumbai: { lat: 19.076, lon: 72.8777 },
  pune: { lat: 18.5204, lon: 73.8567 },
  mahabaleshwar: { lat: 17.9237, lon: 73.6586 },
  lonavala: { lat: 18.7546, lon: 73.4062 },
  alibaug: { lat: 18.6414, lon: 72.8722 },
  karjat: { lat: 18.9107, lon: 73.3234 },
  igatpuri: { lat: 19.6967, lon: 73.5626 },
  delhi: { lat: 28.6139, lon: 77.209 },
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  hyderabad: { lat: 17.385, lon: 78.4867 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
  ahmedabad: { lat: 23.0225, lon: 72.5714 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  udaipur: { lat: 24.5854, lon: 73.7125 },
  coorg: { lat: 12.3375, lon: 75.8069 },
  rishikesh: { lat: 30.0869, lon: 78.2676 },
  alleppey: { lat: 9.4981, lon: 76.3388 },
};

/** Centre of India — the last-resort fallback. */
export const INDIA_CENTER: Coord = { lat: 22.5, lon: 79.0 };

/** Resolves a free-text place to coordinates; `null` when unknown. */
export function resolveCoords(name: string): Coord | null {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  if (PLACE_COORDS[key]) return PLACE_COORDS[key];
  // Match the first token (e.g. "South Goa" → "goa" via contains).
  const hit = Object.keys(PLACE_COORDS).find(
    (place) => key.includes(place) || place.includes(key),
  );
  return hit ? PLACE_COORDS[hit] : null;
}

/** Resolves coordinates or falls back to the centre of India. */
export function coordsOrCenter(name: string): Coord {
  return resolveCoords(name) ?? INDIA_CENTER;
}
