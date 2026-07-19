import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { api } from '../lib/axios';
import { DiscoveryMap, type FestivalItem } from '../components/DiscoveryMap';
import { AIChat } from '../components/AIChat';
import { LogisticsPanel } from '../components/LogisticsPanel';
import { Bookmark, BookmarkCheck, ExternalLink, MapPin, Calendar, Tag, Loader2 } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';

type RightTab = 'chat' | 'logistics' | 'details';

const TAB_LABELS: { id: RightTab; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'logistics', label: 'Logistics' },
  { id: 'details', label: 'Details' },
];

export const DiscoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFestival, setSelectedFestival] = useState<FestivalItem | null>(null);
  const [savedTrips, setSavedTrips] = useState<FestivalItem[]>([]);
  const [savingTripId, setSavingTripId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RightTab>('chat');
  const { routeData, transportMode, selectedTrainIndex } = usePlannerStore();

  // Fetch saved trips
  const fetchSavedTrips = useCallback(async () => {
    try {
      const res = await api.get('/api/trips');
      if (res.data) setSavedTrips(res.data.map((row: any) => row.festival_data));
    } catch { /* not logged in yet */ }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) fetchSavedTrips();
    });
  }, [fetchSavedTrips]);

  // URL param: auto-select from My Trips
  useEffect(() => {
    const festivalId = searchParams.get('festival_id');
    if (festivalId && savedTrips.length > 0 && !selectedFestival) {
      const festival = savedTrips.find(t => String(t.id) === festivalId);
      if (festival) {
        setSelectedFestival(festival);
        setActiveTab('chat');
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, savedTrips, selectedFestival, setSearchParams]);

  const handleSelectFestival = (festival: FestivalItem | null) => {
    setSelectedFestival(festival);
    usePlannerStore.getState().setRouteData({ coordinates: null, transportData: null });
    if (festival) setActiveTab('chat');
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
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        overflow: 'hidden',
        paddingTop: '56px', // Navbar height
        backgroundColor: '#121212',
      }}
    >
      {/* ── LEFT: MAP (65%) ── */}
      <div style={{ flex: '0 0 65%', position: 'relative', overflow: 'hidden' }}>
        <DiscoveryMap
          selectedFestival={selectedFestival}
          onSelectFestival={handleSelectFestival}
          onFestivalsLoaded={() => {}}
          routeCoordinates={routeData.coordinates}
          transportData={routeData.transportData}
          activeTransportMode={transportMode}
          selectedTrainIndex={selectedTrainIndex}
          savedTrips={savedTrips}
          onToggleSavedTrip={handleToggleSavedTrip}
          originCoords={originCoords as [number, number] | null}
        />
      </div>

      {/* ── RIGHT PANEL (35%) ── */}
      <div
        style={{
          flex: '0 0 35%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1E1E1E',
          borderLeft: '1px solid #2D2D2D',
          overflow: 'hidden',
        }}
      >
        {selectedFestival ? (
          <>
            {/* Festival name strip */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #2D2D2D',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.65rem', color: '#A1A1AA', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Selected Festival
                </p>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#EDEDED', margin: 0, lineHeight: 1.3 }}>
                  {selectedFestival.name}
                </h2>
                {(selectedFestival.city || selectedFestival.start_date) && (
                  <p style={{ fontSize: '0.75rem', color: '#A1A1AA', marginTop: '4px' }}>
                    {[selectedFestival.city, selectedFestival.start_date].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleToggleSavedTrip(selectedFestival)}
                disabled={savingTripId === String(selectedFestival.id)}
                title={isSaved ? 'Remove from My Trips' : 'Save to My Trips'}
                className="transition-colors flex-shrink-0"
                style={{ color: isSaved ? '#10B981' : '#A1A1AA', padding: '4px', background: 'none', border: 'none', cursor: savingTripId === String(selectedFestival.id) ? 'not-allowed' : 'pointer', opacity: savingTripId === String(selectedFestival.id) ? 0.7 : 1 }}
              >
                {savingTripId === String(selectedFestival.id) ? (
                  <Loader2 size={18} className="animate-spin text-[#10B981]" />
                ) : isSaved ? (
                  <BookmarkCheck size={18} />
                ) : (
                  <Bookmark size={18} />
                )}
              </button>
            </div>

            {/* Tab bar */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #2D2D2D',
                padding: '0 20px',
              }}
            >
              {TAB_LABELS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase' as const,
                    color: activeTab === id ? '#10B981' : '#A1A1AA',
                    background: 'none',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderBottom: activeTab === id ? '2px solid #10B981' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                    outline: 'none',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {activeTab === 'chat' && (
                <AIChat
                  selectedFestival={selectedFestival}
                  onClearSelection={() => handleSelectFestival(null)}
                />
              )}
              {activeTab === 'logistics' && (
                <LogisticsPanel selectedFestival={selectedFestival} />
              )}
              {activeTab === 'details' && (
                <DetailsPanel festival={selectedFestival} />
              )}
            </div>
          </>
        ) : (
          /* No festival selected */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '1px solid #2D2D2D',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <MapPin size={20} style={{ color: '#A1A1AA' }} />
            </div>
            <p style={{ fontSize: '0.9rem', fontWeight: 500, color: '#EDEDED', marginBottom: '8px' }}>
              No festival selected
            </p>
            <p style={{ fontSize: '0.8rem', color: '#A1A1AA', lineHeight: 1.6 }}>
              Click any marker on the map to view details, chat with the AI concierge, and plan your route.
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
    <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
      {imgUrl && (
        <div style={{ marginBottom: '20px', overflow: 'hidden', borderRadius: '2px', border: '1px solid #2D2D2D' }}>
          <img src={imgUrl} alt={festival.name} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: '#10B981',
              textDecoration: 'none',
              marginTop: '4px',
            }}
          >
            Official website <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
};

const Row: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
    <span style={{ color: '#A1A1AA', marginTop: '1px', flexShrink: 0 }}>{icon}</span>
    <div>
      <p style={{ fontSize: '0.65rem', color: '#A1A1AA', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '3px' }}>
        {label}
      </p>
      <p style={{ fontSize: '0.875rem', color: '#EDEDED' }}>{value}</p>
    </div>
  </div>
);
