import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './dashboard/Navbar';
import { supabase } from '../lib/supabase';

interface UserProfile {
  email: string | null;
  avatar: string | null;
  name: string | null;
}

export const Layout: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({ email: null, avatar: null, name: null });

  const extractProfile = (user: any): UserProfile => ({
    email: user?.email || null,
    avatar:
      user?.user_metadata?.avatar_url ||
      user?.user_metadata?.picture ||
      null,
    name:
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      null,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setProfile(extractProfile(user));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setProfile(extractProfile(session.user));
      else setProfile({ email: null, avatar: null, name: null });
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch initial location on app load
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Import usePlannerStore dynamically or statically to avoid circular issues, 
          // but static import at the top is fine. Let's assume it's imported.
          const { usePlannerStore } = await import('../store/usePlannerStore');
          
          usePlannerStore.getState().setUserCoordinates({ lat, lng });

          // Try reverse geocoding to set departureCity nicely
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state;
            if (city) {
              usePlannerStore.getState().setDepartureCity(city);
            }
          } catch (e) {
            console.error("Reverse geocoding failed", e);
          }
        },
        (error) => {
          console.warn("Geolocation blocked or failed", error);
        }
      );
    }
  }, []);

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: '100dvh', backgroundColor: '#121212', color: '#EDEDED' }}
    >
      <Navbar userEmail={profile.email} userAvatar={profile.avatar} userName={profile.name} />
      <Outlet />
    </div>
  );
};
