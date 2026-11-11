import React, { useState, useEffect } from 'react';
import { LANDMARKS, Landmark } from './data/landmarks';
import { DEFAULT_MARIA_SCHEDULE } from './data/defaultSchedule';
import { DaySchedule } from './types/schedule';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePWAInstall } from './hooks/usePWAInstall';
import { GoogleMapView } from './components/GoogleMapView';
import { TourControls } from './components/TourControls';
import { LandmarkSidebar } from './components/LandmarkSidebar';
import { LandmarkDetailModal } from './components/LandmarkDetailModal';
import { TriviaModal } from './components/TriviaModal';
import { DistanceCalculator } from './components/DistanceCalculator';
import { ThreeLandmarkModel } from './components/ThreeLandmarkModel';
import { MariaScheduleModal } from './components/MariaScheduleModal';
import { MariaAIAssistantModal } from './components/MariaAIAssistantModal';
import { UserHelpModal } from './components/UserHelpModal';
import { IntroWelcomeModal } from './components/IntroWelcomeModal';
import { TravelDiaryModal } from './components/TravelDiaryModal';
import { WeatherModal } from './components/WeatherModal';
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
  Calendar,
  Heart,
  Wifi,
  WifiOff,
  Download,
  Smartphone,
  Camera,
  CloudSun,
  BookOpen,
} from 'lucide-react';

export default function App() {
  const [landmarks] = useState<Landmark[]>(LANDMARKS);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark>(LANDMARKS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mapType, setMapType] = useState<'hybrid' | 'roadmap' | 'satellite' | 'terrain'>('hybrid');
  const [is3DTiltEnabled, setIs3DTiltEnabled] = useState(true);

  // Online / Offline Status
  const isOnline = useOnlineStatus();

  // PWA Install Prompt Hook
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);

  // Maria Ignacia's Schedule with local storage persistence
  const [schedule, setSchedule] = useState<DaySchedule[]>(() => {
    try {
      const saved = localStorage.getItem('maria_ignacia_argentina_schedule');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_MARIA_SCHEDULE;
  });

  const handleUpdateSchedule = (newSchedule: DaySchedule[]) => {
    setSchedule(newSchedule);
    try {
      localStorage.setItem('maria_ignacia_argentina_schedule', JSON.stringify(newSchedule));
    } catch (_) {}
  };

  // User Geolocation State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [locationToast, setLocationToast] = useState<string | null>(null);

  const handleRequestLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('La geolocalización no está disponible en este navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setLocationToast('¡Ubicación detectada! Estás acá, María Ignacia 💕');
        setTimeout(() => setLocationToast(null), 4000);
      },
      (err) => {
        console.warn('Geolocation prompt error or denied:', err);
        // Fallback to Buenos Aires Obelisk coordinates for demonstration
        const fallback = { lat: -34.6037, lng: -58.3816 };
        setUserLocation(fallback);
        setLocationToast('📍 Ubicada en Buenos Aires (modo estimado)');
        setTimeout(() => setLocationToast(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Modals state
  const [activeDetailLandmark, setActiveDetailLandmark] = useState<Landmark | null>(null);
  const [active3DModelLandmark, setActive3DModelLandmark] = useState<Landmark | null>(null);
  const [isTriviaOpen, setIsTriviaOpen] = useState(false);
  const [isDistanceOpen, setIsDistanceOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [diarySelectedDayNumber, setDiarySelectedDayNumber] = useState<number | undefined>(undefined);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);

  // Check if Maria Ignacia is visiting for the first time to welcome her
  useEffect(() => {
    try {
      const sawIntro = localStorage.getItem('maria_saw_intro_welcome_v1');
      if (!sawIntro) {
        setIsIntroOpen(true);
        localStorage.setItem('maria_saw_intro_welcome_v1', 'true');
      }
    } catch (_) {}
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

  const handleFlyToLandmarkId = (landmarkId: string) => {
    const target = landmarks.find((l) => l.id === landmarkId);
    if (target) {
      setSelectedLandmark(target);
    }
  };

  return (
    <div className="relative w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">

      {/* Main Top Navbar */}
      <header className="h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between shrink-0 z-40">
        {/* Brand & Argentine Flag Emblem */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-sky-400 via-white to-sky-400 flex items-center justify-center shadow-md ring-2 ring-sky-400/40 shrink-0">
              <span className="text-amber-500 text-xs font-bold leading-none">☀️</span>
            </div>
            <div>
              <h1 className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>Argentina 3D</span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30 text-[9px] sm:text-[10px] font-semibold flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 fill-current text-pink-400" />
                  <span>Para María Ignacia</span>
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Top Navbar Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          {/* Connectivity Status Tag */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}
            title={isOnline ? 'Conectada a Wi-Fi' : 'Modo Offline: datos guardados en tu teléfono'}
          >
            {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
            <span>{isOnline ? 'Wi-Fi Activo' : 'Modo Offline'}</span>
          </div>

          {/* Clock */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">
            <Clock className="w-3 h-3 text-sky-400" />
            <span>{argTime || '12:00'} (GMT-3)</span>
          </div>

          {/* Audio & Welcome Tour Button specifically requested by Maria Ignacia */}
          <button
            onClick={() => setIsIntroOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/25 to-rose-500/25 hover:from-pink-500/35 hover:to-rose-500/35 border border-pink-400/50 text-pink-200 font-bold transition-all shadow-md ring-2 ring-pink-500/20"
            title="Escuchar el audio introductorio de Rodrigo y ver cómo funciona la app"
          >
            <Heart className="w-3.5 h-3.5 fill-current text-pink-400" />
            <span className="text-xs">Audio Introductorio</span>
          </button>

          {/* Help Button specifically for Maria Ignacia */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold transition-all shadow-sm"
            title="¿Cómo usar la aplicación? Ayuda guiada para María Ignacia"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs">Ayuda</span>
          </button>

          {/* Travel Diary Button */}
          <button
            onClick={() => {
              setDiarySelectedDayNumber(undefined);
              setIsDiaryOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-300 font-bold transition-all shadow-sm"
            title="Abrir tu Diario de Viaje (fotos y notas offline)"
          >
            <Camera className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Diario</span>
          </button>

          {/* Weather & Packing Button */}
          <button
            onClick={() => setIsWeatherOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 font-bold transition-all shadow-sm"
            title="Consultar clima actual y qué empacar"
          >
            <CloudSun className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Clima</span>
          </button>

          {/* My Itinerary Button */}
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold transition-all shadow-sm"
            title="Ver y editar tu itinerario de días en Argentina"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden md:inline">Itinerario</span>
          </button>

          {/* AI Guide Button */}
          <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold transition-all shadow-md shadow-sky-500/20"
            title="Abrir tu asistente inteligente de viaje"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Guía IA</span>
          </button>

          {/* In-App PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 text-xs font-semibold transition-colors"
              title="Instalar como app en la pantalla de inicio"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          )}

          {/* iOS Safari Guide Button */}
          {isIOS && !isInstalled && (
            <button
              onClick={() => setShowIOSInstallGuide(true)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar en iPhone</span>
            </button>
          )}
        </div>
      </header>

      {/* Floating GPS Location Notification Toast */}
      {locationToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white text-xs font-bold shadow-2xl border border-white/30 animate-in fade-in slide-in-from-top-4">
          <Heart className="w-4 h-4 fill-current text-white animate-pulse" />
          <span>{locationToast}</span>
        </div>
      )}

      {/* Main Interactive Map & 3D Stage Area */}
      <main className="relative flex-1 w-full overflow-hidden">
        {/* Floating Intro Audio banner prompt for Maria Ignacia */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <button
            onClick={() => setIsIntroOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-pink-500/40 text-pink-200 text-xs font-semibold shadow-2xl transition-all group ring-2 ring-pink-500/20"
          >
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
            <span>🎙️ María Ignacia: Rodrigo te dejó un audio y guía acá</span>
            <span className="text-pink-400 font-bold group-hover:translate-x-0.5 transition-transform">▶️</span>
          </button>
        </div>

        {/* High-Resolution Free Satellite Map View */}
        <GoogleMapView
          landmarks={landmarks}
          selectedLandmark={selectedLandmark}
          onSelectLandmark={setSelectedLandmark}
          onOpen3DModal={setActive3DModelLandmark}
          mapType={mapType}
          onChangeMapType={setMapType}
          is3DTiltEnabled={is3DTiltEnabled}
          onToggle3DTilt={() => setIs3DTiltEnabled(!is3DTiltEnabled)}
          userLocation={userLocation}
          onRequestLocation={handleRequestLocation}
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
        onOpenSchedule={() => setIsScheduleOpen(true)}
        onOpenDiary={() => {
          setDiarySelectedDayNumber(undefined);
          setIsDiaryOpen(true);
        }}
        onOpenWeather={() => setIsWeatherOpen(true)}
        onOpenAI={() => setIsAIAssistantOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Maria Ignacia's Schedule Modal */}
      <MariaScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        schedule={schedule}
        onUpdateSchedule={handleUpdateSchedule}
        onFlyToLandmarkId={handleFlyToLandmarkId}
        onAskAIAboutSchedule={() => {
          setIsScheduleOpen(false);
          setIsAIAssistantOpen(true);
        }}
        onOpenWeatherModal={() => setIsWeatherOpen(true)}
        onOpenDiaryForDay={(dayNum) => {
          setDiarySelectedDayNumber(dayNum);
          setIsDiaryOpen(true);
        }}
        isOnline={isOnline}
      />

      {/* Maria Ignacia's Travel Diary Modal (Camera & Offline Photos) */}
      <TravelDiaryModal
        isOpen={isDiaryOpen}
        onClose={() => setIsDiaryOpen(false)}
        schedule={schedule}
        userLocation={userLocation}
        onRequestUserLocation={handleRequestLocation}
        selectedDayNumber={diarySelectedDayNumber}
      />

      {/* Weather & Packing Modal */}
      <WeatherModal
        isOpen={isWeatherOpen}
        onClose={() => setIsWeatherOpen(false)}
        schedule={schedule}
        userLocation={userLocation}
        onRequestUserLocation={handleRequestLocation}
        isOnline={isOnline}
      />

      {/* Maria Ignacia's AI Travel Assistant Modal */}
      <MariaAIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        itinerary={schedule}
        userLocation={userLocation}
        onRequestUserLocation={handleRequestLocation}
        isOnline={isOnline}
        onOpenHelp={() => {
          setIsAIAssistantOpen(false);
          setIsHelpOpen(true);
        }}
      />

      {/* Guided Help Modal for Maria Ignacia */}
      <UserHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onOpenSchedule={() => setIsScheduleOpen(true)}
        onOpenAI={() => setIsAIAssistantOpen(true)}
        onOpenDiary={() => setIsDiaryOpen(true)}
        onOpenWeather={() => setIsWeatherOpen(true)}
      />

      {/* Romantic Introductory Audio & Guided Tour Modal requested by Maria Ignacia */}
      <IntroWelcomeModal
        isOpen={isIntroOpen}
        onClose={() => setIsIntroOpen(false)}
        onOpenSchedule={() => setIsScheduleOpen(true)}
        onOpenAI={() => setIsAIAssistantOpen(true)}
        onRequestLocation={handleRequestLocation}
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

      {/* iOS Safari Installation Guide Modal */}
      {showIOSInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sky-400" />
                <span>Instalar en tu iPhone</span>
              </h3>
              <button
                onClick={() => setShowIOSInstallGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Para tener esta app guardada en tu teléfono y abrirla sin internet:
              <br /><br />
              1. En Safari, toca el botón <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba en la barra inferior).<br />
              2. Desplázate hacia abajo y selecciona <strong>"Agregar a pantalla de inicio"</strong>.<br />
              3. ¡Listo! Tendrás el icono directo en tu pantalla.
            </p>
            <button
              onClick={() => setShowIOSInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
