import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { SalesmanProfile, GeoCoordinate } from '../types/sfa';
import {
  Crosshair,
  MapPin,
  Compass,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Radio,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface MapViewProps {
  salesman: SalesmanProfile;
  onUpdateLocation: (coord: GeoCoordinate) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  salesman,
  onUpdateLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [locating, setLocating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(salesman.currentLocation.accuracy || 5);
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('osm');
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Leaflet Map centered purely on User Coordinate
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [salesman.currentLocation.lat, salesman.currentLocation.lng],
      zoom: 16,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const tile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    tileLayerRef.current = tile;

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Tile Layer (Street vs Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    if (mapType === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri', maxZoom: 19 }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }
      ).addTo(map);
    }
  }, [mapType]);

  // Update only the USER's coordinate pin & geofence circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // User Coordinate Marker HTML
    const userPinHtml = `
      <div class="relative flex items-center justify-center">
        <span class="absolute inline-flex h-14 w-14 animate-ping rounded-full bg-blue-500 opacity-40"></span>
        <div class="relative flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl ring-4 ring-white border-2 border-blue-900">
          <svg class="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userPinHtml,
      className: 'user-live-gps-pin',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    const marker = L.marker([salesman.currentLocation.lat, salesman.currentLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000
    }).addTo(layer);

    marker.bindPopup(`
      <div class="p-2 font-sans text-xs space-y-1">
        <div class="flex items-center gap-1.5 text-blue-900 font-extrabold">
          <span>📍 Titik Koordinat Pengguna</span>
        </div>
        <p class="font-bold text-slate-800">${salesman.name}</p>
        <p class="font-mono text-slate-600">${salesman.currentLocation.lat.toFixed(6)}, ${salesman.currentLocation.lng.toFixed(6)}</p>
        <p class="text-[10px] text-emerald-600 font-bold">● Akurasi GPS: ±${gpsAccuracy} Meter</p>
      </div>
    `);

    // Draw GPS Accuracy Circle around user coordinate
    L.circle([salesman.currentLocation.lat, salesman.currentLocation.lng], {
      radius: Math.max(20, gpsAccuracy),
      color: '#2563eb',
      fillColor: '#60a5fa',
      fillOpacity: 0.18,
      weight: 1.5,
      dashArray: '3, 4'
    }).addTo(layer);

  }, [salesman.currentLocation, gpsAccuracy]);

  // Request high-accuracy real GPS coordinate from device
  const handleGetLiveLocation = () => {
    setLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 5);
          setGpsAccuracy(accuracy);

          const newCoord: GeoCoordinate = {
            lat,
            lng,
            accuracy,
            timestamp: new Date().toISOString(),
            address: `Titik GPS Aktual (${lat.toFixed(5)}, ${lng.toFixed(5)})`
          };

          onUpdateLocation(newCoord);
          setLocating(false);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 17);
          }
        },
        (error) => {
          console.warn('Geolocation warning, refreshing coordinates:', error);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    } else {
      setLocating(false);
    }
  };

  const handleCopyCoordinates = () => {
    const text = `${salesman.currentLocation.lat.toFixed(6)}, ${salesman.currentLocation.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${salesman.currentLocation.lat},${salesman.currentLocation.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-900">
      
      {/* Floating GPS Status Pill at Top */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs text-white">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <span className="font-extrabold text-white text-xs block">Titik Koordinat Pengguna</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">
              GPS Terkunci (±{gpsAccuracy}m)
            </span>
          </div>
        </div>

        {/* Action buttons (Live GPS & Map Type) */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={() => setMapType(mapType === 'osm' ? 'satellite' : 'osm')}
            title="Ganti Tipe Peta (Jalan / Satelit)"
            className="bg-slate-900/90 hover:bg-slate-800 text-white p-2.5 rounded-xl shadow-lg border border-slate-700 transition-all flex items-center justify-center text-xs font-bold gap-1"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] hidden sm:inline">{mapType === 'osm' ? 'Satelit' : 'Jalan'}</span>
          </button>

          <button
            onClick={handleGetLiveLocation}
            disabled={locating}
            title="Dapatkan Titik Koordinat GPS Terkini"
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white py-2 px-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 text-xs font-bold border border-blue-400/40"
          >
            <Crosshair className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Mencari...' : 'GPS Live'}</span>
          </button>
        </div>
      </div>

      {/* Map Canvas (Purely showing user location point) */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Bottom Telemetry Card: User Live GPS Coordinates Only (NO OUTLET LIST!) */}
      <div className="absolute bottom-3 left-3 right-3 z-[400] bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                Koordinat Presisi Pengguna
              </span>
              <h4 className="font-extrabold text-slate-900 text-sm">{salesman.name}</h4>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-semibold block">Akurasi Satelit</span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ±{gpsAccuracy} Meter
            </span>
          </div>
        </div>

        {/* Coordinates Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-3">
          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Latitude</span>
            <span className="font-mono text-base font-black text-blue-950 select-all">
              {salesman.currentLocation.lat.toFixed(6)}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Longitude</span>
            <span className="font-mono text-base font-black text-blue-950 select-all">
              {salesman.currentLocation.lng.toFixed(6)}
            </span>
          </div>
        </div>

        {/* Detected Geocoded Address / Location */}
        <div className="text-xs text-slate-600 bg-slate-100/70 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
          <span className="line-clamp-1 text-[11px] font-medium">
            {salesman.currentLocation.address || 'Jl. Matraman Raya No. 42, Jakarta Timur'}
          </span>
          <span className="text-[10px] font-bold text-slate-400 shrink-0">WIB</span>
        </div>

        {/* Action Buttons: Copy, Refresh, Open in Maps */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-200">
          <button
            type="button"
            onClick={handleCopyCoordinates}
            className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin Titik'}</span>
          </button>

          <button
            type="button"
            onClick={handleGetLiveLocation}
            className="py-2 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-blue-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${locating ? 'animate-spin' : ''}`} />
            <span>Update Titik</span>
          </button>

          <button
            type="button"
            onClick={openInGoogleMaps}
            className="py-2 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-blue-500/20"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Google Maps</span>
          </button>
        </div>

      </div>

    </div>
  );
};
