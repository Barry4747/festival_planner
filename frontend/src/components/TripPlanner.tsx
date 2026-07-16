import React, { useState } from 'react';
import { api } from '../lib/axios';
import {
  Sparkles,
  Music2,
  Calendar,
  MapPin,
  Wallet,
  Loader2,
  Plus,
  X,
  Tent,
  AlertCircle,
  CheckCircle2,
  Copy,
  RefreshCw,
  ArrowRight,
  Zap,
  Navigation,
  Map as MapIcon,
  MessageSquare,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { LocationAutocomplete } from './LocationAutocomplete';
import { FestivalMap, type FestivalMarkerData } from './FestivalMap';

interface TripDetails {
  festival_name: string;
  start_date: string;
  end_date: string;
  location: string;
}

interface UserPreferences {
  budget: number;
  travel_from: string;
  music_genres: string[];
}

const PRESET_FESTIVALS = [
  { name: "Open'er Festival",     location: 'Gdynia, PL',       start: '2026-07-01', end: '2026-07-04' },
  { name: "Pol'and'Rock Festival",location: 'Czaplinek, PL',    start: '2026-07-30', end: '2026-08-01' },
  { name: 'OFF Festival',         location: 'Katowice, PL',     start: '2026-08-07', end: '2026-08-09' },
  { name: 'Sziget Festival',      location: 'Budapest, HU',     start: '2026-08-05', end: '2026-08-10' },
  { name: 'Tomorrowland',         location: 'Boom, BE',         start: '2026-07-17', end: '2026-07-26' },
  { name: 'Europe Discovery',     location: 'Europe',           start: '2026-07-01', end: '2026-08-31' },
];

const PRESET_GENRES = [
  'Rock', 'Indie', 'Electronic', 'Techno', 'Hip-Hop',
  'Pop', 'Metal', 'Alternative', 'House', 'Drum & Bass',
];

const STEPS = [
  { id: 1, label: 'Initializing graph execution' },
  { id: 2, label: 'Querying Ticketmaster Discovery API' },
  { id: 3, label: 'Synthesizing itinerary with Gemini AI' },
];

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="mb-1.5 block text-xs font-medium text-slate-300">
    {children}
  </label>
);

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <div className="rounded-2xl border border-white/10 bg-[#111412] p-5 shadow-lg transition-all hover:border-white/15">
    <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-emerald-400">
      {icon}
      <span>{title}</span>
    </div>
    {children}
  </div>
);

export const TripPlanner: React.FC = () => {
  const [tripDetails, setTripDetails] = useState<TripDetails>({
    festival_name: "Open'er Festival",
    start_date: '2026-07-01',
    end_date: '2026-07-04',
    location: 'Gdynia, PL',
  });

  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    budget: 2500,
    travel_from: 'Warsaw',
    music_genres: ['Rock', 'Indie', 'Electronic'],
  });

  const [customGenre, setCustomGenre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<any | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'both' | 'map' | 'chat'>('both');

  const applyPreset = (preset: typeof PRESET_FESTIVALS[0]) => {
    setTripDetails({
      festival_name: preset.name,
      location: preset.location,
      start_date: preset.start,
      end_date: preset.end,
    });
  };

  const toggleGenre = (genre: string) => {
    setUserPreferences((prev) => ({
      ...prev,
      music_genres: prev.music_genres.includes(genre)
        ? prev.music_genres.filter((g) => g !== genre)
        : [...prev.music_genres, genre],
    }));
  };

  const addCustomGenre = () => {
    const formatted = customGenre.trim();
    if (!formatted || userPreferences.music_genres.includes(formatted)) return;
    setUserPreferences((prev) => ({
      ...prev,
      music_genres: [...prev.music_genres, formatted],
    }));
    setCustomGenre('');
  };

  const removeGenre = (g: string) => {
    setUserPreferences((prev) => ({
      ...prev,
      music_genres: prev.music_genres.filter((x) => x !== g),
    }));
  };

  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAiResponse(null);
    setActiveStep(1);

    const t1 = setTimeout(() => setActiveStep(2), 1500);
    const t2 = setTimeout(() => setActiveStep(3), 3500);

    try {
      const response = await api.post('/api/plan-trip', {
        trip_details: tripDetails,
        user_preferences: userPreferences,
      });
      setAiResponse(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          'An unexpected error occurred while connecting to the AI agent.'
      );
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
      setActiveStep(0);
    }
  };

  const handleCopy = () => {
    const textContent =
      typeof aiResponse?.content === 'string'
        ? aiResponse.content
        : typeof aiResponse === 'string'
        ? aiResponse
        : JSON.stringify(aiResponse, null, 2);
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setAiResponse(null);
    setError(null);
  };

  // Prepare map pins from response payload or default location
  const mapFestivals: FestivalMarkerData[] = aiResponse?.discovered_festivals || [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      {/* ══ LEFT COLUMN — Form & Autocomplete ══ */}
      <div className="lg:col-span-6 space-y-5">
        {/* Quick-Select Preset */}
        <div className="rounded-2xl border border-white/10 bg-[#111412] p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Quick-Select Preset</h2>
              <p className="text-xs text-slate-400">Choose a festival to pre-fill parameters</p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
              <Zap className="h-3 w-3" />
              <span>LangGraph AI</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_FESTIVALS.map((preset) => {
              const isActive = tripDetails.festival_name === preset.name;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'border border-emerald-500 bg-emerald-600/20 text-emerald-300 shadow-sm shadow-emerald-500/10'
                      : 'border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handlePlanTrip} className="space-y-5">
          {/* Section 1: Festival details & Location Autocomplete */}
          <Section icon={<MapPin className="h-4 w-4" />} title="Festival & Location Autocomplete">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Festival Name or Target Keyword"
                  type="text"
                  required
                  value={tripDetails.festival_name}
                  onChange={(e) => setTripDetails({ ...tripDetails, festival_name: e.target.value })}
                  placeholder="e.g. Open'er Festival or Summer Rock Events"
                  icon={<Tent className="h-4 w-4" />}
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Target City / Area (Location Autocomplete)</FieldLabel>
                <LocationAutocomplete
                  value={tripDetails.location}
                  onChange={(city, countryCode) => {
                    const fullLoc = countryCode ? `${city}, ${countryCode}` : city;
                    setTripDetails((prev) => ({ ...prev, location: fullLoc }));
                  }}
                  placeholder="Search city (e.g. Warszawa, Berlin, Europe)..."
                />
              </div>

              <div>
                <FieldLabel>Date From (Start Date)</FieldLabel>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-emerald-500 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={tripDetails.start_date}
                    onChange={(e) => setTripDetails({ ...tripDetails, start_date: e.target.value })}
                    className="w-full rounded-xl bg-[#111412] border border-white/10 pl-10 pr-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Date To (End Date)</FieldLabel>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-emerald-500 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={tripDetails.end_date}
                    onChange={(e) => setTripDetails({ ...tripDetails, end_date: e.target.value })}
                    className="w-full rounded-xl bg-[#111412] border border-white/10 pl-10 pr-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Section 2: User preferences */}
          <Section icon={<Wallet className="h-4 w-4" />} title="Budget & Departure City">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Budget Limit (PLN)"
                type="number"
                min={100}
                step={100}
                required
                value={userPreferences.budget}
                onChange={(e) => setUserPreferences({ ...userPreferences, budget: Number(e.target.value) })}
                placeholder="e.g. 2500"
                icon={<Wallet className="h-4 w-4" />}
              />

              <div>
                <FieldLabel>
                  <span className="inline-flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Departure City (Location Autocomplete)</span>
                  </span>
                </FieldLabel>
                <LocationAutocomplete
                  value={userPreferences.travel_from}
                  onChange={(city, _countryCode) => {
                    setUserPreferences((prev) => ({ ...prev, travel_from: city }));
                  }}
                  placeholder="e.g. Warsaw, Kraków, Berlin..."
                />
              </div>
            </div>
          </Section>

          {/* Section 3: Music genres */}
          <Section icon={<Music2 className="h-4 w-4" />} title="Music Genre Profile">
            <div className="mb-3 flex flex-wrap gap-2">
              {PRESET_GENRES.map((genre) => {
                const isSelected = userPreferences.music_genres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-sm shadow-emerald-500/10'
                        : 'border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}
                  >
                    <span>{genre}</span>
                  </button>
                );
              })}
            </div>

            {/* Active genres */}
            {userPreferences.music_genres.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5 rounded-xl border border-white/5 bg-black/20 p-3">
                {userPreferences.music_genres.map((genre) => (
                  <span
                    key={genre}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300"
                  >
                    <span>{genre}</span>
                    <button
                      type="button"
                      onClick={() => removeGenre(genre)}
                      className="rounded p-0.5 hover:bg-emerald-500/20 hover:text-white transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Custom genre input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomGenre(); } }}
                placeholder="Add a custom genre..."
                className="flex-1 rounded-xl border border-white/10 bg-[#111412] px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomGenre}
                className="rounded-xl"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </Button>
            </div>
          </Section>

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full py-4 text-sm rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Orchestrating Plan (Ticketmaster + Gemini AI)...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Custom Itinerary & Map</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      {/* ══ RIGHT COLUMN — Map & AI Chat Response ══ */}
      <div className="lg:col-span-6 space-y-6">
        {/* Toggle tabs for view control */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#111412] p-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('both')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'both'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span>Interactive Map ({mapFestivals.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Agent Chat</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-500 pr-2 hidden sm:inline">
            Location Auto & Live Coordinates
          </span>
        </div>

        {/* ── INTERACTIVE MAP ── */}
        {(activeTab === 'both' || activeTab === 'map') && (
          <div className="rounded-2xl border border-white/10 bg-[#111412] p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapIcon className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Live Festival Map ({mapFestivals.length} Discovered Pins)
                </h3>
              </div>
              <span className="text-[10px] font-medium text-slate-400">
                Powered by OpenStreetMap + Leaflet
              </span>
            </div>
            <FestivalMap
              festivals={mapFestivals.length > 0 ? mapFestivals : [
                { lat: 54.5189, lng: 18.5305, name: "Open'er Festival (Gdynia)", date: "2026-07-01" },
                { lat: 52.2297, lng: 21.0122, name: "Warsaw Event Hub", date: "2026-07-15" }
              ]}
              className="h-[360px] w-full"
            />
          </div>
        )}

        {/* ── AGENT CHAT / ITINERARY RESPONSE ── */}
        {(activeTab === 'both' || activeTab === 'chat') && (
          <div className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111412] shadow-lg">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Agent Chat & Itinerary</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {aiResponse && (
                  <>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Clear</span>
                    </Button>
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Panel body */}
            <div className="flex flex-1 flex-col p-5">
              {/* ── LOADING ── */}
              {loading && (
                <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                    <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
                  </div>

                  <h4 className="mb-1 text-base font-semibold text-white">Agent Pipeline Active</h4>
                  <p className="mb-6 max-w-xs text-xs text-slate-400">
                    Fetching live Ticketmaster events and analyzing lineup with Gemini AI.
                  </p>

                  {/* Progress steps */}
                  <div className="w-full max-w-xs space-y-2.5 rounded-xl border border-white/10 bg-black/20 p-4 text-left">
                    {STEPS.map((step) => {
                      const isActive = activeStep >= step.id;
                      const isRunning = activeStep === step.id;
                      return (
                        <div key={step.id} className="flex items-center gap-2.5 text-xs">
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-medium text-[10px] transition-colors ${
                            isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-600'
                          }`}>
                            {isActive && !isRunning ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : step.id}
                          </div>
                          <span className={`transition-colors ${isActive ? 'text-slate-300' : 'text-slate-600'}`}>
                            {step.label}
                          </span>
                          {isRunning && (
                            <Loader2 className="ml-auto h-3 w-3 animate-spin text-emerald-400" />
                          )}
                          {isActive && !isRunning && (
                            <CheckCircle2 className="ml-auto h-3 w-3 text-emerald-400" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── ERROR ── */}
              {!loading && error && (
                <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h4 className="mb-2 text-sm font-semibold text-white">Execution Error</h4>
                  <div className="max-h-48 w-full max-w-sm overflow-auto rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-left text-xs text-red-300">
                    {error}
                  </div>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-xl"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Try Again</span>
                  </Button>
                </div>
              )}

              {/* ── AI RESPONSE ── */}
              {!loading && !error && aiResponse && (
                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-medium text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Personalized itinerary and coordinates extracted successfully</span>
                  </div>

                  <div className="ai-prose flex-1 overflow-y-auto rounded-xl border border-white/10 bg-[#090b0a] p-5 text-xs max-h-[550px] leading-relaxed text-slate-300 space-y-2">
                    {(typeof aiResponse?.content === 'string'
                      ? aiResponse.content
                      : typeof aiResponse === 'string'
                      ? aiResponse
                      : JSON.stringify(aiResponse, null, 2)
                    )
                      .split('\n')
                      .map((line: string, i: number) => (
                        <p key={i} className={line === '' ? 'mt-3' : ''}>
                          {line}
                        </p>
                      ))}
                  </div>
                </div>
              )}

              {/* ── EMPTY STATE ── */}
              {!loading && !error && !aiResponse && (
                <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h4 className="mb-1.5 text-sm font-semibold text-white">
                    Awaiting Configuration
                  </h4>
                  <p className="max-w-xs text-xs text-slate-400 leading-relaxed">
                    Adjust your festival parameters and search location autocomplete on the left, then trigger the AI planning agent.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                    {['Location Autocomplete', 'OpenStreetMap Pins', 'Gemini AI Synthesis'].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripPlanner;
