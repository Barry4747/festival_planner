import React, { useEffect, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/axios';

export const UpgradeModal: React.FC = () => {
  const { isUpgradeModalOpen, setUpgradeModalOpen, currentTier } = usePlannerStore();
  const { t } = useTranslation();
  const [tiersConfig, setTiersConfig] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (isUpgradeModalOpen && !tiersConfig) {
      api.get('/api/tiers')
        .then(res => setTiersConfig(res.data))
        .catch(err => console.error('Failed to load tiers', err));
    }
  }, [isUpgradeModalOpen, tiersConfig]);

  if (!isUpgradeModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl p-8 flex flex-col shadow-2xl overflow-y-auto max-h-[95dvh]">
        
        <button 
          onClick={() => setUpgradeModalOpen(false)}
          className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-zinc-100 transition-colors bg-zinc-900 hover:bg-zinc-800 rounded-full"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-zinc-100 text-center mb-2 mt-4">{t('upgrade.title')}</h2>
        <p className="text-zinc-400 text-center mb-8">{t('upgrade.currentPlanText')} <span className="text-zinc-200 font-semibold">{currentTier}</span></p>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Free */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col">
            <h3 className="text-lg font-bold text-zinc-100 mb-1">{tiersConfig?.['FREE']?.name || 'Free'}</h3>
            <p className="text-sm text-zinc-500 mb-6">{t('upgrade.freeSubtitle')}</p>
            <div className="text-3xl font-bold text-zinc-100 mb-8">0 zł <span className="text-sm font-normal text-zinc-500">/ {t('upgrade.perMonth')}</span></div>
            
            <ul className="flex flex-col gap-4 text-sm text-zinc-400 mb-8 flex-grow">
              <li className="flex items-center"><Check className="w-4 h-4 text-zinc-500 mr-3 shrink-0" /> {t('upgrade.aiLimit', { n: tiersConfig?.['FREE']?.limits?.ai_agent?.rpd || 5 })}</li>
              <li className="flex items-center"><Check className="w-4 h-4 text-zinc-500 mr-3 shrink-0" /> {t('upgrade.basicRoutes', { n: tiersConfig?.['FREE']?.limits?.google_maps?.rpd || 20 })}</li>
              <li className="flex items-center"><Check className="w-4 h-4 text-zinc-500 mr-3 shrink-0" /> {t('upgrade.weatherBasic', { n: tiersConfig?.['FREE']?.limits?.weather?.rpd || 30 })}</li>
              <li className="flex items-center"><Check className="w-4 h-4 text-zinc-500 mr-3 shrink-0" /> {t('upgrade.dbQueries', { n: tiersConfig?.['FREE']?.limits?.ticketmaster?.rpd || 30 })}</li>
            </ul>
            
            <button 
              disabled={currentTier === 'FREE'}
              className="mt-auto w-full py-2.5 text-sm font-semibold border border-zinc-800 bg-zinc-800 text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-all duration-200 rounded-lg"
            >
              {currentTier === 'FREE' ? t('upgrade.currentPlan') : t('upgrade.select')}
            </button>
          </div>

          {/* Basic (Popular) */}
          <div className="bg-zinc-900 border border-zinc-600 rounded-xl p-6 flex flex-col relative shadow-lg transform md:-translate-y-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-700 text-zinc-100 text-[10px] font-bold px-3 py-1 rounded-full tracking-wider shadow-sm">{t('upgrade.recommendedBadge')}</div>
            
            <h3 className="text-lg font-bold text-zinc-100 mb-1">{tiersConfig?.['BASIC']?.name || 'Basic'}</h3>
            <p className="text-sm text-zinc-400 mb-6">{t('upgrade.basicSubtitle')}</p>
            <div className="text-3xl font-bold text-zinc-100 mb-8">19 zł <span className="text-sm font-normal text-zinc-500">/ {t('upgrade.perMonth')}</span></div>
            
            <ul className="flex flex-col gap-4 text-sm text-zinc-300 mb-8 flex-grow">
              <li className="flex items-center"><Check className="w-4 h-4 text-zinc-400 mr-3 shrink-0" /> {t('upgrade.aiDaily', { n: tiersConfig?.['BASIC']?.limits?.ai_agent?.rpd || 50 })}</li>
              <li className="flex items-center"><Check className="w-4 h-4 text-zinc-400 mr-3 shrink-0" /> {t('upgrade.advancedRoutes', { n: tiersConfig?.['BASIC']?.limits?.google_maps?.rpd || 150 })}</li>
              <li className="flex items-center"><Check className="w-4 h-4 text-zinc-400 mr-3 shrink-0" /> {t('upgrade.weatherAdvanced', { n: tiersConfig?.['BASIC']?.limits?.weather?.rpd || 150 })}</li>
              <li className="flex items-center"><Check className="w-4 h-4 text-zinc-400 mr-3 shrink-0" /> {t('upgrade.dbQueries', { n: tiersConfig?.['BASIC']?.limits?.ticketmaster?.rpd || 300 })}</li>
            </ul>
            
            <button className="mt-auto w-full py-2.5 text-sm font-semibold bg-zinc-100 text-zinc-900 hover:bg-white transition-all duration-200 rounded-lg shadow-sm">
              {t('upgrade.start')}
            </button>
          </div>

          {/* Pro */}
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-6 flex flex-col relative shadow-lg">
            <h3 className="text-lg font-bold text-emerald-400 mb-1">{tiersConfig?.['PRO']?.name || 'Pro'}</h3>
            <p className="text-sm text-zinc-500 mb-6">{t('upgrade.proSubtitle')}</p>
            <div className="text-3xl font-bold text-zinc-100 mb-8">99 zł <span className="text-sm font-normal text-zinc-500">/ {t('upgrade.perMonth')}</span></div>
            
            <ul className="flex flex-col gap-4 text-sm text-zinc-300 mb-8 flex-grow">
              <li className="flex items-center"><Check className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> {t('upgrade.aiDaily', { n: tiersConfig?.['PRO']?.limits?.ai_agent?.rpd || 500 })}</li>
              <li className="flex items-center"><Check className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> {t('upgrade.priorityRoutes', { n: tiersConfig?.['PRO']?.limits?.google_maps?.rpd || 1000 })}</li>
              <li className="flex items-center"><Check className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> {t('upgrade.earlyAccess')}</li>
              <li className="flex items-center"><Check className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> {t('upgrade.dedicatedSupport', { n: tiersConfig?.['PRO']?.limits?.ticketmaster?.rpd || 1000 })}</li>
            </ul>
            
            <button className="mt-auto w-full py-2.5 text-sm font-semibold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-all duration-200 rounded-lg shadow-sm">
              {t('upgrade.select')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
