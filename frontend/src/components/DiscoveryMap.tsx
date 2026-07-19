import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, CircleMarker, Tooltip, useMapEvents, useMap } from 'react-leaflet';
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
  Bookmark,
  BookmarkCheck,
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

const OriginPinIcon = L.divIcon({
  className: 'origin-pin-marker',
  html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;position:relative">
    <div style="position:absolute;width:30px;height:30px;border-radius:50%;background:rgba(59,130,246,0.15);animation:pulse 1.8s ease-in-out infinite"></div>
    <div style="position:relative;width:20px;height:20px;border-radius:50%;background:#3b82f6;border:2px solid #fff;display:flex;align-items:center;justify-content:center">
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L12 22M2 12L22 12"/></svg>
    </div>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

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

// Route bounding controller when routeCoordinates or transportData change
const RouteFitter: React.FC<{
  routeCoordinates?: [number, number][] | null;
  transportData?: TransportRoutesData | null;
  activeTransportMode?: 'car' | 'train';
  selectedTrainIndex?: number;
}> = ({ routeCoordinates, transportData, activeTransportMode, selectedTrainIndex = 0 }) => {
  const map = useMap();
  useEffect(() => {
    try {
      if (transportData) {
        if (activeTransportMode === 'car' && transportData.car?.geometry?.length > 0) {
          map.fitBounds(transportData.car.geometry, { padding: [60, 60] });
          return;
        } else if (activeTransportMode === 'train' && transportData.train) {
          const activeJourney = transportData.train.itineraries[selectedTrainIndex] || transportData.train.itineraries[0];
          if (activeJourney?.path_coordinates && activeJourney.path_coordinates.length > 0) {
            map.fitBounds(activeJourney.path_coordinates, { padding: [60, 60] });
            return;
          }
          const pts: [number, number][] = [];
          if (transportData.train.origin_coords) pts.push(transportData.train.origin_coords);
          if (transportData.train.dest_coords) pts.push(transportData.train.dest_coords);
          if (pts.length > 0) {
            map.fitBounds(pts, { padding: [60, 60] });
            return;
          }
        }
      }
      if (routeCoordinates && routeCoordinates.length > 0) {
        map.fitBounds(routeCoordinates, { padding: [50, 50] });
      }
    } catch (e) {
      console.error("RouteFitter fitBounds error:", e);
    }
  }, [routeCoordinates, transportData, activeTransportMode, selectedTrainIndex, map]);
  return null;
};

import type { Festival } from '../types';
import { SuggestFestivalModal } from './SuggestFestivalModal';
import type { TransportRoutesData } from './LogisticsPanel';

export type FestivalItem = Festival;

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
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState<boolean>(false);
  const [savingTripId, setSavingTripId] = useState<string | null>(null);
  // Default pin: Warsaw / Central Poland
  const [pin, setPin] = useState<{ lat: number; lng: number }>({ lat: 52.2297, lng: 21.0122 });
  const [radiusKm, setRadiusKm] = useState<number>(100);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [festivals, setFestivals] = useState<FestivalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<any>(null);

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

  const fetchFestivals = async (lat: number, lng: number, radius: number, start: string, end: string) => {
    setLoading(true);
    if (onLoadingChange) onLoadingChange(true);
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
      if (onFestivalsLoaded) onFestivalsLoaded(items);
    } catch (err: any) {
      console.error('Failed to fetch map festivals:', err);
      setError('Could not load festivals for this location.');
    } finally {
      setLoading(false);
      if (onLoadingChange) onLoadingChange(false);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: '#1E1E1E' }}>
      {/* ── CONTROL PANEL ── */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #2D2D2D', backgroundColor: '#1E1E1E', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={13} style={{ color: '#10B981' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#EDEDED' }}>
              Discovery Map
            </span>
            <span style={{ fontSize: '0.65rem', color: '#A1A1AA', fontFamily: 'monospace' }}>
              {pin.lat.toFixed(3)}, {pin.lng.toFixed(3)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading && <Loader2 size={12} style={{ color: '#10B981', animation: 'spin 0.8s linear infinite' }} />}
          </div>
        </div>

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
          />

          {/* Listen for map clicks to move pin */}
          <MapClickHandler onPinChange={handlePinChange} />

          {/* Recenter viewport when pin changes */}
          <MapRecenter center={[pin.lat, pin.lng]} />

          {/* Render route polyline and fit bounds if travel route or transport data exists */}
          <RouteFitter
            routeCoordinates={routeCoordinates}
            transportData={transportData}
            activeTransportMode={activeTransportMode}
            selectedTrainIndex={selectedTrainIndex}
          />

          {/* Car Route from Logistics Panel */}
          {transportData && activeTransportMode === 'car' && transportData.car?.geometry && (
            <Polyline positions={transportData.car.geometry} color="#3b82f6" weight={5} opacity={0.85} />
          )}

          {/* Train Route & Stations from Logistics Panel */}
          {transportData && activeTransportMode === 'train' && transportData.train && (() => {
            const activeJourney = transportData.train.itineraries[selectedTrainIndex] || transportData.train.itineraries[0];
            if (!activeJourney) return null;

            const pathCoords = activeJourney.path_coordinates && activeJourney.path_coordinates.length > 0
              ? activeJourney.path_coordinates
              : [transportData.train.origin_coords, transportData.train.dest_coords].filter(Boolean);

            const legs = activeJourney.legs || [];

            return (
              <React.Fragment key={`train-route-${selectedTrainIndex}`}>
                <Polyline positions={pathCoords} color="#ef4444" weight={4} dashArray="6, 10" opacity={0.85} />

                {legs.map((leg, legIdx) => {
                  const isFirst = legIdx === 0;
                  const isLast = legIdx === legs.length - 1;

                  return (
                    <React.Fragment key={`leg-${legIdx}`}>
                      <CircleMarker
                        center={[leg.origin.lat, leg.origin.lng]}
                        radius={isFirst ? 8 : 7}
                        pathOptions={{ color: '#ffffff', fillColor: isFirst ? '#3b82f6' : '#f59e0b', fillOpacity: 1, weight: 2 }}
                      >
                        <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#121212' }}>
                            {isFirst ? 'Departure: ' : 'Transfer: '} {leg.origin.name} ({leg.departure})
                          </span>
                        </Tooltip>
                      </CircleMarker>

                      {isLast && (
                        <CircleMarker
                          center={[leg.destination.lat, leg.destination.lng]}
                          radius={8}
                          pathOptions={{ color: '#ffffff', fillColor: '#10b981', fillOpacity: 1, weight: 2 }}
                        >
                          <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#121212' }}>
                              Arrival: {leg.destination.name} ({leg.arrival})
                            </span>
                          </Tooltip>
                        </CircleMarker>
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })()}

          {/* Fallback AI Chat Polyline when no explicit Logistics Panel data is active */}
          {!transportData && routeCoordinates && routeCoordinates.length > 0 && (
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
          <Marker position={[pin.lat, pin.lng]} icon={CenterPinIcon}>
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', padding: '4px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#121212', margin: '0 0 2px' }}>Search Center</p>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>Showing festivals within {radiusKm} km</p>
              </div>
            </Popup>
          </Marker>
          {/* Origin City Pin (from Logistics panel) */}
          {originCoords && (
            <Marker position={originCoords} icon={OriginPinIcon}>
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', padding: '4px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#121212', margin: '0 0 2px' }}>Origin / Start City</p>
                  <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>Your departure point</p>
                </div>
              </Popup>
            </Marker>
          )}

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
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 1000 }}>
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

