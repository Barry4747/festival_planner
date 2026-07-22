import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Brakuje zmiennych środowiskowych VITE_SUPABASE_URL lub VITE_SUPABASE_ANON_KEY w pliku .env.local');
}

/**
 * Klient Supabase.
 * Tokeny auth zarządzane są przez backend (FastAPI) za pomocą HttpOnly cookies.
 * Nie używamy local storage ani ciastek zarządzanych przez przeglądarkę, by zapobiec atakom XSS.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Turn off client-side persistence
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
