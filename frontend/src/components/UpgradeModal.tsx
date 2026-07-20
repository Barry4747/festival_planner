import React from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { Sparkles, Crown, Zap, X, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const UpgradeModal: React.FC = () => {
  const { isUpgradeModalOpen, setUpgradeModalOpen, currentTier } = usePlannerStore();
  const { t } = useTranslation();

  if (!isUpgradeModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="relative w-full max-w-5xl bg-bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative p-8 text-center border-b border-border-subtle bg-gradient-to-b from-brand-primary/10 to-bg-surface">
          <button 
            onClick={() => setUpgradeModalOpen(false)}
            className="absolute top-4 right-4 p-2 text-text-muted hover:text-white bg-bg-base/50 hover:bg-bg-muted rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="inline-flex items-center justify-center p-3 bg-brand-primary/20 text-brand-primary rounded-full mb-4">
            <Crown size={32} />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Upgrade Twój Festival Planner</h2>
          <p className="text-text-muted max-w-lg mx-auto">
            Wyczerpałeś limity dla swojego obecnego planu ({currentTier}). Wybierz wyższy pakiet, aby kontynuować planowanie bez ograniczeń!
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-subtle bg-bg-base">
          
          {/* Beforek */}
          <div className="p-8 flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-text-muted mb-1">Beforek</h3>
            <p className="text-sm text-text-muted/60 mb-6">Darmowy plan startowy</p>
            <div className="text-4xl font-black text-white mb-8">0 zł <span className="text-base font-normal text-text-muted">/ msc</span></div>
            
            <ul className="flex flex-col gap-4 text-sm text-left w-full mb-8">
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-brand-primary" /> 5 zapytań AI dziennie</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-brand-primary" /> 20 tras z Google Maps dziennie</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-brand-primary" /> 30 podglądów pogody dziennie</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-brand-primary" /> 30 zapytań bazy Ticketmaster</li>
            </ul>
            
            <button 
              disabled={currentTier === 'BEFOREK'}
              className="mt-auto w-full py-3 rounded-lg font-bold border-2 border-border-subtle text-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentTier === 'BEFOREK' ? 'Twój Plan' : 'Wybierz'}
            </button>
          </div>

          {/* Raver (Popular) */}
          <div className="p-8 flex flex-col items-center text-center relative bg-brand-primary/5">
            <div className="absolute top-0 inset-x-0 h-1 bg-brand-primary"></div>
            <div className="absolute -top-3 px-3 py-1 bg-brand-primary text-bg-base text-[10px] font-black uppercase rounded-full tracking-wider">Najpopularniejszy</div>
            
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Zap size={20} className="text-brand-primary fill-brand-primary" /> Raver</h3>
            <p className="text-sm text-brand-primary/80 mb-6">Dla stałych bywalców</p>
            <div className="text-4xl font-black text-brand-primary mb-8">19 zł <span className="text-base font-normal text-brand-primary/60">/ msc</span></div>
            
            <ul className="flex flex-col gap-4 text-sm text-left w-full mb-8">
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-brand-primary" /> <strong className="text-white">50</strong> zapytań AI dziennie</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-brand-primary" /> <strong className="text-white">150</strong> tras z Google Maps dziennie</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-brand-primary" /> <strong className="text-white">150</strong> podglądów pogody dziennie</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-brand-primary" /> <strong className="text-white">300</strong> zapytań Ticketmaster</li>
            </ul>
            
            <button className="mt-auto w-full py-3 rounded-lg font-bold bg-brand-primary text-bg-base hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20">
              Ulepsz do Raver
            </button>
          </div>

          {/* Mainstage VIP */}
          <div className="p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-purple-500/10 blur-[100px] rounded-full"></div>
            
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Sparkles size={20} className="text-purple-400" /> Mainstage VIP</h3>
            <p className="text-sm text-purple-400/80 mb-6">Dla prawdziwych promotorów</p>
            <div className="text-4xl font-black text-purple-400 mb-8">99 zł <span className="text-base font-normal text-purple-400/60">/ msc</span></div>
            
            <ul className="flex flex-col gap-4 text-sm text-left w-full mb-8 relative z-10">
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-purple-400" /> <strong className="text-white">500</strong> zapytań AI dziennie</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-purple-400" /> <strong className="text-white">1000</strong> tras z Google Maps</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-purple-400" /> <strong className="text-white">1000</strong> podglądów pogody</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-purple-400" /> <strong className="text-white">1000</strong> zapytań Ticketmaster</li>
            </ul>
            
            <button className="mt-auto w-full py-3 rounded-lg font-bold bg-gradient-to-r from-purple-600 to-brand-primary text-white hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20">
              Zostań VIPem
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
