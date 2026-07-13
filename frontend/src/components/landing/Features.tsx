import React from 'react';
import { Cpu, Music2, MapPin, Zap, Shield, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Cpu,
    title: 'LangGraph Orchestration',
    description:
      'A multi-step AI pipeline powered by Google Gemini handles lineup analysis, ticket queries, and itinerary synthesis seamlessly.',
  },
  {
    icon: Music2,
    title: 'Live Ticketmaster API',
    description:
      'Real-time concert data from Ticketmaster Discovery API guarantees accurate artist schedules, venues, and ticket prices.',
  },
  {
    icon: MapPin,
    title: 'Smart Travel & Budgeting',
    description:
      'Input your departure city and budget limit. The AI builds a realistic travel, lodging, and festival cost breakdown.',
  },
  {
    icon: Zap,
    title: '30-Second Turnaround',
    description:
      'Parallel API execution and structured output generation deliver a complete custom plan in under half a minute.',
  },
  {
    icon: Shield,
    title: 'Secure Supabase Auth',
    description:
      'Enterprise-grade authentication with Google OAuth or email. Your preferences and saved itineraries are strictly private.',
  },
  {
    icon: BarChart3,
    title: 'Genre Cross-Referencing',
    description:
      'The AI matches your specific musical genres against festival rosters to highlight the must-see acts for your taste.',
  },
];

export const Features: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            Engineered for Precision
          </h2>
          <p className="text-sm text-slate-400">
            Everything required to plan your festival trip without unnecessary bloat or complex interfaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#111412] p-6 transition-colors duration-150 hover:border-white/20 hover:bg-[#151917]"
              >
                <div>
                  <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-white">{feat.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-400">{feat.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
