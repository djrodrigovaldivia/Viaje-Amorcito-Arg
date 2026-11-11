import React, { useState, useEffect, Suspense } from 'react';
import { LANDMARKS, Landmark } from './data/landmarks';
import { DEFAULT_MARIA_SCHEDULE } from './data/defaultSchedule';
import { DaySchedule } from './types/schedule';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePWAInstall } from './hooks/usePWAInstall';
import { GoogleMapView } from './components/GoogleMapView';
import { LandmarkDetailModal } from './components/LandmarkDetailModal';
import { TriviaModal } from './components/TriviaModal';
import { DistanceCalculator } from './components/DistanceCalculator';
import { MariaAIAssistantModal } from './components/MariaAIAssistantModal';
import { UserHelpModal } from './components/UserHelpModal';
import { IntroWelcomeModal } from './components/IntroWelcomeModal';
import { TravelDiaryModal } from './components/TravelDiaryModal';
import { WeatherModal } from './components/WeatherModal';
import { MariaQuickHubModal, QuickHubTab } from './components/MariaQuickHubModal';
import { EssentialModeView } from './components/EssentialModeView';
import { CatWelcomeModal } from './components/CatWelcomeModal';
import { SOSEmergencyModal } from './components/SOSEmergencyModal';
import { stopAllVoicePlayback, unlockIOSAudio } from './services/voiceService';
import { syncDailyExchangeRates } from './services/currencyAndLetterService';
import {
  Sparkles,
  MapPin,
  X,
  Heart,
  Smartphone,
  Camera,
  CloudSun,
  Calculator,
  MailOpen,
  LayoutGrid,
  BatteryCharging,
  Map as MapIcon,
  Mic,
  ShoppingBag,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

// Lazy-load Three.js 3D Engine so it consumes 0% RAM & battery until a 3D model is opened
const LazyThreeLandmarkModel = React.lazy(() => import('./components/ThreeLandmarkModel'));

export default function App() {
  const [landmarks] = useState<Landmark[]>(LANDMARKS);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark>(LANDMARKS[0]);
  // Default to 'roadmap' so street names in Buenos Aires are clear and readable right away
  const [mapType, setMapType] = useState<'hybrid' | 'roadmap' | 'satellite' | 'terrain'>('roadmap');
  const [is3DTiltEnabled, setIs3DTiltEnabled] = useState(false);
  const [focusedVintageSpotId, setFocusedVintageSpotId] = useState<string | null>(null);
  const [openStoreListTrigger, setOpenStoreListTrigger] = useState<number>(0);

  // ALWAYS open the Cat Welcome Modal every time the app is opened ("Hola mamiii que tengas un hermoso dia  -_- , miaauu")
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(true);
  const [catModalTab, setCatModalTab] = useState<'cat' | 'guide'>('cat');

  // Essential / Ultra-Low Battery Mode for iPhone (persisted in localStorage)
  const [isEssentialMode, setIsEssentialMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('amorcito_essential_mode_v1');
      if (saved !== null) return saved === 'true';
    } catch (_) {}
    return false;
  });

  const handleToggleEssentialMode = (val: boolean) => {
    setIsEssentialMode(val);
    try {
      localStorage.setItem('amorcito_essential_mode_v1', String(val));
    } catch (_) {}
  };

  // Online / Offline Status
  const isOnline = useOnlineStatus();

  // Sync live day-to-day CLP <-> ARS exchange rates on boot when online
  useEffect(() => {
    if (isOnline) {
      syncDailyExchangeRates(false).catch(() => {});
    }
  }, [isOnline]);

  // PWA Install Prompt Hook
  const { isInstalled, isIOS } = usePWAInstall();
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);

  // Keep schedule array only for Diary / Weather compatibility (no fixed itinerary UI)
  const [schedule] = useState<DaySchedule[]>(DEFAULT_MARIA_SCHEDULE);

  // Single-Pulse GPS Geolocation with Offline Memory Persistence (Saves iPhone Battery)
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('maria_last_gps_location');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null;
  });
  const [locationToast, setLocationToast] = useState<string | null>(null);

  const handleRequestLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationToast('El GPS no está disponible en este navegador.');
      setTimeout(() => setLocationToast(null), 3500);
      return;
    }

    setLocationToast('📡 Buscando tu ubicación en Buenos Aires...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        try {
          localStorage.setItem('maria_last_gps_location', JSON.stringify(coords));
        } catch (_) {}
        setLocationToast('¡Ubicación lista! Estás acá, mi Amorcito 💕');
        setTimeout(() => setLocationToast(null), 3500);
      },
      () => {
        const fallback = userLocation || { lat: -34.6037, lng: -58.3816 };
        setUserLocation(fallback);
        setLocationToast('📍 Ubicada en Buenos Aires (CABA)');
        setTimeout(() => setLocationToast(null), 3000);
      },
      { enableHighAccuracy: false, maximumAge: 120000, timeout: 7000 }
    );
  };

  // Modals state
  const [activeDetailLandmark, setActiveDetailLandmark] = useState<Landmark | null>(null);
  const [active3DModelLandmark, setActive3DModelLandmark] = useState<Landmark | null>(null);
  const [isTriviaOpen, setIsTriviaOpen] = useState(false);
  const [isDistanceOpen, setIsDistanceOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [autoStartAIMic, setAutoStartAIMic] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [diarySelectedDayNumber, setDiarySelectedDayNumber] = useState<number | undefined>(
    undefined
  );
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [isQuickHubOpen, setIsQuickHubOpen] = useState(false);
  const [quickHubTab, setQuickHubTab] = useState<QuickHubTab>('menu');
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  const openQuickHub = (tab: QuickHubTab = 'menu') => {
    setQuickHubTab(tab);
    setIsQuickHubOpen(true);
  };

  const handleOpenAI = (startWithMic = false) => {
    unlockIOSAudio();
    setAutoStartAIMic(startWithMic);
    setIsAIAssistantOpen(true);
  };

  const handleFlyToVintageSpot = (spotId: string) => {
    setIsEssentialMode(false);
    setMapType('roadmap');
    setFocusedVintageSpotId(spotId);
  };

  // Page Visibility API Battery Saver: Stop audio when iPhone screen locks
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        stopAllVoicePlayback();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Silent Background Offline Pre-Warmer for Buenos Aires Street Map Tiles
  useEffect(() => {
    if (!isOnline) return;
    try {
      const prewarmed = sessionStorage.getItem('arg3d_offline_prewarmed_v2');
      if (prewarmed) return;
      sessionStorage.setItem('arg3d_offline_prewarmed_v2', 'true');

      const timer = setTimeout(() => {
        const keyUrls = [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/12/2468/1381',
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/13/4936/2763',
        ];
        keyUrls.forEach((u) => {
          const img = new Image();
          img.src = u;
        });
      }, 2500);
      return () => clearTimeout(timer);
    } catch (_) {}
  }, [isOnline]);

  return (
    <div className="relative w-screen h-[100dvh] flex flex-col bg-black text-slate-100 overflow-hidden font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* =====================================================================
          CLEAN, UNCLUTTERED TOP HEADER BAR
         ===================================================================== */}
      <header className="h-12 bg-slate-950 border-b border-slate-800/90 px-2.5 sm:px-4 flex items-center justify-between shrink-0 z-40 gap-2">
        {/* Left: Brand & Amorcito Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-b from-sky-400 via-white to-sky-400 flex items-center justify-center shadow-sm ring-1 ring-sky-400/40 shrink-0">
            <span className="text-amber-500 text-[11px] font-bold leading-none">☀️</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-200 border border-pink-400/40 text-xs font-extrabold flex items-center gap-1">
            <Heart className="w-3 h-3 fill-current text-pink-400" />
            <span>Mi Amorcito 💕</span>
          </span>
        </div>

        {/* Right: Essential Quick Actions */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {/* 🐱 Cat Greeting Trigger Button */}
          <button
            onClick={() => {
              setCatModalTab('cat');
              setIsCatModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/40 text-pink-200 font-extrabold text-xs transition-all shrink-0"
            title="Saludo de tu gatito"
          >
            <span>🐱</span>
            <span>Miau</span>
          </button>

          {/* 📖 ¿Cómo usar tu app? */}
          <button
            onClick={() => {
              setCatModalTab('guide');
              setIsCatModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-pink-500/40 text-pink-200 font-extrabold text-xs transition-all shrink-0"
            title="¿Cómo usar tu app?"
          >
            <HelpCircle className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden xs:inline">Cómo usar</span>
          </button>

          {/* 1-TAP ESSENTIAL / BATTERY SAVER MODE TOGGLE */}
          <button
            onClick={() => handleToggleEssentialMode(!isEssentialMode)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 border ${
              isEssentialMode
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {isEssentialMode ? (
              <>
                <MapIcon className="w-3.5 h-3.5" />
                <span>Ver Mapa</span>
              </>
            ) : (
              <>
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                <span>Modo Simple</span>
              </>
            )}
          </button>

          {/* Weather & Packing Button */}
          <button
            onClick={() => setIsWeatherOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-300 font-bold text-xs transition-all shrink-0"
            title="Clima en Buenos Aires"
          >
            <CloudSun className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Clima</span>
          </button>

          {/* Travel Diary Button */}
          <button
            onClick={() => {
              setDiarySelectedDayNumber(undefined);
              setIsDiaryOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/40 text-pink-300 font-bold text-xs transition-all shrink-0"
            title="Diario de Fotos"
          >
            <Camera className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Fotos</span>
          </button>

          {/* More / Quick Hub Button */}
          <button
            onClick={() => openQuickHub('menu')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition-all shrink-0"
            title="Menú completo"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden md:inline">Menú</span>
          </button>

          {/* iOS Safari Guide Button */}
          {isIOS && !isInstalled && (
            <button
              onClick={() => setShowIOSInstallGuide(true)}
              className="p-1.5 rounded-xl bg-slate-900 text-sky-300 border border-sky-500/40 text-xs font-bold shrink-0"
              title="Instalar en iPhone"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Floating GPS Location Notification Toast */}
      {locationToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white text-xs font-bold shadow-2xl border border-white/30 max-w-[92vw]">
          <Heart className="w-4 h-4 fill-current text-white shrink-0" />
          <span>{locationToast}</span>
        </div>
      )}

      {/* =====================================================================
          MAIN STAGE: Either Essential Mode OR Clean Street Map + 5-Tab Bottom Bar
         ===================================================================== */}
      {isEssentialMode ? (
        <main className="relative flex-1 w-full overflow-hidden bg-black">
          <EssentialModeView
            schedule={schedule}
            userLocation={userLocation}
            isOnline={isOnline}
            onRequestLocation={handleRequestLocation}
            onSwitchToMapMode={() => handleToggleEssentialMode(false)}
            onOpenSOS={() => setIsSOSOpen(true)}
            onOpenWeather={() => setIsWeatherOpen(true)}
            onOpenDiary={() => {
              setDiarySelectedDayNumber(undefined);
              setIsDiaryOpen(true);
            }}
            onOpenAI={handleOpenAI}
            onOpenQuickHub={openQuickHub}
            onOpenCatGreeting={() => setIsCatModalOpen(true)}
          />
        </main>
      ) : (
        <>
          <main className="relative flex-1 w-full overflow-hidden">
            {/* Clean Buenos Aires Street Map with 1-Layer-At-A-Time Filter Bar */}
            <GoogleMapView
              landmarks={landmarks}
              selectedLandmark={selectedLandmark}
              onSelectLandmark={setSelectedLandmark}
              onOpen3DModal={setActive3DModelLandmark}
              onOpenLandmarkDetails={setActiveDetailLandmark}
              mapType={mapType}
              onChangeMapType={setMapType}
              is3DTiltEnabled={is3DTiltEnabled}
              onToggle3DTilt={() => setIs3DTiltEnabled(!is3DTiltEnabled)}
              userLocation={userLocation}
              onRequestLocation={handleRequestLocation}
              focusedVintageSpotId={focusedVintageSpotId}
              onClearFocusedVintageSpot={() => setFocusedVintageSpotId(null)}
              externalOpenStoreListTrigger={openStoreListTrigger}
            />
          </main>

          {/* =====================================================================
              CLEAN 5-BUTTON IPHONE BOTTOM NAVIGATION BAR (Zero Itinerary, Fast SOS!)
             ===================================================================== */}
          <nav className="h-16 bg-slate-950 border-t border-slate-800/90 px-2 flex items-center justify-around shrink-0 z-40">
            {/* 1. Tiendas (Ropa Usada, Zara & Chinos) */}
            <button
              onClick={() => setOpenStoreListTrigger((c) => c + 1)}
              className="flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-2xl text-pink-300 hover:text-pink-200 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-5 h-5 text-pink-400" />
              <span className="text-[10px] font-extrabold tracking-tight">Tiendas (10)</span>
            </button>

            {/* 2. Cartita y Tips del Día */}
            <button
              onClick={() => openQuickHub('letters')}
              className="flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-2xl text-rose-300 hover:text-rose-200 active:scale-95 transition-all"
            >
              <MailOpen className="w-5 h-5 text-rose-400" />
              <span className="text-[10px] font-extrabold tracking-tight">Cartita 💌</span>
            </button>

            {/* 3. Center Primary Button: Guía IA (Ella le dice qué quiere hacer y el Guía la lleva) */}
            <button
              onClick={() => handleOpenAI(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white font-extrabold text-xs shadow-lg shadow-pink-600/30 border border-white/25 active:scale-95 transition-all"
            >
              <Mic className="w-4 h-4" />
              <span>Guía IA</span>
            </button>

            {/* 4. Calculadora Cambio CLP <-> ARS */}
            <button
              onClick={() => openQuickHub('calculator')}
              className="flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-2xl text-emerald-300 hover:text-emerald-200 active:scale-95 transition-all"
            >
              <Calculator className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-extrabold tracking-tight">Cambio $</span>
            </button>

            {/* 5. Fast SOS Police 911 & Emergency Button */}
            <button
              onClick={() => setIsSOSOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-2xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/60 text-red-200 active:scale-95 transition-all"
              title="Llamar rápido al 911 Policía de Buenos Aires o Emergencias"
            >
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span className="text-[10px] font-extrabold tracking-tight text-red-300">
                🆘 SOS 911
              </span>
            </button>
          </nav>
        </>
      )}

      {/* ALWAYS-ON-OPEN CAT WELCOME MODAL ("Hola mamiii que tengas un hermoso dia  -_- , miaauu") + GUIA PASO A PASO */}
      <CatWelcomeModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        onOpenDailyLetter={() => openQuickHub('letters')}
        initialTab={catModalTab}
      />

      {/* FAST SOS POLICE 911 & EMERGENCY MODAL */}
      <SOSEmergencyModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        userLocation={userLocation}
        onRequestLocation={handleRequestLocation}
      />

      {/* Easy Quick Hub Modal for Amorcito */}
      <MariaQuickHubModal
        isOpen={isQuickHubOpen}
        onClose={() => setIsQuickHubOpen(false)}
        schedule={schedule}
        userLocation={userLocation}
        onRequestLocation={handleRequestLocation}
        onOpenSchedule={() => setIsSOSOpen(true)}
        onOpenDiary={() => {
          setDiarySelectedDayNumber(undefined);
          setIsDiaryOpen(true);
        }}
        onOpenWeather={() => setIsWeatherOpen(true)}
        onOpenAI={handleOpenAI}
        onOpenIntro={() => setIsIntroOpen(true)}
        onOpenTrivia={() => setIsTriviaOpen(true)}
        onOpenDistance={() => setIsDistanceOpen(true)}
        onFlyToVintageSpot={handleFlyToVintageSpot}
        initialTab={quickHubTab}
      />

      {/* Travel Diary Modal */}
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

      {/* AI Travel Assistant Modal (She tells the Guide what she wants to do!) */}
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
        autoStartMic={autoStartAIMic}
        onClearAutoStartMic={() => setAutoStartAIMic(false)}
      />

      {/* Guided Help Modal */}
      <UserHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onOpenSchedule={() => setIsSOSOpen(true)}
        onOpenAI={() => handleOpenAI(false)}
        onOpenDiary={() => setIsDiaryOpen(true)}
        onOpenWeather={() => setIsWeatherOpen(true)}
      />

      {/* Romantic Introductory Audio & Guided Tour Modal */}
      <IntroWelcomeModal
        isOpen={isIntroOpen}
        onClose={() => setIsIntroOpen(false)}
        onOpenSchedule={() => setIsSOSOpen(true)}
        onOpenAI={() => handleOpenAI(true)}
        onRequestLocation={handleRequestLocation}
        onOpenVoiceStudio={() => openQuickHub('voice-studio')}
      />

      {/* Cultural Information Detail Modal */}
      <LandmarkDetailModal
        landmark={activeDetailLandmark}
        onClose={() => setActiveDetailLandmark(null)}
        onFlyTo={setSelectedLandmark}
      />

      {/* Standalone 3D Digital Twin Modal (Lazy Loaded on Demand) */}
      {active3DModelLandmark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl h-[86dvh] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Gemelo 3D: {active3DModelLandmark.name}
                  </h3>
                  <p className="text-xs text-sky-400">
                    {active3DModelLandmark.province} •{' '}
                    {active3DModelLandmark.elevation.toLocaleString()} msnm
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedLandmark(active3DModelLandmark);
                    setActive3DModelLandmark(null);
                    setIsEssentialMode(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ver en Mapa</span>
                </button>

                <button
                  onClick={() => setActive3DModelLandmark(null)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full p-3 sm:p-4 overflow-hidden bg-slate-950">
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center text-xs text-sky-300 font-bold">
                    Cargando Diorama 3D para mi Amorcito... ✨
                  </div>
                }
              >
                <LazyThreeLandmarkModel landmark={active3DModelLandmark} height="100%" />
              </Suspense>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sky-400" />
                <span>Instalar en tu iPhone, mi Amorcito 💕</span>
              </h3>
              <button
                onClick={() => setShowIOSInstallGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Para tener esta app en tu iPhone y abrirla 100% sin internet en Buenos Aires:
              <br />
              <br />
              1. En Safari, toca el botón <strong>Compartir</strong> (el cuadradito con la flecha
              hacia arriba en la barra de abajo).
              <br />
              2. Baja un poquito y toca <strong>"Agregar a Inicio"</strong>.<br />
              3. ¡Listo mi amorcito! Quedará como una app real en tu iPhone.
            </p>
            <button
              onClick={() => setShowIOSInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs"
            >
              ¡Entendido! ❤️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
