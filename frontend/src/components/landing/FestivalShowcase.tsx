import React from 'react';
import { MapPin, Calendar, ArrowRight, Music } from 'lucide-react';

const festivals = [
  {
    name: "Open'er Festival",
    location: 'Gdynia, Poland',
    dates: '1–4 Jul 2026',
    genre: 'Rock · Indie · Electronic',
  },
  {
    name: "Pol'and'Rock",
    location: 'Czaplinek, Poland',
    dates: '30 Jul – 1 Aug 2026',
    genre: 'Rock · Punk · Alternative',
  },
  {
    name: 'OFF Festival',
    location: 'Katowice, Poland',
    dates: '7–9 Aug 2026',
    genre: 'Indie · Alternative · Experimental',
  },
  {
    name: 'Sziget Festival',
    location: 'Budapest, Hungary',
    dates: '5–10 Aug 2026',
    genre: 'Multi-genre · International',
  },
  {
    name: 'Tomorrowland',
    location: 'Boom, Belgium',
    dates: '17–26 Jul 2026',
    genre: 'Electronic · Techno · House',
  },
];

export const FestivalShowcase: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Featured 2026 Festivals
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Select any festival to auto-fill your trip planner.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {festivals.map((fest) => (
            <div
              key={fest.name}
              className="group flex flex-col justify-between rounded-xl border border-white/10 bg-[#111412] p-5 transition-all duration-150 hover:border-emerald-500/40 hover:bg-[#151917] cursor-pointer"
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Music className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-medium tracking-wide uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    2026 Season
                  </span>
                </div>
                <h3 className="mb-1 text-lg font-semibold text-white">{fest.name}</h3>
                <p className="mb-4 text-xs font-medium text-slate-400">{fest.genre}</p>

                <div className="space-y-1.5 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span>{fest.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>{fest.dates}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-medium text-emerald-400 group-hover:text-emerald-300">
                <span>Configure Trip</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
