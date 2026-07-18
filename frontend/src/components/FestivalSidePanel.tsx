import React, { useState } from 'react';
import type { FestivalItem } from '../types';
import {
  MapPin,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
  Music,
  Tag,
  Filter,
} from 'lucide-react';

interface FestivalSidePanelProps {
  festivals: FestivalItem[];
  selectedFestival: FestivalItem | null;
  onSelectFestival: (festival: FestivalItem) => void;
  loading: boolean;
}

export const FestivalSidePanel: React.FC<FestivalSidePanelProps> = ({
  festivals,
  selectedFestival,
  onSelectFestival,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  // Collect unique genres
  const genres = ['All', ...Array.from(new Set(festivals.map((f) => f.genre || f.category || 'Music')))];

  const filteredFestivals = festivals.filter((fest) => {
    const matchesSearch =
      fest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fest.city && fest.city.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGenre =
      selectedGenre === 'All' ||
      fest.genre === selectedGenre ||
      fest.category === selectedGenre ||
      (selectedGenre === 'Music' && !fest.genre && !fest.category);
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="flex h-full w-full flex-col bg-[#0d0f0e] text-white border-l border-white/10 shadow-2xl overflow-hidden">
      {/* Panel Header */}
      <div className="flex flex-col gap-3 p-4 border-b border-white/10 bg-[#111412]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Discovered Festivals
              </h3>
              <p className="text-[11px] text-slate-400">
                Click any pane to select & open AI Concierge
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-400 border border-emerald-500/20">
            {festivals.length}
          </span>
        </div>

        {/* Search Input within Sidebar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#161a18] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>

        {/* Genre / Category Filter Chips */}
        {genres.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            <Filter className="h-3 w-3 text-slate-500 shrink-0 mr-0.5" />
            {genres.slice(0, 8).map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`shrink-0 rounded-lg px-2 py-0.5 font-medium transition-all ${
                  selectedGenre === genre
                    ? 'bg-emerald-500 text-black font-bold shadow-sm shadow-emerald-500/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pane List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-xs">Scanning area & aggregating festivals...</p>
          </div>
        ) : filteredFestivals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center text-slate-500 p-4">
            <Music className="h-8 w-8 opacity-30 mb-1" />
            <p className="text-xs font-semibold text-slate-400">No festivals found</p>
            <p className="text-[11px]">Try moving the map center pin or adjusting the radius slider above.</p>
          </div>
        ) : (
          filteredFestivals.map((fest) => {
            const isSelected = selectedFestival?.id === fest.id;
            const imgUrl = fest.image_url || fest.image;
            const isLocal = fest.source_name && fest.source_name.toLowerCase().includes('local');
            const dateDisplay = fest.start_date || fest.dates || '';

            return (
              <div
                key={fest.id}
                onClick={() => onSelectFestival(fest)}
                className={`group relative flex items-center gap-3.5 rounded-2xl p-3 cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.01]'
                    : 'bg-[#141816] border-white/5 hover:border-white/20 hover:bg-[#191e1b]'
                }`}
              >
                {/* Left side: Festival Logo / Image */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#1d231f] border border-white/10 flex items-center justify-center">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={fest.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-emerald-400/60 p-1 text-center">
                      <Music className="h-6 w-6 mb-0.5" />
                      <span className="text-[8px] font-mono leading-tight uppercase">Festival</span>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-emerald-500/20 ring-2 ring-emerald-400 ring-inset rounded-xl pointer-events-none" />
                  )}
                </div>

                {/* Right side: Name, City, Dates, Category */}
                <div className="flex flex-1 flex-col justify-between overflow-hidden min-w-0 py-0.5">
                  <div className="flex items-start justify-between gap-1.5">
                    <h4
                      className={`truncate text-xs font-bold leading-tight transition-colors ${
                        isSelected ? 'text-emerald-400' : 'text-white group-hover:text-emerald-300'
                      }`}
                    >
                      {fest.name}
                    </h4>
                    {isLocal ? (
                      <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                        ✨ Niche
                      </span>
                    ) : fest.source_name ? (
                      <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300">
                        {fest.source_name}
                      </span>
                    ) : null}
                  </div>

                  {/* City / Location */}
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-300 font-medium truncate">
                    <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      {fest.city || (fest.coordinates ? `${fest.coordinates.lat.toFixed(2)}, ${fest.coordinates.lng.toFixed(2)}` : 'Europe')}
                    </span>
                  </div>

                  {/* Date range & Category */}
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                    {dateDisplay && (
                      <div className="flex items-center gap-1 text-slate-300 font-medium">
                        <Calendar className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span>{dateDisplay}</span>
                        {fest.end_date && fest.end_date !== dateDisplay && (
                          <span> - {fest.end_date}</span>
                        )}
                      </div>
                    )}

                    {(fest.genre || fest.category) && (
                      <div className="flex items-center gap-1 text-emerald-400/90 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        <Tag className="h-2.5 w-2.5" />
                        <span className="truncate max-w-[100px]">{fest.genre || fest.category}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ticket Link if present and hovered/selected */}
                {fest.url && (
                  <a
                    href={fest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-2.5 right-2.5 rounded-lg bg-white/10 p-1.5 text-slate-300 hover:bg-emerald-500 hover:text-black transition-all shadow"
                    title="Open official ticket URL"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FestivalSidePanel;
