import React, { useState } from 'react';
import { LogOut, Sparkles, ChevronDown, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface NavbarProps {
  userEmail?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ userEmail }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const initials = userEmail
    ? userEmail.substring(0, 2).toUpperCase()
    : 'AI';

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090b0a]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">
            Festival Planner AI
          </span>
          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
            Pro
          </span>
        </div>

        {/* Right side */}
        <div className="relative flex items-center gap-3">
          {/* User button */}
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111412] px-3 py-1.5 text-xs font-medium transition-colors hover:border-white/20"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-600/20 text-emerald-400 font-bold text-[11px]">
              {initials}
            </div>
            <span className="max-w-[150px] truncate text-slate-300">
              {userEmail || 'Account'}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#111412] shadow-lg">
                <div className="border-b border-white/10 px-3.5 py-2.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-white">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{userEmail}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-xs text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
