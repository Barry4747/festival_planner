export interface Festival {
  id: string | number;
  name: string;
  lat: number;
  lng: number;
  start_date: string;
  end_date: string;
  source_name: string;
  url?: string;
  image_url?: string;
  city?: string;
  genre?: string;
  category?: string;
  sources?: Array<{ source_name: string; url: string }>;
  coordinates?: { lat: number; lng: number };
  // Backward compatibility properties for UI convenience
  dates?: string;
  image?: string;
  raw?: any;
}

export type FestivalItem = Festival;

// Re-export weather types so consumers can import from a single location
export type { CurrentWeather, WeatherCondition, WeatherDay, WeatherForecast } from './weather';
