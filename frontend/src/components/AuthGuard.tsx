import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthGuardProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Komponent chroniący ścieżki (Route Guard).
 * Sprawdza obecność aktywnej sesji w Supabase. Jeśli użytkownik jest niezalogowany, przekierowuje na `redirectTo` (domyślnie /login).
 * Obsługuje zarówno zagnieżdżone routingi (<Outlet />) jak i przekazywanie jako children.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // 1. Pobranie początkowego stanu sesji
    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Błąd pobierania sesji w AuthGuard:', error);
        }
        setSession(session);
      } catch (err) {
        console.error('❌ Wyjątek AuthGuard fetchSession:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // 2. Nasłuchiwanie na zmiany (np. zalogowanie w innej karcie lub wygaśnięcie tokenu)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium tracking-wide text-slate-300">
            Weryfikacja sesji w Supabase...
          </span>
        </div>
      </div>
    );
  }

  if (!session) {
    // Przekierowanie z zapamiętaniem ścieżki docelowej
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AuthGuard;
