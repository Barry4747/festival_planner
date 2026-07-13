import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { FestivalShowcase } from '../components/landing/FestivalShowcase';
import { AuthSection } from '../components/auth/AuthSection';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const authRef = useRef<HTMLDivElement>(null);

  const scrollToAuth = (mode?: 'signin' | 'signup') => {
    authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleAuthSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-dvh bg-[#090b0a] text-white flex flex-col">
      {/* Minimalist Top Bar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#090b0a]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              Festival Planner AI
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden items-center gap-6 sm:flex text-xs font-medium text-slate-400">
            <a href="#festivals" className="transition-colors hover:text-white">
              Festivals
            </a>
            <a href="#features" className="transition-colors hover:text-white">
              Features
            </a>
            <a href="#auth" className="transition-colors hover:text-white">
              Sign In
            </a>
          </div>

          {/* CTA */}
          <Button
            onClick={() => scrollToAuth('signup')}
            variant="primary"
            size="sm"
          >
            <span>Get Started</span>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <Hero
        onGetStarted={() => scrollToAuth('signup')}
        onSignIn={() => scrollToAuth('signin')}
      />

      {/* Festival Showcase */}
      <div id="festivals">
        <FestivalShowcase />
      </div>

      {/* Features */}
      <div id="features">
        <Features />
      </div>

      {/* Auth Section */}
      <section id="auth" ref={authRef} className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="mx-auto max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Access AI Planner
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Start your festival itinerary
            </h2>
            <p className="mt-2 text-xs text-slate-400">
              Create a secure account or sign in to configure and save your custom trips.
            </p>
          </div>

          {/* Auth Card */}
          <div className="rounded-xl border border-white/10 bg-[#111412] p-6 sm:p-8 shadow-sm">
            <AuthSection onSuccess={handleAuthSuccess} />
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            Protected by Supabase Authentication. Terms & Privacy apply.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-600/20 text-emerald-400 font-bold">
              AI
            </div>
            <span className="font-medium text-slate-400">Festival Planner AI</span>
          </div>
          <p>
            Powered by LangGraph · Gemini AI · Ticketmaster API · Supabase
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
