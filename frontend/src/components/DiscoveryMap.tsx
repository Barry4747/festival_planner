import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../lib/axios';
import {
  MapPin,
  Calendar,
  Sliders,
  Loader2,
  ExternalLink,
  Sparkles,
  Info,
  RefreshCw,
  Navigation,
} from 'lucide-react';

// Ensure default icon compatibility with Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const createFestivalIcon = (isSelected: boolean) => {
  const borderBg = isSelected
    ? 'bg-emerald-400 text-black border-white shadow-emerald-500/60 scale-110 z-50'
    : 'bg-[#111412] text-emerald-400 border-emerald-500/60 shadow-black/80 hover:scale-105';
  return L.divIcon({
    className: 'festival-marker-icon',
    html: `<div class="flex h-8 w-8 items-center justify-center rounded-full border-2 ${borderBg} shadow-lg transition-all">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

const CenterPinIcon = L.divIcon({
  className: 'center-pin-marker',
  html: `<div class="relative flex h-8 w-8 items-center justify-center">
    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40"></span>
    <div class="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-md">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
    </div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Map click capture component
const MapClickHandler: React.FC<{ onPinChange: (lat: number, lng: number) => void }> = ({ onPinChange }) => {
  useMapEvents({
    click(e) {
      onPinChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Map center/zoom controller when pin changes
const MapRecenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center[0], center[1]]);
  return null;
};

import type { Festival } from '../types';
import { SuggestFestivalModal } from './SuggestFestivalModal';

export type FestivalItem = Festival;

interface DiscoveryMapProps {
  selectedFestival: FestivalItem | null;
  onSelectFestival: (festival: FestivalItem | null) => void;
  onOpenSuggestModal?: () => void;
}

const RADIUS_PRESETS = [50, 100, 250, 500];

export const DiscoveryMap: React.FC<DiscoveryMapProps> = ({
  selectedFestival,
  onSelectFestival,
  onOpenSuggestModal,
}) => {
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState<boolean>(false);
  // Default pin: Warsaw / Central Poland
  const [pin, setPin] = useState<{ lat: number; lng: number }>({ lat: 52.2297, lng: 21.0122 });
  const [radiusKm, setRadiusKm] = useState<number>(100);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [festivals, setFestivals] = useState<FestivalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<any>(null);

  const fetchFestivals = async (lat: number, lng: number, radius: number, start: string, end: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        lat: lat.toFixed(4),
        lng: lng.toFixed(4),
        radius_km: radius,
      };
      if (start) params.start_date = start;
      if (end) params.end_date = end;

      const response = await api.get('/api/festivals/map', { params });
      const items: FestivalItem[] = Array.isArray(response.data)
        ? response.data
        : response.data?.festivals || [];
      setFestivals(items);
    } catch (err: any) {
      console.error('Failed to fetch map festivals:', err);
      setError('Could not load festivals for this location.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchFestivals(pin.lat, pin.lng, radiusKm, startDate, endDate);
    }, 400);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [pin.lat, pin.lng, radiusKm, startDate, endDate]);

  const handlePinChange = (lat: number, lng: number) => {
    setPin({ lat, lng });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111412] shadow-xl">
      {/* ── TOP CONTROL PANEL ── */}
      <div className="border-b border-white/10 bg-[#0d0f0e] p-4 space-y-3.5">
        {/* Header & Pin coordinates status */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
                Interactive Discovery Map
              </h2>
              <p className="text-[11px] text-slate-400">
                Click anywhere on map to move search center pin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-mono text-slate-300">
              <Navigation className="h-3 w-3 text-emerald-400" />
              <span>{pin.lat.toFixed(3)}, {pin.lng.toFixed(3)}</span>
            </div>
            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-[11px] hidden sm:inline">Scanning API...</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls Grid: Date pickers & Radius slider */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-center">
          {/* Start Date */}
          <div className="sm:col-span-3">
            <label className="mb-1 block text-[10px] font-medium text-slate-400">
              START DATE
            </label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-500 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#151917] pl-8 pr-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="sm:col-span-3">
            <label className="mb-1 block text-[10px] font-medium text-slate-400">
              END DATE
            </label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-emerald-500 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#151917] pl-8 pr-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Radius Slider & Quick Presets */}
          <div className="sm:col-span-6 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
              <span className="flex items-center gap-1">
                <Sliders className="h-3 w-3 text-emerald-400" />
                <span>SEARCH RADIUS: <strong className="text-white">{radiusKm} KM</strong></span>
              </span>
              <div className="flex gap-1">
                {RADIUS_PRESETS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRadiusKm(val)}
                    className={`rounded px-1.5 py-0.5 text-[9px] font-semibold transition-all ${
                      radiusKm === val
                        ? 'bg-emerald-500 text-black'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {val}km
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ── MAP CONTAINER ── */}
      <div className="relative flex-1 min-h-[420px] w-full">
        {/* Error overlay if any */}
        {error && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] rounded-xl border border-red-500/30 bg-red-950/90 px-4 py-2 text-xs text-red-200 shadow-xl flex items-center gap-2">
            <span>{error}</span>
            <button
              onClick={() => fetchFestivals(pin.lat, pin.lng, radiusKm, startDate, endDate)}
              className="underline font-semibold hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        <MapContainer
          center={[pin.lat, pin.lng]}
          zoom={6}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Listen for map clicks to move pin */}
          <MapClickHandler onPinChange={handlePinChange} />

          {/* Recenter viewport when pin changes */}
          <MapRecenter center={[pin.lat, pin.lng]} />

          {/* Search Center Circle overlay */}
          <Circle
            center={[pin.lat, pin.lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.12,
              weight: 1.5,
              dashArray: '5, 5',
            }}
          />

          {/* Search Center Pin */}
          <Marker position={[pin.lat, pin.lng]} icon={CenterPinIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 text-center font-sans">
                <div className="text-xs font-bold text-slate-900">📍 Search Center Pin</div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  Showing festivals within {radiusKm} km
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Discovered Festival Markers */}
          {festivals.map((festival) => {
            if (typeof festival.lat !== 'number' || typeof festival.lng !== 'number') return null;
            const isSelected = selectedFestival?.id === festival.id;
            const isLocal = festival.source_name && festival.source_name.toLowerCase().includes('local');
            const dateDisplay = festival.start_date || festival.dates || '';

            return (
              <Marker
                key={festival.id}
                position={[festival.lat, festival.lng]}
                icon={createFestivalIcon(isSelected)}
                eventHandlers={{
                  click: () => {
                    onSelectFestival(festival);
                  },
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="w-[210px] p-1 font-sans text-slate-900">
                    {(festival.image_url || festival.image) && (
                      <div className="mb-2 h-24 w-full overflow-hidden rounded-lg bg-slate-100">
                        <img
                          src={festival.image_url || festival.image}
                          alt={festival.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <h4 className="text-xs font-bold leading-tight text-slate-900 flex-1">
                        {festival.name}
                      </h4>
                      {isLocal ? (
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 border border-emerald-300 shadow-sm">
                          ✨ Niche/Exclusive
                        </span>
                      ) : festival.source_name ? (
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-700 border border-slate-300">
                          {festival.source_name}
                        </span>
                      ) : null}
                    </div>

                    {dateDisplay && (
                      <p className="mt-1.5 text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                        📅 <span>{dateDisplay}</span>
                        {festival.end_date && festival.end_date !== dateDisplay && (
                          <span> - {festival.end_date}</span>
                        )}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2 border-slate-200">
                      {festival.url && (
                        <a
                          href={festival.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 hover:underline"
                        >
                          <span>Tickets</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectFestival(festival)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white shadow hover:bg-emerald-700 transition-colors"
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>Ask AI about this</span>
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Suggestion Button over the map */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          <button
            type="button"
            onClick={() => (onOpenSuggestModal ? onOpenSuggestModal() : setIsSuggestModalOpen(true))}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/60 bg-[#111412]/95 px-4 py-2.5 text-xs font-bold text-emerald-400 shadow-2xl backdrop-blur-md hover:bg-emerald-500 hover:text-black hover:scale-105 transition-all group"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 group-hover:text-black" />
            <span>Missing a festival? Suggest it here!</span>
          </button>
        </div>
      </div>

      {/* Internal Suggest Festival Modal in case controlled within DiscoveryMap */}
      <SuggestFestivalModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
      />

      {/* ── FOOTER STATUS BAR ── */}
      <div className="flex items-center justify-between border-t border-white/10 bg-[#0d0f0e] px-4 py-2.5 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-emerald-400" />
          <span>Found <strong className="text-white font-semibold">{festivals.length}</strong> festivals within {radiusKm} km</span>
        </div>
        <button
          type="button"
          onClick={() => fetchFestivals(pin.lat, pin.lng, radiusKm, startDate, endDate)}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Pins</span>
        </button>
      </div>
    </div>
  );
};

export default DiscoveryMap;
