import React, { useState } from 'react';
import { api } from '../lib/axios';
import { LocationAutocomplete } from './LocationAutocomplete';
import { WeatherWidget } from './WeatherWidget';
import type { FestivalItem } from './DiscoveryMap';
import { Car, Train, Navigation, Loader2, MapPin, Clock, Fuel, ArrowRight, Check } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';

export interface TrainLeg {
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  train_name: string;
  departure: string;
  arrival: string;
}

export interface TrainItinerary {
  departure_time: string;
  arrival_time: string;
  duration: string;
  transfers: number;
  provider?: string;
  connection_type?: string;
  legs?: TrainLeg[];
  path_coordinates?: [number, number][];
}

export interface TransportRoutesData {
  car: {
    geometry: [number, number][];
    duration: string;
    duration_hours?: number;
    duration_minutes?: number;
    cost: string;
    estimated_fuel_cost_pln?: number;
    distance_km: number;
    status: string;
  };
  train: {
    itineraries: TrainItinerary[];
    origin_coords: [number, number];
    dest_coords: [number, number];
    origin_name?: string;
    dest_name?: string;
  };
}

interface LogisticsPanelProps {
  selectedFestival: FestivalItem | null;
}

const Row: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; accent?: boolean }> = ({
  icon, label, value, accent,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #2D2D2D' }}>
    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#A1A1AA' }}>
      {icon}{label}
    </span>
    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: accent ? '#10B981' : '#EDEDED' }}>{value}</span>
  </div>
);

export const LogisticsPanel: React.FC<LogisticsPanelProps> = ({ selectedFestival }) => {
  const {
    departureCity: originCity,
    setDepartureCity: onOriginCityChange,
    routeData,
    setRouteData,
    transportMode: activeTransportMode,
    setTransportMode: onActiveTransportModeChange,
    selectedTrainIndex,
    setSelectedTrainIndex: onSelectedTrainIndexChange,
  } = usePlannerStore();
  
  const transportData = routeData.transportData;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetDirections = async () => {
    if (!selectedFestival || !originCity.trim()) {
      setError('Please enter your starting city.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/transport/routes', {
        params: {
          origin_city: originCity.trim(),
          dest_lat: selectedFestival.lat,
          dest_lng: selectedFestival.lng,
          date: selectedFestival.start_date || selectedFestival.dates || '2026-07-20',
          dest_name: selectedFestival.name,
        },
      });
      if (response.data) {
        setRouteData({ coordinates: null, transportData: response.data });
        onActiveTransportModeChange('car');
        onSelectedTrainIndexChange(0);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to calculate routes.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedFestival) {
    return (
      <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '1px solid #2D2D2D', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px' }}>
          <Navigation size={18} style={{ color: '#A1A1AA' }} />
        </div>
        <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#EDEDED' }}>No festival selected</p>
        <p style={{ fontSize: '0.75rem', color: '#A1A1AA', lineHeight: 1.6 }}>
          Select a festival on the map to compare car and train routes.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Origin input */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A1A1AA', marginBottom: '8px' }}>
          <MapPin size={11} /> Starting City
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <LocationAutocomplete
              value={originCity}
              onChange={onOriginCityChange}
              placeholder="e.g. Warsaw, Berlin, Prague..."
            />
          </div>
          <button
            onClick={handleGetDirections}
            disabled={loading || !originCity.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 14px',
              backgroundColor: loading || !originCity.trim() ? '#2D2D2D' : '#10B981',
              color: loading || !originCity.trim() ? '#A1A1AA' : '#121212',
              border: 'none',
              borderRadius: '2px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: loading || !originCity.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
              flexShrink: 0,
              height: '36px',
            }}
          >
            {loading ? (
              <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <Navigation size={14} />
            )}
            {loading ? 'Calculating...' : 'Get Routes'}
          </button>
        </div>
        {error && (
          <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '6px' }}>{error}</p>
        )}
      </div>

      <WeatherWidget />

      {/* Mode toggles */}
      {transportData && (
        <>
          <div style={{ display: 'flex', border: '1px solid #2D2D2D', borderRadius: '2px', overflow: 'hidden' }}>
            {(['car', 'train'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => onActiveTransportModeChange(mode)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  backgroundColor: activeTransportMode === mode ? '#10B981' : 'transparent',
                  color: activeTransportMode === mode ? '#121212' : '#A1A1AA',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  borderRight: mode === 'car' ? '1px solid #2D2D2D' : 'none',
                }}
              >
                {mode === 'car' ? <Car size={13} /> : <Train size={13} />}
                {mode === 'car' ? 'Car' : 'Train'}
              </button>
            ))}
          </div>

          {/* Car results */}
          {activeTransportMode === 'car' && transportData.car && (
            <div style={{ border: '1px solid #2D2D2D', borderRadius: '2px', padding: '0 16px' }}>
              <Row icon={<Clock size={12} />} label="Drive Time" value={transportData.car.duration} />
              <Row icon={<MapPin size={12} />} label="Distance" value={`${transportData.car.distance_km} km`} />
              <Row icon={<Fuel size={12} />} label="Est. Fuel Cost" value={transportData.car.cost} accent />
            </div>
          )}
          {activeTransportMode === 'car' && !transportData.car && (
            <p style={{ fontSize: '0.75rem', color: '#A1A1AA', textAlign: 'center', padding: '24px 0' }}>
              No car route data available.
            </p>
          )}

          {/* Train results */}
          {activeTransportMode === 'train' && transportData.train && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }} className="no-scrollbar">
              {transportData.train.itineraries.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: '#A1A1AA', textAlign: 'center', padding: '24px 0' }}>
                  No train itineraries found for this route.
                </p>
              ) : (
                transportData.train.itineraries.map((itinerary, idx) => {
                  const isSelected = selectedTrainIndex === idx;
                  const legsChain = itinerary.legs && itinerary.legs.length > 0
                    ? [itinerary.legs[0].origin.name, ...itinerary.legs.map(l => l.destination.name)].join(' → ')
                    : null;

                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectedTrainIndexChange(idx)}
                      style={{
                        padding: '12px 14px',
                        border: `1px solid ${isSelected ? '#10B981' : '#2D2D2D'}`,
                        borderRadius: '2px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#1A2E25' : 'transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      {/* Times row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#10B981' }}>
                          <span>{itinerary.departure_time.split(' ')[1] || itinerary.departure_time}</span>
                          <ArrowRight size={12} style={{ color: '#A1A1AA' }} />
                          <span>{itinerary.arrival_time.split(' ')[1] || itinerary.arrival_time}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isSelected && <Check size={12} style={{ color: '#10B981' }} />}
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: '#10B981',
                            backgroundColor: '#1A2E25',
                            border: '1px solid #2D5A3D',
                            padding: '2px 6px',
                            borderRadius: '2px',
                          }}>{itinerary.duration}</span>
                        </div>
                      </div>

                      {/* Provider / transfers */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#A1A1AA', marginBottom: legsChain ? '8px' : 0 }}>
                        <span>{itinerary.provider || 'PKP / DB'}</span>
                        <span style={{ color: itinerary.transfers === 0 ? '#10B981' : '#A1A1AA' }}>
                          {itinerary.transfers === 0 ? 'Direct' : `${itinerary.transfers} transfer${itinerary.transfers > 1 ? 's' : ''}`}
                        </span>
                      </div>

                      {/* Leg chain */}
                      {legsChain && (
                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#121212', border: '1px solid #2D2D2D', borderRadius: '2px' }}>
                          <p style={{ fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A1A1AA', marginBottom: '4px' }}>Route</p>
                          <p style={{ fontSize: '0.7rem', color: '#EDEDED', fontFamily: 'monospace', lineHeight: 1.5, wordBreak: 'break-word' }}>{legsChain}</p>

                          {itinerary.legs && itinerary.legs.length > 1 && isSelected && (
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #2D2D2D', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {itinerary.legs.map((leg, legIdx) => (
                                <div key={legIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#A1A1AA' }}>
                                  <span>
                                    <strong style={{ color: '#EDEDED' }}>{leg.departure}</strong> {leg.origin.name}
                                    {' → '}
                                    <strong style={{ color: '#EDEDED' }}>{leg.arrival}</strong> {leg.destination.name}
                                  </span>
                                  <span style={{ color: '#10B981', marginLeft: '8px', flexShrink: 0 }}>{leg.train_name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
          {activeTransportMode === 'train' && !transportData.train && (
            <p style={{ fontSize: '0.75rem', color: '#A1A1AA', textAlign: 'center', padding: '24px 0' }}>
              No train itineraries available.
            </p>
          )}
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LogisticsPanel;
