import React, { useState } from 'react';
import { MapPin, Calendar, ArrowRight, Sparkles, Compass } from 'lucide-react';

const CHRONICLES = [
  {
    chapter: "CHAPTER I · JULY 2026",
    name: "Open'er Festival 2026",
    location: 'Gdynia, Poland · Coastal Airport Grounds',
    dates: '1–4 Jul 2026',
    genre: 'Rock · Indie · Electronic Avant-Garde',
    synthesis: 'A massive coastal sanctuary blending headlining global rock acts with intimate late-night electronic domes just minutes from the Baltic Sea.',
    estimate: 'From €210 / 4-day pass'
  },
  {
    chapter: "CHAPTER II · JULY 2026",
    name: "Tomorrowland Belgium",
    location: 'Boom, Belgium · De Schorre Park',
    dates: '17–26 Jul 2026',
    genre: 'Electronic · Melodic Techno · Progressive House',
    synthesis: 'The pinnacle of electronic stage architecture and immersive world-building. Recommended booking window via AI concierge: 6 months prior.',
    estimate: 'From €360 / weekend'
  },
  {
    chapter: "CHAPTER III · JULY/AUGUST 2026",
    name: "Pol'and'Rock Festival",
    location: 'Czaplinek-Broczyno, West Pomerania',
    dates: '30 Jul – 1 Aug 2026',
    genre: 'Rock · Punk · Alternative Community',
    synthesis: 'One of Europes most authentic open-air cultural celebrations. Free entry philosophy paired with community-driven camping acoustics.',
    estimate: 'Free Admission / €80 lodging'
  },
  {
    chapter: "CHAPTER IV · AUGUST 2026",
    name: 'OFF Festival Katowice',
    location: 'Katowice, Poland · Three Ponds Valley',
    dates: '7–9 Aug 2026',
    genre: 'Indie · Post-Punk · Experimental Jazz',
    synthesis: 'Curated specifically for sonic connoisseurs seeking rare performances, green parkland acoustics, and zero commercial compromises.',
    estimate: 'From €165 / 3-day pass'
  },
  {
    chapter: "CHAPTER V · AUGUST 2026",
    name: 'Sziget Festival Island',
    location: 'Budapest, Hungary · Óbuda Island',
    dates: '5–10 Aug 2026',
    genre: 'Multi-genre · Global Pop · Art Installations',
    synthesis: 'The Island of Freedom: an entire week of continuous cultural immersion right in the heart of the Danube river, boasting over 60 stages.',
    estimate: 'From €290 / 6-day pass'
  },
  {
    chapter: "CHAPTER VI · AUGUST 2026",
    name: 'Primavera Sound Porto',
    location: 'Porto, Portugal · Parque da Cidade',
    dates: '12–14 Aug 2026',
    genre: 'Dream Pop · Shoegaze · Electronic',
    synthesis: 'Where Atlantic breezes meet refined indie selection. Set within a lush urban park sloping directly down to the ocean beach.',
    estimate: 'From €180 / full festival'
  }
];

export const FestivalShowcase: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handleSelectChronicle = (_festName: string) => {
    const el = document.getElementById('auth');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-[#0a0d0b]">
      <div className="mx-auto max-w-6xl">
        {/* Editorial Section Header */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-white/10 pb-8">
          <div className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-semibold flex items-center gap-2">
              <Compass className="h-3.5 w-3.5" />
              <span>Curated 2026 Chronicles</span>
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-white leading-tight">
              An anthology of <br />
              <span className="font-serif italic text-emerald-400">Europes most resonant</span> stages.
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-light text-slate-400 max-w-md leading-relaxed">
            Each destination below is mapped directly into our live Ticketmaster (`KZFzniwnSyZfZ7v7nJ`) engine. 
            Select any chapter to begin synthesizing your customized travel and lodging blueprint.
          </p>
        </div>

        {/* Modular Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CHRONICLES.map((chronicle, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={chronicle.name}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => handleSelectChronicle(chronicle.name)}
                className={`group flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300 cursor-pointer ${
                  isHovered
                    ? 'border-emerald-500/50 bg-[#121614] shadow-2xl shadow-emerald-500/10 scale-[1.01]'
                    : 'border-white/10 bg-[#0e110f] hover:border-white/20'
                }`}
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400/90 font-semibold">
                      {chronicle.chapter}
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-mono text-slate-300">
                      {chronicle.estimate}
                    </span>
                  </div>

                  <h3 className="mb-2 text-xl font-medium text-white group-hover:text-emerald-300 transition-colors">
                    {chronicle.name}
                  </h3>
                  <p className="mb-4 text-xs font-mono text-emerald-400/80">
                    {chronicle.genre}
                  </p>

                  <p className="mb-6 text-xs leading-relaxed text-slate-300/80 font-light">
                    {chronicle.synthesis}
                  </p>

                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{chronicle.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{chronicle.dates}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Synthesize Itinerary</span>
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
