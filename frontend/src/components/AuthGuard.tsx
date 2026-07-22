import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api } from '../lib/axios';

interface AuthGuardProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Komponent chroniący ścieżki (Route Guard).
 * Sprawdza obecność aktywnej sesji przez API backendu (HttpOnly cookies). 
 * Jeśli użytkownik jest niezalogowany, przekierowuje na `redirectTo` (domyślnie /login).
 * Obsługuje zarówno zagnieżdżone routingi (<Outlet />) jak i przekazywanie jako children.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        await api.get('/api/me');
        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isAuthenticated === null) {
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

  if (!isAuthenticated) {
    // Przekierowanie z zapamiętaniem ścieżki docelowej
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AuthGuard;
