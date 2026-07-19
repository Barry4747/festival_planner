import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { MapPin, Calendar, Music } from 'lucide-react';
import type { FestivalItem } from '../components/DiscoveryMap';

export const MyTripsPage: React.FC = () => {
  const [trips, setTrips] = useState<FestivalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await api.get('/api/trips');
        if (res.data) setTrips(res.data.map((row: any) => row.festival_data));
      } catch (err) {
        console.error('Failed to fetch trips', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: '#121212',
        color: '#EDEDED',
        padding: '80px 24px 48px', // top pad accounts for fixed navbar
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: '#10B981', textTransform: 'uppercase', marginBottom: '12px' }}>
            Saved
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#EDEDED', margin: 0 }}>My Trips</h1>
          <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#A1A1AA' }}>
            Your bookmarked festivals. Resume planning from where you left off.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                border: '2px solid #2D2D2D',
                borderTopColor: '#10B981',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        ) : trips.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '320px',
              border: '1px solid #2D2D2D',
              textAlign: 'center',
              padding: '48px',
            }}
          >
            <Music size={32} style={{ color: '#2D2D2D', marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#EDEDED', marginBottom: '8px' }}>
              No trips saved yet
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#A1A1AA', maxWidth: '360px', lineHeight: 1.6, marginBottom: '32px' }}>
              Browse the discovery map and click the bookmark icon on any festival to save it here.
            </p>
            <button
              onClick={() => navigate('/discover')}
              style={{
                backgroundColor: '#10B981',
                color: '#121212',
                fontWeight: 600,
                fontSize: '0.8rem',
                padding: '10px 24px',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              Open Map
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1px',
              backgroundColor: '#2D2D2D',
            }}
          >
            {trips.map((festival) => {
              const imgUrl = festival.image_url || festival.image;
              const dateDisplay = festival.start_date || festival.dates || '';

              return (
                <div
                  key={festival.id}
                  style={{
                    backgroundColor: '#1E1E1E',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      height: '140px',
                      backgroundColor: '#2D2D2D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {imgUrl ? (
                      <img src={imgUrl} alt={festival.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Music size={24} style={{ color: '#A1A1AA' }} />
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#EDEDED', margin: 0, lineHeight: 1.3 }}>
                      {festival.name}
                    </h3>
                    {festival.city && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={12} style={{ color: '#A1A1AA', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', color: '#A1A1AA' }}>{festival.city}</span>
                      </div>
                    )}
                    {dateDisplay && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12} style={{ color: '#A1A1AA', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', color: '#A1A1AA' }}>{dateDisplay}</span>
                      </div>
                    )}

                    <button
                      onClick={() => navigate(`/discover?festival_id=${festival.id}`)}
                      style={{
                        marginTop: 'auto',
                        paddingTop: '16px',
                        width: '100%',
                        padding: '10px',
                        backgroundColor: 'transparent',
                        border: '1px solid #2D2D2D',
                        color: '#10B981',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#282828')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      Resume Planning
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
