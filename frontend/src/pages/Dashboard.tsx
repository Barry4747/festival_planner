import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/dashboard/Navbar';
import { DiscoveryMap, type FestivalItem } from '../components/DiscoveryMap';
import { FestivalSidePanel } from '../components/FestivalSidePanel';
import { FloatingMessengerChat } from '../components/FloatingMessengerChat';
import { SuggestFestivalModal } from '../components/SuggestFestivalModal';
import { LogisticsPanel, type TransportRoutesData } from '../components/LogisticsPanel';

export const Dashboard: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<FestivalItem | null>(null);
  const [festivals, setFestivals] = useState<FestivalItem[]>([]);
  const [mapLoading, setMapLoading] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState<boolean>(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [originCity, setOriginCity] = useState<string>('Warsaw');
  const [transportData, setTransportData] = useState<TransportRoutesData | null>(null);
  const [activeTransportMode, setActiveTransportMode] = useState<'car' | 'train'>('car');
  const [selectedTrainIndex, setSelectedTrainIndex] = useState<number>(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || null);
    });
  }, []);

  const handleSelectFestival = (festival: FestivalItem | null) => {
    setSelectedFestival(festival);
    setRouteCoordinates(null);
    setTransportData(null);
    setSelectedTrainIndex(0);
    if (festival) {
      setIsChatOpen(true);
    }
  };

  return (
    <div className="flex h-dvh min-h-dvh flex-col bg-[#090b0a] text-white overflow-hidden">
      <Navbar userEmail={userEmail} />

      <main className="flex flex-1 flex-col lg:flex-row h-[calc(100dvh-4rem)] overflow-hidden relative">
        {/* Left / Main Section: Interactive Full-Screen Map */}
        <div className="flex-1 h-[55vh] lg:h-full min-w-0 relative z-0 flex flex-col">
          <DiscoveryMap
            selectedFestival={selectedFestival}
            onSelectFestival={handleSelectFestival}
            onOpenSuggestModal={() => setIsSuggestModalOpen(true)}
            onFestivalsLoaded={(items) => setFestivals(items)}
            onLoadingChange={(loading) => setMapLoading(loading)}
            routeCoordinates={routeCoordinates}
            transportData={transportData}
            activeTransportMode={activeTransportMode}
            selectedTrainIndex={selectedTrainIndex}
          />
          {selectedFestival && (
            <div className="absolute top-4 left-4 z-[450] w-[340px] sm:w-[380px] max-w-[calc(100vw-2rem)]">
              <LogisticsPanel
                selectedFestival={selectedFestival}
                originCity={originCity}
                onOriginCityChange={(city) => setOriginCity(city)}
                transportData={transportData}
                onTransportDataChange={(data) => setTransportData(data)}
                activeTransportMode={activeTransportMode}
                onActiveTransportModeChange={(mode) => setActiveTransportMode(mode)}
                selectedTrainIndex={selectedTrainIndex}
                onSelectedTrainIndexChange={(idx) => setSelectedTrainIndex(idx)}
              />
            </div>
          )}
        </div>

        {/* Right Section: Festival Pane List Sidebar */}
        <div className="w-full lg:w-[380px] xl:w-[410px] h-[45vh] lg:h-full shrink-0 z-10 overflow-hidden border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0d0f0e]">
          <FestivalSidePanel
            festivals={festivals}
            selectedFestival={selectedFestival}
            onSelectFestival={(fest) => handleSelectFestival(fest)}
            loading={mapLoading}
          />
        </div>

        {/* Floating Messenger / X-Kom Style Chat Bubble & Window */}
        <FloatingMessengerChat
          selectedFestival={selectedFestival}
          onClearSelection={() => {
            setSelectedFestival(null);
            setRouteCoordinates(null);
            setTransportData(null);
          }}
          isOpen={isChatOpen}
          onOpen={() => setIsChatOpen(true)}
          onClose={() => setIsChatOpen(false)}
          setRouteCoordinates={setRouteCoordinates}
        />
      </main>

      <SuggestFestivalModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
