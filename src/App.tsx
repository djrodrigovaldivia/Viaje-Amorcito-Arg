import React, { useState, useEffect } from 'react';
import { LANDMARKS, Landmark } from './data/landmarks';
import { GoogleMapView } from './components/GoogleMapView';
import { TourControls } from './components/TourControls';
import { LandmarkSidebar } from './components/LandmarkSidebar';
import { LandmarkDetailModal } from './components/LandmarkDetailModal';
import { TriviaModal } from './components/TriviaModal';
import { DistanceCalculator } from './components/DistanceCalculator';
import { ThreeLandmarkModel } from './components/ThreeLandmarkModel';
import {
  Compass,
  Sparkles,
  HelpCircle,
  Route,
  Layers,
  Info,
  Clock,
  MapPin,
  ExternalLink,
  X,
} from 'lucide-react';

export default function App() {
  const [landmarks] = useState<Landmark[]>(LANDMARKS);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark>(LANDMARKS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mapType, setMapType] = useState<'hybrid' | 'roadmap' | 'satellite' | 'terrain'>('hybrid');
  const [is3DTiltEnabled, setIs3DTiltEnabled] = useState(true);

  // Modals state
  const [activeDetailLandmark, setActiveDetailLandmark] = useState<Landmark | null>(null);
  const [active3DModelLandmark, setActive3DModelLandmark] = useState<Landmark | null>(null);
  const [isTriviaOpen, setIsTriviaOpen] = useState(false);
  const [isDistanceOpen, setIsDistanceOpen] = useState(false);

  // Quota exceeded state (Tier 2 Client-Side Quota Defense)
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Google Maps API Key from environment variable
  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    (typeof window !== 'undefined' && (window as unknown as { GOOGLE_MAPS_API_KEY?: string }).GOOGLE_MAPS_API_KEY) ||
    '';

  // Listen to gmp-quota-exceeded custom event
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };

    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Time in Argentina (GMT-3) clock display
  const [argTime, setArgTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setArgTime(
        now.toLocaleTimeString('es-AR', {
          timeZone: 'America/Argentina/Buenos_Aires',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Client-Side Quota Defense Banner (Case A from Google Maps Platform guidelines) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Main Top Navbar */}
      <header className="h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-40">
        {/* Brand & Argentine Flag Emblem */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-sky-400 via-white to-sky-400 flex items-center justify-center shadow-md ring-2 ring-sky-400/40">
              <span className="text-amber-500 text-xs font-bold leading-none">☀️</span>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>Argentina 3D</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-semibold">
                  Tour Interactivo
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Monumentos y Maravillas Naturales en Perspectiva 3D
              </p>
            </div>
          </div>
        </div>

        {/* Top Right Quick Badges & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Argentina Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Hora Argentina: {argTime || '12:00'} (GMT-3)</span>
          </div>

          {/* Quick Buttons */}
          <button
            onClick={() => setActive3DModelLandmark(selectedLandmark)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Gemelo 3D</span>
          </button>

          <button
            onClick={() => setIsDistanceOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Route className="w-3.5 h-3.5 text-emerald-400" />
            <span>Distancias</span>
          </button>

          <button
            onClick={() => setIsTriviaOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-semibold transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Desafío</span>
          </button>
        </div>
      </header>

      {/* Main Interactive Map & 3D Stage Area */}
      <main className="relative flex-1 w-full overflow-hidden">
        {/* Google Maps 3D View */}
        <GoogleMapView
          apiKey={apiKey}
          landmarks={landmarks}
          selectedLandmark={selectedLandmark}
          onSelectLandmark={setSelectedLandmark}
          onOpen3DModal={setActive3DModelLandmark}
          mapType={mapType}
          onChangeMapType={setMapType}
          is3DTiltEnabled={is3DTiltEnabled}
          onToggle3DTilt={() => setIs3DTiltEnabled(!is3DTiltEnabled)}
        />

        {/* Collapsible Left Explorer Sidebar */}
        <LandmarkSidebar
          landmarks={landmarks}
          selectedLandmark={selectedLandmark}
          onSelectLandmark={setSelectedLandmark}
          onOpenDetails={setActiveDetailLandmark}
          onOpen3DModal={setActive3DModelLandmark}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </main>

      {/* Bottom Tour Player & Spanish Audioguide Controller */}
      <TourControls
        landmarks={landmarks}
        selectedLandmark={selectedLandmark}
        onSelectLandmark={setSelectedLandmark}
        onOpenDetails={setActiveDetailLandmark}
        onOpenTrivia={() => setIsTriviaOpen(true)}
        onOpenDistance={() => setIsDistanceOpen(true)}
        onOpen3DModel={setActive3DModelLandmark}
      />

      {/* Cultural Information Detail Modal */}
      <LandmarkDetailModal
        landmark={activeDetailLandmark}
        onClose={() => setActiveDetailLandmark(null)}
        onFlyTo={setSelectedLandmark}
      />

      {/* Standalone 3D Digital Twin Modal */}
      {active3DModelLandmark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Gemelo Digital 3D: {active3DModelLandmark.name}
                  </h3>
                  <p className="text-xs text-sky-400">
                    {active3DModelLandmark.province} • {active3DModelLandmark.elevation.toLocaleString()} msnm
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedLandmark(active3DModelLandmark);
                    setActive3DModelLandmark(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Ver en Mapa Satelital</span>
                </button>

                <button
                  onClick={() => setActive3DModelLandmark(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 3D Canvas Body */}
            <div className="flex-1 w-full p-4 overflow-hidden bg-slate-950">
              <ThreeLandmarkModel landmark={active3DModelLandmark} height="100%" />
            </div>
          </div>
        </div>
      )}

      {/* Trivia Game Modal */}
      <TriviaModal
        landmarks={landmarks}
        isOpen={isTriviaOpen}
        onClose={() => setIsTriviaOpen(false)}
        onFlyToLandmark={setSelectedLandmark}
      />

      {/* Distance Calculator Modal */}
      <DistanceCalculator
        landmarks={landmarks}
        isOpen={isDistanceOpen}
        onClose={() => setIsDistanceOpen(false)}
        onFlyTo={setSelectedLandmark}
      />
    </div>
  );
}
