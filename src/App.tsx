import React, { useState, useEffect, Suspense } from 'react';
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
import { MariaScheduleModal } from './components/MariaScheduleModal';
import { MariaAIAssistantModal } from './components/MariaAIAssistantModal';
import { UserHelpModal } from './components/UserHelpModal';
import { IntroWelcomeModal } from './components/IntroWelcomeModal';
import { TravelDiaryModal } from './components/TravelDiaryModal';
import { WeatherModal } from './components/WeatherModal';
import { MariaQuickHubModal, QuickHubTab } from './components/MariaQuickHubModal';
import { EssentialModeView } from './components/EssentialModeView';
import { CatWelcomeModal } from './components/CatWelcomeModal';
import { stopAllVoicePlayback, unlockIOSAudio } from './services/voiceService';
import { syncDailyExchangeRates } from './services/currencyAndLetterService';
import {
  Sparkles,
  HelpCircle,
  Clock,
  MapPin,
  X,
  Calendar,
  Heart,
  Wifi,
  WifiOff,
  Download,
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
} from 'lucide-react';

// Lazy-load Three.js 3D Engine so it consumes 0% RAM & battery until a 3D model is opened
const LazyThreeLandmarkModel = React.lazy(() => import('./components/ThreeLandmarkModel'));

export default function App() {
  const [landmarks] = useState<Landmark[]>(LANDMARKS);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark>(LANDMARKS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mapType, setMapType] = useState<'hybrid' | 'roadmap' | 'satellite' | 'terrain'>('hybrid');
  const [is3DTiltEnabled, setIs3DTiltEnabled] = useState(false);
  const [focusedVintageSpotId, setFocusedVintageSpotId] = useState<string | null>(null);

  // ALWAYS open the Cat Welcome Modal every time the app is opened ("Hola mamiii que tengas un hermoso dia  -_- , miaauu")
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(true);

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
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);

  // Amorcito's Schedule with local storage persistence
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

    setLocationToast('📡 Buscando tu ubicación GPS (pulso rápido de 1s)...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        try {
          localStorage.setItem('maria_last_gps_location', JSON.stringify(coords));
        } catch (_) {}
        setLocationToast('¡Ubicación lista! Estás acá, mi Amorcito 💕 (GPS en reposo para ahorrar batería)');
        setTimeout(() => setLocationToast(null), 4000);
      },
      () => {
        const fallback = userLocation || { lat: -34.6037, lng: -58.3816 };
        setUserLocation(fallback);
        setLocationToast('📍 Ubicada en Buenos Aires (usando última posición guardada)');
        setTimeout(() => setLocationToast(null), 3500);
      },
      { enableHighAccuracy: false, maximumAge: 120000, timeout: 7000 }
    );
  };

  // Modals state
  const [activeDetailLandmark, setActiveDetailLandmark] = useState<Landmark | null>(null);
  const [active3DModelLandmark, setActive3DModelLandmark] = useState<Landmark | null>(null);
  const [isTriviaOpen, setIsTriviaOpen] = useState(false);
  const [isDistanceOpen, setIsDistanceOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
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

  // Page Visibility API Battery Saver: Stop audio and freeze background work when iPhone locks
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        stopAllVoicePlayback();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Silent Background Offline Pre-Warmer when connected to hotel Wi-Fi
  useEffect(() => {
    if (!isOnline) return;
    try {
      const prewarmed = sessionStorage.getItem('arg3d_offline_prewarmed_v1');
      if (prewarmed) return;
      sessionStorage.setItem('arg3d_offline_prewarmed_v1', 'true');

      const timer = setTimeout(() => {
        const keyUrls = [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/9/5',
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/4/9/5',
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/12/2468/1381',
        ];
        keyUrls.forEach((u) => {
          const img = new Image();
          img.src = u;
        });
      }, 2500);
      return () => clearTimeout(timer);
    } catch (_) {}
  }, [isOnline]);

  // Low-frequency clock (60s interval, skipped when iPhone screen is off)
  const [argTime, setArgTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
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
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleFlyToLandmarkId = (landmarkId: string) => {
    const target = landmarks.find((l) => l.id === landmarkId);
    if (target) {
      setSelectedLandmark(target);
      setIsEssentialMode(false);
    }
  };

  return (
    <div className="relative w-screen h-[100dvh] flex flex-col bg-black text-slate-100 overflow-hidden font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Main Top Navbar */}
      <header className="h-14 bg-slate-950 border-b border-slate-800/90 px-2.5 sm:px-4 flex items-center justify-between shrink-0 z-40 gap-2">
        {/* Brand & Amorcito Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-b from-sky-400 via-white to-sky-400 flex items-center justify-center shadow-sm ring-2 ring-sky-400/40 shrink-0">
            <span className="text-amber-500 text-xs font-bold leading-none">☀️</span>
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span className="hidden xs:inline">Argentina</span>
              <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/40 text-[10px] font-extrabold flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 fill-current text-pink-400" />
                <span>Mi Amorcito 💕</span>
              </span>
            </h1>
          </div>
        </div>

        {/* Top Navbar Actions (Scrollable on narrow screens) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {/* 🐱 Cat Greeting Trigger Button */}
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/40 text-pink-200 font-extrabold text-xs transition-all shrink-0"
            title="Ver foto de tu gatito: Hola mamiii que tengas un hermoso dia -_- , miaauu"
          >
            <span>🐱</span>
            <span className="hidden sm:inline">Miau</span>
          </button>

          {/* 1-TAP ESSENTIAL / BATTERY SAVER MODE TOGGLE FOR IPHONE */}
          <button
            onClick={() => handleToggleEssentialMode(!isEssentialMode)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 border ${
              isEssentialMode
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
            }`}
            title="Alternar entre el Modo Esencial OLED (Ahorro máximo de batería y voz gigante) y el Mapa 3D"
          >
            {isEssentialMode ? (
              <>
                <MapIcon className="w-3.5 h-3.5" />
                <span>Ver Mapa 3D</span>
              </>
            ) : (
              <>
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                <span>✨ Modo Simple</span>
              </>
            )}
          </button>

          {/* Direct Voice Button */}
          <button
            onClick={() => handleOpenAI(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs transition-all shrink-0 shadow-md"
            title="Hablarle con tu voz a tu guía chileno"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>🎙️ Hablar</span>
          </button>

          {/* Ropa Usada, Zara & Mall Chinos Button */}
          <button
            onClick={() => openQuickHub('fashion')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/40 text-fuchsia-200 font-extrabold text-xs transition-all shrink-0"
            title="Ruta @maria_la_vintage: Ropa Usada, Tiendas tipo Zara accesibles y Mall Chinos"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>👗 Ropa Usada & Zara</span>
          </button>

          {/* Rodrigo's Daily Love Letter Button */}
          <button
            onClick={() => openQuickHub('letters')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 font-bold text-xs transition-all shrink-0"
          >
            <MailOpen className="w-3.5 h-3.5 text-rose-400" />
            <span>Cartita 💌</span>
          </button>

          {/* Quick Currency & Tip Calculator Button */}
          <button
            onClick={() => openQuickHub('calculator')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-bold text-xs transition-all shrink-0"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cambio $</span>
          </button>

          {/* Easy Quick Hub Button */}
          <button
            onClick={() => openQuickHub('menu')}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-pink-500/40 text-pink-200 font-bold text-xs transition-all shrink-0"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-pink-400" />
            <span>Menú Fácil</span>
          </button>

          {/* Travel Diary Button */}
          <button
            onClick={() => {
              setDiarySelectedDayNumber(undefined);
              setIsDiaryOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-300 font-bold text-xs transition-all shrink-0"
          >
            <Camera className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Diario</span>
          </button>

          {/* Weather & Packing Button */}
          <button
            onClick={() => setIsWeatherOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 font-bold text-xs transition-all shrink-0"
          >
            <CloudSun className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Clima</span>
          </button>

          {/* My Itinerary Button */}
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs transition-all shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden lg:inline">Itinerario</span>
          </button>

          {/* Connectivity Status Tag */}
          <div
            className={`hidden xl:flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold border shrink-0 ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? 'Wi-Fi' : 'Offline'}</span>
          </div>

          {/* Clock */}
          <div className="hidden 2xl:flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] shrink-0">
            <Clock className="w-3 h-3 text-sky-400" />
            <span>{argTime || '12:00'}</span>
          </div>

          {/* Help Button */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 shrink-0"
            title="Ayuda"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* In-App PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 text-emerald-400 border border-emerald-500/40 text-xs font-semibold shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          )}

          {/* iOS Safari Guide Button */}
          {isIOS && !isInstalled && (
            <button
              onClick={() => setShowIOSInstallGuide(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 text-sky-300 border border-sky-500/40 text-xs font-bold shrink-0"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iPhone</span>
            </button>
          )}
        </div>
      </header>

      {/* Floating GPS Location Notification Toast */}
      {locationToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white text-xs font-bold shadow-2xl border border-white/30 max-w-[92vw]">
          <Heart className="w-4 h-4 fill-current text-white shrink-0" />
          <span>{locationToast}</span>
        </div>
      )}

      {/* Main Content Stage: Either Ultra-Low Battery Essential Mode OR Full Interactive Map & 3D Explorer */}
      {isEssentialMode ? (
        <main className="relative flex-1 w-full overflow-hidden bg-black">
          <EssentialModeView
            schedule={schedule}
            userLocation={userLocation}
            isOnline={isOnline}
            onRequestLocation={handleRequestLocation}
            onSwitchToMapMode={() => handleToggleEssentialMode(false)}
            onOpenSchedule={() => setIsScheduleOpen(true)}
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
            {/* Floating Quick Pills Banner for Amorcito */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-1.5 pointer-events-auto max-w-[94vw]">
              <button
                onClick={() => openQuickHub('letters')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/95 hover:bg-slate-900 border border-pink-500/50 text-pink-200 text-xs font-extrabold shadow-xl transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                <span>💌 Cartita y Tips de Hoy</span>
              </button>

              <button
                onClick={() => handleOpenAI(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 border border-white/30 text-white text-xs font-extrabold shadow-xl transition-all"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Hablar con Guía IA (Voz Chilena)</span>
              </button>

              <button
                onClick={() => setIsIntroOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/95 hover:bg-slate-900 border border-sky-500/40 text-sky-300 text-xs font-bold shadow-xl transition-all"
              >
                <span>🎙️ Audio de Bienvenida</span>
              </button>
            </div>

            {/* High-Resolution Free Satellite & Street Map View + Ropa Usada & Zara Layer */}
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
              focusedVintageSpotId={focusedVintageSpotId}
              onClearFocusedVintageSpot={() => setFocusedVintageSpotId(null)}
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

          {/* Bottom Tour Player & Chilean Audioguide Controller */}
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
            onOpenAI={() => handleOpenAI(false)}
            onOpenHelp={() => setIsHelpOpen(true)}
          />
        </>
      )}

      {/* ALWAYS-ON-OPEN CAT WELCOME MODAL ("Hola mamiii que tengas un hermoso dia  -_- , miaauu") */}
      <CatWelcomeModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        onOpenDailyLetter={() => openQuickHub('letters')}
      />

      {/* Easy Quick Hub Modal for Amorcito */}
      <MariaQuickHubModal
        isOpen={isQuickHubOpen}
        onClose={() => setIsQuickHubOpen(false)}
        schedule={schedule}
        userLocation={userLocation}
        onRequestLocation={handleRequestLocation}
        onOpenSchedule={() => setIsScheduleOpen(true)}
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

      {/* Amorcito's Schedule Modal */}
      <MariaScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        schedule={schedule}
        onUpdateSchedule={handleUpdateSchedule}
        onFlyToLandmarkId={handleFlyToLandmarkId}
        onAskAIAboutSchedule={() => {
          setIsScheduleOpen(false);
          handleOpenAI(false);
        }}
        onOpenWeatherModal={() => setIsWeatherOpen(true)}
        onOpenDiaryForDay={(dayNum) => {
          setDiarySelectedDayNumber(dayNum);
          setIsDiaryOpen(true);
        }}
        isOnline={isOnline}
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

      {/* AI Travel Assistant Modal */}
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
        onOpenSchedule={() => setIsScheduleOpen(true)}
        onOpenAI={() => handleOpenAI(false)}
        onOpenDiary={() => setIsDiaryOpen(true)}
        onOpenWeather={() => setIsWeatherOpen(true)}
      />

      {/* Romantic Introductory Audio & Guided Tour Modal */}
      <IntroWelcomeModal
        isOpen={isIntroOpen}
        onClose={() => setIsIntroOpen(false)}
        onOpenSchedule={() => setIsScheduleOpen(true)}
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
              Para tener esta app en tu iPhone y abrirla 100% sin internet en Argentina:
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
