import { useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';

export const useGeolocation = () => {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const setUserCoordinates = usePlannerStore((state) => state.setUserCoordinates);
  const setDepartureCity = usePlannerStore((state) => state.setDepartureCity);

  const locateUser = () => {
    setIsLocating(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoordinates({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (!res.ok) throw new Error('Network response was not ok');
          const data = await res.json();
          
          const city = data.address?.city || data.address?.town || data.address?.village;
          if (city) {
            setDepartureCity(city);
          } else {
            setError("Could not determine your city name");
          }
        } catch (err) {
          setError("Failed to fetch location data");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setError(err.message || "Failed to get your location");
        setIsLocating(false);
      }
    );
  };

  return { locateUser, isLocating, error };
};
