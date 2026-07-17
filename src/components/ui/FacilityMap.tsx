import { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';

export interface MappedFacility {
  name: string;
  category: 'clinic' | 'hospital' | 'pharmacy' | 'telehealth';
  rating: number;
  position: { lat: number; lng: number };
  address?: string;
}

interface FacilityMapProps {
  facilities: MappedFacility[];
  userLocation?: { lat: number; lng: number } | null;
  height?: string;
  className?: string;
}

const PIN_COLORS: Record<MappedFacility['category'], string> = {
  hospital: '#CE1126',
  clinic: '#007A5E',
  pharmacy: '#FCD116',
  telehealth: '#0EA5E9',
};

// Default center: Yaoundé, Cameroon
const DEFAULT_CENTER = { lat: 0, lng: 0 };

export const FacilityMap = ({ facilities, userLocation = null, height = '420px', className = '' }: FacilityMapProps) => {
  const { ready, error } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Init map
  useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return;
    const center = userLocation || facilities[0]?.position || DEFAULT_CENTER;
    mapInstance.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: userLocation || facilities.length > 0 ? 12 : 2,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: CARE_MAP_STYLE,
    });
  }, [facilities, ready, userLocation]);

  // Pan to user location once obtained
  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;
    mapInstance.current.panTo(userLocation);

    if (userMarkerRef.current) userMarkerRef.current.setMap(null);
    userMarkerRef.current = new google.maps.Marker({
      position: userLocation,
      map: mapInstance.current,
      title: 'You are here',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#0EA5E9',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
      zIndex: 1000,
    });
  }, [userLocation]);

  // Render facility markers
  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    if (userLocation) bounds.extend(userLocation);

    facilities.forEach((facility, idx) => {
      const marker = new google.maps.Marker({
        position: facility.position,
        map: mapInstance.current!,
        title: facility.name,
        icon: pinSvg(PIN_COLORS[facility.category]),
        animation: google.maps.Animation.DROP,
      });
      const infowindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: Inter, sans-serif; padding: 4px 6px; max-width: 220px;">
            <div style="font-weight: 800; color: #00563F; font-size: 13px; margin-bottom: 2px;">${escapeHtml(facility.name)}</div>
            <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">${facility.category}</div>
            ${facility.rating > 0 ? `<div style="font-size: 12px; color: #9A6700; font-weight: 700; margin-top: 4px;">Rating ${facility.rating.toFixed(1)}</div>` : ''}
            ${facility.address ? `<div style="font-size: 11px; color: #4B5563; margin-top: 4px;">${escapeHtml(facility.address)}</div>` : ''}
          </div>
        `,
      });
      marker.addListener('click', () => {
        markersRef.current.forEach((other) => {
          const win = (other as google.maps.Marker & { __infowindow?: google.maps.InfoWindow }).__infowindow;
          win?.close();
        });
        infowindow.open({ anchor: marker, map: mapInstance.current! });
        setActiveIndex(idx);
      });
      (marker as google.maps.Marker & { __infowindow?: google.maps.InfoWindow }).__infowindow = infowindow;
      markersRef.current.push(marker);
      bounds.extend(facility.position);
    });

    if (!bounds.isEmpty() && (facilities.length > 1 || userLocation)) {
      mapInstance.current.fitBounds(bounds, 64);
    }
  }, [facilities, ready, userLocation]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border-2 border-dashed border-cameroon-yellow/40 bg-white p-8 text-center ${className}`}
        style={{ height }}
      >
        <div>
          <p className="text-sm font-bold text-cameroon-red mb-2">Map unavailable</p>
          <p className="text-xs text-slate-500 max-w-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-slate-200 shadow-sm ${className}`} style={{ height }}>
      <div ref={mapRef} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-cameroon-ivory">
          <div className="w-10 h-10 border-2 border-cameroon-green/30 border-t-cameroon-green rounded-full animate-spin" />
        </div>
      )}
      {/* Legend */}
      <div className="absolute bottom-3 left-3 right-3 glass-effect rounded-2xl p-3 flex items-center justify-around text-[10px] font-bold uppercase tracking-wider">
        {(Object.keys(PIN_COLORS) as Array<keyof typeof PIN_COLORS>).map((k) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIN_COLORS[k] }} />
            <span className="text-cameroon-night/70">{k}</span>
          </div>
        ))}
      </div>
      {activeIndex !== null && facilities[activeIndex] && (
        <div className="absolute top-3 left-3 right-3 bg-white rounded-2xl shadow-lg p-3 flex items-center gap-3 border border-cameroon-yellow/30">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs"
            style={{ background: PIN_COLORS[facilities[activeIndex].category] }}
          >
            {facilities[activeIndex].category.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-sm font-black text-cameroon-night truncate">{facilities[activeIndex].name}</p>
            <p className="text-[10px] text-slate-500 font-medium">★ {facilities[activeIndex].rating.toFixed(1)} · {facilities[activeIndex].category}</p>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${facilities[activeIndex].position.lat},${facilities[activeIndex].position.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-black text-cameroon-green uppercase tracking-wider px-3 py-1.5 rounded-full bg-cameroon-green/10"
          >
            Directions
          </a>
        </div>
      )}
    </div>
  );
};

const pinSvg = (color: string): google.maps.Icon => ({
  url:
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
        <defs>
          <radialGradient id="g" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#fff" stop-opacity="0.85"/>
            <stop offset="60%" stop-color="${color}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <path d="M18 1 C9 1 2 8 2 17 C2 28 18 47 18 47 S34 28 34 17 C34 8 27 1 18 1Z" fill="${color}" stroke="#FFF7E6" stroke-width="2"/>
        <circle cx="18" cy="17" r="14" fill="url(#g)"/>
        <circle cx="18" cy="17" r="6" fill="#FFF7E6"/>
      </svg>`,
    ),
  scaledSize: new google.maps.Size(36, 48),
  anchor: new google.maps.Point(18, 46),
});

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Subtle map style — desaturated land, gentle warm bias to hint at Cameroon
const CARE_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5efe0' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5d4d36' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#fff7e6' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#cfe9d6' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fcd116' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#d4a800' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a8d5e2' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3a6b78' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];
