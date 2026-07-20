import { create } from 'zustand';
import type { TransportRoutesData, RouteStep } from '../components/LogisticsPanel';

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

  weatherForecast: any | null;
  setWeatherForecast: (forecast: any | null) => void;

  weatherLayer: 'precipitation_new' | 'temp_new' | 'wind_new' | 'clouds_new' | 'none';
  setWeatherLayer: (layer: 'precipitation_new' | 'temp_new' | 'wind_new' | 'clouds_new' | 'none') => void;

  activeTab: 'logistics' | 'chat' | 'details' | 'weather';
  setActiveTab: (tab: 'logistics' | 'chat' | 'details' | 'weather') => void;

  isUpgradeModalOpen: boolean;
  currentTier: string;
  setUpgradeModalOpen: (isOpen: boolean) => void;
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
  setSelectedTrainIndex: (index) => {
    set({ selectedTrainIndex: index });
    set((state) => {
      // Sync multileg data immediately after setting index
      const routeData = { ...state.routeData };
      const trainData = routeData.transportData?.train;
      if (trainData?.itineraries && trainData.itineraries[index]) {
        const itinerary = trainData.itineraries[index];
        const legs = itinerary.legs || [];
        routeData.originName = trainData.origin_name || state.departureCity;
        routeData.originCoords = state.userCoordinates ? [state.userCoordinates.lat, state.userCoordinates.lng] : trainData.origin_coords;
        if (legs.length > 0) {
          routeData.departureStationName = legs[0].origin.name;
          routeData.departureStationCoords = [legs[0].origin.lat, legs[0].origin.lng];
          routeData.arrivalStationName = legs[legs.length - 1].destination.name;
          routeData.arrivalStationCoords = [legs[legs.length - 1].destination.lat, legs[legs.length - 1].destination.lng];
        }
        routeData.destinationName = trainData.dest_name;
        routeData.destinationCoords = trainData.dest_coords;
      }
      return { routeData };
    });
  },

  syncMultiLegData: () => set((state) => {
    const routeData = { ...state.routeData };
    const trainData = routeData.transportData?.train;
    if (trainData?.itineraries && trainData.itineraries[state.selectedTrainIndex]) {
      const itinerary = trainData.itineraries[state.selectedTrainIndex];
      const legs = itinerary.legs || [];
      routeData.originName = trainData.origin_name || state.departureCity;
      routeData.originCoords = state.userCoordinates ? [state.userCoordinates.lat, state.userCoordinates.lng] : trainData.origin_coords;
      if (legs.length > 0) {
        routeData.departureStationName = legs[0].origin.name;
        routeData.departureStationCoords = [legs[0].origin.lat, legs[0].origin.lng];
        routeData.arrivalStationName = legs[legs.length - 1].destination.name;
        routeData.arrivalStationCoords = [legs[legs.length - 1].destination.lat, legs[legs.length - 1].destination.lng];
      }
      routeData.destinationName = trainData.dest_name;
      routeData.destinationCoords = trainData.dest_coords;
    }
    return { routeData };
  }),

  weatherForecast: null,
  setWeatherForecast: (forecast) => set({ weatherForecast: forecast }),

  weatherLayer: 'precipitation_new',
  setWeatherLayer: (layer) => set({ weatherLayer: layer }),

  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),

  isUpgradeModalOpen: false,
  currentTier: 'BEFOREK',
  setUpgradeModalOpen: (isOpen) => set({ isUpgradeModalOpen: isOpen }),
}));
