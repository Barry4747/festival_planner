import React, { useCallback, useEffect, useRef, useState } from 'react';

import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, CircleMarker, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../lib/axios';
import {

  Calendar,
  Sliders,
  Loader2,
  ExternalLink,
  Sparkles,
  Info,
  RefreshCw,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useTranslation } from 'react-i18next';

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
    className: 'bg-transparent border-none',
    html: `<div class="flex h-8 w-8 items-center justify-center rounded-full border-2 ${borderBg} shadow-lg transition-all">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

const OriginPinIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;position:relative">
    <div style="position:absolute;width:30px;height:30px;border-radius:50%;background:rgba(59,130,246,0.15);animation:pulse 1.8s ease-in-out infinite"></div>
    <div style="position:relative;width:20px;height:20px;border-radius:50%;background:#3b82f6;border:2px solid #fff;display:flex;align-items:center;justify-content:center">
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L12 22M2 12L22 12"/></svg>
    </div>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const getCenterPinIcon = (isLoading: boolean) => L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="relative flex h-8 w-8 items-center justify-center">
    ${isLoading 
      ? `<span class="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-emerald-500 opacity-60"></span>` 
      : `<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40"></span>`
    }
    <div class="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-md">
      ${isLoading
        ? `<svg class="animate-spin text-white w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>`
      }
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

// Route bounding controller when activeRouteSteps or transportData change
const RouteFitter: React.FC<{
  activeRouteSteps?: RouteStep[] | null;
  transportData?: TransportRoutesData | null;
  activeTransportMode?: 'car' | 'train';
  selectedTrainIndex?: number;
}> = ({ activeRouteSteps, transportData, activeTransportMode, selectedTrainIndex = 0 }) => {
  const map = useMap();
  useEffect(() => {
    try {
      if (activeRouteSteps && activeRouteSteps.length > 0) {
        const allCoords = activeRouteSteps.flatMap(step => step.polyline);
        if (allCoords.length > 0) {
          map.fitBounds(allCoords, { padding: [50, 50] });
          return;
        }
      }
      if (transportData) {
        if (activeTransportMode === 'car' && transportData.car?.geometry?.length > 0) {
          map.fitBounds(transportData.car.geometry, { padding: [60, 60] });
          return;
        } else if (activeTransportMode === 'train' && transportData.train?.steps && transportData.train.steps.length > 0) {
          const allCoords = transportData.train.steps.flatMap(step => step.polyline);
          if (allCoords.length > 0) {
            map.fitBounds(allCoords, { padding: [60, 60] });
            return;
          }
        }
      }
    } catch (e) {
      console.error("RouteFitter fitBounds error:", e);
    }
  }, [activeRouteSteps, transportData, activeTransportMode, selectedTrainIndex, map]);
  return null;
};

import type { Festival } from '../types';
import { SuggestFestivalModal } from './SuggestFestivalModal';
import type { TransportRoutesData, RouteStep } from './LogisticsPanel';

export type FestivalItem = Festival;

const TrainStationPinIcon = new L.DivIcon({
  html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.5); border: 2px solid #ffffff;">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="2" ry="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path><path d="M8 19l-2 3"></path><path d="M18 22l-2-3"></path><path d="M8 15h0"></path><path d="M16 15h0"></path></svg>
         </div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface DiscoveryMapProps {
  selectedFestival: FestivalItem | null;
  onSelectFestival: (festival: FestivalItem | null) => void;
  onOpenSuggestModal?: () => void;
  onFestivalsLoaded?: (festivals: FestivalItem[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  routeCoordinates?: [number, number][] | null;
  transportData?: TransportRoutesData | null;
  activeTransportMode?: 'car' | 'train';
  selectedTrainIndex?: number;
  savedTrips?: FestivalItem[];
  onToggleSavedTrip?: (festival: FestivalItem) => Promise<void> | void;
  originCoords?: [number, number] | null;
}

const RADIUS_PRESETS = [50, 100, 250, 500];

export const DiscoveryMap: React.FC<DiscoveryMapProps> = ({
  selectedFestival,
  onSelectFestival,
  onOpenSuggestModal,
  onFestivalsLoaded,
  onLoadingChange,
  routeCoordinates,
  transportData,
  activeTransportMode,
  selectedTrainIndex = 0,
  savedTrips = [],
  onToggleSavedTrip,
  originCoords,
}) => {
  const { t } = useTranslation();
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState<boolean>(false);
  const [savingTripId, setSavingTripId] = useState<string | null>(null);
  // Default pin: Warsaw / Central Poland
  const [pin, setPin] = useState<{ lat: number; lng: number }>({ lat: 52.2297, lng: 21.0122 });
  const [radiusKm, setRadiusKm] = useState<number>(100);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [festivals, setFestivals] = useState<FestivalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  const activeTab = usePlannerStore((state) => state.activeTab);
  const weatherLayer = usePlannerStore((state) => state.weatherLayer);
  const setWeatherLayer = usePlannerStore((state) => state.setWeatherLayer);
  const routeData = usePlannerStore((state) => state.routeData);
  const activeRouteSteps = usePlannerStore((state) => state.activeRouteSteps);

  const [currentWeatherPoints, setCurrentWeatherPoints] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab !== 'weather') {
      setCurrentWeatherPoints([]);
      return;
    }
    
    let isMounted = true;
    const fetchPoints = async () => {
      const points = [];
      if (originCoords) {
        try {
          const res = await api.get(`/api/weather/current?lat=${originCoords[0]}&lon=${originCoords[1]}`);
          if (!res.data.error) points.push({ ...res.data, label: 'Origin' });
        } catch (e) {
          console.warn('[DiscoveryMap] Failed to fetch origin weather:', e);
        }
      }

      const destCoords = selectedFestival ? [selectedFestival.lat, selectedFestival.lng] : [pin.lat, pin.lng];
      try {
        const res = await api.get(`/api/weather/current?lat=${destCoords[0]}&lon=${destCoords[1]}`);
        if (!res.data.error) points.push({ ...res.data, label: selectedFestival ? selectedFestival.name : 'Destination' });
      } catch (e) {
        console.warn('[DiscoveryMap] Failed to fetch destination weather:', e);
      }
      if (isMounted) {
        // Filter out duplicates if origin and destination are the same/very close
        const uniquePoints = points.filter((p, i, self) => 
          i === self.findIndex((t) => Math.abs(t.lat - p.lat) < 0.1 && Math.abs(t.lon - p.lon) < 0.1)
        );
        setCurrentWeatherPoints(uniquePoints);
      }
    };
    fetchPoints();
    return () => { isMounted = false; };
  }, [activeTab, originCoords, selectedFestival, pin.lat, pin.lng]);

  const handleToggle = async (e: React.MouseEvent, festival: FestivalItem) => {
    e.stopPropagation();
    if (!onToggleSavedTrip) return;
    setSavingTripId(String(festival.id));
    try {
      await onToggleSavedTrip(festival);
    } finally {
      setSavingTripId(null);
    }
  };

  const fetchFestivals = useCallback(
    async (lat: number, lng: number, radius: number, start: string, end: string) => {
      setLoading(true);
      if (onLoadingChange) onLoadingChange(true);
      setError(null);
      try {
        const params: Record<string, string | number> = {
          lat: Number(lat.toFixed(4)),
          lng: Number(lng.toFixed(4)),
          radius_km: radius,
        };
        if (start) params.start_date = start;
        if (end) params.end_date = end;

        const response = await api.get('/api/festivals/map', { params });
        const items: FestivalItem[] = Array.isArray(response.data)
          ? response.data
          : response.data?.festivals ?? [];
        setFestivals(items);
        if (onFestivalsLoaded) onFestivalsLoaded(items);
      } catch (err: unknown) {
        console.error('[DiscoveryMap] Failed to fetch map festivals:', err);
        setError('Could not load festivals for this location.');
      } finally {
        setLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      }
    },
    [onFestivalsLoaded, onLoadingChange],
  );


  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchFestivals(pin.lat, pin.lng, radiusKm, startDate, endDate);
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [pin.lat, pin.lng, radiusKm, startDate, endDate, fetchFestivals]);


  const handlePinChange = (lat: number, lng: number) => {
    setPin({ lat, lng });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: '#1E1E1E' }}>
      {/* ── CONTROL PANEL ── */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #2D2D2D', backgroundColor: '#1E1E1E', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Loading indicator moved to controls row or hidden since it's a small detail, let's put it next to radius if needed, or just keep it simple */}
        {/* Controls row: dates + radius */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Start Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A1A1AA' }}>From</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={11} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#10B981', pointerEvents: 'none' }} />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          {/* End Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A1A1AA' }}>To</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={11} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#10B981', pointerEvents: 'none' }} />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          {/* Radius */}
          <div style={{ flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sliders size={10} /> Radius: <strong style={{ color: '#EDEDED' }}>{radiusKm} km</strong>
              </label>
              <div style={{ display: 'flex', gap: '3px' }}>
                {RADIUS_PRESETS.map(val => (
                  <button
                    key={val}
                    onClick={() => setRadiusKm(val)}
                    style={{
                      padding: '2px 6px',
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: radiusKm === val ? '#10B981' : '#2D2D2D',
                      backgroundColor: radiusKm === val ? '#10B981' : 'transparent',
                      color: radiusKm === val ? '#121212' : '#A1A1AA',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                    }}
                  >
                    {val}km
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min={10} max={500} step={10}
              value={radiusKm}
              onChange={e => setRadiusKm(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10B981', cursor: 'pointer', height: '2px' }}
            />
          </div>
        </div>
      </div>
      {/* ── MAP CONTAINER ── */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, width: '100%' }}>
        {error && (
          <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'rgba(127,29,29,0.95)', border: '1px solid rgba(239,68,68,0.4)', padding: '6px 12px', borderRadius: '2px', fontSize: '0.75rem', color: '#fca5a5' }}>
            <span>{error}</span>
            <button onClick={() => fetchFestivals(pin.lat, pin.lng, radiusKm, startDate, endDate)} style={{ fontWeight: 600, textDecoration: 'underline', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button>
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
              className={activeTab === 'weather' ? 'brightness-[0.3] grayscale contrast-125' : ''}
            />
          {activeTab === 'weather' && weatherLayer !== 'none' && (
            <TileLayer
              key={weatherLayer}
              attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
              url={`https://tile.openweathermap.org/map/${weatherLayer}/{z}/{x}/{y}.png?appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`}
              opacity={1}
              className="saturate-200 contrast-150 drop-shadow-md"
              zIndex={5}
            />
          )}

          {/* Concrete Weather Data Points */}
          {activeTab === 'weather' && currentWeatherPoints.map((point, idx) => (
            <Marker
              key={`weather-pt-${idx}`}
              position={[point.lat, point.lon]}
              icon={L.divIcon({
                className: 'bg-transparent border-none',
                html: `<div class="flex items-center gap-2 px-2 py-1.5 bg-[#18181b] border border-[#27272a] rounded-md shadow-xl pointer-events-none whitespace-nowrap overflow-hidden max-w-[220px]">
                         <span class="text-[10px] text-zinc-400 font-medium uppercase truncate max-w-[80px]" title="${point.label}">${point.label}</span>
                         <span class="text-sm font-bold text-white shrink-0">${Math.round(point.temp)}°C</span>
                         <div class="flex items-center gap-1 text-[11px] text-zinc-300 border-l border-[#27272a] pl-2 ml-1 shrink-0">
                           <svg style="transform: rotate(${point.wind_deg}deg);" class="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                           <span>${Math.round(point.wind_speed)} km/h</span>
                         </div>
                       </div>`,
                iconSize: [220, 36],
                iconAnchor: [110, 70] // Shifted significantly up to not overlap with festival pin
              })}
            />
          ))}

          {/* Listen for map clicks to move pin */}
          <MapClickHandler onPinChange={handlePinChange} />

          {/* Recenter viewport when pin changes */}
          <MapRecenter center={[pin.lat, pin.lng]} />

          {/* Render route polyline and fit bounds if travel route or transport data exists */}
          <RouteFitter
            activeRouteSteps={activeRouteSteps}
            transportData={transportData}
            activeTransportMode={activeTransportMode}
            selectedTrainIndex={selectedTrainIndex}
          />

          {/* Car Route from Logistics Panel */}
          {transportData && activeTransportMode === 'car' && transportData.car?.geometry && (
            <Polyline positions={transportData.car.geometry} color="#3b82f6" weight={5} opacity={0.85} />
          )}

          {/* Multi-step Train Route Render Engine */}
          {(() => {
            const stepsToRender = activeRouteSteps || (activeTransportMode === 'train' && transportData?.train?.steps ? transportData.train.steps : null);
            if (!stepsToRender || stepsToRender.length === 0) return null;

            return stepsToRender.map((step, idx) => {
              // Calculate midpoint of polyline for the duration label
              const midIndex = Math.floor(step.polyline.length / 2);
              const midPoint = step.polyline[midIndex];

              if (step.mode === 'WALKING') {
                return (
                  <React.Fragment key={`step-${idx}`}>
                    <Polyline 
                      positions={step.polyline} 
                      pathOptions={{ color: '#9ca3af', weight: 4, dashArray: '5, 10' }} 
                    />
                    {midPoint && (
                      <Marker 
                        position={midPoint} 
                        icon={L.divIcon({
                          className: 'bg-transparent border-none',
                          html: `<div class="px-2 py-1 bg-[#18181b] text-zinc-300 text-[10px] font-medium rounded-md border border-[#27272a] shadow-md whitespace-nowrap text-center">${step.duration}</div>`,
                          iconSize: [80, 24],
                          iconAnchor: [40, 12]
                        })} 
                      />
                    )}
                  </React.Fragment>
                );
              }
              return (
                <React.Fragment key={`step-${idx}`}>
                  <Polyline 
                    positions={step.polyline} 
                    pathOptions={{ color: step.color || '#3b82f6', weight: 5 }} 
                  />
                  {step.start_location && (
                    <>
                      <CircleMarker 
                        center={step.start_location} 
                        radius={4} 
                        pathOptions={{ color: '#ffffff', fillColor: step.color || '#3b82f6', fillOpacity: 1, weight: 2 }}
                      />
                      <Marker 
                        position={step.start_location}
                        icon={L.divIcon({
                          className: 'bg-transparent border-none',
                          html: `<div class="flex flex-col bg-[#18181b] border border-[#27272a] rounded-lg shadow-lg p-2 whitespace-nowrap pointer-events-none">
                                   <span class="text-xs font-semibold text-zinc-100">${step.departure_stop || 'Transit Stop'}</span>
                                   <span class="text-[10px] text-zinc-400">Departs: ${step.departure_time}</span>
                                 </div>`,
                          iconSize: [140, 50],
                          iconAnchor: [70, 60]
                        })}
                      />
                    </>
                  )}
                  {midPoint && (
                    <Marker 
                      position={midPoint} 
                      icon={L.divIcon({
                        className: 'bg-transparent border-none',
                        html: `<div class="px-2 py-1 bg-[#18181b] text-zinc-300 text-[10px] font-medium rounded-md border border-[#27272a] shadow-md whitespace-nowrap text-center">${step.duration}</div>`,
                        iconSize: [80, 24],
                        iconAnchor: [40, 12]
                      })} 
                    />
                  )}
                </React.Fragment>
              );
            });
          })()}

          {/* Fallback AI Chat Polyline when no explicit Logistics Panel data is active */}
          {!transportData && !activeRouteSteps && routeCoordinates && routeCoordinates.length > 0 && (
            <Polyline positions={routeCoordinates} color="#3b82f6" weight={5} opacity={0.7} />
          )}

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
          <Marker position={[pin.lat, pin.lng]} icon={getCenterPinIcon(loading)} interactive={false}>
            <Tooltip direction="bottom" offset={[0, 10]} opacity={0.9} permanent className="!bg-[#18181b] !border-[#27272a] !text-white !font-bold !text-[10px] !p-1 !rounded">
              {loading ? t('map.searching') : t('map.center')}
            </Tooltip>
          </Marker>
          {/* Origin City Pin (from Logistics panel) */}
          {originCoords && (
            activeTransportMode === 'train' && routeData.departureStationCoords && 
            (originCoords[0] !== routeData.departureStationCoords[0] || originCoords[1] !== routeData.departureStationCoords[1])
          ) ? (
            <CircleMarker
              center={originCoords as [number, number]}
              radius={6}
              pathOptions={{ color: '#ffffff', fillColor: '#10b981', fillOpacity: 1, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#121212' }}>
                  Your Origin: {routeData.originName || 'Current Location'}
                </span>
              </Tooltip>
            </CircleMarker>
          ) : originCoords ? (
            <Marker position={originCoords as [number, number]} icon={OriginPinIcon}>
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', padding: '4px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#121212', margin: '0 0 2px' }}>Origin / Start City</p>
                  <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>Your departure point</p>
                </div>
              </Popup>
            </Marker>
          ) : null}

          {/* Discovered Festival Markers */}
          {festivals.map((festival) => {
            if (typeof festival.lat !== 'number' || typeof festival.lng !== 'number') return null;
            const isSelected = selectedFestival?.id === festival.id;
            const isSaved = savedTrips.some(t => String(t.id) === String(festival.id));
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
              <Popup>
                  <div style={{ width: '220px', padding: '4px', fontFamily: 'Inter, sans-serif', color: '#EDEDED' }}>
                    {(festival.image_url || festival.image) && (
                      <div style={{ marginBottom: '8px', height: '90px', overflow: 'hidden', borderRadius: '2px', border: '1px solid #2D2D2D' }}>
                        <img src={festival.image_url || festival.image} alt={festival.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0, flex: 1, lineHeight: 1.2 }}>{festival.name}</h4>
                      {onToggleSavedTrip && (
                        <button
                          onClick={e => handleToggle(e, festival)}
                          title={isSaved ? 'Remove from My Trips' : 'Save to My Trips'}
                          disabled={savingTripId === String(festival.id)}
                          style={{ background: 'none', border: 'none', cursor: savingTripId === String(festival.id) ? 'not-allowed' : 'pointer', padding: '2px', opacity: savingTripId === String(festival.id) ? 0.7 : 1, display: 'flex', alignItems: 'center' }}
                        >
                          {savingTripId === String(festival.id) ? (
                            <Loader2 size={16} className="animate-spin" style={{ color: '#10B981' }} />
                          ) : isSaved ? (
                            <BookmarkCheck size={16} style={{ color: '#10B981' }} />
                          ) : (
                            <Bookmark size={16} style={{ color: '#A1A1AA' }} />
                          )}
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                      {isLocal ? (
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#10B981', border: '1px solid #10B981', padding: '1px 6px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Niche</span>
                      ) : festival.source_name ? (
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#A1A1AA', backgroundColor: '#121212', border: '1px solid #2D2D2D', padding: '1px 6px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={festival.source_name}>
                          {festival.source_name}
                        </span>
                      ) : null}
                    </div>

                    {dateDisplay && (
                      <p style={{ fontSize: '0.7rem', color: '#A1A1AA', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '4px', lineHeight: 1.4 }}>
                        <span>{dateDisplay}</span>
                        {festival.end_date && festival.end_date !== dateDisplay && <span>– {festival.end_date}</span>}
                      </p>
                    )}

                    <div style={{ paddingTop: '10px', borderTop: '1px solid #2D2D2D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {festival.url ? (
                        <a href={festival.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                          Tickets <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span />
                      )}
                      <button
                        onClick={() => onSelectFestival(festival)}
                        style={{ fontSize: '0.7rem', fontWeight: 600, color: '#121212', backgroundColor: '#10B981', border: 'none', padding: '4px 12px', borderRadius: '2px', cursor: 'pointer' }}
                      >
                        Open Chat
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating suggest button */}
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          
          <button
            onClick={() => onOpenSuggestModal ? onOpenSuggestModal() : setIsSuggestModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#10B981',
              backgroundColor: 'rgba(18,18,18,0.92)',
              border: '1px solid #2D2D2D',
              borderRadius: '2px',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#10B981'; e.currentTarget.style.color = '#121212'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(18,18,18,0.92)'; e.currentTarget.style.color = '#10B981'; }}
          >
            <Sparkles size={12} />
            Missing a festival? Suggest it
          </button>
        </div>
      </div>

      {/* Internal Suggest Festival Modal in case controlled within DiscoveryMap */}
      <SuggestFestivalModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
      />

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderTop: '1px solid #2D2D2D',
          backgroundColor: '#1E1E1E',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '0.7rem', color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={11} style={{ color: '#10B981' }} />
          <strong style={{ color: '#EDEDED' }}>{festivals.length}</strong>&nbsp;festivals within {radiusKm} km
        </span>
        <button
          onClick={() => fetchFestivals(pin.lat, pin.lng, radiusKm, startDate, endDate)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.65rem', color: '#A1A1AA',
            background: 'none', border: '1px solid #2D2D2D',
            borderRadius: '2px', padding: '3px 8px', cursor: 'pointer',
          }}
        >
          <RefreshCw size={10} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>
    </div>
  );
};

export default DiscoveryMap;

const inputStyle: React.CSSProperties = {
  paddingLeft: '28px',
  paddingRight: '8px',
  paddingTop: '6px',
  paddingBottom: '6px',
  fontSize: '0.75rem',
  backgroundColor: '#121212',
  border: '1px solid #2D2D2D',
  borderRadius: '2px',
  color: '#EDEDED',
  outline: 'none',
  width: '100%',
};

