import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/dashboard/Navbar';
import { TripPlanner } from '../components/TripPlanner';

export const Dashboard: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || null);
    });
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-[#090b0a] text-white">
      <Navbar userEmail={userEmail} />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 border-b border-white/10 pb-5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Trip & Lineup Orchestrator
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Configure your festival dates, departure city, and budget below.
            </p>
          </div>

          <TripPlanner />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
