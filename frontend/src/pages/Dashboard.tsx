import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/axios';
import { LogOut, CheckCircle2, ShieldCheck, User, Server } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || 'Użytkownik');
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const testBackendConnection = async () => {
    setLoadingApi(true);
    setApiError(null);
    setApiResponse(null);
    try {
      // Axios interceptor automatycznie dołączy Bearer token zalogowanego użytkownika
      const response = await api.get('/api/me');
      setApiResponse(response.data);
    } catch (err: any) {
      setApiError(err.response?.data?.detail || err.message || 'Błąd połączenia z API');
    } finally {
      setLoadingApi(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100 md:p-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Panel Festival Planner</h1>
              <p className="text-sm text-slate-400">Zalogowano jako: <span className="font-semibold text-indigo-300">{userEmail}</span></p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            <span>Wyloguj się</span>
          </button>
        </header>

        {/* Status Section */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="mb-4 flex items-center gap-3 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
              <h2 className="font-semibold text-white">Ochrona Routingów (AuthGuard)</h2>
            </div>
            <p className="text-sm text-slate-400">
              Widzisz tę stronę, co oznacza, że komponent <code className="rounded bg-slate-800 px-1.5 py-0.5 text-indigo-300">AuthGuard</code> zweryfikował Twoją aktywną sesję Supabase.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="mb-4 flex items-center gap-3 text-indigo-400">
              <Server className="h-6 w-6" />
              <h2 className="font-semibold text-white">Axios Interceptor + FastAPI DI</h2>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Kliknij poniżej, aby przetestować komunikację z backendem za pomocą Axios z automatycznym wstrzykiwaniem tokenu JWT.
            </p>
            <button
              onClick={testBackendConnection}
              disabled={loadingApi}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50"
            >
              {loadingApi ? 'Weryfikacja w API...' : 'Sprawdź połączenie z /api/me'}
            </button>
          </div>
        </div>

        {/* API Result Display */}
        {(apiResponse || apiError) && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Wynik z backendu FastAPI:
            </h3>
            {apiResponse && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Autoryzacja po stronie FastAPI powiodła się!</span>
                </div>
                <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-indigo-300">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}
            {apiError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                ⚠️ {apiError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
