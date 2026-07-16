import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon paths in Leaflet when bundled with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface FestivalMarkerData {
  lat: number;
  lng: number;
  name: string;
  date?: string;
  url?: string;
}

interface FestivalMapProps {
  festivals: FestivalMarkerData[];
  className?: string;
}

// Auto-fit map bounds to markers when list changes
const MapController: React.FC<{ festivals: FestivalMarkerData[] }> = ({ festivals }) => {
  const map = useMap();

  useEffect(() => {
    if (festivals.length === 0) return;
    const validCoords = festivals.filter(
      (f) => typeof f.lat === 'number' && typeof f.lng === 'number' && !isNaN(f.lat) && !isNaN(f.lng) && (f.lat !== 0 || f.lng !== 0)
    );
    if (validCoords.length === 0) return;

    if (validCoords.length === 1) {
      map.setView([validCoords[0].lat, validCoords[0].lng], 12);
    } else {
      const bounds = L.latLngBounds(validCoords.map((f) => [f.lat, f.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [festivals, map]);

  return null;
};

export const FestivalMap: React.FC<FestivalMapProps> = ({ festivals, className = '' }) => {
  const defaultCenter = [52.2297, 21.0122]; // Warsaw default

  const validFestivals = festivals.filter(
    (f) => typeof f.lat === 'number' && typeof f.lng === 'number' && !isNaN(f.lat) && !isNaN(f.lng) && (f.lat !== 0 || f.lng !== 0)
  );

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#111412] shadow-xl ${className}`}>
      <MapContainer
        center={defaultCenter as [number, number]}
        zoom={5}
        scrollWheelZoom={false}
        className="h-full w-full min-h-[360px] z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController festivals={validFestivals} />
        {validFestivals.map((fest, idx) => (
          <Marker key={`${fest.lat}-${fest.lng}-${idx}`} position={[fest.lat, fest.lng]}>
            <Popup className="rounded-xl">
              <div className="p-1 font-sans text-xs">
                <h4 className="font-bold text-slate-900 text-sm mb-1">{fest.name}</h4>
                {fest.date && (
                  <p className="flex items-center gap-1.5 text-slate-600 mb-1">
                    <span>📅</span> {fest.date}
                  </p>
                )}
                {fest.url && (
                  <a
                    href={fest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-[11px] font-semibold text-emerald-600 hover:underline"
                  >
                    View Tickets &rarr;
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default FestivalMap;
