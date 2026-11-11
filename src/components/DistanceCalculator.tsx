import React, { useState } from 'react';
import { Landmark } from '../data/landmarks';
import { X, Route, Plane, Car, Mountain, ArrowRight, Compass } from 'lucide-react';

interface DistanceCalculatorProps {
  landmarks: Landmark[];
  isOpen: boolean;
  onClose: () => void;
  onFlyTo: (landmark: Landmark) => void;
}

// Haversine formula for distance between 2 coordinates in km
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const DistanceCalculator: React.FC<DistanceCalculatorProps> = ({
  landmarks,
  isOpen,
  onClose,
  onFlyTo,
}) => {
  const [originId, setOriginId] = useState<string>(landmarks[0]?.id || 'obelisco');
  const [destId, setDestId] = useState<string>(landmarks[1]?.id || 'iguazu');

  if (!isOpen) return null;

  const origin = landmarks.find((l) => l.id === originId) || landmarks[0];
  const dest = landmarks.find((l) => l.id === destId) || landmarks[1];

  const flightDistKm = calculateHaversineDistance(
    origin.coordinates.lat,
    origin.coordinates.lng,
    dest.coordinates.lat,
    dest.coordinates.lng
  );

  // Approximate road travel (typically ~1.25 to 1.35x geodesic due to topography and andean passes)
  const approxRoadKm = Math.round(flightDistKm * 1.3);

  // Flight time (~700 km/h + 30 min takeoff/landing)
  const flightHours = (flightDistKm / 700 + 0.5).toFixed(1);

  // Driving time (~85 km/h average)
  const driveHours = Math.round(approxRoadKm / 85);

  // Elevation difference
  const elevDiff = dest.elevation - origin.elevation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧭</span>
            <div>
              <h3 className="text-base font-bold text-white">
                Calculadora de Rutas & Distancias en Argentina
              </h3>
              <p className="text-xs text-slate-400">
                Conexiones aéreas y terrestres a través de la República
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Selectors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1.5">
                Punto de Origen:
              </label>
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-hidden focus:border-sky-400"
              >
                {landmarks.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.shortTitle} ({l.province})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                Punto de Destino:
              </label>
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-hidden focus:border-sky-400"
              >
                {landmarks.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.shortTitle} ({l.province})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Route Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <span className="font-semibold text-white">{origin.shortTitle}</span>
            <ArrowRight className="w-4 h-4 text-sky-400 mx-2 shrink-0" />
            <span className="font-semibold text-white">{dest.shortTitle}</span>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col">
              <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                <Plane className="w-3.5 h-3.5 text-sky-400" />
                Vuelo Directo
              </span>
              <span className="text-xl font-extrabold text-sky-400 mt-1">
                {flightDistKm.toLocaleString()} km
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                ~{flightHours} h de vuelo
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col">
              <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-emerald-400" />
                Ruta Terrestre
              </span>
              <span className="text-xl font-extrabold text-emerald-400 mt-1">
                {approxRoadKm.toLocaleString()} km
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                ~{driveHours} h conduciendo
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col">
              <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                <Mountain className="w-3.5 h-3.5 text-amber-400" />
                Desnivel
              </span>
              <span className="text-xl font-extrabold text-amber-300 mt-1">
                {elevDiff > 0 ? `+${elevDiff}` : elevDiff} m
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                {origin.elevation}m → {dest.elevation}m
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-800/40 text-xs text-sky-200">
            💡 <strong>Ruta 40 & Conectividad:</strong> Argentina abarca más de 2,7 millones de km² continentales. La legendaria Ruta Nacional 40 bordea la Cordillera de los Andes a lo largo de 5.194 km uniendo 11 provincias desde Cabo Vírgenes hasta La Quiaca.
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                onFlyTo(dest);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              Volar a {dest.shortTitle} en el Mapa 3D →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
