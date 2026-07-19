import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '../lib/supabase';
import { AuthSection } from '../components/auth/AuthSection';
import { ScrollCanvas } from '../components/ScrollCanvas';
import { useTranslation } from 'react-i18next';

gsap.registerPlugin(ScrollTrigger);

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const overlayTitleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const scrollPromptRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLElement>(null);
  const authSectionRef = useRef<HTMLElement>(null);
  const authContentRef = useRef<HTMLDivElement>(null);

  const [loadedFrames, setLoadedFrames] = useState(0);
  const isFullyLoaded = loadedFrames >= 146;

  // Scroll lock
  useEffect(() => {
    if (!isFullyLoaded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isFullyLoaded]);

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/discover');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/discover');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Navbar transparency on scroll
  useEffect(() => {
    const el = navbarRef.current;
    if (!el) return;
    const handler = () => {
      el.style.backgroundColor = window.scrollY > 20 ? '#1E1E1E' : 'transparent';
      el.style.borderBottomColor = window.scrollY > 20 ? '#2D2D2D' : 'transparent';
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // GSAP hero overlay text fade out
  useEffect(() => {
    const section = heroSectionRef.current;
    const overlay = overlayTitleRef.current;
    if (!section || !overlay) return;

    const ctx = gsap.context(() => {
      // Initial state
      if (!isFullyLoaded) {
        gsap.set([subtitleRef.current, titleRef.current, descRef.current, scrollPromptRef.current], {
          opacity: 0,
          y: 32
        });
      }

      // Fade in sequentially when fully loaded
      if (isFullyLoaded) {
        gsap.to([subtitleRef.current, titleRef.current, descRef.current, scrollPromptRef.current], {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          delay: 0.4
        });
      }

      // Fade out overlay text as user scrolls
      gsap.to(overlay, {
        opacity: 0,
        y: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '25% top',
          scrub: true,
        },
      });

      // Auth Section reveal
      if (authSectionRef.current) {
        gsap.set(authSectionRef.current, {
          clipPath: 'inset(15% 15% 15% 15% round 24px)'
        });
        
        gsap.to(authSectionRef.current, {
          clipPath: 'inset(0% 0% 0% 0% round 0px)',
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: authSectionRef.current,
            start: 'top 90%',
            end: 'top 30%',
            scrub: true,
          }
        });
      }
    });

    return () => ctx.revert();
  }, [isFullyLoaded]);

  const handleAuthSuccess = () => navigate('/discover');
  const scrollToAuth = () => {
    document.getElementById('access-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div style={{ backgroundColor: '#121212', color: '#EDEDED', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── NAVBAR ── */}
      <nav
        ref={navbarRef}
        className="fixed top-0 left-0 right-0 z-50 transition-colors duration-200"
        style={{ backgroundColor: 'transparent', borderBottom: '1px solid transparent' }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <span style={{ color: '#10B981', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.15em' }}>
            {t('nav.title')}
          </span>
          <button
            onClick={scrollToAuth}
            className="text-xs font-medium px-4 py-2 transition-colors"
            style={{ color: '#10B981', border: '1px solid #10B981', borderRadius: '2px' }}
          >
            {t('nav.get_access')}
          </button>
        </div>
      </nav>

      {/* ── SCROLL-BOUND VIDEO HERO (200vh tall) ── */}
      <section ref={heroSectionRef} style={{ height: '200vh', position: 'relative' }}>
        {/* Sticky viewport frame */}
        <div
          ref={stickyRef}
          style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}
        >
          {/* Canvas Image Sequence Layer */}
          <ScrollCanvas 
            frameCount={146} 
            urlTemplate="/frames_fast/frame_{index}.webp" 
            onProgress={(loaded) => setLoadedFrames(loaded)}
          />

          {/* Loading Overlay */}
          <div 
            className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#121212] transition-opacity duration-1000 ${isFullyLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <div className="text-center">
              <p className="text-[0.65rem] font-bold tracking-[0.2em] text-[#A1A1AA] mb-4">
                {t('hero.loading')} [ {Math.round((loadedFrames / 146) * 100)}% ]
              </p>
              <div className="h-[2px] bg-[#2D2D2D] w-48 mx-auto overflow-hidden rounded-full">
                <div 
                  className="h-full bg-[#10B981] transition-all duration-300 ease-out" 
                  style={{ width: `${(loadedFrames / 146) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Solid dark overlay for text readability */}
          <div className="absolute inset-0 z-10 pointer-events-none" style={{ backgroundColor: 'rgba(18,18,18,0.6)' }}></div>

          {/* Overlay text */}
          <div
            ref={overlayTitleRef}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 24px',
            }}
          >
            <p
              ref={subtitleRef}
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.25em',
                color: '#10B981',
                textTransform: 'uppercase',
                marginBottom: '24px',
              }}
            >
              {t('hero.subtitle')}
            </p>
            <h1
              ref={titleRef}
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                fontWeight: 700,
                lineHeight: 1.05,
                color: '#EDEDED',
                maxWidth: '820px',
                margin: '0 0 32px',
              }}
            >
              {t('hero.title_start')}
              <span style={{ color: '#10B981' }}>{t('hero.title_accent')}</span>{' '}
              {t('hero.title_end')}
            </h1>
            <p
              ref={descRef}
              style={{
                fontSize: '1rem',
                color: '#A1A1AA',
                maxWidth: '480px',
                lineHeight: 1.65,
                marginBottom: '48px',
              }}
            >
              {t('hero.description')}
            </p>

          {/* Scroll Prompt */}
          <div
            ref={scrollPromptRef}
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              zIndex: 20,
            }}
            >
              <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: '#A1A1AA', textTransform: 'uppercase' }}>{t('hero.scroll')}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
              <path d="M12 5v14M19 12l-7 7-7-7"/>
            </svg>
          </div>
            <button
              onClick={scrollToAuth}
              className="transition-colors"
              style={{
                backgroundColor: '#10B981',
                color: '#121212',
                fontWeight: 600,
                fontSize: '0.875rem',
                padding: '12px 32px',
                borderRadius: '2px',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              {t('hero.button')}
            </button>

            {/* Scroll hint */}
            <div
              style={{
                position: 'absolute',
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: '#A1A1AA', textTransform: 'uppercase' }}>
                {t('hero.scroll')}
              </p>
              <div
                style={{
                  width: '1px',
                  height: '40px',
                  backgroundColor: '#2D2D2D',
                  animation: 'scrollIndicator 1.5s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section style={{ backgroundColor: '#121212', padding: '120px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: '#10B981', textTransform: 'uppercase', marginBottom: '24px' }}>
            {t('features.label')}
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 3rem)', fontWeight: 700, color: '#EDEDED', marginBottom: '80px', maxWidth: '600px' }}>
            {t('features.title')}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', backgroundColor: '#2D2D2D' }}>
            {[
              { n: '01', title: t('features.map_title'), desc: t('features.map_desc') },
              { n: '02', title: t('features.ai_title'), desc: t('features.ai_desc') },
              { n: '03', title: t('features.route_title'), desc: t('features.route_desc') },
              { n: '04', title: t('features.trips_title'), desc: t('features.trips_desc') },
            ].map(({ n, title, desc }) => (
              <div
                key={n}
                style={{ backgroundColor: '#121212', padding: '40px 32px' }}
              >
                <p style={{ fontSize: '0.65rem', color: '#2D2D2D', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '16px' }}>{n}</p>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#EDEDED', marginBottom: '12px' }}>{title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#A1A1AA', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUTH SECTION ── */}
      <section 
        id="access-section" 
        ref={authSectionRef}
        style={{ 
          position: 'relative',
          backgroundColor: '#1E1E1E', 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          backgroundImage: 'url(/landing-behind-sso.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(18,18,18,0.7)', zIndex: 0 }}></div>
        <div ref={authContentRef} style={{ width: '100%', maxWidth: '420px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: '#10B981', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
            {t('auth.label')}
          </p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#EDEDED', marginBottom: '40px', textAlign: 'center' }}>
            {t('auth.title')}
          </h2>
          <div style={{ 
            backgroundColor: '#1E1E1E', 
            padding: '40px 32px', 
            borderRadius: '4px',
            border: '1px solid #2D2D2D',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <AuthSection onSuccess={handleAuthSuccess} />
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 24px', textAlign: 'center', zIndex: 1 }}>
          <p style={{ fontSize: '0.75rem', color: '#A1A1AA' }}>{t('footer.copyright')}</p>
        </footer>
      </section>

      <style>{`
        @keyframes scrollIndicator {
          0%, 100% { opacity: 0.2; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(0.6); }
        }
      `}</style>
    </div>
  );
};
