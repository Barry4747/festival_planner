import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './dashboard/Navbar';
import { supabase } from '../lib/supabase';

export const Layout: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh', backgroundColor: '#121212', color: '#EDEDED' }}>
      <Navbar userEmail={userEmail} />
      <Outlet />
    </div>
  );
};
