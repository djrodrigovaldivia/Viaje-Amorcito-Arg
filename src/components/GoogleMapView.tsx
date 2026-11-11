import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { Landmark } from '../data/landmarks';
import { VINTAGE_AND_SHOPPING_SPOTS, VintageFashionSpot } from '../data/vintageFashionSpots';
import {
  unlockIOSAudio,
  speakAsRodrigoOrChileanMaleAI,
  stopAllVoicePlayback,
} from '../services/voiceService';
import {
  Compass,
  Sparkles,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  ShoppingBag,
  Clock,
  MapPin,
} from 'lucide-react';

interface GoogleMapViewProps {
  apiKey?: string;
  landmarks: Landmark[];
  selectedLandmark: Landmark;
  onSelectLandmark: (landmark: Landmark) => void;
  onOpen3DModal: (landmark: Landmark) => void;
  mapType: 'hybrid' | 'roadmap' | 'satellite' | 'terrain';
  onChangeMapType: (type: 'hybrid' | 'roadmap' | 'satellite' | 'terrain') => void;
  is3DTiltEnabled: boolean;
  onToggle3DTilt: () => void;
  userLocation: { lat: number; lng: number; address?: string } | null;
  onRequestLocation: () => void;
  focusedVintageSpotId?: string | null;
  onClearFocusedVintageSpot?: () => void;
}

// Tile URLs (100% Free, No API Key Required, High Resolution Esri ArcGIS Online)
const TILE_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
  },
  labelsOverlay: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: '',
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; National Geographic, DeLorme, NAVTEQ',
  },
  roadmap: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, USGS, Intermap',
  },
};

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  landmarks,
  selectedLandmark,
  onSelectLandmark,
  onOpen3DModal,
  mapType,
  onChangeMapType,
  is3DTiltEnabled,
  onToggle3DTilt,
  userLocation,
  onRequestLocation,
  focusedVintageSpotId,
  onClearFocusedVintageSpot,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const vintageMarkersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const flightLineRef = useRef<L.Polyline | null>(null);
  const flightGlowRef = useRef<L.Polyline | null>(null);

  const [activePopupLandmark, setActivePopupLandmark] = useState<Landmark | null>(null);
  const [showVintageLayer, setShowVintageLayer] = useState<boolean>(true);
  const [showVintageDrawer, setShowVintageDrawer] = useState<boolean>(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [activePopupVintageSpot, setActivePopupVintageSpot] = useState<VintageFashionSpot | null>(
    null
  );
  const [isSpeakingSpotTip, setIsSpeakingSpotTip] = useState<boolean>(false);

  // Initialize Leaflet Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [selectedLandmark.coordinates.lat, selectedLandmark.coordinates.lng],
      zoom: Math.min(17, Math.max(5, Math.round(selectedLandmark.camera.zoom - 1))),
      zoomControl: false,
      attributionControl: true,
      minZoom: 3,
      maxZoom: 20,
    });

    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Draw Geodesic / Tour Flight Polyline connecting all 12 landmarks
    const routeCoords: L.LatLngExpression[] = landmarks.map((l) => [
      l.coordinates.lat,
      l.coordinates.lng,
    ]);
    if (landmarks.length > 1) {
      routeCoords.push([landmarks[0].coordinates.lat, landmarks[0].coordinates.lng]);
    }

    const glowLine = L.polyline(routeCoords, {
      color: '#0ea5e9',
      weight: 6,
      opacity: 0.25,
      lineCap: 'round',
    }).addTo(map);

    const flightLine = L.polyline(routeCoords, {
      color: '#38bdf8',
      weight: 2.5,
      opacity: 0.85,
      dashArray: '8, 8',
      lineCap: 'round',
    }).addTo(map);

    flightGlowRef.current = glowLine;
    flightLineRef.current = flightLine;

    return () => {
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer & Hybrid Labels when mapType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }
    if (labelsTileLayerRef.current) {
      map.removeLayer(labelsTileLayerRef.current);
      labelsTileLayerRef.current = null;
    }

    if (mapType === 'hybrid') {
      const sat = L.tileLayer(TILE_LAYERS.satellite.url, {
        attribution: TILE_LAYERS.satellite.attribution,
        maxNativeZoom: 18,
        maxZoom: 20,
      }).addTo(map);
      const labels = L.tileLayer(TILE_LAYERS.labelsOverlay.url, {
        maxNativeZoom: 18,
        maxZoom: 20,
        opacity: 0.92,
      }).addTo(map);
      baseTileLayerRef.current = sat;
      labelsTileLayerRef.current = labels;
    } else if (mapType === 'satellite') {
      const sat = L.tileLayer(TILE_LAYERS.satellite.url, {
        attribution: TILE_LAYERS.satellite.attribution,
        maxNativeZoom: 18,
        maxZoom: 20,
      }).addTo(map);
      baseTileLayerRef.current = sat;
    } else if (mapType === 'terrain') {
      const topo = L.tileLayer(TILE_LAYERS.terrain.url, {
        attribution: TILE_LAYERS.terrain.attribution,
        maxNativeZoom: 18,
        maxZoom: 20,
      }).addTo(map);
      baseTileLayerRef.current = topo;
    } else {
      const road = L.tileLayer(TILE_LAYERS.roadmap.url, {
        attribution: TILE_LAYERS.roadmap.attribution,
        maxNativeZoom: 19,
        maxZoom: 20,
      }).addTo(map);
      baseTileLayerRef.current = road;
    }
  }, [mapType]);

  // Render & Update Landmark Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    landmarks.forEach((landmark) => {
      const isSelected = landmark.id === selectedLandmark.id && !activePopupVintageSpot;
      const elevStr =
        landmark.elevation >= 1000
          ? `${(landmark.elevation / 1000).toFixed(1)}k m`
          : `${landmark.elevation} m`;

      const html = `
        <div class="relative flex flex-col items-center group cursor-pointer select-none" style="transform: translate(-50%, -100%);">
          ${
            isSelected
              ? `<div class="absolute -inset-2.5 rounded-full bg-sky-400/35 animate-ping pointer-events-none"></div>`
              : ''
          }
          <div class="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-2xl transition-all duration-300 ${
            isSelected
              ? 'bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 border-white text-white scale-110 ring-4 ring-sky-400/50'
              : 'bg-slate-950/90 border-slate-700/90 text-slate-100 hover:border-sky-400 hover:scale-105'
          }">
            <span class="text-amber-400 text-xs leading-none">☀️</span>
            <span class="text-xs font-bold whitespace-nowrap tracking-tight">${landmark.shortTitle}</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/90 text-sky-300 border border-slate-700 font-mono">${elevStr}</span>
          </div>
          <div class="w-2.5 h-2.5 rotate-45 -mt-1 border-r border-b ${
            isSelected ? 'bg-indigo-600 border-white' : 'bg-slate-950 border-slate-700'
          }"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'leaflet-div-icon',
        html,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([landmark.coordinates.lat, landmark.coordinates.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : 100,
      }).addTo(map);

      marker.on('click', () => {
        stopAllVoicePlayback();
        setIsSpeakingSpotTip(false);
        setActivePopupVintageSpot(null);
        onSelectLandmark(landmark);
        setActivePopupLandmark(landmark);
      });

      markersRef.current[landmark.id] = marker;
    });
  }, [landmarks, selectedLandmark, onSelectLandmark, activePopupVintageSpot]);

  // Render & Update Ropa Usada, Estilo Zara & Mall Chinos Layer Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(vintageMarkersRef.current).forEach((marker) => marker.remove());
    vintageMarkersRef.current = {};

    if (!showVintageLayer) return;

    VINTAGE_AND_SHOPPING_SPOTS.forEach((spot) => {
      if (selectedCategoryFilter !== 'all' && spot.category !== selectedCategoryFilter) {
        return;
      }

      const isSelected = activePopupVintageSpot?.id === spot.id;

      const badgeColor =
        spot.category === 'mall_chino'
          ? 'from-amber-500 via-orange-600 to-red-600 border-amber-200 ring-amber-400/50'
          : spot.category === 'zara_tendencia'
          ? 'from-fuchsia-600 via-purple-600 to-indigo-600 border-fuchsia-200 ring-fuchsia-400/50'
          : spot.category === 'moda_mayorista'
          ? 'from-emerald-500 via-teal-600 to-cyan-600 border-emerald-200 ring-emerald-400/50'
          : 'from-pink-500 via-rose-600 to-purple-600 border-pink-200 ring-pink-400/50';

      const html = `
        <div class="relative flex flex-col items-center group cursor-pointer select-none" style="transform: translate(-50%, -100%);">
          ${
            isSelected
              ? `<div class="absolute -inset-2.5 rounded-full bg-pink-400/45 animate-ping pointer-events-none"></div>`
              : ''
          }
          <div class="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-2xl transition-all duration-300 bg-gradient-to-r ${badgeColor} text-white ${
            isSelected ? 'scale-115 ring-4' : 'hover:scale-105 opacity-95'
          }">
            <span class="text-xs leading-none">${spot.emoji}</span>
            <span class="text-[11px] font-extrabold whitespace-nowrap tracking-tight">${spot.shortTitle}</span>
          </div>
          <div class="w-2.5 h-2.5 rotate-45 -mt-1 bg-pink-600 border-r border-b border-white"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'leaflet-div-icon',
        html,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([spot.coordinates.lat, spot.coordinates.lng], {
        icon,
        zIndexOffset: isSelected ? 1500 : 500,
      }).addTo(map);

      marker.on('click', () => {
        stopAllVoicePlayback();
        setIsSpeakingSpotTip(false);
        setActivePopupLandmark(null);
        setActivePopupVintageSpot(spot);
        map.flyTo([spot.coordinates.lat, spot.coordinates.lng], 15, {
          animate: true,
          duration: 1.1,
        });
      });

      vintageMarkersRef.current[spot.id] = marker;
    });
  }, [showVintageLayer, selectedCategoryFilter, activePopupVintageSpot]);

  // Fly to focusedVintageSpotId when triggered from Rodrigo's Letter or Quick Hub
  useEffect(() => {
    if (!focusedVintageSpotId) return;
    const spot = VINTAGE_AND_SHOPPING_SPOTS.find((s) => s.id === focusedVintageSpotId);
    const map = mapInstanceRef.current;
    if (spot && map) {
      setShowVintageLayer(true);
      setSelectedCategoryFilter('all');
      setActivePopupLandmark(null);
      setActivePopupVintageSpot(spot);
      map.flyTo([spot.coordinates.lat, spot.coordinates.lng], 16, {
        animate: true,
        duration: 1.3,
      });
      if (onClearFocusedVintageSpot) {
        onClearFocusedVintageSpot();
      }
    }
  }, [focusedVintageSpotId, onClearFocusedVintageSpot]);

  // Fly smoothly to Selected Landmark when it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const targetZoom = Math.min(16, Math.max(6, Math.round(selectedLandmark.camera.zoom - 1)));
    map.flyTo([selectedLandmark.coordinates.lat, selectedLandmark.coordinates.lng], targetZoom, {
      animate: true,
      duration: 1.5,
    });
  }, [selectedLandmark]);

  // Render & Fly to User GPS Location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userHtml = `
        <div class="relative flex flex-col items-center" style="transform: translate(-50%, -100%);">
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold shadow-2xl border-2 border-white ring-4 ring-pink-500/40 whitespace-nowrap">
            <span>❤️</span>
            <span>Mi Amorcito está acá 💕</span>
          </div>
          <div class="w-2.5 h-2.5 bg-purple-600 rotate-45 -mt-1 border-r-2 border-b-2 border-white"></div>
        </div>
      `;

      const userIcon = L.divIcon({
        className: 'leaflet-div-icon',
        html: userHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const uMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 2000,
      }).addTo(map);

      userMarkerRef.current = uMarker;

      map.flyTo([userLocation.lat, userLocation.lng], 14, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [userLocation]);

  const handleFlyToVintageSpot = (spot: VintageFashionSpot) => {
    stopAllVoicePlayback();
    setIsSpeakingSpotTip(false);
    setShowVintageLayer(true);
    setActivePopupLandmark(null);
    setActivePopupVintageSpot(spot);
    mapInstanceRef.current?.flyTo([spot.coordinates.lat, spot.coordinates.lng], 16, {
      animate: true,
      duration: 1.2,
    });
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetArgentinaView = () => {
    mapInstanceRef.current?.flyTo([-38.416097, -63.616672], 4, {
      animate: true,
      duration: 1.2,
    });
    setActivePopupLandmark(null);
    setActivePopupVintageSpot(null);
  };

  const filteredSpots = VINTAGE_AND_SHOPPING_SPOTS.filter(
    (s) => selectedCategoryFilter === 'all' || s.category === selectedCategoryFilter
  );

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950 map-3d-perspective-wrapper">
      {/* Atmospheric Horizon Sky Glow when 3D Perspective Tilt is Active */}
      {is3DTiltEnabled && (
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-slate-950 via-sky-950/40 to-transparent z-10 pointer-events-none" />
      )}

      {/* Leaflet Map Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full z-0 ${is3DTiltEnabled ? 'map-3d-tilted' : 'map-3d-flat'}`}
      />

      {/* Interactive Vintage / Zara-Trend / Mall Chino Floating Card (When Fashion Marker Clicked) */}
      {activePopupVintageSpot && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-md bg-slate-950/95 backdrop-blur-md border-2 border-pink-500/60 rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in duration-150">
          <div className="p-4 bg-gradient-to-r from-pink-600/30 via-rose-600/25 to-purple-600/30 border-b border-pink-500/30 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="text-2xl shrink-0">{activePopupVintageSpot.emoji}</span>
              <div className="min-w-0">
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/30 text-pink-200 border border-pink-400/40">
                  {activePopupVintageSpot.categoryLabel}
                </span>
                <h4 className="text-sm sm:text-base font-extrabold text-white leading-snug mt-1">
                  {activePopupVintageSpot.name}
                </h4>
                <p className="text-[11px] text-pink-200 font-semibold">
                  📍 {activePopupVintageSpot.neighborhood} — {activePopupVintageSpot.address}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                stopAllVoicePlayback();
                setIsSpeakingSpotTip(false);
                setActivePopupVintageSpot(null);
              }}
              className="p-1.5 rounded-full bg-slate-900/90 text-slate-300 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-[52dvh] overflow-y-auto">
            {/* Price & Hours Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-900 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 font-bold block uppercase">
                  💵 Precios Aprox (Nada Caro):
                </span>
                <span className="font-extrabold text-white block">
                  {activePopupVintageSpot.priceLevelArs}
                </span>
                <span className="text-[11px] text-emerald-300">
                  🇨🇱 {activePopupVintageSpot.approxClpNote}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-900 border border-sky-500/30">
                <span className="text-[10px] text-sky-400 font-bold flex items-center gap-1 uppercase">
                  <Clock className="w-3 h-3" /> Horario de Atención:
                </span>
                <span className="text-xs font-semibold text-slate-200 block mt-0.5">
                  {activePopupVintageSpot.hours}
                </span>
              </div>
            </div>

            {/* Style Vibe (@maria_la_vintage connection) */}
            <div className="px-3 py-2 rounded-2xl bg-fuchsia-950/40 border border-fuchsia-500/30 text-xs">
              <span className="font-extrabold text-fuchsia-300">✨ Estilo & Tendencia: </span>
              <span className="text-slate-200">{activePopupVintageSpot.styleVibe}</span>
            </div>

            {/* Highlights */}
            <div className="space-y-1">
              {activePopupVintageSpot.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                  <span className="text-pink-400 font-bold">•</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>

            {/* Rodrigo's Personal Fashion Tip + Voice Button */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-950/60 to-purple-950/60 border border-pink-400/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-pink-300">
                  💌 Tip de Rodrigo para mi Amorcito:
                </span>
                <button
                  onClick={() => {
                    unlockIOSAudio();
                    if (isSpeakingSpotTip) {
                      stopAllVoicePlayback();
                      setIsSpeakingSpotTip(false);
                    } else {
                      speakAsRodrigoOrChileanMaleAI({
                        text: `${activePopupVintageSpot.shortTitle}. ${activePopupVintageSpot.rodrigoFashionTip}`,
                        onStart: () => setIsSpeakingSpotTip(true),
                        onEnd: () => setIsSpeakingSpotTip(false),
                      });
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold"
                >
                  {isSpeakingSpotTip ? (
                    <>
                      <VolumeX className="w-3 h-3" />
                      <span>Detener</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3" />
                      <span>Escuchar Tip</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-pink-100 italic leading-relaxed">
                "{activePopupVintageSpot.rodrigoFashionTip}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Selected Landmark Floating Card (When Monument Marker Clicked) */}
      {activePopupLandmark && !activePopupVintageSpot && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-md border border-sky-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
          <div className="relative h-36 w-full overflow-hidden">
            <img
              src={activePopupLandmark.imageUrl}
              alt={activePopupLandmark.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <button
              onClick={() => setActivePopupLandmark(null)}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-950/80 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                  {activePopupLandmark.province}
                </span>
                <h4 className="text-sm font-extrabold text-white leading-tight">
                  {activePopupLandmark.name}
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-200 font-mono">
                {activePopupLandmark.elevation.toLocaleString()} msnm
              </span>
            </div>
          </div>

          <div className="p-3.5 space-y-3">
            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {activePopupLandmark.description}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
              <span className="text-[10px] text-amber-300 font-semibold truncate">
                ✨ {activePopupLandmark.badge}
              </span>
              <button
                onClick={() => {
                  onOpen3DModal(activePopupLandmark);
                  setActivePopupLandmark(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Abrir Gemelo 3D</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Map HUD Controls (Top Right) */}
      <div className="absolute top-14 sm:top-4 right-3 sm:right-4 z-20 flex flex-col gap-2 items-end max-w-[92vw]">
        {/* Live GPS Location Button for Amorcito */}
        <button
          onClick={onRequestLocation}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold shadow-xl transition-all ${
            userLocation
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-white/60 text-white ring-2 ring-pink-500/40'
              : 'bg-slate-950/95 hover:bg-slate-900 border-pink-500/40 text-pink-200'
          }`}
          title="Ver dónde estoy parada con el GPS de mi iPhone"
        >
          <Navigation className="w-3.5 h-3.5 text-pink-300" />
          <span>📍 ¿Dónde estoy? (GPS)</span>
        </button>

        {/* CAPA ROPA USADA, ESTILO ZARA & MALL CHINOS TOGGLE + DRAWER */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const next = !showVintageDrawer;
              setShowVintageDrawer(next);
              if (next && !showVintageLayer) {
                setShowVintageLayer(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border border-pink-300/60 text-xs font-extrabold shadow-xl transition-all"
            title="Explorar ruta de Ropa Usada, Estilo @maria_la_vintage, Tiendas tipo Zara accesibles y Mall Chinos"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>👗 Ropa Usada, Zara & Chinos ({VINTAGE_AND_SHOPPING_SPOTS.length})</span>
          </button>

          <button
            onClick={() => setShowVintageLayer(!showVintageLayer)}
            className={`px-2.5 py-2 rounded-xl border text-[11px] font-extrabold shadow-xl transition-all ${
              showVintageLayer
                ? 'bg-pink-500/25 border-pink-400 text-pink-200'
                : 'bg-slate-950/90 border-slate-700 text-slate-400'
            }`}
            title="Mostrar u ocultar íconos de Ropa Usada y Mall Chinos en el mapa"
          >
            {showVintageLayer ? 'Capa ON' : 'Capa OFF'}
          </button>
        </div>

        {/* Collapsible Fashion & Vintage Map Layer Drawer */}
        {showVintageDrawer && (
          <div className="w-80 sm:w-96 p-3.5 rounded-3xl bg-slate-950/95 backdrop-blur-md border-2 border-pink-500/50 shadow-2xl space-y-3 text-slate-100 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>👗</span>
                  <span>Mapa Moda: @maria_la_vintage + Zara + Chinos</span>
                </h4>
                <p className="text-[10px] text-pink-300">
                  Toca cualquier tienda para volar directo a su calle en Buenos Aires
                </p>
              </div>
              <button
                onClick={() => setShowVintageDrawer(false)}
                className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: '✨ Todas (10)' },
                { id: 'ropa_usada', label: '👗 Ropa Usada' },
                { id: 'zara_tendencia', label: '🖤 Tipo Zara / Outlets' },
                { id: 'moda_mayorista', label: '👠 Mayorista' },
                { id: 'mall_chino', label: '🏮 Mall Chinos' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-2 py-1 rounded-xl text-[10px] font-extrabold border transition-all ${
                    selectedCategoryFilter === cat.id
                      ? 'bg-pink-600 border-pink-300 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Scrollable Store List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filteredSpots.map((spot) => (
                <button
                  key={spot.id}
                  onClick={() => handleFlyToVintageSpot(spot)}
                  className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-2 ${
                    activePopupVintageSpot?.id === spot.id
                      ? 'bg-pink-600/25 border-pink-400 text-white'
                      : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-lg shrink-0">{spot.emoji}</span>
                    <div className="min-w-0">
                      <h5 className="text-xs font-extrabold text-white truncate">
                        {spot.shortTitle}
                      </h5>
                      <p className="text-[10px] text-pink-300 truncate">{spot.neighborhood}</p>
                      <p className="text-[10px] text-emerald-300 font-semibold truncate">
                        {spot.approxClpNote}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-pink-600/30 border border-pink-400/40 text-pink-200 text-[10px] font-bold shrink-0 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" /> Ir
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3D Perspective Tilt Button */}
        <button
          onClick={onToggle3DTilt}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold shadow-xl transition-all ${
            is3DTiltEnabled
              ? 'bg-sky-500/25 border-sky-400 text-sky-300 ring-2 ring-sky-500/30'
              : 'bg-slate-950/95 border-slate-700/80 text-slate-300 hover:text-white'
          }`}
          title="Alternar vista oblicua 3D / vista cenital plana"
        >
          <Compass className={`w-4 h-4 ${is3DTiltEnabled ? 'text-sky-400' : ''}`} />
          <span>{is3DTiltEnabled ? 'Modo 3D Activo' : 'Activar Perspectiva 3D'}</span>
        </button>

        {/* Map Type Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-xl">
          <button
            onClick={() => onChangeMapType('hybrid')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              mapType === 'hybrid'
                ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Híbrido
          </button>
          <button
            onClick={() => onChangeMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              mapType === 'satellite'
                ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Satélite HD
          </button>
          <button
            onClick={() => onChangeMapType('terrain')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              mapType === 'terrain'
                ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Relieve
          </button>
          <button
            onClick={() => onChangeMapType('roadmap')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              mapType === 'roadmap'
                ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Calles
          </button>
        </div>

        {/* Zoom & Country Reset Controls */}
        <div className="flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl overflow-hidden shadow-xl">
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 border-b border-slate-800 transition-colors"
            title="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 border-b border-slate-800 transition-colors"
            title="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetArgentinaView}
            className="p-2 text-sky-400 hover:text-sky-300 hover:bg-slate-800 transition-colors"
            title="Ver mapa completo de Argentina"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Legend / Badge HUD (Bottom Left) */}
      <div className="absolute bottom-6 left-6 hidden md:flex items-center gap-3 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2.5 shadow-2xl text-xs text-slate-300 z-20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">Calles & Satélite HD Libre</span>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <button
          onClick={() => {
            setShowVintageLayer(true);
            setShowVintageDrawer(true);
          }}
          className="flex items-center gap-1.5 text-pink-300 hover:text-pink-200 font-bold transition-colors"
        >
          <span>👗 10 Tiendas Ropa Usada, Zara & Chinos</span>
        </button>
        <div className="w-px h-4 bg-slate-700" />
        <button
          onClick={() => onOpen3DModal(selectedLandmark)}
          className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-semibold transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ver {selectedLandmark.shortTitle} en 3D</span>
        </button>
      </div>
    </div>
  );
};
