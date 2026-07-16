import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';

interface NominatimResult {
  place_id: number;
  display_name: string;
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    country?: string;
    country_code?: string;
  };
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (city: string, countryCode: string) => void;
  placeholder?: string;
  className?: string;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Search city (e.g., Warszawa, Berlin, Europe)...',
  className = ''
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<{ city: string; country: string; countryCode: string; key: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const userTypedRef = useRef(false);

  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Quick shortcut for Europe if user types Europe
    if (query.trim().toLowerCase() === 'europe') {
      setResults([
        { city: 'Europe', country: 'Major European Countries', countryCode: 'EUROPE', key: 999999 }
      ]);
      setIsOpen(true);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Using q= instead of city= allows OpenStreetMap Nominatim to match city prefixes instantly on every typed character
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query.trim()
          )}&format=json&addressdetails=1&limit=8`,
          {
            headers: {
              'Accept-Language': 'en'
            }
          }
        );
        if (response.ok) {
          const data: NominatimResult[] = await response.json();
          const parsed = data
            .map((item) => {
              const addr = item.address || {};
              const cityName = addr.city || addr.town || addr.village || addr.municipality || item.name || query;
              const countryName = addr.country || '';
              const cCode = (addr.country_code || 'PL').toUpperCase();
              return {
                city: cityName,
                country: countryName,
                countryCode: cCode,
                key: item.place_id
              };
            })
            // Filter unique city + countryCode combinations
            .filter(
              (item, idx, self) =>
                item.city &&
                idx === self.findIndex((t) => t.city.toLowerCase() === item.city.toLowerCase() && t.countryCode === item.countryCode)
            );
          setResults(parsed);
          if (userTypedRef.current) {
            setIsOpen(parsed.length > 0);
          }
        }
      } catch (err) {
        console.error('Nominatim search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (city: string, countryCode: string) => {
    userTypedRef.current = false;
    setQuery(city);
    setIsOpen(false);
    onChange(city, countryCode);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    userTypedRef.current = true;
    const val = e.target.value;
    setQuery(val);
    onChange(val, '');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <MapPin className="absolute left-3.5 h-4 w-4 text-emerald-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl bg-[#111412] border border-white/10 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3.5 h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <Search className="absolute right-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl bg-[#111412] border border-white/10 shadow-xl py-1 backdrop-blur-md">
          {results.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleSelect(item.city, item.countryCode)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>
                  <strong className="font-medium text-white">{item.city}</strong>
                  {item.country ? `, ${item.country}` : ''}
                </span>
              </div>
              <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border border-white/5">
                {item.countryCode}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
