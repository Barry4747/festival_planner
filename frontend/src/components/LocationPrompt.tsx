import React, { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';

export const LocationPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const setUserCoordinates = usePlannerStore((state) => state.setUserCoordinates);
  const setDepartureCity = usePlannerStore((state) => state.setDepartureCity);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    // Optional chaining because Safari older versions might not support navigator.permissions
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          // If already granted, get it silently
          requestLocation(true);
        } else if (result.state === 'prompt') {
          // Show our custom UI to get a user gesture
          setTimeout(() => setShowPrompt(true), 2000);
        }
      }).catch(() => {
         // Fallback if permissions API fails
         setTimeout(() => setShowPrompt(true), 2000);
      });
    } else {
      // Fallback for browsers without navigator.permissions
      setTimeout(() => setShowPrompt(true), 2000);
    }
  }, []);

  const requestLocation = (silent = false) => {
    if (!silent) {
        // If not silent, we are responding to a click, we can hide our custom prompt
        setShowPrompt(false);
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserCoordinates({ lat, lng });

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state;
          if (city) {
            setDepartureCity(city);
          }
        } catch (e) {
          console.error("Reverse geocoding failed", e);
        }
      },
      (error) => {
        console.warn("Geolocation failed", error);
      }
    );
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 bg-[#1E1E1E] border border-[#2D2D2D] rounded-lg p-4 shadow-xl max-w-sm flex gap-4 items-start animate-in slide-in-from-bottom-5">
      <div className="bg-[#1E3A30] p-2 rounded-full text-[#10B981]">
        <MapPin size={20} />
      </div>
      <div className="flex-1">
        <h4 className="text-[#EDEDED] font-medium text-sm mb-1">Pozwól na dostęp do lokalizacji</h4>
        <p className="text-[#A1A1AA] text-xs mb-3 leading-relaxed">
          Udostępnij swoją lokalizację, aby BUDDY mógł automatycznie wyznaczać trasy dojazdu na festiwale z Twojego miasta.
        </p>
        <div className="flex gap-2">
          <button 
            onClick={() => requestLocation(false)}
            className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-[#121212] text-xs font-semibold rounded transition-colors"
          >
            Włącz lokalizację
          </button>
          <button 
            onClick={() => setShowPrompt(false)}
            className="px-3 py-1.5 bg-transparent hover:bg-[#2D2D2D] text-[#A1A1AA] text-xs rounded transition-colors"
          >
            Później
          </button>
        </div>
      </div>
      <button onClick={() => setShowPrompt(false)} className="text-[#71717A] hover:text-[#EDEDED] ml-1 mt-0.5">
        <X size={14} />
      </button>
    </div>
  );
};
