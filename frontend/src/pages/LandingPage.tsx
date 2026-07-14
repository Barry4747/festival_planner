import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Compass, ArrowUpRight } from 'lucide-react';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { FestivalShowcase } from '../components/landing/FestivalShowcase';
import { AuthSection } from '../components/auth/AuthSection';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const authRef = useRef<HTMLDivElement>(null);

  const scrollToAuth = (_mode?: 'signin' | 'signup') => {
    authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleAuthSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-dvh bg-[#090b0a] text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* ── MINIMALIST HUMANISTIC TOP BAR ── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#090b0a]/90 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Mark */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-black shadow-md shadow-emerald-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-sm font-medium tracking-tight text-white">
                Festival Planner AI
              </span>
              <span className="block text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                Solomei Suite
              </span>
            </div>
          </div>

          {/* Elegant Page-Free Anchor Links */}
          <div className="hidden items-center gap-8 sm:flex text-xs font-light tracking-wide text-slate-300">
            <a href="#chronicles" className="transition-colors hover:text-emerald-400">
              Chronicles
            </a>
            <a href="#architecture" className="transition-colors hover:text-emerald-400">
              Architecture
            </a>
            <a href="#suite" className="transition-colors hover:text-emerald-400">
              Suite Access
            </a>
          </div>

          {/* CTA */}
          <Button
            onClick={() => scrollToAuth('signup')}
            variant="primary"
            size="sm"
            className="rounded-xl px-4 py-2 text-xs font-semibold shadow-lg shadow-emerald-500/20"
          >
            <span>Launch Studio</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </nav>

      {/* ── HERO INTERACTIVE INTENT ENGINE ── */}
      <Hero
        onGetStarted={() => scrollToAuth('signup')}
        onSignIn={() => scrollToAuth('signin')}
      />

      {/* ── EDITORIAL CHRONICLES ── */}
      <div id="chronicles">
        <FestivalShowcase />
      </div>

      {/* ── HUMANISTIC ARCHITECTURE ── */}
      <div id="architecture">
        <Features />
      </div>

      {/* ── AUTHENTICATION SUITE ── */}
      <section id="suite" ref={authRef} className="py-28 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-emerald-600/10 blur-[130px] -z-10" />

        <div className="mx-auto max-w-md">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-mono text-emerald-400 mb-3">
              <Compass className="h-3 w-3" />
              <span>ENTER THE CONCIERGE SUITE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white leading-tight">
              Begin your bespoke <br />
              <span className="font-serif italic text-emerald-400">festival journey</span>.
            </h2>
            <p className="mt-2.5 text-xs font-light text-slate-300 leading-relaxed">
              Create your secure profile or sign in with Google to unlock full split-screen cartography, 
              live Ticketmaster coordinates, and instant LangGraph itinerary synthesis.
            </p>
          </div>

          {/* Auth Card */}
          <div className="rounded-3xl border border-white/10 bg-[#111412] p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
            <AuthSection onSuccess={handleAuthSuccess} />
          </div>

          <p className="mt-5 text-center text-[11px] font-light text-slate-500">
            Strictly Private · Powered by Supabase Authentication · Zero Data Selling
          </p>
        </div>
      </section>

      {/* ── BOUTIQUE EDITORIAL FOOTER ── */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 mt-auto bg-[#0a0d0b]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold font-mono">
              AI
            </div>
            <div>
              <span className="block font-medium text-slate-300">Festival Planner AI · Solomei Experience</span>
              <span className="block text-[10px] text-slate-500 font-light">Humanistic Artificial Intelligence Architecture</span>
            </div>
          </div>
          <p className="text-center sm:text-right font-light text-[11px] text-slate-400 leading-relaxed">
            Orchestrated with LangGraph · Google Gemini AI · Ticketmaster Segment `KZFzniwnSyZfZ7v7nJ` · Supabase
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
