import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { useAppStore } from '../store/useAppStore';
import { FacilityMap, type MappedFacility } from './ui/FacilityMap';
import { BackIcon, HomeIcon, PlusIcon, UsersIcon, MapPinIcon, WarningIcon, RemedyIcon } from './ui/Icons';

type CareTab = 'clinics' | 'hospitals' | 'pharmacies';
type LocationStatus = 'idle' | 'requesting' | 'ready' | 'error';

interface FacilityRecord extends MappedFacility {
  placeId?: string;
  distanceKm: number;
  openNow?: boolean;
}

const CARE_TABS: CareTab[] = ['clinics', 'hospitals', 'pharmacies'];

const PLACE_CONFIG: Record<CareTab, { type: string; keyword: string; category: MappedFacility['category'] }> = {
  clinics: { type: 'doctor', keyword: 'medical clinic', category: 'clinic' },
  hospitals: { type: 'hospital', keyword: 'hospital', category: 'hospital' },
  pharmacies: { type: 'pharmacy', keyword: 'pharmacy', category: 'pharmacy' },
};

const EMPTY_RESULTS: Record<CareTab, FacilityRecord[]> = {
  clinics: [],
  hospitals: [],
  pharmacies: [],
};

const distanceInKm = (from: { lat: number; lng: number }, to: { lat: number; lng: number }): number => {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusKm = 6371;
  const deltaLat = radians(to.lat - from.lat);
  const deltaLng = radians(to.lng - from.lng);
  const lat1 = radians(from.lat);
  const lat2 = radians(to.lat);
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const mapsSearchUrl = (tab: CareTab): string => {
  const label = tab === 'clinics' ? 'medical clinics' : tab;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${label} near me`)}`;
};

const NextSteps = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<CareTab>(
    CARE_TABS.includes(initialTab as CareTab) ? initialTab as CareTab : 'clinics',
  );
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [facilityResults, setFacilityResults] = useState<Record<CareTab, FacilityRecord[]>>(EMPTY_RESULTS);
  const [searching, setSearching] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const { ready: mapsReady, error: mapsError } = useGoogleMaps();
  const { possibleFindings, selectedFinding, analysisUrgency } = useAppStore();
  const selectedReport = possibleFindings[selectedFinding] ?? possibleFindings[0];

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('error');
      setLocationError('Location is not available in this browser.');
      return;
    }

    setLocationStatus('requesting');
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus('ready');
      },
      (error) => {
        setLocationStatus('error');
        setLocationError(error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Enable it in the browser to sort care by distance.'
          : 'Your location could not be determined.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 },
    );
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(requestLocation, 0);
    return () => window.clearTimeout(timer);
  }, [requestLocation]);

  useEffect(() => {
    if (!mapsReady || !userLocation) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const config = PLACE_CONFIG[activeTab];
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      setSearching(true);
      setPlacesError(null);

      service.nearbySearch({
        location: userLocation,
        radius: 25000,
        type: config.type,
        keyword: config.keyword,
      }, (results, status) => {
        if (cancelled) return;
        setSearching(false);

        if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setFacilityResults((current) => ({ ...current, [activeTab]: [] }));
          return;
        }
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
          setPlacesError('Nearby search is temporarily unavailable. Open Google Maps below to continue.');
          return;
        }

        const facilities = results.flatMap<FacilityRecord>((place) => {
          const location = place.geometry?.location;
          if (!location || !place.name) return [];
          const position = { lat: location.lat(), lng: location.lng() };
          const openingHours = place.opening_hours as (google.maps.places.PlaceOpeningHours & { open_now?: boolean }) | undefined;
          const openNow = openingHours?.isOpen?.() ?? openingHours?.open_now;
          return [{
            name: place.name,
            category: config.category,
            rating: place.rating ?? 0,
            position,
            address: place.vicinity,
            placeId: place.place_id,
            distanceKm: distanceInKm(userLocation, position),
            openNow,
          }];
        }).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 10);

        setFacilityResults((current) => ({ ...current, [activeTab]: facilities }));
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeTab, mapsReady, userLocation]);

  const facilities = facilityResults[activeTab];
  const mappedFacilities = useMemo<MappedFacility[]>(() => facilities.map((facility) => ({
    name: facility.name,
    category: facility.category,
    rating: facility.rating,
    position: facility.position,
    address: facility.address,
  })), [facilities]);

  const selectTab = (tab: CareTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="flex h-[100svh] h-[100dvh] flex-col overflow-hidden bg-slate-50 text-slate-950">
      <div className="h-1 shrink-0 bg-cameroon-flag" />

      <header className="safe-area-top z-20 flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={() => navigate('/analysis')} aria-label="Back" className="shrink-0 p-1 text-cameroon-green active:scale-95">
            <BackIcon />
          </button>
          <h1 className="truncate text-xl font-black text-cameroon-green-deep">{t.next_steps}</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowMap((current) => !current)}
          className="shrink-0 rounded-lg bg-cameroon-green px-3 py-2 text-xs font-black text-white"
        >
          {showMap ? t.list : t.view_map}
        </button>
      </header>

      <main aria-labelledby="nextsteps-heading" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-8">
        <div className="mx-auto w-full max-w-lg space-y-6">
          <section className="border-l-4 border-cameroon-green bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-black uppercase text-cameroon-green">Analysis follow-up</p>
            <h2 id="nextsteps-heading" className="mt-1 break-words text-lg font-black text-slate-950">
              {selectedReport?.name ?? 'Find qualified care near you'}
            </h2>
            <p className="mt-1 text-sm font-semibold capitalize text-slate-600">Urgency: {analysisUrgency.replace('_', ' ')}</p>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Nearby care</h3>
                <p className="text-xs text-slate-500">
                  {locationStatus === 'ready' ? 'Sorted from your current location.' : 'Location is needed for distance-sorted results.'}
                </p>
              </div>
              <button
                type="button"
                onClick={requestLocation}
                disabled={locationStatus === 'requesting'}
                className="flex items-center gap-2 rounded-lg border border-cameroon-green px-3 py-2 text-xs font-black text-cameroon-green disabled:opacity-50"
              >
                <MapPinIcon className="h-4 w-4" />
                {locationStatus === 'requesting' ? 'Locating...' : 'Use my location'}
              </button>
            </div>

            {(locationError || mapsError || placesError) && (
              <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-900">
                {locationError || placesError || mapsError}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Nearby care type">
              {CARE_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => selectTab(tab)}
                  className={`min-w-0 rounded-lg px-2 py-2.5 text-xs font-black capitalize ${
                    activeTab === tab
                      ? 'bg-cameroon-green text-white'
                      : 'border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </section>

          {showMap ? (
            <section className="space-y-3">
              <FacilityMap facilities={mappedFacilities} userLocation={userLocation} height="min(58dvh, 520px)" />
              <a
                href={mapsSearchUrl(activeTab)}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-black text-white"
              >
                <MapPinIcon className="h-5 w-5" />
                Open {activeTab} in Google Maps
              </a>
            </section>
          ) : (
            <section className="space-y-3" aria-live="polite">
              {searching && (
                <div className="flex items-center justify-center gap-3 py-8 text-sm font-bold text-slate-600">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-cameroon-green" />
                  Searching nearby {activeTab}...
                </div>
              )}

              {!searching && facilities.map((facility, index) => (
                <motion.article
                  key={facility.placeId ?? `${facility.name}-${index}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                    activeTab === 'hospitals'
                      ? 'bg-red-50 text-red-700'
                      : activeTab === 'pharmacies'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {activeTab === 'pharmacies' ? <RemedyIcon className="h-5 w-5" /> : <MapPinIcon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="break-words text-sm font-black leading-tight text-slate-950">{facility.name}</h4>
                    <p className="mt-1 break-words text-xs text-slate-500">{facility.address || 'Address available in Google Maps'}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-600">
                      <span>{facility.distanceKm < 1 ? `${Math.round(facility.distanceKm * 1000)} m` : `${facility.distanceKm.toFixed(1)} km`}</span>
                      {facility.rating > 0 && <span className="text-amber-700">Rating {facility.rating.toFixed(1)}</span>}
                      {facility.openNow !== undefined && (
                        <span className={facility.openNow ? 'text-emerald-700' : 'text-red-700'}>{facility.openNow ? 'Open now' : 'Closed now'}</span>
                      )}
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${facility.position.lat},${facility.position.lng}${facility.placeId ? `&destination_place_id=${encodeURIComponent(facility.placeId)}` : ''}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Directions to ${facility.name}`}
                    className="shrink-0 rounded-lg bg-cameroon-green px-3 py-2 text-xs font-black text-white"
                  >
                    Go
                  </a>
                </motion.article>
              ))}

              {!searching && facilities.length === 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-5 text-center">
                  <p className="text-sm font-bold text-slate-700">
                    {locationStatus === 'ready' && mapsReady
                      ? `No ${activeTab} were returned in the search radius.`
                      : `Open Google Maps to find ${activeTab} near you.`}
                  </p>
                </div>
              )}

              <a
                href={mapsSearchUrl(activeTab)}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-slate-900 bg-white px-4 py-3 text-sm font-black text-slate-900"
              >
                <MapPinIcon className="h-5 w-5" />
                Search {activeTab} in Google Maps
              </a>
            </section>
          )}

          <section className="border-t border-red-200 pt-5 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700">
              <WarningIcon />
            </div>
            <h4 className="font-black text-red-900">{t.disclaimer_title}</h4>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-red-800">{t.disclaimer_text}</p>
            <p className="mt-2 text-xs font-black text-red-700">{t.disclaimer_consult}</p>
          </section>
        </div>
      </main>

      <nav aria-label="Main navigation" className="mobile-bottom-nav z-30 flex shrink-0 items-center justify-between border-t border-slate-200 bg-white/95 px-8 py-3 backdrop-blur">
        <button onClick={() => navigate('/app')} aria-label="Home" className="text-cameroon-green/70"><HomeIcon /></button>
        <button onClick={() => navigate('/scanner')} aria-label="New scan" className="flex h-12 w-12 items-center justify-center rounded-lg bg-cameroon-green text-white shadow-md">
          <PlusIcon />
        </button>
        <button onClick={() => navigate('/patients')} aria-label="Patients" className="text-cameroon-green/70"><UsersIcon /></button>
      </nav>
    </div>
  );
};

export default NextSteps;
