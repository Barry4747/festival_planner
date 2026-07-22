/**
 * Global UI state managed by Zustand.
 *
 * Rule: this store holds ONLY UI state — selection, loading indicators,
 * panel tabs, etc. Heavy business logic (routing calculation, cost estimation)
 * belongs on the server, not here.
 */
import { create } from 'zustand';
import type { TransportRoutesData, RouteStep } from '../components/LogisticsPanel';
import type { WeatherForecast } from '../types/weather';

export interface RouteData {
  coordinates: [number, number][] | null;
  transportData: TransportRoutesData | null;

  originName?: string;
  originCoords?: [number, number] | null;

  departureStationName?: string;
  departureStationCoords?: [number, number] | null;

  arrivalStationName?: string;
  arrivalStationCoords?: [number, number] | null;

  destinationName?: string;
  destinationCoords?: [number, number] | null;
}

interface PlannerState {
  departureCity: string;
  setDepartureCity: (city: string) => void;

  userCoordinates: { lat: number; lng: number } | null;
  setUserCoordinates: (coords: { lat: number; lng: number } | null) => void;

  activeRouteSteps: RouteStep[] | null;
  setActiveRouteSteps: (steps: RouteStep[] | null) => void;

  routeData: RouteData;
  setRouteData: (data: RouteData) => void;
  syncMultiLegData: () => void;

  transportMode: 'car' | 'train';
  setTransportMode: (mode: 'car' | 'train') => void;

  selectedTrainIndex: number;
  setSelectedTrainIndex: (index: number) => void;

  weatherForecast: WeatherForecast | null;
  setWeatherForecast: (forecast: WeatherForecast | null) => void;

  weatherLayer: 'precipitation_new' | 'temp_new' | 'wind_new' | 'clouds_new' | 'none';
  setWeatherLayer: (layer: 'precipitation_new' | 'temp_new' | 'wind_new' | 'clouds_new' | 'none') => void;

  activeTab: 'logistics' | 'chat' | 'details' | 'weather';
  setActiveTab: (tab: 'logistics' | 'chat' | 'details' | 'weather') => void;

  isUpgradeModalOpen: boolean;
  currentTier: string;
  setUpgradeModalOpen: (isOpen: boolean) => void;
}

/** Compute updated RouteData for a given train itinerary index. */
function buildRouteDataForTrainIndex(
  state: PlannerState,
  index: number,
): Partial<RouteData> {
  const trainData = state.routeData.transportData?.train;
  if (!trainData?.itineraries?.[index]) return {};

  const itinerary = trainData.itineraries[index];
  const legs = itinerary.legs ?? [];

  return {
    originName: trainData.origin_name || state.departureCity,
    originCoords: state.userCoordinates
      ? [state.userCoordinates.lat, state.userCoordinates.lng]
      : trainData.origin_coords,
    departureStationName: legs[0]?.origin.name,
    departureStationCoords: legs[0] ? [legs[0].origin.lat, legs[0].origin.lng] : undefined,
    arrivalStationName: legs.at(-1)?.destination.name,
    arrivalStationCoords: legs.at(-1)
      ? [legs.at(-1)!.destination.lat, legs.at(-1)!.destination.lng]
      : undefined,
    destinationName: trainData.dest_name,
    destinationCoords: trainData.dest_coords,
  };
}

export const usePlannerStore = create<PlannerState>((set) => ({
  departureCity: 'Warsaw',
  setDepartureCity: (city) => set({ departureCity: city }),

  userCoordinates: null,
  setUserCoordinates: (coords) => set({ userCoordinates: coords }),

  activeRouteSteps: null,
  setActiveRouteSteps: (steps) => set({ activeRouteSteps: steps }),

  routeData: { coordinates: null, transportData: null },
  setRouteData: (data) => set({ routeData: data }),

  transportMode: 'car',
  setTransportMode: (mode) => set({ transportMode: mode }),

  selectedTrainIndex: 0,
  // Single set() call — computes both index and derived routeData in one state update.
  setSelectedTrainIndex: (index) =>
    set((state) => ({
      selectedTrainIndex: index,
      routeData: { ...state.routeData, ...buildRouteDataForTrainIndex(state, index) },
    })),

  syncMultiLegData: () =>
    set((state) => ({
      routeData: {
        ...state.routeData,
        ...buildRouteDataForTrainIndex(state, state.selectedTrainIndex),
      },
    })),

  weatherForecast: null,
  setWeatherForecast: (forecast) => set({ weatherForecast: forecast }),

  weatherLayer: 'precipitation_new',
  setWeatherLayer: (layer) => set({ weatherLayer: layer }),

  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),

  isUpgradeModalOpen: false,
  currentTier: 'FREE',
  setUpgradeModalOpen: (isOpen) => set({ isUpgradeModalOpen: isOpen }),
}));
