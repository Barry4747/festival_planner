/**
 * Typed weather forecast interfaces.
 *
 * These replace the `any` type previously used for `weatherForecast` in
 * usePlannerStore and across WeatherPanel, DiscoveryMap, and TripPlanner.
 *
 * Keep this file as the single source of truth for weather-related types.
 */

export interface WeatherCondition {
  description: string;
  icon: string;
  id?: number;
  main?: string;
}

export interface WeatherDay {
  dt: number;
  /** UTC unix timestamp for the forecast day */
  temp: {
    min: number;
    max: number;
    day: number;
    night?: number;
    eve?: number;
    morn?: number;
  };
  feels_like?: {
    day?: number;
    night?: number;
    eve?: number;
    morn?: number;
  };
  weather: WeatherCondition[];
  humidity: number;
  wind_speed: number;
  uvi?: number;
  clouds?: number;
  pop?: number; // probability of precipitation
  rain?: number;
}

export interface CurrentWeather {
  lat?: number;
  lon?: number;
  temp?: number;
  feels_like?: number;
  humidity?: number;
  wind_speed?: number;
  weather?: WeatherCondition[];
  label?: string;
}

export interface WeatherForecast {
  city?: string;
  lat?: number;
  lon?: number;
  daily?: WeatherDay[];
  hourly?: WeatherDay[];
  /** Raw current conditions if returned by the backend */
  current?: CurrentWeather;
  /** Error string if the backend returned an error */
  error?: string;
}
