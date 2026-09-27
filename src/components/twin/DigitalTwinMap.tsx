"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type * as LeafletTypes from "leaflet";

import type { TwinState } from "@/lib/digital-twin";

export type MapEntity = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
};

export type MapWeather = {
  icon: string;
  condition: string;
  tempC: number;
  precipitationMm: number;
};

/** Impact → colour, matching the twin's own severity bands. */
export function impactColor(impact: number): string {
  if (impact < 25) return "#16a34a";
  if (impact < 45) return "#d97706";
  if (impact < 65) return "#ea580c";
  return "#dc2626";
}

/**
 * Geospatial view of the Digital Twin.
 *
 * Leaflet + OpenStreetMap tiles (both free, no key). Entities are drawn as
 * impact-coloured markers; the selected one gets a propagation ring sized by
 * its simulated impact. Only client-side: Leaflet is imported inside an effect,
 * so it never runs on the server.
 */
export default function DigitalTwinMap({
  entities,
  states,
  weather,
  selectedId,
  onSelect,
}: {
  entities: MapEntity[];
  states: Record<string, TwinState>;
  weather: Record<string, MapWeather>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletTypes.Map | null>(null);
  const layerRef = useRef<LeafletTypes.LayerGroup | null>(null);
  const leafletRef = useRef<typeof LeafletTypes | null>(null);
  const selectRef = useRef(onSelect);

  // Keep the latest handler without re-initialising Leaflet on every render.
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  // Initialise once.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || mapRef.current || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [22.5, 79],
        zoom: 5,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      leafletRef.current = L;
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      // Ensure correct sizing after mount/layout.
      setTimeout(() => map.invalidateSize(), 200);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Redraw markers whenever the simulated state changes.
  useEffect(() => {
    const L = leafletRef.current;
    const layer = layerRef.current;
    if (!L || !layer) return;

    layer.clearLayers();

    for (const entity of entities) {
      const state = states[entity.id];
      const impact = state?.impact ?? 0;
      const color = impactColor(impact);

      const marker = L.circleMarker([entity.lat, entity.lon], {
        radius: 9 + impact / 6,
        color: "#ffffff",
        weight: 2,
        fillColor: color,
        fillOpacity: 0.9,
      });

      const w = weather[entity.id];
      const popup = `
        <div style="min-width:190px">
          <div style="font-weight:700;font-size:13px">${entity.name}</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:4px">${entity.region}</div>
          ${
            w
              ? `<div style="font-size:12px">${w.icon} ${w.condition} · ${Math.round(
                  w.tempC,
                )}°C · ${w.precipitationMm} mm/h</div>`
              : ""
          }
          ${
            state
              ? `<div style="margin-top:6px;font-size:12px">
                   <span style="display:inline-block;padding:1px 7px;border-radius:999px;background:${color};color:#fff;font-weight:700;font-size:10px">${state.status}</span>
                   <span style="margin-left:6px">Impact ${impact}/100</span>
                 </div>
                 <div style="margin-top:4px;font-size:11px;color:#374151">${state.headline}</div>`
              : ""
          }
        </div>`;

      marker.bindPopup(popup);
      marker.on("click", () => selectRef.current(entity.id));
      marker.addTo(layer);
    }

    // Propagation ring around the selected entity, sized by simulated impact.
    const selected = entities.find((entity) => entity.id === selectedId);
    if (selected) {
      const state = states[selected.id];
      const impact = state?.impact ?? 0;
      L.circle([selected.lat, selected.lon], {
        radius: 40_000 + impact * 2500,
        color: impactColor(impact),
        weight: 1.5,
        opacity: 0.5,
        fillColor: impactColor(impact),
        fillOpacity: 0.08,
      }).addTo(layer);

      L.circleMarker([selected.lat, selected.lon], {
        radius: 20,
        color: impactColor(impact),
        weight: 2,
        opacity: 0.7,
        fill: false,
      }).addTo(layer);
    }
  }, [entities, states, weather, selectedId]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-sm">
      <div ref={containerRef} className="h-[380px] w-full sm:h-[440px]" />

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-2xl border border-sand-200 bg-white/95 p-3 text-[11px] shadow-md backdrop-blur">
        <p className="mb-1.5 font-bold text-forest-950">Simulated impact</p>
        <div className="space-y-1">
          {[
            { label: "Normal", color: "#16a34a" },
            { label: "Watch", color: "#d97706" },
            { label: "Disrupted", color: "#ea580c" },
            { label: "Severe", color: "#dc2626" },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2 text-sand-700">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              {row.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
