import React from 'react';
import { Cpu, Music2, MapPin, Zap, Shield, Sparkles } from 'lucide-react';

const ARCHITECTURE_BLOCKS = [
  {
    code: "01 · ORCHESTRATION",
    title: 'Kallimachos AI Engine',
    subtitle: 'LangGraph + Google Gemini Multi-Agent Synthesis',
    description:
      'Inspired by ancient curation philosophy, our modular agents dynamically assemble itinerary blocks, travel logistics, and hotel accommodations without forcing you through rigid forms or multi-page funnels.',
    icon: Cpu,
  },
  {
    code: "02 · LIVE CULTURAL DATA",
    title: 'Ticketmaster Discovery API',
    subtitle: 'Direct Segment ID (KZFzniwnSyZfZ7v7nJ) Integration',
    description:
      'Real-time access to the European music ecosystem. We bypass stale databases to verify live artist rosters, exact coordinates (`_embedded.venues`), and accurate ticket availability across major countries.',
    icon: Music2,
  },
  {
    code: "03 · VISUAL INTELLIGENCE",
    title: 'Thamyris Spatial Mapping',
    subtitle: 'Split-Screen Interactive Leaflet Cartography',
    description:
      'A continuous dialogue between map exploration and AI conversation. Pin any coordinate across Europe, adjust your search radius up to 500 km, and watch our generative concierge adapt immediately.',
    icon: MapPin,
  },
  {
    code: "04 · SPEED & CRAFTSMANSHIP",
    title: '30-Second Turnaround',
    subtitle: 'Parallel Asynchronous Execution',
    description:
      'We treat time as a luxury. Parallel API queries and structured JSON output formatting construct complete, personalized travel schedules in under thirty seconds.',
    icon: Zap,
  },
  {
    code: "05 · HUMANISTIC PRIVACY",
    title: 'Zero-Friction Identity',
    subtitle: 'Protected by Supabase Authentication',
    description:
      'Your personal travel tastes, budget boundaries, and saved itineraries are strictly confidential. One-click Google login ensures seamless security without intrusive data mining.',
    icon: Shield,
  },
  {
    code: "06 · AUDITORY ALIGNMENT",
    title: 'Genre Cross-Synthesis',
    subtitle: 'Personalized Acoustic Matching',
    description:
      'Our agents evaluate festival lineups against your distinct musical preferences—whether melodic techno, post-punk, or ambient indie—to ensure your itinerary resonates with your true taste.',
    icon: Sparkles,
  },
];

export const Features: React.FC = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-[#090b0a]">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold">
            The Humanistic Architecture
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-white leading-tight">
            Technology built to serve <br />
            <span className="font-serif italic text-emerald-400">human curiosity & art</span>.
          </h2>
          <p className="mt-4 text-sm font-light leading-relaxed text-slate-300/80">
            Every technical component is designed with simplicity and elegance in mind. We eliminate 
            digital clutter so you can focus entirely on your musical journey.
          </p>
        </div>

        {/* Architectural Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ARCHITECTURE_BLOCKS.map((block) => {
            const Icon = block.icon;
            return (
              <div
                key={block.title}
                className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#101311] p-7 transition-all duration-300 hover:border-emerald-500/40 hover:bg-[#141816]"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-wider text-emerald-400/80 uppercase">
                      {block.code}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="mb-1 text-xl font-medium text-white group-hover:text-emerald-300 transition-colors">
                    {block.title}
                  </h3>
                  <p className="mb-4 text-xs font-mono text-slate-400">
                    {block.subtitle}
                  </p>

                  <p className="text-xs leading-relaxed text-slate-300/80 font-light">
                    {block.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
