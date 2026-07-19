import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface NavbarProps {
  userEmail?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ userEmail }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : '??';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-colors duration-200"
      style={{
        backgroundColor: scrolled ? '#1E1E1E' : 'transparent',
        borderBottom: scrolled ? '1px solid #2D2D2D' : '1px solid transparent',
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <NavLink to="/discover" className="flex items-center gap-2">
          <span
            className="text-sm font-semibold tracking-widest uppercase"
            style={{ color: '#10B981', letterSpacing: '0.15em' }}
          >
            FP
          </span>
          <span className="hidden sm:block text-sm font-medium" style={{ color: '#EDEDED' }}>
            Festival Planner
          </span>
        </NavLink>

        {/* Center nav */}
        <nav className="flex items-center gap-8">
          {[
            { to: '/discover', label: 'Discover' },
            { to: '/my-trips', label: 'My Trips' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-150 pb-0.5 ${
                  isActive
                    ? 'border-b border-[#10B981] text-[#10B981]'
                    : 'text-[#A1A1AA] hover:text-[#EDEDED]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right: user avatar */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="flex items-center justify-center w-8 h-8 rounded-sm text-xs font-bold transition-colors"
            style={{ backgroundColor: '#2D2D2D', color: '#10B981', border: '1px solid #2D2D2D' }}
          >
            {initials}
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div
                className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-sm"
                style={{ backgroundColor: '#1E1E1E', border: '1px solid #2D2D2D' }}
              >
                <div className="px-3 py-2.5 border-b" style={{ borderColor: '#2D2D2D' }}>
                  <p className="text-xs" style={{ color: '#A1A1AA' }}>Signed in as</p>
                  <p className="text-xs font-medium truncate" style={{ color: '#EDEDED' }}>
                    {userEmail}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2.5 text-left text-xs font-medium transition-colors hover:bg-[#282828]"
                  style={{ color: '#A1A1AA' }}
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
