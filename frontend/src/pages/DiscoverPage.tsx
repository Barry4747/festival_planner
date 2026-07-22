import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { api } from '../lib/axios';
import { DiscoveryMap, type FestivalItem } from '../components/DiscoveryMap';
import { AIChat } from '../components/AIChat';
import { WeatherPanel } from '../components/WeatherPanel';
import { LogisticsPanel } from '../components/LogisticsPanel';
import { Bookmark, BookmarkCheck, ExternalLink, MapPin, Calendar, Tag, Loader2, X } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';

export const DiscoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFestival, setSelectedFestival] = useState<FestivalItem | null>(null);
  const [savedTrips, setSavedTrips] = useState<FestivalItem[]>([]);
  const [savingTripId, setSavingTripId] = useState<string | null>(null);
  const { routeData, transportMode, selectedTrainIndex, activeTab, setActiveTab } = usePlannerStore();
  const { t } = useTranslation();

  // Mobile Bottom Sheet states
  const [mapFestivals, setMapFestivals] = useState<FestivalItem[]>([]);
  const [isListView, setIsListView] = useState(false);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (mapRef.current) {
      tl.fromTo(mapRef.current, { scale: 0.97, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.0 }, 0.3);
    }
    // Fade in panel only on desktop initially
    if (panelRef.current && window.innerWidth >= 768) {
      tl.fromTo(panelRef.current, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9 }, 0.45);
    }
  }, []);

  const TAB_LABELS: { id: 'chat' | 'logistics' | 'details' | 'weather'; label: string }[] = [
    { id: 'chat', label: t('tabs.chat') },
    { id: 'logistics', label: t('tabs.logistics') },
    { id: 'details', label: t('tabs.details') },
    { id: 'weather', label: t('tabs.weather') },
  ];

  const fetchSavedTrips = useCallback(async () => {
    try {
      const res = await api.get('/api/trips');
      if (res.data) setSavedTrips(res.data.map((row: any) => row.festival_data));
    } catch { /* not logged in */ }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) fetchSavedTrips();
    });
  }, [fetchSavedTrips]);

  useEffect(() => {
    const festivalId = searchParams.get('festival_id');
    if (festivalId && savedTrips.length > 0 && !selectedFestival) {
      const festival = savedTrips.find(t => String(t.id) === festivalId);
      if (festival) {
        setSelectedFestival(festival);
        setActiveTab('chat');
        setIsBottomSheetExpanded(true);
        setIsListView(false);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, savedTrips, selectedFestival, setSearchParams]);

  const handleSelectFestival = (festival: FestivalItem | null) => {
    setSelectedFestival(festival);
    usePlannerStore.getState().setRouteData({ coordinates: null, transportData: null });
    if (festival) {
      setActiveTab('chat');
      setIsBottomSheetExpanded(true);
      setIsListView(false);
    } else {
      setIsBottomSheetExpanded(false);
    }
  };

  const handleToggleSavedTrip = async (festival: FestivalItem) => {
    const isSaved = savedTrips.some(t => String(t.id) === String(festival.id));
    setSavingTripId(String(festival.id));
    try {
      if (isSaved) {
        await api.delete(`/api/trips/${festival.id}`);
        setSavedTrips(prev => prev.filter(t => String(t.id) !== String(festival.id)));
      } else {
        await api.post('/api/trips', {
          festival_id: String(festival.id),
          festival_name: festival.name,
          festival_data: festival,
        });
        setSavedTrips(prev => [festival, ...prev]);
      }
    } catch (err) {
      console.error('Failed to toggle trip:', err);
    } finally {
      setSavingTripId(null);
    }
  };

  const isSaved = selectedFestival
    ? savedTrips.some(t => String(t.id) === String(selectedFestival.id))
    : false;

  const originCoords = routeData.transportData?.train?.origin_coords 
    || (routeData.transportData?.car?.geometry?.[0]) 
    || null;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] pt-[56px] bg-[#121212] overflow-hidden relative">
      
      {/* ── LEFT: MAP (100% Mobile, 65% Desktop) ── */}
      <div 
        ref={mapRef} 
        className="absolute inset-0 md:relative w-full h-[100dvh] md:h-full md:flex-[0_0_65%] z-0"
      >
        <DiscoveryMap
          selectedFestival={selectedFestival}
          onSelectFestival={handleSelectFestival}
          onFestivalsLoaded={setMapFestivals}
          routeCoordinates={routeData.coordinates}
          transportData={routeData.transportData}
          activeTransportMode={transportMode}
          selectedTrainIndex={selectedTrainIndex}
          savedTrips={savedTrips}
          onToggleSavedTrip={handleToggleSavedTrip}
          originCoords={originCoords as [number, number] | null}
        />

        {/* ── MOBILE VIEW TOGGLE ── */}
        {!selectedFestival && (
          <div className="md:hidden absolute bottom-[100px] left-1/2 -translate-x-1/2 z-20 transition-all">
            <div className="flex bg-zinc-900/90 backdrop-blur border border-zinc-700/50 p-1.5 rounded-full shadow-2xl">
              <button
                onClick={() => { setIsListView(false); setIsBottomSheetExpanded(false); }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${!isListView ? 'bg-emerald-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                🗺️ Mapa
              </button>
              <button
                onClick={() => { setIsListView(true); setIsBottomSheetExpanded(true); }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${isListView ? 'bg-emerald-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                📋 Lista
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL / MOBILE BOTTOM SHEET (35% Desktop, Dynamic Mobile) ── */}
      <div
        ref={panelRef}
        className={`
          absolute md:relative z-10 md:z-auto
          bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto
          w-full md:flex-[0_0_35%] md:h-full
          bg-[#1E1E1E] md:border-l border-[#2D2D2D]
          flex flex-col overflow-hidden
          transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]
          rounded-t-3xl md:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.6)] md:shadow-none
          ${!selectedFestival && !isListView 
            ? 'translate-y-full md:translate-y-0 h-0 md:h-full opacity-0 md:opacity-100' 
            : 'translate-y-0 opacity-100'}
          ${(selectedFestival || isListView) 
            ? (isBottomSheetExpanded ? 'h-[88dvh] md:h-full' : 'h-[30dvh] md:h-full') 
            : ''}
        `}
      >
        {/* Mobile Drag Handle */}
        <div 
          className="md:hidden w-full flex flex-col justify-center items-center h-10 cursor-pointer shrink-0 border-b border-[#2D2D2D]/50 hover:bg-zinc-800/30 transition-colors"
          onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
        >
          <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
        </div>

        {/* --- STATE: LIST VIEW --- */}
        {isListView && !selectedFestival ? (
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-3 pb-safe">
            <h3 className="text-lg font-bold text-white mb-2 px-1">Znalezione Festiwale ({mapFestivals.length})</h3>
            {mapFestivals.map(fest => (
              <div 
                key={fest.id} 
                onClick={() => handleSelectFestival(fest)}
                className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex gap-4 cursor-pointer hover:border-emerald-500/50 transition-all active:scale-[0.98]"
              >
                {fest.image && (
                  <img src={fest.image} alt={fest.name} className="w-20 h-20 object-cover rounded-lg shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold truncate">{fest.name}</h4>
                  <p className="text-sm text-zinc-400 truncate">{fest.city} • {fest.start_date}</p>
                  <p className="text-xs text-emerald-400 mt-2 font-medium">{fest.category || fest.genre}</p>
                </div>
              </div>
            ))}
            {mapFestivals.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                <p>Brak wyników w tym obszarze.</p>
              </div>
            )}
          </div>
        ) : selectedFestival ? (
          /* --- STATE: SELECTED FESTIVAL --- */
          <>
            {/* Festival name strip */}
            <div className="px-5 py-4 border-b border-[#2D2D2D] flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <p className="text-[0.65rem] text-zinc-400 tracking-[0.1em] uppercase mb-1">
                  Selected Festival
                </p>
                <h2 className="text-[0.95rem] font-semibold text-zinc-100 m-0 leading-snug truncate">
                  {selectedFestival.name}
                </h2>
                {(selectedFestival.city || selectedFestival.start_date) && (
                  <p className="text-xs text-zinc-400 mt-1 truncate">
                    {[selectedFestival.city, selectedFestival.start_date].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleSavedTrip(selectedFestival)}
                  disabled={savingTripId === String(selectedFestival.id)}
                  title={isSaved ? 'Remove from My Trips' : 'Save to My Trips'}
                  className={`p-1.5 rounded-lg transition-all ${isSaved ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-400 hover:bg-zinc-800'}`}
                >
                  {savingTripId === String(selectedFestival.id) ? (
                    <Loader2 size={18} className="animate-spin text-emerald-500" />
                  ) : isSaved ? (
                    <BookmarkCheck size={18} />
                  ) : (
                    <Bookmark size={18} />
                  )}
                </button>
                <button
                  onClick={() => handleSelectFestival(null)}
                  title="Close panel"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-[#2D2D2D] px-5 overflow-x-auto no-scrollbar shrink-0">
            {TAB_LABELS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setIsBottomSheetExpanded(true); }}
                  className={`flex-1 min-w-[70px] py-3 text-[0.7rem] font-semibold tracking-wider uppercase transition-all outline-none whitespace-nowrap
                    ${activeTab === id 
                      ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                      : 'text-zinc-400 border-b-2 border-transparent hover:text-zinc-200 hover:bg-white/5'}
                  `}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden flex flex-col pb-safe">
              {activeTab === 'chat' && (
                <AIChat
                  selectedFestival={selectedFestival}
                />
              )}
              {activeTab === 'logistics' && (
                <LogisticsPanel selectedFestival={selectedFestival} />
              )}
              {activeTab === 'details' && (
                <DetailsPanel festival={selectedFestival} />
              )}
              {activeTab === 'weather' && (
                <WeatherPanel festival={selectedFestival} />
              )}
            </div>
          </>
        ) : (
          /* --- STATE: DESKTOP EMPTY (Hidden on mobile) --- */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center p-10 text-center">
            <div className="w-12 h-12 border border-[#2D2D2D] rounded-lg flex items-center justify-center mb-5">
              <MapPin size={20} className="text-zinc-500" />
            </div>
            <p className="text-[0.9rem] font-medium text-zinc-200 mb-2">
              No festival selected
            </p>
            <p className="text-[0.8rem] text-zinc-500 leading-relaxed max-w-[250px]">
              Click any marker on the map to view details, chat with BUDDY, and plan your route.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Details sub-panel ── */
const DetailsPanel: React.FC<{ festival: FestivalItem }> = ({ festival }) => {
  const imgUrl = festival.image_url || festival.image;
  return (
    <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
      {imgUrl && (
        <div className="mb-5 overflow-hidden rounded-xl border border-[#2D2D2D]">
          <img src={imgUrl} alt={festival.name} className="w-full h-40 object-cover block" />
        </div>
      )}

      <div className="flex flex-col gap-4">
        {festival.city && (
          <Row icon={<MapPin size={14} />} label="Location" value={festival.city} />
        )}
        {(festival.start_date || festival.dates) && (
          <Row icon={<Calendar size={14} />} label="Dates" value={festival.start_date || festival.dates || ''} />
        )}
        {(festival.genre || festival.category) && (
          <Row icon={<Tag size={14} />} label="Genre" value={festival.genre || festival.category || ''} />
        )}
        {festival.url && (
          <a
            href={festival.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-500 hover:text-emerald-400 transition-colors mt-2"
          >
            Official website <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
};

const Row: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex gap-3 items-start">
    <span className="text-zinc-500 mt-0.5 shrink-0">{icon}</span>
    <div>
      <p className="text-[0.65rem] text-zinc-500 tracking-wider uppercase mb-1">{label}</p>
      <p className="text-sm text-zinc-200">{value}</p>
    </div>
  </div>
);
