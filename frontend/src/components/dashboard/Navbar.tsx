import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { LogOut, ChevronDown } from 'lucide-react';
import gsap from 'gsap';

interface NavbarProps {
  userEmail?: string | null;
  userAvatar?: string | null;
  userName?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ userEmail, userAvatar, userName }) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(
        navRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 }
      );
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const initials = userName
    ? userName.slice(0, 2).toUpperCase()
    : userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : '??';

  return (
    <header
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: 'rgba(18, 18, 18, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        opacity: 0, // will be animated by GSAP
      }}
    >
      <div className="mx-auto flex h-14 max-w-full items-center justify-between px-6">
        {/* Logo */}
        <NavLink to="/discover" className="flex items-center gap-2.5 group">
          <img src="/logo-simple-transparent.svg" alt="LINEUP Logo" className="h-6 w-auto transition-opacity duration-300 group-hover:opacity-80" />
          <span
            className="hidden sm:block text-sm font-medium tracking-wide"
            style={{ color: '#EDEDED' }}
          >
            {t('nav.logo')}
          </span>
        </NavLink>

        {/* Center nav */}
        <nav className="flex items-center gap-8">
          {[
            { to: '/discover', label: t('nav.discover') },
            { to: '/my-trips', label: t('nav.myTrips') },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-xs font-semibold uppercase tracking-widest transition-all duration-300 pb-0.5 ${
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
            className="flex items-center gap-2 rounded-full transition-all duration-300 hover:opacity-80 focus:outline-none"
            style={{ padding: '3px 3px 3px 10px', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span className="text-xs font-medium hidden sm:block" style={{ color: '#A1A1AA' }}>
              {userName || userEmail?.split('@')[0] || ''}
            </span>
            <ChevronDown size={10} style={{ color: '#A1A1AA' }} />
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
                style={{ border: '1px solid rgba(16, 185, 129, 0.3)' }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: '#10B981',
                  color: '#121212',
                  border: '1px solid rgba(16,185,129,0.3)',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
            )}
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div
                className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden"
                style={{
                  backgroundColor: 'rgba(30, 30, 30, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <div className="px-3.5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {userAvatar && (
                    <img
                      src={userAvatar}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover mb-2.5"
                      style={{ border: '1px solid rgba(16,185,129,0.25)' }}
                    />
                  )}
                  {userName && (
                    <p className="text-xs font-semibold truncate" style={{ color: '#EDEDED' }}>
                      {userName}
                    </p>
                  )}
                  <p className="text-[11px] truncate" style={{ color: '#A1A1AA' }}>
                    {userEmail}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-medium flex items-center gap-2 transition-all duration-200 hover:bg-white/5"
                  style={{ color: '#A1A1AA' }}
                >
                  <LogOut size={12} />
                  {t('nav.signOut')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
