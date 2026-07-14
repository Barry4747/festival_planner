import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/dashboard/Navbar';
import { DiscoveryMap, type FestivalItem } from '../components/DiscoveryMap';
import { AIChat } from '../components/AIChat';
import { TripPlanner } from '../components/TripPlanner';
import { SuggestFestivalModal } from '../components/SuggestFestivalModal';
import { Map, SlidersHorizontal, Sparkles } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<FestivalItem | null>(null);
  const [activeMode, setActiveMode] = useState<'split' | 'form'>('split');
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || null);
    });
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-[#090b0a] text-white">
      <Navbar userEmail={userEmail} />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 flex flex-col">
        <div className="mx-auto w-full max-w-7xl flex-1 flex flex-col">
          {/* Header Bar */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Festival Discovery & AI Concierge</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  <span>v2 Split-Screen</span>
                </span>
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Fast, deterministic map-based festival search paired with generative AI concierge.
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#111412] p-1.5 self-start">
              <button
                type="button"
                onClick={() => setActiveMode('split')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeMode === 'split'
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Map className="h-3.5 w-3.5" />
                <span>Split-Screen Map & Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('form')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeMode === 'form'
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Legacy Form Planner</span>
              </button>
            </div>
          </div>

          {/* Active View */}
          {activeMode === 'split' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-[660px]">
              {/* Left side: Interactive Map */}
              <div className="lg:col-span-7 flex flex-col h-[650px] lg:h-auto">
                <DiscoveryMap
                  selectedFestival={selectedFestival}
                  onSelectFestival={(fest) => setSelectedFestival(fest)}
                  onOpenSuggestModal={() => setIsSuggestModalOpen(true)}
                />
              </div>

              {/* Right side: AI Chatbot */}
              <div className="lg:col-span-5 flex flex-col h-[650px] lg:h-auto">
                <AIChat
                  selectedFestival={selectedFestival}
                  onClearSelection={() => setSelectedFestival(null)}
                />
              </div>
            </div>
          ) : (
            <TripPlanner />
          )}
        </div>
      </main>

      <SuggestFestivalModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
