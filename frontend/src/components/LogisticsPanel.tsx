import React, { useState } from 'react';
import { api } from '../lib/axios';
import { LocationAutocomplete } from './LocationAutocomplete';
import type { FestivalItem } from './DiscoveryMap';
import { Car, Train, Navigation, Loader2, MapPin, Clock, Fuel, LocateFixed } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useGeolocation } from '../utils/useGeolocation';

export interface TrainLeg {
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  train_name: string;
  departure: string;
  arrival: string;
}

export interface RouteStep {
  mode: string;
  duration: string;
  instruction?: string;
  polyline: [number, number][];
  line_name?: string;
  color?: string;
  departure_stop?: string;
  departure_time?: string;
  arrival_stop?: string;
  arrival_time?: string;
  start_location?: [number, number];
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
    total_duration?: string;
    distance?: string;
    route_coordinates?: [number, number][];
    steps?: RouteStep[];
    status?: string;
    message?: string;
    itineraries?: any[];
    origin_name?: string;
    origin_coords?: [number, number];
    dest_name?: string;
    dest_coords?: [number, number];
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
    setSelectedTrainIndex: onSelectedTrainIndexChange,
  } = usePlannerStore();
  
  const transportData = routeData.transportData;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { locateUser, isLocating, error: geoError } = useGeolocation();

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
          dest_name: selectedFestival.city || selectedFestival.name.split('|')[0].replace('Festival', '').trim(),
        },
      });
      if (response.data) {
        setRouteData({ coordinates: null, transportData: response.data });
        onActiveTransportModeChange('car');
        onSelectedTrainIndexChange(0);
        usePlannerStore.getState().syncMultiLegData();
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
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, height: '100%', minHeight: 0 }}>
      {/* Origin input */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A1A1AA', marginBottom: '8px' }}>
          <MapPin size={11} /> Starting City
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <LocationAutocomplete
              value={originCity}
              onChange={onOriginCityChange}
              placeholder="e.g. Warsaw, Berlin, Prague..."
            />
            <button
              onClick={locateUser}
              disabled={isLocating}
              title="Locate Me"
              style={{
                position: 'absolute',
                right: '32px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: isLocating ? '#10B981' : '#A1A1AA',
                cursor: isLocating ? 'not-allowed' : 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="hover:text-white transition-colors"
            >
              {isLocating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
            </button>
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
        {geoError && (
          <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '6px' }}>{geoError}</p>
        )}
      </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }} className="no-scrollbar">
              
              {transportData.train.message && (
                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '2px', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <Navigation size={14} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.65rem', color: '#93c5fd', lineHeight: 1.5, margin: 0 }}>
                    {transportData.train.message}
                  </p>
                </div>
              )}

              {transportData.train.status !== 'success' && (!transportData.train.steps || transportData.train.steps.length === 0) ? (
                <p style={{ fontSize: '0.75rem', color: '#A1A1AA', textAlign: 'center', padding: '24px 0' }}>
                  No transit routes found for this journey.
                </p>
              ) : (
                <div
                  style={{
                    backgroundColor: '#1E1E1E',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    padding: '12px',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#EDEDED' }}>
                        {transportData.train.total_duration}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#A1A1AA' }}>
                        {transportData.train.distance}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                    {transportData.train.steps?.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12px', flexShrink: 0 }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: step.color || (step.mode === 'WALKING' ? '#6b7280' : '#ef4444'), marginTop: '4px', zIndex: 1 }} />
                          {idx < (transportData.train.steps!.length - 1) && (
                            <div style={{ width: '2px', flex: 1, backgroundColor: step.color || (step.mode === 'WALKING' ? '#6b7280' : '#ef4444'), opacity: 0.5, marginTop: '2px', marginBottom: '2px' }} />
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: idx < (transportData.train.steps!.length - 1) ? '16px' : '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: step.color || (step.mode === 'WALKING' ? '#9ca3af' : '#EDEDED') }}>
                              {step.mode === 'WALKING' ? 'Walk' : step.line_name}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#A1A1AA', fontWeight: 500 }}>{step.duration}</span>
                          </div>
                          {step.mode !== 'WALKING' && step.departure_stop && (
                            <div style={{ fontSize: '0.65rem', color: '#A1A1AA', lineHeight: 1.4, marginTop: '2px' }}>
                              <div><strong style={{color: '#D4D4D8'}}>{step.departure_time}</strong> {step.departure_stop}</div>
                              {step.arrival_stop && <div><strong style={{color: '#D4D4D8'}}>{step.arrival_time}</strong> {step.arrival_stop}</div>}
                            </div>
                          )}
                          {step.mode === 'WALKING' && step.instruction && (
                            <span style={{ fontSize: '0.65rem', color: '#A1A1AA', marginTop: '2px' }} dangerouslySetInnerHTML={{ __html: step.instruction }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
