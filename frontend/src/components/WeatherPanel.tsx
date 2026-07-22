import React, { useEffect, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Wind, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/axios';
import type { FestivalItem } from './DiscoveryMap';

const getWeatherIcon = (condition: string, size: number = 20) => {
  const cond = condition.toLowerCase();
  if (cond.includes('clear')) return <Sun size={size} className="text-yellow-400" />;
  if (cond.includes('rain')) return <CloudRain size={size} className="text-blue-400" />;
  if (cond.includes('snow')) return <CloudSnow size={size} className="text-white" />;
  if (cond.includes('thunderstorm')) return <CloudLightning size={size} className="text-purple-400" />;
  if (cond.includes('drizzle')) return <CloudDrizzle size={size} className="text-blue-300" />;
  if (cond.includes('cloud')) return <Cloud size={size} className="text-gray-400" />;
  if (cond.includes('wind') || cond.includes('mist') || cond.includes('fog')) return <Wind size={size} className="text-gray-300" />;
  return <Sun size={size} className="text-yellow-400" />;
};

interface WeatherPanelProps {
  festival: FestivalItem | null;
}

export const WeatherPanel: React.FC<WeatherPanelProps> = ({ festival }) => {
  const weatherForecast: any = usePlannerStore((state) => state.weatherForecast);
  const weatherLayer = usePlannerStore((state) => state.weatherLayer);
  const setWeatherLayer = usePlannerStore((state) => state.setWeatherLayer);
  const setWeatherForecast = usePlannerStore((state) => state.setWeatherForecast);
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'5day' | '24h'>('5day');

  useEffect(() => {
    if (!festival || !festival.city) return;
    
    if (weatherForecast?.city === festival.city && weatherForecast?.forecast?.length > 0) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/weather?city=${festival.city}`);
        if (res.data.error) {
          setError(res.data.error);
        } else {
          setWeatherForecast(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch weather');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeather();
  }, [festival, weatherForecast?.city, setWeatherForecast]);

  const renderContent = () => {
    if (!festival) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border-subtle rounded text-text-muted text-sm text-center mt-4">
          <Cloud size={24} className="mb-2 opacity-50" />
          {t('weather.noData')}
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border-subtle rounded text-text-muted text-sm text-center mt-4">
          <Loader2 size={24} className="mb-2 animate-spin text-brand-primary" />
          Loading weather data...
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border-subtle rounded text-red-400 text-sm text-center mt-4 bg-red-950/20">
          <Cloud size={24} className="mb-2 opacity-50" />
          {error}
        </div>
      );
    }

    if (!weatherForecast || !weatherForecast.forecast || weatherForecast.forecast.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border-subtle rounded text-text-muted text-sm text-center mt-4">
          <Cloud size={24} className="mb-2 opacity-50" />
          {t('weather.noData')}
        </div>
      );
    }

    const formatter = new Intl.DateTimeFormat(i18n.language, {
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    });

    return (
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider text-text-muted font-semibold ml-1">
            {t('weather.title')} <span className="text-brand-primary">- {festival.name}</span>
          </h3>
          <div className="flex border border-border-subtle rounded overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode('5day')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-colors ${viewMode === '5day' ? 'bg-brand-primary/20 text-brand-primary' : 'bg-bg-surface text-text-muted hover:bg-bg-muted'}`}
            >
              {t('weather.view5Days')}
            </button>
            <button
              onClick={() => setViewMode('24h')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-colors border-l border-border-subtle ${viewMode === '24h' ? 'bg-brand-primary/20 text-brand-primary' : 'bg-bg-surface text-text-muted hover:bg-bg-muted'}`}
            >
              {t('weather.view24h')}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {viewMode === '5day' && weatherForecast.forecast.map((day: any, idx: number) => {
            const dateObj = new Date(day.date);
            const formattedDate = formatter.format(dateObj);
            const avgTemp = Math.round((day.max_temp + day.min_temp) / 2);

            return (
              <div 
                key={`5d-${idx}`} 
                className="flex flex-row items-center justify-between p-3 rounded border border-border-subtle bg-bg-surface"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center bg-bg-base rounded-full border border-border-subtle shrink-0">
                    {getWeatherIcon(day.condition)}
                  </div>
                  <span className="text-sm font-medium text-text-primary capitalize">{formattedDate}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-text-primary">{avgTemp}°C</span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wide">{day.condition}</span>
                </div>
              </div>
            );
          })}

          {viewMode === '24h' && weatherForecast.hourly?.map((hour: any, idx: number) => {
            const dateObj = new Date(hour.date);
            const formattedDate = formatter.format(dateObj);
            const temp = Math.round(hour.temp);

            return (
              <div 
                key={`24h-${idx}`} 
                className="flex flex-row items-center justify-between p-3 rounded border border-border-subtle bg-bg-surface"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center bg-bg-base rounded-full border border-border-subtle shrink-0">
                    {getWeatherIcon(hour.condition)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary">{hour.time}</span>
                    <span className="text-[10px] text-text-muted capitalize">{formattedDate}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-text-primary">{temp}°C</span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wide">{hour.condition}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Map Layers Toggles */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs uppercase tracking-wider text-text-muted font-semibold ml-1">Map Layers</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setWeatherLayer('precipitation_new')}
            className={`py-2 px-3 text-xs font-medium rounded border transition-colors ${weatherLayer === 'precipitation_new' ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-bg-surface border-border-subtle text-text-muted hover:bg-bg-muted'}`}
          >
            {t('weather.layerRain')}
          </button>
          <button
            onClick={() => setWeatherLayer('temp_new')}
            className={`py-2 px-3 text-xs font-medium rounded border transition-colors ${weatherLayer === 'temp_new' ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-bg-surface border-border-subtle text-text-muted hover:bg-bg-muted'}`}
          >
            {t('weather.layerTemp')}
          </button>
          <button
            onClick={() => setWeatherLayer('wind_new')}
            className={`py-2 px-3 text-xs font-medium rounded border transition-colors ${weatherLayer === 'wind_new' ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-bg-surface border-border-subtle text-text-muted hover:bg-bg-muted'}`}
          >
            {t('weather.layerWind')}
          </button>
          <button
            onClick={() => setWeatherLayer('clouds_new')}
            className={`py-2 px-3 text-xs font-medium rounded border transition-colors ${weatherLayer === 'clouds_new' ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-bg-surface border-border-subtle text-text-muted hover:bg-bg-muted'}`}
          >
            {t('weather.layerClouds')}
          </button>
          <button
            onClick={() => setWeatherLayer('none')}
            className={`col-span-2 py-2 px-3 text-xs font-medium rounded border transition-colors ${weatherLayer === 'none' ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-bg-surface border-border-subtle text-text-muted hover:bg-bg-muted'}`}
          >
            {t('weather.layerNone')}
          </button>
        </div>
      </div>

      {/* Forecast Content */}
      {renderContent()}

    </div>
  );
};
