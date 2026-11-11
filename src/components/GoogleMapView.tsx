import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { Landmark } from '../data/landmarks';
import {
  Compass,
  Sparkles,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Heart,
  MapPin,
  X,
  CheckCircle2,
  Eye,
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
  onOpenApiKeyConfig?: () => void;
}

// Tile URLs (100% Free, No API Key Required, High Resolution)
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
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const flightLineRef = useRef<L.Polyline | null>(null);
  const flightGlowRef = useRef<L.Polyline | null>(null);

  const [activePopupLandmark, setActivePopupLandmark] = useState<Landmark | null>(null);

  // Initialize Leaflet Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [selectedLandmark.coordinates.lat, selectedLandmark.coordinates.lng],
      zoom: Math.min(16, Math.max(5, Math.round(selectedLandmark.camera.zoom - 1))),
      zoomControl: false,
      attributionControl: true,
      minZoom: 3,
      maxZoom: 18,
    });

    mapInstanceRef.current = map;

    // Draw Geodesic / Tour Flight Polyline connecting all 12 landmarks
    const routeCoords: L.LatLngExpression[] = landmarks.map((l) => [
      l.coordinates.lat,
      l.coordinates.lng,
    ]);
    if (landmarks.length > 1) {
      routeCoords.push([landmarks[0].coordinates.lat, landmarks[0].coordinates.lng]);
    }

    // Outer subtle cyan glow line
    const glowLine = L.polyline(routeCoords, {
      color: '#0ea5e9',
      weight: 6,
      opacity: 0.25,
      lineCap: 'round',
    }).addTo(map);

    // Inner dashed tour route line
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
        maxZoom: 18,
      }).addTo(map);
      const labels = L.tileLayer(TILE_LAYERS.labelsOverlay.url, {
        maxZoom: 18,
        opacity: 0.9,
      }).addTo(map);
      baseTileLayerRef.current = sat;
      labelsTileLayerRef.current = labels;
    } else if (mapType === 'satellite') {
      const sat = L.tileLayer(TILE_LAYERS.satellite.url, {
        attribution: TILE_LAYERS.satellite.attribution,
        maxZoom: 18,
      }).addTo(map);
      baseTileLayerRef.current = sat;
    } else if (mapType === 'terrain') {
      const topo = L.tileLayer(TILE_LAYERS.terrain.url, {
        attribution: TILE_LAYERS.terrain.attribution,
        maxZoom: 18,
      }).addTo(map);
      baseTileLayerRef.current = topo;
    } else {
      const road = L.tileLayer(TILE_LAYERS.roadmap.url, {
        attribution: TILE_LAYERS.roadmap.attribution,
        maxZoom: 18,
      }).addTo(map);
      baseTileLayerRef.current = road;
    }
  }, [mapType]);

  // Render & Update Landmark Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    landmarks.forEach((landmark) => {
      const isSelected = landmark.id === selectedLandmark.id;
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
        onSelectLandmark(landmark);
        setActivePopupLandmark(landmark);
      });

      markersRef.current[landmark.id] = marker;
    });
  }, [landmarks, selectedLandmark, onSelectLandmark]);

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

  // Render & Fly to User GPS Location (María Ignacia)
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
          <div class="absolute -inset-3 rounded-full bg-pink-500/40 animate-ping pointer-events-none"></div>
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold shadow-2xl border-2 border-white ring-4 ring-pink-500/40 whitespace-nowrap">
            <span>❤️</span>
            <span>María Ignacia está acá 💕</span>
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
        duration: 1.5,
      });
    }
  }, [userLocation]);

  // Map Zoom & Reset Helpers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetArgentinaView = () => {
    mapInstanceRef.current?.flyTo([-38.416097, -63.616672], 4, {
      animate: true,
      duration: 1.4,
    });
    setActivePopupLandmark(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950 map-3d-perspective-wrapper">
      {/* Atmospheric Horizon Sky Glow when 3D Perspective Tilt is Active */}
      {is3DTiltEnabled && (
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-slate-950 via-sky-950/40 to-transparent z-10 pointer-events-none" />
      )}

      {/* Leaflet Map Container with optional 3D Orbital Tilt */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full z-0 ${is3DTiltEnabled ? 'map-3d-tilted' : 'map-3d-flat'}`}
      />

      {/* Interactive Selected Landmark Floating Card (When Marker Clicked) */}
      {activePopupLandmark && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-sky-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="relative h-36 w-full overflow-hidden">
            <img
              src={activePopupLandmark.imageUrl}
              alt={activePopupLandmark.name}
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
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
        {/* Live GPS Location Button for Maria Ignacia */}
        <button
          onClick={onRequestLocation}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl backdrop-blur-md border text-xs font-bold shadow-2xl transition-all ${
            userLocation
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-white/60 text-white ring-2 ring-pink-500/40'
              : 'bg-slate-900/90 hover:bg-slate-800 border-pink-500/40 text-pink-200'
          }`}
          title="Ver dónde estoy parada con el GPS de mi celular"
        >
          <Navigation className="w-3.5 h-3.5 text-pink-300" />
          <span>📍 ¿Dónde estoy? (GPS)</span>
        </button>

        {/* 3D Perspective Tilt Button */}
        <button
          onClick={onToggle3DTilt}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl backdrop-blur-md border text-xs font-semibold shadow-2xl transition-all ${
            is3DTiltEnabled
              ? 'bg-sky-500/25 border-sky-400 text-sky-300 ring-2 ring-sky-500/30'
              : 'bg-slate-900/85 border-slate-700/80 text-slate-300 hover:text-white'
          }`}
          title="Alternar vista oblicua 3D / vista cenital plana"
        >
          <Compass
            className={`w-4 h-4 ${is3DTiltEnabled ? 'text-sky-400 animate-spin' : ''}`}
            style={{ animationDuration: '8s' }}
          />
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
          <span className="font-semibold text-white">Satélite HD Libre (Sin Claves)</span>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <span className="text-slate-400">12 Monumentos y Maravillas</span>
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
