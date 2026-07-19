import React from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Wind } from 'lucide-react';

const getWeatherIcon = (condition: string, size: number = 18) => {
  const cond = condition.toLowerCase();
  if (cond.includes('clear')) return <Sun size={size} />;
  if (cond.includes('rain')) return <CloudRain size={size} />;
  if (cond.includes('snow')) return <CloudSnow size={size} />;
  if (cond.includes('thunderstorm')) return <CloudLightning size={size} />;
  if (cond.includes('drizzle')) return <CloudDrizzle size={size} />;
  if (cond.includes('cloud')) return <Cloud size={size} />;
  if (cond.includes('wind') || cond.includes('mist') || cond.includes('fog')) return <Wind size={size} />;
  return <Sun size={size} />;
};

export const WeatherWidget: React.FC = () => {
  const weatherForecast: any = usePlannerStore((state) => state.weatherForecast);

  if (!weatherForecast || !weatherForecast.forecast || weatherForecast.forecast.length === 0) {
    return null;
  }

  // Expecting weatherForecast to be an object: { city: 'Warsaw', forecast: [{ date: ... }] }

  return (
    <div className="flex flex-col gap-2 mt-4 mb-4">
      <h3 className="text-xs uppercase tracking-wider text-text-muted font-semibold ml-1">
        Weather Forecast <span className="lowercase text-[10px] ml-1 opacity-70">({weatherForecast.city})</span>
      </h3>
      <div className="flex flex-row gap-3 overflow-x-auto no-scrollbar pb-1">
        {weatherForecast.forecast.map((day: any, idx: number) => {
          const dateObj = new Date(day.date);
          const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const avgTemp = Math.round((day.max_temp + day.min_temp) / 2);

          return (
            <div 
              key={idx} 
              className="flex flex-col items-center justify-center min-w-[60px] p-2 rounded border border-border-subtle bg-bg-surface shrink-0"
            >
              <span className="text-[10px] text-text-muted uppercase tracking-wide mb-1">{dayOfWeek}</span>
              <div className="text-text-primary my-1">
                {getWeatherIcon(day.condition)}
              </div>
              <span className="text-sm font-medium text-text-primary">{avgTemp}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
