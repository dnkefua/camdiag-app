import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google?: typeof google;
    __camdiagMapsLoading?: Promise<void>;
  }
}

const SCRIPT_ID = 'camdiag-google-maps';

const loadScript = (apiKey: string): Promise<void> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR context'));
  if (window.google?.maps) return Promise.resolve();
  if (window.__camdiagMapsLoading) return window.__camdiagMapsLoading;

  window.__camdiagMapsLoading = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Maps script failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly&loading=async`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Maps script failed to load'));
    document.head.appendChild(script);
  });
  return window.__camdiagMapsLoading;
};

interface UseGoogleMapsResult {
  ready: boolean;
  error: string | null;
}

const MISSING_KEY_ERROR = 'Google Maps API key missing. Set VITE_GOOGLE_MAPS_API_KEY.';

/**
 * Loads the Google Maps JS API on demand. Returns `ready` once
 * `window.google.maps` is callable. Components mount their map after.
 */
export const useGoogleMaps = (): UseGoogleMapsResult => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [ready, setReady] = useState<boolean>(Boolean(window?.google?.maps));
  const [error, setError] = useState<string | null>(apiKey ? null : MISSING_KEY_ERROR);

  useEffect(() => {
    if (ready || !apiKey) return;
    loadScript(apiKey).then(() => setReady(true)).catch((err: Error) => setError(err.message));
  }, [apiKey, ready]);

  return { ready, error };
};
