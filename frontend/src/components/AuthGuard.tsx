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
    let isMounted = true;

    // 1. Pobranie początkowego stanu sesji oraz proaktywne odświeżenie jeśli wygasa
    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Błąd pobierania sesji w AuthGuard:', error);
        }

        if (session && isMounted) {
          const now = Math.round(Date.now() / 1000);
          // Jeśli token wygasa za mniej niż 3 minuty, natychmiast odświeżamy sesję
          if (session.expires_at && session.expires_at <= now + 180) {
            console.info('🔄 [AuthGuard] Token bliski wygaśnięcia podczas wejścia na stronę. Odświeżam sesję...');
            const { data: refreshedData } = await supabase.auth.refreshSession();
            if (refreshedData.session && isMounted) {
              setSession(refreshedData.session);
              setLoading(false);
              return;
            }
          }
        }

        if (isMounted) {
          setSession(session);
        }
      } catch (err) {
        console.error('❌ Wyjątek AuthGuard fetchSession:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSession();

    // 2. Nasłuchiwanie na zmiany (np. zalogowanie w innej karcie lub wygaśnięcie tokenu)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (isMounted) {
          setSession(currentSession);
          setLoading(false);
        }
      }
    );

    // 3. Okresowy strażnik sesji (zabezpiecza przed wygaśnięciem przy długim otwarciu karty)
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session: current } } = await supabase.auth.getSession();
        if (current) {
          const now = Math.round(Date.now() / 1000);
          if (current.expires_at && current.expires_at <= now + 300) {
            console.info('🔄 [AuthGuard Strażnik] Odświeżam sesję w tle przed upływem ważności...');
            await supabase.auth.refreshSession();
          }
        }
      } catch (e) {
        console.warn('⚠️ Błąd okresowego odświeżania sesji w tle:', e);
      }
    }, 3 * 60 * 1000); // Sprawdzenie co 3 minuty

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#090b0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-emerald-500 animate-spin" />
          <span className="text-xs font-medium text-slate-400">
            Verifying session...
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
