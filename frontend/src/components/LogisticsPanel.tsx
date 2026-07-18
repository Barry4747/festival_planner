import React, { useState } from 'react';
import { api } from '../lib/axios';
import { LocationAutocomplete } from './LocationAutocomplete';
import type { FestivalItem } from './DiscoveryMap';
import {
  Car,
  Train,
  Navigation,
  Loader2,
  MapPin,
  Clock,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

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
  originCity: string;
  onOriginCityChange: (city: string) => void;
  transportData: TransportRoutesData | null;
  onTransportDataChange: (data: TransportRoutesData | null) => void;
  activeTransportMode: 'car' | 'train';
  onActiveTransportModeChange: (mode: 'car' | 'train') => void;
  selectedTrainIndex: number;
  onSelectedTrainIndexChange: (index: number) => void;
}

export const LogisticsPanel: React.FC<LogisticsPanelProps> = ({
  selectedFestival,
  originCity,
  onOriginCityChange,
  transportData,
  onTransportDataChange,
  activeTransportMode,
  onActiveTransportModeChange,
  selectedTrainIndex,
  onSelectedTrainIndexChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetDirections = async () => {
    if (!selectedFestival) return;
    if (!originCity.trim()) {
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
        onTransportDataChange(response.data);
        onSelectedTrainIndexChange(0);
      }
    } catch (err: any) {
      console.error('Transport routes fetch error:', err);
      setError(
        err.response?.data?.detail || err.message || 'Failed to calculate transport options. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!selectedFestival) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111412]/95 p-4 text-center shadow-xl backdrop-blur-md">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <Navigation className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-bold text-white">Dedicated Logistics & Transport</h3>
        <p className="mt-1 text-xs text-slate-400">
          Select a festival pin on the map to compare car driving vs train routes instantly.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111412]/95 p-4 shadow-2xl backdrop-blur-md transition-all">
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Navigation className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Logistics to {selectedFestival.name}
            </h3>
            <p className="text-[10px] text-slate-400">
              {selectedFestival.city || 'Europe'}
            </p>
          </div>
        </div>
      </div>

      {/* Origin Autocomplete Input & Button */}
      <div className="mb-3 space-y-2">
        <label className="block text-[11px] font-semibold text-slate-300">
          📍 Starting City / Origin
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1">
            <LocationAutocomplete
              value={originCity}
              onChange={(city) => onOriginCityChange(city)}
              placeholder="e.g. Warsaw, Berlin, Prague..."
            />
          </div>
          <button
            type="button"
            onClick={handleGetDirections}
            disabled={loading || !originCity.trim()}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-black shadow-lg hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                <span>Get Directions</span>
              </>
            )}
          </button>
        </div>
        {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
      </div>

      {/* Mode Toggles & Results */}
      {transportData && (
        <div className="mt-4 border-t border-white/10 pt-3 animate-in fade-in duration-200">
          <div className="mb-3 flex rounded-xl bg-black/40 p-1 border border-white/5">
            <button
              type="button"
              onClick={() => onActiveTransportModeChange('car')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-bold transition-all ${
                activeTransportMode === 'car'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="h-4 w-4" />
              <span>Car Route</span>
            </button>
            <button
              type="button"
              onClick={() => onActiveTransportModeChange('train')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-bold transition-all ${
                activeTransportMode === 'train'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Train className="h-4 w-4" />
              <span>Train Connections</span>
            </button>
          </div>

          {/* Car Results */}
          {activeTransportMode === 'car' && (
            <div className="rounded-xl bg-white/5 p-3.5 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" /> Estimated Drive Time
                </span>
                <span className="text-sm font-bold text-white">{transportData.car.duration}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Distance
                </span>
                <span className="text-sm font-bold text-white">{transportData.car.distance_km} km</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Est. Fuel Cost
                </span>
                <span className="text-sm font-black text-emerald-400">{transportData.car.cost}</span>
              </div>
            </div>
          )}

          {/* Train Results */}
          {activeTransportMode === 'train' && (
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {transportData.train.itineraries.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No train itineraries found for this route.</p>
              ) : (
                transportData.train.itineraries.map((itinerary, idx) => {
                  const isSelected = selectedTrainIndex === idx;
                  const legsChain = itinerary.legs && itinerary.legs.length > 0
                    ? [itinerary.legs[0].origin.name, ...itinerary.legs.map(l => l.destination.name)].join(' ➔ ')
                    : null;

                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectedTrainIndexChange(idx)}
                      className={`cursor-pointer rounded-xl p-3 border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                          : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white mb-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <span>{itinerary.departure_time.split(' ')[1] || itinerary.departure_time}</span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <span>{itinerary.arrival_time.split(' ')[1] || itinerary.arrival_time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isSelected && (
                            <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-black">
                              ACTIVE
                            </span>
                          )}
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-semibold">
                            {itinerary.duration}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                        <span>{itinerary.provider || 'PKP / DB Express'}</span>
                        <span className="font-medium text-slate-300">
                          {itinerary.transfers === 0
                            ? '✅ Direct train'
                            : `🔄 ${itinerary.transfers} transfer${itinerary.transfers > 1 ? 's' : ''}`}
                        </span>
                      </div>

                      {/* Legs Overview Chain */}
                      {legsChain && (
                        <div className="mt-2 rounded-lg bg-black/50 p-2 border border-white/5 text-[11px] text-slate-200">
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold mb-1">
                            <span>🚆 Journey Legs:</span>
                          </div>
                          <div className="font-mono text-[10px] leading-relaxed text-slate-300 break-words">
                            {legsChain}
                          </div>
                          {/* Detailed leg segments */}
                          {itinerary.legs && itinerary.legs.length > 1 && isSelected && (
                            <div className="mt-1.5 pt-1.5 border-t border-white/10 space-y-1">
                              {itinerary.legs.map((leg, legIdx) => (
                                <div key={legIdx} className="flex items-center justify-between text-[9px] text-slate-400">
                                  <span>
                                    <strong className="text-white">{leg.departure}</strong> {leg.origin.name} ➔{' '}
                                    <strong className="text-white">{leg.arrival}</strong> {leg.destination.name}
                                  </span>
                                  <span className="text-emerald-400 font-mono ml-1">{leg.train_name}</span>
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
        </div>
      )}
    </div>
  );
};

export default LogisticsPanel;
