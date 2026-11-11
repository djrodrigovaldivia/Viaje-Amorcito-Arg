import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { Landmark } from '../data/landmarks';
import { Compass, Layers, Sparkles, Navigation, Mountain, CheckCircle2 } from 'lucide-react';

interface GoogleMapViewProps {
  apiKey: string;
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
}

// Subcomponent to smoothly animate camera to selected landmark
const MapCameraUpdater: React.FC<{
  selectedLandmark: Landmark;
  is3DTiltEnabled: boolean;
}> = ({ selectedLandmark, is3DTiltEnabled }) => {
  const map = useMap();
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map) return;
    if (prevIdRef.current === selectedLandmark.id) return;
    prevIdRef.current = selectedLandmark.id;

    // Smoothly fly camera to new landmark coordinates
    const target = {
      lat: selectedLandmark.coordinates.lat,
      lng: selectedLandmark.coordinates.lng,
    };

    map.panTo(target);

    // After slight delay, adjust zoom, heading and tilt
    const timer = setTimeout(() => {
      map.setZoom(selectedLandmark.camera.zoom);
      if (is3DTiltEnabled) {
        map.setTilt(selectedLandmark.camera.tilt);
        map.setHeading(selectedLandmark.camera.heading);
      } else {
        map.setTilt(0);
        map.setHeading(0);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [map, selectedLandmark, is3DTiltEnabled]);

  // Adjust tilt dynamically when user toggles 3D perspective
  useEffect(() => {
    if (!map) return;
    if (is3DTiltEnabled) {
      map.setTilt(selectedLandmark.camera.tilt);
      map.setHeading(selectedLandmark.camera.heading);
    } else {
      map.setTilt(0);
      map.setHeading(0);
    }
  }, [map, is3DTiltEnabled, selectedLandmark]);

  return null;
};

// Subcomponent to draw geodesic flight tour polyline
const TourFlightPath: React.FC<{
  landmarks: Landmark[];
}> = ({ landmarks }) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const path = landmarks.map((l) => ({
      lat: l.coordinates.lat,
      lng: l.coordinates.lng,
    }));

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#38bdf8',
      strokeOpacity: 0.65,
      strokeWeight: 3,
      icons: [
        {
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 2.5,
            strokeColor: '#0284c7',
            fillColor: '#7dd3fc',
            fillOpacity: 0.9,
          },
          offset: '50%',
          repeat: '120px',
        },
      ],
    });

    polyline.setMap(map);
    polylineRef.current = polyline;

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, landmarks]);

  return null;
};

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  apiKey,
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
  const [hoveredLandmark, setHoveredLandmark] = useState<Landmark | null>(null);
  const [infoWindowLandmark, setInfoWindowLandmark] = useState<Landmark | null>(null);

  const handleMarkerClick = useCallback(
    (landmark: Landmark) => {
      onSelectLandmark(landmark);
      setInfoWindowLandmark(landmark);
    },
    [onSelectLandmark]
  );

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <APIProvider
        apiKey={apiKey}
        language="es"
        region="AR"
      >
        <Map
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          mapId="DEMO_MAP_ID"
          defaultCenter={{ lat: -38.416097, lng: -63.616672 }} // Centro de Argentina
          defaultZoom={4.8}
          defaultHeading={0}
          defaultTilt={0}
          mapTypeId={mapType}
          gestureHandling="greedy"
          disableDefaultUI={true}
          style={{ width: '100%', height: '100%' }}
        >
          <MapCameraUpdater
            selectedLandmark={selectedLandmark}
            is3DTiltEnabled={is3DTiltEnabled}
          />
          <TourFlightPath landmarks={landmarks} />

          {/* Interactive Advanced Markers for each Argentine Landmark */}
          {landmarks.map((landmark) => {
            const isSelected = landmark.id === selectedLandmark.id;
            const isHovered = hoveredLandmark?.id === landmark.id;

            return (
              <AdvancedMarker
                key={landmark.id}
                position={landmark.coordinates}
                title={landmark.name}
                zIndex={isSelected ? 100 : isHovered ? 80 : 50}
                onClick={() => handleMarkerClick(landmark)}
              >
                <div
                  className="group relative flex flex-col items-center cursor-pointer transition-transform duration-300"
                  onMouseEnter={() => setHoveredLandmark(landmark)}
                  onMouseLeave={() => setHoveredLandmark(null)}
                >
                  {/* Outer Pulsing Aura when active */}
                  {isSelected && (
                    <div className="absolute -inset-3 rounded-full bg-sky-400/30 animate-pulse-ring pointer-events-none" />
                  )}

                  {/* Marker Pin Bubble */}
                  <div
                    className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shadow-2xl transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 border-white text-white scale-110 ring-4 ring-sky-400/40'
                        : isHovered
                        ? 'bg-slate-900/95 border-sky-400 text-sky-200 scale-105'
                        : 'bg-slate-950/90 border-slate-700/80 text-slate-200 hover:border-sky-400'
                    }`}
                  >
                    {/* Sol de Mayo Accent */}
                    <span className="text-amber-400 text-xs">☀️</span>
                    
                    <span className="text-xs font-semibold whitespace-nowrap tracking-tight">
                      {landmark.shortTitle}
                    </span>

                    {/* Small elevation tag */}
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-sky-300 border border-slate-700 font-mono">
                      {landmark.elevation >= 1000 ? `${(landmark.elevation / 1000).toFixed(1)}k m` : `${landmark.elevation} m`}
                    </span>
                  </div>

                  {/* Pin Pointer Arrow */}
                  <div
                    className={`w-2.5 h-2.5 rotate-45 -mt-1 border-r border-b ${
                      isSelected
                        ? 'bg-indigo-600 border-white'
                        : isHovered
                        ? 'bg-slate-900 border-sky-400'
                        : 'bg-slate-950 border-slate-700'
                    }`}
                  />
                </div>
              </AdvancedMarker>
            );
          })}

          {/* InfoWindow for selected / clicked landmark */}
          {infoWindowLandmark && (
            <InfoWindow
              position={infoWindowLandmark.coordinates}
              onCloseClick={() => setInfoWindowLandmark(null)}
              headerContent={
                <div className="flex items-center gap-1.5 font-bold text-sky-700 text-sm">
                  <span>🇦🇷</span>
                  <span>{infoWindowLandmark.shortTitle}</span>
                </div>
              }
            >
              <div className="max-w-xs p-1 text-slate-800 text-xs space-y-2">
                <div className="relative rounded-lg overflow-hidden h-28 w-full shadow-inner">
                  <img
                    src={infoWindowLandmark.imageUrl}
                    alt={infoWindowLandmark.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-1 right-1 bg-slate-900/80 backdrop-blur-xs text-[10px] text-amber-300 font-medium px-2 py-0.5 rounded-full">
                    {infoWindowLandmark.badge}
                  </div>
                </div>
                
                <p className="line-clamp-2 text-slate-600 leading-snug">
                  {infoWindowLandmark.description}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">
                    📍 {infoWindowLandmark.province}
                  </span>
                  <button
                    onClick={() => onOpen3DModal(infoWindowLandmark)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-medium text-[11px] shadow-sm transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Gemelo 3D</span>
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
          {/* Marker for María Ignacia's current GPS location */}
          {userLocation && (
            <AdvancedMarker
              position={{ lat: userLocation.lat, lng: userLocation.lng }}
              title="Estás acá, María Ignacia 💕"
              zIndex={200}
            >
              <div className="relative flex flex-col items-center">
                <div className="absolute -inset-4 rounded-full bg-pink-500/30 animate-ping pointer-events-none" />
                <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs shadow-2xl border-2 border-white ring-4 ring-pink-500/30">
                  <span>📍</span>
                  <span>María Ignacia 💕</span>
                </div>
                <div className="w-2.5 h-2.5 rotate-45 -mt-1 bg-rose-600 border-r-2 border-b-2 border-white" />
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>

      {/* Floating Map Controls HUD (Top Right) */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20 pointer-events-auto">
        {/* GPS Location Button for María Ignacia */}
        <button
          onClick={onRequestLocation}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-md border shadow-xl transition-all ${
            userLocation
              ? 'bg-pink-500/25 border-pink-400 text-pink-200 ring-2 ring-pink-400/30'
              : 'bg-slate-900/85 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Detectar y centrar mi ubicación GPS en Argentina"
        >
          <Navigation className={`w-4 h-4 ${userLocation ? 'text-pink-400 fill-current' : 'text-slate-400'}`} />
          <span>{userLocation ? '📍 Mi Ubicación Activa' : '📍 ¿Dónde estoy? (GPS)'}</span>
        </button>

        {/* 3D Perspective Toggle Button */}
        <button
          onClick={onToggle3DTilt}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-md border shadow-xl transition-all ${
            is3DTiltEnabled
              ? 'bg-sky-500/30 border-sky-400 text-sky-200 ring-2 ring-sky-400/30'
              : 'bg-slate-900/85 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Alternar inclinación y perspectiva 3D"
        >
          <Compass className={`w-4 h-4 ${is3DTiltEnabled ? 'text-sky-400 animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          <span>{is3DTiltEnabled ? 'Modo 3D Activo' : 'Activar Perspectiva 3D'}</span>
        </button>

        {/* Map Type Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-xl">
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
            Satélite
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
        </div>
      </div>

      {/* Map Legend / Badge HUD (Bottom Left) */}
      <div className="absolute bottom-6 left-6 hidden md:flex items-center gap-3 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2.5 shadow-2xl text-xs text-slate-300 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
          <span className="font-semibold text-white">Ruta Turística Argentina</span>
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
