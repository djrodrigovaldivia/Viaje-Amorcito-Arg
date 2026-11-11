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
  Sparkles,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  Clock,
  MapPin,
  ListFilter,
  Layers,
} from 'lucide-react';

export type ActiveMapLayer = 'tiendas' | 'paseos_ba' | 'solo_calles';

interface GoogleMapViewProps {
  apiKey?: string;
  landmarks: Landmark[];
  selectedLandmark: Landmark;
  onSelectLandmark: (landmark: Landmark) => void;
  onOpen3DModal: (landmark: Landmark) => void;
  onOpenLandmarkDetails?: (landmark: Landmark) => void;
  mapType: 'hybrid' | 'roadmap' | 'satellite' | 'terrain';
  onChangeMapType: (type: 'hybrid' | 'roadmap' | 'satellite' | 'terrain') => void;
  is3DTiltEnabled: boolean;
  onToggle3DTilt: () => void;
  userLocation: { lat: number; lng: number; address?: string } | null;
  onRequestLocation: () => void;
  focusedVintageSpotId?: string | null;
  onClearFocusedVintageSpot?: () => void;
  externalOpenStoreListTrigger?: number;
}

// Tile URLs (100% Free, High Resolution Esri ArcGIS Online)
const TILE_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  labelsOverlay: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: '',
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  roadmap: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Calles de Buenos Aires',
  },
};

// Default Buenos Aires CABA Center (Palermo / Recoleta / Centro axis)
const BUENOS_AIRES_CENTER: [number, number] = [-34.595, -58.405];
const BUENOS_AIRES_DEFAULT_ZOOM = 13;

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  landmarks,
  selectedLandmark,
  onSelectLandmark,
  onOpen3DModal,
  onOpenLandmarkDetails,
  mapType,
  onChangeMapType,
  is3DTiltEnabled,
  userLocation,
  onRequestLocation,
  focusedVintageSpotId,
  onClearFocusedVintageSpot,
  externalOpenStoreListTrigger,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const vintageMarkersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const isFirstLandmarkRenderRef = useRef<boolean>(true);

  // ONLY 1 LAYER ACTIVE AT A TIME BY DEFAULT: 'tiendas' on top of clean street names
  const [activeLayer, setActiveLayer] = useState<ActiveMapLayer>('tiendas');
  const [showAllArgentinaLandmarks, setShowAllArgentinaLandmarks] = useState<boolean>(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [showStoreListSheet, setShowStoreListSheet] = useState<boolean>(false);

  const [activePopupLandmark, setActivePopupLandmark] = useState<Landmark | null>(null);
  const [activePopupVintageSpot, setActivePopupVintageSpot] = useState<VintageFashionSpot | null>(
    null
  );
  const [isSpeakingSpotTip, setIsSpeakingSpotTip] = useState<boolean>(false);

  // Open store list sheet when triggered from bottom navbar
  useEffect(() => {
    if (externalOpenStoreListTrigger && externalOpenStoreListTrigger > 0) {
      setActiveLayer('tiendas');
      setShowStoreListSheet((prev) => !prev);
    }
  }, [externalOpenStoreListTrigger]);

  // Initialize Leaflet Map Once — Centered on Buenos Aires CABA with clear street names
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: BUENOS_AIRES_CENTER,
      zoom: BUENOS_AIRES_DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
      minZoom: 4,
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

    return () => {
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer (Default: 'roadmap' with clear street names)
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

    if (mapType === 'hybrid' || mapType === 'satellite') {
      const sat = L.tileLayer(TILE_LAYERS.satellite.url, {
        attribution: TILE_LAYERS.satellite.attribution,
        maxNativeZoom: 18,
        maxZoom: 20,
      }).addTo(map);
      const labels = L.tileLayer(TILE_LAYERS.labelsOverlay.url, {
        maxNativeZoom: 18,
        maxZoom: 20,
        opacity: 0.95,
      }).addTo(map);
      baseTileLayerRef.current = sat;
      labelsTileLayerRef.current = labels;
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

  // Render Landmark Markers ONLY when activeLayer === 'paseos_ba'
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    if (activeLayer !== 'paseos_ba') return;

    const visibleLandmarks = showAllArgentinaLandmarks
      ? landmarks
      : landmarks.filter((l) => l.province.toLowerCase().includes('buenos aires'));

    visibleLandmarks.forEach((landmark) => {
      const isSelected = activePopupLandmark?.id === landmark.id;

      const html = `
        <div class="relative flex flex-col items-center group cursor-pointer select-none" style="transform: translate(-50%, -100%);">
          ${
            isSelected
              ? `<div class="absolute -inset-2 rounded-full bg-sky-400/40 animate-ping pointer-events-none"></div>`
              : ''
          }
          <div class="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-xl transition-all duration-200 ${
            isSelected
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 border-white text-white scale-110 ring-2 ring-sky-300'
              : 'bg-slate-950/95 border-sky-400/80 text-white hover:scale-105'
          }">
            <span class="text-xs leading-none">🏛️</span>
            <span class="text-[11px] font-extrabold whitespace-nowrap tracking-tight">${landmark.shortTitle}</span>
          </div>
          <div class="w-2 h-2 rotate-45 -mt-1 border-r border-b ${
            isSelected ? 'bg-indigo-600 border-white' : 'bg-slate-950 border-sky-400'
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
        zIndexOffset: isSelected ? 1000 : 200,
      }).addTo(map);

      marker.on('click', () => {
        stopAllVoicePlayback();
        setIsSpeakingSpotTip(false);
        setActivePopupVintageSpot(null);
        onSelectLandmark(landmark);
        setActivePopupLandmark(landmark);
        map.flyTo([landmark.coordinates.lat, landmark.coordinates.lng], 15, {
          animate: true,
          duration: 1.0,
        });
      });

      markersRef.current[landmark.id] = marker;
    });
  }, [activeLayer, showAllArgentinaLandmarks, landmarks, activePopupLandmark, onSelectLandmark]);

  // Render Ropa Usada, Tipo Zara & Mall Chinos Markers ONLY when activeLayer === 'tiendas'
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(vintageMarkersRef.current).forEach((marker) => marker.remove());
    vintageMarkersRef.current = {};

    if (activeLayer !== 'tiendas') return;

    VINTAGE_AND_SHOPPING_SPOTS.forEach((spot) => {
      if (selectedCategoryFilter !== 'all' && spot.category !== selectedCategoryFilter) {
        return;
      }

      const isSelected = activePopupVintageSpot?.id === spot.id;

      const badgeColor =
        spot.category === 'mall_chino'
          ? 'from-amber-500 to-red-600 border-amber-200'
          : spot.category === 'zara_tendencia'
          ? 'from-fuchsia-600 to-indigo-600 border-fuchsia-200'
          : spot.category === 'moda_mayorista'
          ? 'from-emerald-600 to-teal-600 border-emerald-200'
          : 'from-pink-600 to-rose-600 border-pink-200';

      const html = `
        <div class="relative flex flex-col items-center group cursor-pointer select-none" style="transform: translate(-50%, -100%);">
          ${
            isSelected
              ? `<div class="absolute -inset-2 rounded-full bg-pink-400/50 animate-ping pointer-events-none"></div>`
              : ''
          }
          <div class="relative flex items-center gap-1 px-2.5 py-1 rounded-full border shadow-xl transition-all duration-200 bg-gradient-to-r ${badgeColor} text-white ${
            isSelected ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
          }">
            <span class="text-xs leading-none">${spot.emoji}</span>
            <span class="text-[11px] font-extrabold whitespace-nowrap tracking-tight">${spot.shortTitle}</span>
          </div>
          <div class="w-2 h-2 rotate-45 -mt-1 bg-pink-600 border-r border-b border-white"></div>
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
        setShowStoreListSheet(false);
        setActivePopupLandmark(null);
        setActivePopupVintageSpot(spot);
        map.flyTo([spot.coordinates.lat, spot.coordinates.lng], 16, {
          animate: true,
          duration: 1.0,
        });
      });

      vintageMarkersRef.current[spot.id] = marker;
    });
  }, [activeLayer, selectedCategoryFilter, activePopupVintageSpot]);

  // Fly to focusedVintageSpotId when triggered from Rodrigo's Letter, Quick Hub, or 3-Day Schedule
  useEffect(() => {
    if (!focusedVintageSpotId) return;
    const spot = VINTAGE_AND_SHOPPING_SPOTS.find((s) => s.id === focusedVintageSpotId);
    const map = mapInstanceRef.current;
    if (spot && map) {
      setActiveLayer('tiendas');
      setSelectedCategoryFilter('all');
      setShowStoreListSheet(false);
      setActivePopupLandmark(null);
      setActivePopupVintageSpot(spot);
      map.flyTo([spot.coordinates.lat, spot.coordinates.lng], 16, {
        animate: true,
        duration: 1.2,
      });
      if (onClearFocusedVintageSpot) {
        onClearFocusedVintageSpot();
      }
    }
  }, [focusedVintageSpotId, onClearFocusedVintageSpot]);

  // Fly smoothly to Selected Landmark when user explicitly selects a landmark
  useEffect(() => {
    if (isFirstLandmarkRenderRef.current) {
      isFirstLandmarkRenderRef.current = false;
      return;
    }
    const map = mapInstanceRef.current;
    if (!map) return;

    setActiveLayer('paseos_ba');
    if (!selectedLandmark.province.toLowerCase().includes('buenos aires')) {
      setShowAllArgentinaLandmarks(true);
    }
    setActivePopupVintageSpot(null);
    setActivePopupLandmark(selectedLandmark);

    const targetZoom = Math.min(16, Math.max(6, Math.round(selectedLandmark.camera.zoom - 1)));
    map.flyTo([selectedLandmark.coordinates.lat, selectedLandmark.coordinates.lng], targetZoom, {
      animate: true,
      duration: 1.3,
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
          <div class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white text-[11px] font-extrabold shadow-2xl border-2 border-white ring-2 ring-pink-500/50 whitespace-nowrap">
            <span>📍</span>
            <span>Estás acá, Amorcito 💕</span>
          </div>
          <div class="w-2 h-2 bg-purple-600 rotate-45 -mt-1 border-r border-b border-white"></div>
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

      map.flyTo([userLocation.lat, userLocation.lng], 15, {
        animate: true,
        duration: 1.1,
      });
    }
  }, [userLocation]);

  const handleSelectStoreFromSheet = (spot: VintageFashionSpot) => {
    stopAllVoicePlayback();
    setIsSpeakingSpotTip(false);
    setActiveLayer('tiendas');
    setShowStoreListSheet(false);
    setActivePopupLandmark(null);
    setActivePopupVintageSpot(spot);
    mapInstanceRef.current?.flyTo([spot.coordinates.lat, spot.coordinates.lng], 16, {
      animate: true,
      duration: 1.1,
    });
  };

  const handleCenterBuenosAires = () => {
    setActivePopupLandmark(null);
    setActivePopupVintageSpot(null);
    mapInstanceRef.current?.flyTo(BUENOS_AIRES_CENTER, BUENOS_AIRES_DEFAULT_ZOOM, {
      animate: true,
      duration: 1.0,
    });
  };

  const filteredSpots = VINTAGE_AND_SHOPPING_SPOTS.filter(
    (s) => selectedCategoryFilter === 'all' || s.category === selectedCategoryFilter
  );

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      {/* Leaflet Map Container (Default: Clean Street Map with Street Names) */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full z-0 ${is3DTiltEnabled ? 'map-3d-tilted' : 'map-3d-flat'}`}
      />

      {/* =====================================================================
          SINGLE CLEAN TOP FILTER BAR (No overlapping floating buttons!)
         ===================================================================== */}
      <div className="absolute top-2.5 inset-x-2.5 z-20 flex flex-col gap-1.5 pointer-events-none">
        {/* Primary Layer Selector Row: Pick ONLY 1 Layer at a time */}
        <div className="flex items-center justify-between gap-1.5 bg-slate-950/95 backdrop-blur-md border border-slate-800/90 rounded-2xl p-1.5 shadow-xl pointer-events-auto max-w-xl mx-auto w-full">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
            {/* Layer 1 (Default): Tiendas Ropa Usada, Zara & Chinos */}
            <button
              onClick={() => {
                setActiveLayer('tiendas');
                setActivePopupLandmark(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeLayer === 'tiendas'
                  ? 'bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>👗 Tiendas ({VINTAGE_AND_SHOPPING_SPOTS.length})</span>
            </button>

            {/* Layer 2: Paseos Turísticos en Buenos Aires */}
            <button
              onClick={() => {
                setActiveLayer('paseos_ba');
                setActivePopupVintageSpot(null);
                setShowStoreListSheet(false);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeLayer === 'paseos_ba'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>🏛️ Paseos BA</span>
            </button>

            {/* Layer 3: Solo Calles (0 pins, pure street names) */}
            <button
              onClick={() => {
                setActiveLayer('solo_calles');
                setActivePopupVintageSpot(null);
                setActivePopupLandmark(null);
                setShowStoreListSheet(false);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeLayer === 'solo_calles'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>🗺️ Solo Calles</span>
            </button>
          </div>

          {/* 1-Tap Street Names vs Satellite Switcher */}
          <button
            onClick={() => onChangeMapType(mapType === 'roadmap' ? 'hybrid' : 'roadmap')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-sky-300 shrink-0"
            title="Cambiar entre Mapa con Nombre de Calles y Vista Satélite"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>{mapType === 'roadmap' ? 'Calles' : 'Satélite'}</span>
          </button>
        </div>

        {/* Sub-Filter Row ONLY when 'tiendas' layer is active */}
        {activeLayer === 'tiendas' && (
          <div className="flex items-center justify-between gap-1.5 max-w-xl mx-auto w-full pointer-events-auto">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-xl p-1 shadow-lg flex-1">
              {[
                { id: 'all', label: '✨ Todas (10)' },
                { id: 'ropa_usada', label: '👗 Usada' },
                { id: 'zara_tendencia', label: '🖤 Zara / Outlets' },
                { id: 'moda_mayorista', label: '👠 Mayorista' },
                { id: 'mall_chino', label: '🏮 Chinos' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition-all ${
                    selectedCategoryFilter === cat.id
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Button to open the scrollable list of stores */}
            <button
              onClick={() => setShowStoreListSheet(!showStoreListSheet)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[11px] font-extrabold shadow-lg shrink-0 transition-all ${
                showStoreListSheet
                  ? 'bg-pink-600 border-pink-300 text-white'
                  : 'bg-slate-950/95 border-pink-500/50 text-pink-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Ver Lista</span>
            </button>
          </div>
        )}

        {/* Sub-Filter Row ONLY when 'paseos_ba' layer is active */}
        {activeLayer === 'paseos_ba' && (
          <div className="flex items-center justify-center gap-1.5 max-w-md mx-auto pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-lg">
            <button
              onClick={() => {
                setShowAllArgentinaLandmarks(false);
                handleCenterBuenosAires();
              }}
              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                !showAllArgentinaLandmarks
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              📍 Solo Buenos Aires (3 días)
            </button>
            <button
              onClick={() => {
                setShowAllArgentinaLandmarks(true);
                mapInstanceRef.current?.flyTo([-38.416, -63.616], 4, {
                  animate: true,
                  duration: 1.1,
                });
              }}
              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                showAllArgentinaLandmarks
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🇦🇷 Todo Argentina (12)
            </button>
          </div>
        )}
      </div>

      {/* =====================================================================
          CLEAN STORE DIRECTORY DRAWER (Only opens when she taps "Ver Lista")
         ===================================================================== */}
      {showStoreListSheet && (
        <div className="absolute inset-x-3 bottom-3 z-30 max-w-md mx-auto bg-slate-950/95 backdrop-blur-md border-2 border-pink-500/60 rounded-3xl shadow-2xl p-3.5 text-slate-100 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>👗</span>
                <span>Tiendas en Buenos Aires ({filteredSpots.length})</span>
              </h4>
              <p className="text-[11px] text-pink-300">
                Tocá una tienda para ver su calle exacta en el mapa
              </p>
            </div>
            <button
              onClick={() => setShowStoreListSheet(false)}
              className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {filteredSpots.map((spot) => (
              <button
                key={spot.id}
                onClick={() => handleSelectStoreFromSheet(spot)}
                className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 ${
                  activePopupVintageSpot?.id === spot.id
                    ? 'bg-pink-600/25 border-pink-400 text-white'
                    : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="text-lg shrink-0">{spot.emoji}</span>
                  <div className="min-w-0">
                    <h5 className="text-xs font-extrabold text-white truncate">
                      {spot.shortTitle}
                    </h5>
                    <p className="text-[11px] text-pink-300 truncate">
                      📍 {spot.neighborhood} — {spot.address}
                    </p>
                    <p className="text-[10px] text-emerald-300 font-semibold truncate">
                      {spot.approxClpNote}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-pink-600 text-white text-[10px] font-extrabold shrink-0 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Ver
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          SELECTED FASHION STORE CARD (When a Store Pin is Tapped)
         ===================================================================== */}
      {activePopupVintageSpot && !showStoreListSheet && (
        <div className="absolute bottom-3 inset-x-3 z-30 max-w-md mx-auto bg-slate-950/95 backdrop-blur-md border-2 border-pink-500/60 rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in duration-150">
          <div className="p-3.5 bg-gradient-to-r from-pink-600/30 via-rose-600/25 to-purple-600/30 border-b border-pink-500/30 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="text-2xl shrink-0">{activePopupVintageSpot.emoji}</span>
              <div className="min-w-0">
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/30 text-pink-200 border border-pink-400/40">
                  {activePopupVintageSpot.categoryLabel}
                </span>
                <h4 className="text-sm sm:text-base font-extrabold text-white leading-snug mt-0.5">
                  {activePopupVintageSpot.name}
                </h4>
                <p className="text-xs text-pink-200 font-bold">
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

          <div className="p-3.5 space-y-2.5 max-h-[44dvh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-900 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 font-bold block uppercase">
                  💵 Precios Aprox:
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
                  <Clock className="w-3 h-3" /> Horario:
                </span>
                <span className="text-xs font-semibold text-slate-200 block mt-0.5">
                  {activePopupVintageSpot.hours}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-pink-950/60 to-purple-950/60 border border-pink-400/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-pink-300">
                  💌 Tip de Rodrigo para vos:
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
                      <span>Escuchar</span>
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

      {/* =====================================================================
          SELECTED LANDMARK CARD (When a Paseo BA Pin is Tapped)
         ===================================================================== */}
      {activePopupLandmark && !activePopupVintageSpot && !showStoreListSheet && (
        <div className="absolute bottom-3 inset-x-3 z-30 max-w-md mx-auto bg-slate-950/95 backdrop-blur-md border border-sky-500/50 rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in duration-150">
          <div className="flex items-center gap-3 p-3.5 border-b border-slate-800">
            <img
              src={activePopupLandmark.imageUrl}
              alt={activePopupLandmark.name}
              loading="lazy"
              className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-700"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                {activePopupLandmark.province}
              </span>
              <h4 className="text-sm sm:text-base font-extrabold text-white truncate">
                {activePopupLandmark.name}
              </h4>
              <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
                {activePopupLandmark.description}
              </p>
            </div>
            <button
              onClick={() => setActivePopupLandmark(null)}
              className="p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white shrink-0 self-start"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3.5 py-2.5 bg-slate-900/90 flex items-center justify-between gap-2">
            {onOpenLandmarkDetails && (
              <button
                onClick={() => {
                  onOpenLandmarkDetails(activePopupLandmark);
                  setActivePopupLandmark(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Historia y Tips
              </button>
            )}
            <button
              onClick={() => {
                onOpen3DModal(activePopupLandmark);
                setActivePopupLandmark(null);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold text-xs shadow-md ml-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ver en 3D</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MINIMAL BOTTOM-RIGHT GPS & ZOOM CONTROLS (Never blocks the center map)
         ===================================================================== */}
      <div className="absolute bottom-4 right-3 z-20 flex flex-col items-end gap-2">
        {/* Compact GPS Button */}
        <button
          onClick={onRequestLocation}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-extrabold shadow-xl transition-all ${
            userLocation
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-white text-white ring-2 ring-pink-500/40'
              : 'bg-slate-950/95 hover:bg-slate-900 border-pink-500/50 text-pink-200'
          }`}
          title="Ver dónde estoy con el GPS de mi iPhone"
        >
          <Navigation className="w-3.5 h-3.5 text-pink-300" />
          <span>📍 Mi GPS</span>
        </button>

        {/* Compact Zoom + Center Buenos Aires */}
        <div className="flex flex-col bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2.5 text-slate-200 hover:text-white hover:bg-slate-800 border-b border-slate-800"
            title="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2.5 text-slate-200 hover:text-white hover:bg-slate-800 border-b border-slate-800"
            title="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleCenterBuenosAires}
            className="p-2.5 text-sky-400 hover:text-sky-300 hover:bg-slate-800"
            title="Centrar en Buenos Aires (CABA)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
