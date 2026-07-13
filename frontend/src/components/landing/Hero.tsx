import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeroProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted, onSignIn }) => {
  return (
    <section className="relative flex flex-col items-center justify-center pt-24 pb-20 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      <div className="mx-auto max-w-4xl text-center">
        {/* Minimalist Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI-Powered Festival & Trip Orchestrator</span>
        </div>

        {/* Headline */}
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Intelligent trip planning <br className="hidden sm:inline" />
          for <span className="text-emerald-400">music lovers</span>.
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          Analyze festival lineups instantly with Google Gemini AI and live Ticketmaster concert data. 
          Get a complete, budget-optimized travel itinerary in seconds without the manual hassle.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={onGetStarted}
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
          >
            <span>Start Planning — Free</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            onClick={onSignIn}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            Sign In to Account
          </Button>
        </div>

        {/* Clean Stats Row */}
        <div className="mt-16 pt-12 border-t border-white/10 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-white">500+</span>
            <span className="text-xs text-slate-500 mt-1">Festivals Covered</span>
          </div>
          <div className="flex flex-col items-center border-x border-white/10">
            <span className="text-2xl sm:text-3xl font-bold text-white">Live</span>
            <span className="text-xs text-slate-500 mt-1">Ticketmaster API</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400">100%</span>
            <span className="text-xs text-slate-500 mt-1">AI Automated</span>
          </div>
        </div>
      </div>
    </section>
  );
};
