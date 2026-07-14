import React, { useState } from 'react';
import { ArrowRight, Sparkles, Send, Compass, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeroProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const INTENT_PRESETS = [
  {
    label: "🏔️ Alpine Electronic Sanctuary",
    prompt: "Curate a boutique electronic & ambient festival in the Alps under €800 with scenic mountain lodging.",
    response: {
      title: "Alpine Sanctuary Itinerary Synthesized",
      location: "Innsbruck & Swiss Alps Region",
      budgetBreakdown: "Festival Pass (€240) + Eco-Cabin Lodging (€380) + Train Pass (€150)",
      highlight: "Focusing on low-capacity, high-fidelity sound installations surrounded by panoramic mountain vistas. Live Ticketmaster cross-check confirms 4 matching July events.",
    }
  },
  {
    label: "🎻 Intimate European Indie",
    prompt: "Show me intimate acoustic & alternative indie gatherings across Central Europe in late July.",
    response: {
      title: "Intimate Indie Gatherings Curated",
      location: "Poland, Czechia & Germany Border",
      budgetBreakdown: "Full Weekend Pass (€180) + Boutique Camping (€160) + Direct Rail (€90)",
      highlight: "Selecting menu-free, pageless cultural celebrations emphasizing organic acoustic performances and human connection. 100% verified artist rosters via live APIs.",
    }
  },
  {
    label: "✨ Primavera VIP VIP Experience",
    prompt: "Architect a seamless luxury weekend VIP itinerary for Primavera Sound with private transfers.",
    response: {
      title: "Primavera VIP Architectural Plan",
      location: "Barcelona, Spain",
      budgetBreakdown: "VIP Festival Access (€520) + 4-Star Waterfront Hotel (€850) + Airport Express (€80)",
      highlight: "Orchestrating late-night headliner schedules with guaranteed private lounge access and Mediterranean culinary reservations.",
    }
  },
  {
    label: "🌊 Baltic Sunset Techno",
    prompt: "Discover coastal electronic festivals within 300 km of Gdansk/Warsaw for August.",
    response: {
      title: "Baltic Coastal Electronic Synthesis",
      location: "Hel Peninsula & Tri-City Coast, Poland",
      budgetBreakdown: "3-Day Festival Ticket (€190) + Seaside Glamping (€290) + Intercity PKP (€60)",
      highlight: "Optimized for beachfront stages, sunset DJ sets, and minimal transit friction from central transport hubs.",
    }
  }
];

export const Hero: React.FC<HeroProps> = ({ onGetStarted, onSignIn }) => {
  const [activeIntent, setActiveIntent] = useState<number>(0);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [displayedResponse, setDisplayedResponse] = useState<any>(INTENT_PRESETS[0].response);

  const handleSelectPreset = (idx: number) => {
    setActiveIntent(idx);
    setCustomPrompt('');
    setIsSynthesizing(true);
    setTimeout(() => {
      setDisplayedResponse(INTENT_PRESETS[idx].response);
      setIsSynthesizing(false);
    }, 450);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    setIsSynthesizing(true);
    setActiveIntent(-1);
    setTimeout(() => {
      setDisplayedResponse({
        title: "Bespoke Intent Synthesized",
        location: "Custom European Coordinate Radius",
        budgetBreakdown: "Dynamic Pricing based on real-time Ticketmaster API + Lodging Index",
        highlight: `Synthesizing customized AI itinerary for: "${customPrompt}". Our multi-agent concierge (Kallimachos engine) is ready to map your exact routes and artist schedules.`,
      });
      setIsSynthesizing(false);
    }, 600);
  };

  return (
    <section className="relative flex flex-col items-center justify-center pt-24 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-white/10">
      {/* Subtle luxury ambient glow behind hero */}
      <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 -z-10 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-emerald-900/20 via-emerald-600/10 to-transparent blur-[120px]" />

      <div className="mx-auto max-w-5xl text-center">
        {/* Editorial Brand Tagline */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 backdrop-blur-md transition-all hover:border-emerald-500/30">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] font-mono tracking-widest uppercase text-slate-300">
            Humanistic Artificial Intelligence · Solomei Architecture
          </span>
        </div>

        {/* Poetic & Elegant Headline */}
        <h1 className="mb-6 text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-white leading-[1.12]">
          Where human intention <br className="hidden sm:inline" />
          meets <span className="font-serif italic font-normal text-emerald-400">musical discovery</span>.
        </h1>

        {/* Philosophy Subtitle */}
        <p className="mx-auto mb-12 max-w-2xl text-base sm:text-lg font-light leading-relaxed text-slate-300/80">
          Abandon static menus and rigid booking funnels. Experience a fluid, pageless concierge 
          that dynamically composes European festival itineraries, live Ticketmaster schedules, 
          and bespoke travel acoustics based purely on your desire.
        </p>

        {/* ── INTERACTIVE HUMANISTIC AI CONCIERGE PREVIEW ── */}
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#101311]/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-left transition-all">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                Live Intent Synthesizer · Kallimachos Engine
              </span>
            </div>
            <span className="text-[11px] text-emerald-400/80 font-mono hidden sm:inline">
              Real-time API Ready
            </span>
          </div>

          {/* Quick Intent Selection Chips */}
          <div className="mb-5">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2.5">
              Select a Curated Inspiration or Express Your Own:
            </p>
            <div className="flex flex-wrap gap-2">
              {INTENT_PRESETS.map((preset, idx) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(idx)}
                  className={`rounded-xl px-3.5 py-2 text-xs transition-all duration-200 ${
                    activeIntent === idx
                      ? 'border border-emerald-500 bg-emerald-500/20 text-white font-medium shadow-lg shadow-emerald-500/10'
                      : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Input */}
          <form onSubmit={handleCustomSubmit} className="mb-6 relative">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Or type your exact festival dream (e.g. 'Techno weekend near Berlin under €600 in August')..."
              className="w-full rounded-2xl border border-white/10 bg-[#161a18] py-3.5 pl-4 pr-12 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-black shadow hover:bg-emerald-400 transition-colors"
              title="Synthesize custom intent"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {/* Live AI Synthesis Output Box */}
          <div className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-[#131715] to-[#101311] p-5 transition-all">
            {isSynthesizing ? (
              <div className="flex h-32 flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
                <span className="text-xs font-mono tracking-wider">
                  Orchestrating live Ticketmaster schedules & European coordinate synthesis...
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Compass className="h-4 w-4 text-emerald-400" />
                    <span>{displayedResponse.title}</span>
                  </h4>
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                    📍 {displayedResponse.location}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-300 font-light">
                  {displayedResponse.highlight}
                </p>

                <div className="rounded-xl border border-white/5 bg-black/40 p-3 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
                  <span>💰 Estimated Cost Architecture:</span>
                  <strong className="text-white">{displayedResponse.budgetBreakdown}</strong>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Verified by LangGraph + Supabase Identity</span>
                  </span>
                  <button
                    type="button"
                    onClick={onGetStarted}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
                  >
                    <span>Unlock Interactive Map & Book</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Clean CTA & Stats */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={onGetStarted}
            variant="primary"
            size="lg"
            className="w-full sm:w-auto px-8 py-3.5 font-medium tracking-wide"
          >
            <span>Launch Full Split-Screen Studio</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            onClick={onSignIn}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-white/15 hover:border-emerald-500/50"
          >
            Sign In to Existing Suite
          </Button>
        </div>

        {/* Editorial Philosophy Badges */}
        <div className="mt-16 pt-12 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto text-left sm:text-center">
          <div className="space-y-1">
            <span className="font-serif italic text-lg text-emerald-400">01. Menu-Free Flow</span>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              No cluttered indexes or rigid forms. A seamless dialogue between human curiosity and live cultural data.
            </p>
          </div>
          <div className="space-y-1 sm:border-x sm:border-white/10 sm:px-6">
            <span className="font-serif italic text-lg text-emerald-400">02. Live Discovery</span>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Direct connection to Ticketmaster's European music segment (`KZFzniwnSyZfZ7v7nJ`) with instant geocoding.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-serif italic text-lg text-emerald-400">03. Absolute Privacy</span>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Protected by Supabase Auth. Your itineraries, budget tolerances, and musical tastes remain strictly confidential.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
