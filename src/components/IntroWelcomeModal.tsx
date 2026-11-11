import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  MapPin,
  Calendar,
  WifiOff,
  Smartphone,
  ArrowRight,
  Check,
  MessageCircle,
  Camera,
} from 'lucide-react';

interface IntroWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSchedule: () => void;
  onOpenAI: () => void;
  onRequestLocation: () => void;
}

export const IntroWelcomeModal: React.FC<IntroWelcomeModalProps> = ({
  isOpen,
  onClose,
  onOpenSchedule,
  onOpenAI,
  onRequestLocation,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const progressTimerRef = useRef<number | null>(null);

  const introText =
    '¡Hola mi amorcito María Ignacia! 💕 Te doy la bienvenida a tu guía interactiva de Argentina en 3D. Creé esta página con todo mi amor pensando en cada detalle de tu viaje. Acá vas a poder organizar tu schedule con los días que te quedan, consultar horarios de apertura de los monumentos, ver dónde estás con tu GPS en el mapa, y preguntarle cualquier duda a tu Asistente IA. Y lo mejor de todo: podés usarla tranquila sin gastar internet en la calle porque funciona en modo offline cuando no tengas Wi-Fi. ¡Disfrutá mucho cada momento en Argentina mi vida, te amo!';

  const startVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(introText);
    utterance.lang = 'es-AR';
    utterance.rate = 0.93;
    utterance.pitch = 1.05;

    // Pick Spanish voice
    const voices = window.speechSynthesis.getVoices();
    const esVoice =
      voices.find((v) => v.lang.includes('es-CL')) || // Chilean accent if available
      voices.find((v) => v.lang.includes('es-AR')) ||
      voices.find((v) => v.lang.includes('es-419')) ||
      voices.find((v) => v.lang.startsWith('es'));

    if (esVoice) utterance.voice = esVoice;

    setAudioProgress(0);
    const startTime = Date.now();
    const estDuration = 22000; // estimated 22s

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / estDuration) * 100));
      setAudioProgress(pct);
    }, 200);

    utterance.onstart = () => {
      setIsPlayingAudio(true);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setAudioProgress(100);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopVoice = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  };

  const toggleAudio = () => {
    if (isPlayingAudio) {
      stopVoice();
    } else {
      startVoice();
    }
  };

  // Stop speech if modal closes
  useEffect(() => {
    if (!isOpen) {
      stopVoice();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    {
      title: '1. Tu Itinerario y Schedule de Días',
      icon: <Calendar className="w-5 h-5 text-pink-400" />,
      desc: 'En el botón "Mi Itinerario" tenés organizados tus días en Argentina. Podés ver tus actividades hora a hora, marcar las que ya hiciste y agregar nuevas cosas que quieras hacer.',
      actionText: 'Ver Itinerario',
      onAction: onOpenSchedule,
    },
    {
      title: '2. Clima & Tu Asistente IA',
      icon: <Sparkles className="w-5 h-5 text-sky-400" />,
      desc: 'En "Clima" y "Guía IA" podés ver el pronóstico de cada ciudad, qué ropa ponerte según el frío o lluvia, horarios de apertura y dónde comer las mejores empanadas o helados.',
      actionText: 'Hablar con la IA',
      onAction: onOpenAI,
    },
    {
      title: '3. Tu Diario de Viaje (Fotos & Notas)',
      icon: <Camera className="w-5 h-5 text-pink-400" />,
      desc: 'Podés sacar fotos con la cámara de tu celular de cada lugar que visites y guardar anécdotas vinculadas a tus días de viaje. ¡Todo se guarda seguro en tu teléfono sin internet!',
      actionText: 'Ver Itinerario',
      onAction: onOpenSchedule,
    },
    {
      title: '4. Tu Ubicación en el Mapa 3D',
      icon: <MapPin className="w-5 h-5 text-emerald-400" />,
      desc: 'Cuando estés en la calle o en tu hotel, tocá "📍 ¿Dónde estoy?". La app usará tu GPS para mostrarte en el mapa y decirte qué monumentos y atractivos tenés cerca.',
      actionText: 'Probar Ubicación',
      onAction: onRequestLocation,
    },
    {
      title: '5. Funciona 100% Sin Internet (Offline)',
      icon: <WifiOff className="w-5 h-5 text-amber-400" />,
      desc: '¡Tranquila si no tenés datos móviles! Todos los monumentos, fotos, clima regional, modelos 3D y tu itinerario quedan guardados en tu teléfono para que no dependas del Wi-Fi en la calle.',
      actionText: 'Entendido, ¡gracias!',
      onAction: onClose,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-slate-900 border border-pink-500/30 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-300">
                <span>Para María Ignacia</span>
                <Heart className="w-3 h-3 fill-current text-pink-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                ¡Bienvenida a tu Guía de Argentina!
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* WhatsApp-Style Introductory Audio Player requested by Maria Ignacia */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-pink-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">Audio Introductorio de Rodrigo</span>
              </div>
              <span className="text-slate-400 text-[11px] font-mono">0:22</span>
            </div>

            {/* Audio Waveform & Play/Pause bar */}
            <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
              <button
                onClick={toggleAudio}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 shadow-md ${
                  isPlayingAudio
                    ? 'bg-rose-500 text-white ring-4 ring-rose-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
                title={isPlayingAudio ? 'Pausar audio' : 'Reproducir audio introductorio'}
              >
                {isPlayingAudio ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium mb-1.5">
                  <span className="truncate">
                    {isPlayingAudio ? '🔊 Reproduciendo voz...' : '▶️ Toca para escuchar el mensaje'}
                  </span>
                  <span className="text-pink-400 font-mono text-[10px]">
                    {isPlayingAudio ? `${audioProgress}%` : 'Voz en español'}
                  </span>
                </div>

                {/* Simulated voice wave bars */}
                <div className="relative w-full h-4 bg-slate-950 rounded-full overflow-hidden flex items-center px-1 gap-1 border border-slate-800">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-pink-500 opacity-30 transition-all duration-200"
                    style={{ width: `${audioProgress}%` }}
                  />
                  {[40, 70, 90, 60, 30, 85, 100, 65, 45, 95, 75, 50, 80, 60, 90, 40, 70, 85].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        isPlayingAudio ? 'bg-pink-400 animate-pulse' : 'bg-slate-600'
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Transcript Quote */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed italic">
              "{introText}"
            </div>
          </div>

          {/* Interactive Steps Carousel / Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                ¿Cómo funciona tu página? (Guía Rápida)
              </h4>
              <span className="text-[11px] text-sky-400 font-semibold">
                Paso {currentStep + 1} de {steps.length}
              </span>
            </div>

            {/* Current Step Card */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  {steps[currentStep].icon}
                </div>
                <h5 className="text-sm font-bold text-white">
                  {steps[currentStep].title}
                </h5>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {steps[currentStep].desc}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  {steps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        idx === currentStep ? 'bg-pink-400 w-5' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {currentStep < steps.length - 1 ? (
                    <button
                      onClick={() => setCurrentStep((prev) => prev + 1)}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                    >
                      <span>Siguiente</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={onClose}
                      className="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md"
                    >
                      ¡Empezar a explorar! ✨
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <div className="text-xs text-pink-300 flex items-center gap-1 font-medium">
            <span>Hecho especialmente para vos</span>
            <Heart className="w-3.5 h-3.5 fill-current text-pink-400" />
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all"
          >
            Entendido, ¡a viajar! 🇦🇷
          </button>
        </div>
      </div>
    </div>
  );
};
