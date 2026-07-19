import { create } from 'zustand';
import type { TransportRoutesData } from '../components/LogisticsPanel';

export interface RouteData {
  coordinates: [number, number][] | null;
  transportData: TransportRoutesData | null;
}

interface PlannerState {
  departureCity: string;
  setDepartureCity: (city: string) => void;
  
  routeData: RouteData;
  setRouteData: (data: RouteData) => void;
  
  transportMode: 'car' | 'train';
  setTransportMode: (mode: 'car' | 'train') => void;

  selectedTrainIndex: number;
  setSelectedTrainIndex: (index: number) => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
  departureCity: 'Warsaw',
  setDepartureCity: (city) => set({ departureCity: city }),
  
  routeData: { coordinates: null, transportData: null },
  setRouteData: (data) => set({ routeData: data }),
  
  transportMode: 'car',
  setTransportMode: (mode) => set({ transportMode: mode }),

  selectedTrainIndex: 0,
  setSelectedTrainIndex: (index) => set({ selectedTrainIndex: index }),
}));
