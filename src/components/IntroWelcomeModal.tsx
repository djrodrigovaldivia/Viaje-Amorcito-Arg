import React, { useState, useEffect, useRef } from 'react';
import {
  speakAsRodrigoOrChileanMaleAI,
  stopAllVoicePlayback,
  unlockIOSAudio,
  getRodrigoRecording,
} from '../services/voiceService';
import {
  Heart,
  Play,
  Pause,
  X,
  Sparkles,
  MapPin,
  Calendar,
  WifiOff,
  ArrowRight,
  Camera,
  Mic,
} from 'lucide-react';

interface IntroWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSchedule: () => void;
  onOpenAI: () => void;
  onRequestLocation: () => void;
  onOpenVoiceStudio?: () => void;
}

export const IntroWelcomeModal: React.FC<IntroWelcomeModalProps> = ({
  isOpen,
  onClose,
  onOpenSchedule,
  onOpenAI,
  onRequestLocation,
  onOpenVoiceStudio,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const progressTimerRef = useRef<number | null>(null);

  const introText =
    '¡Hola mi amorcito lindo! 💕 Te doy la bienvenida a tu guía interactiva de Argentina. Hice esta aplicación con todo mi amor pensando en cuidarte en cada detalle de tu viaje. Aquí puedes ver tu itinerario día por día, mirar qué abrigo ponerte según el clima, ver dónde estás parada con el GPS de tu iPhone y hablarme con el micrófono sin tener que tipear. Y lo más bacán: funciona 100% sin internet cuando salgas del hotel y gasta el mínimo de batería. ¡Disfruta caleta cada momento en Argentina mi amorcito, te amo con todo mi corazón!';

  const hasRealIntroVoice = !!getRodrigoRecording('intro');

  const startVoice = () => {
    unlockIOSAudio();
    setAudioProgress(0);
    const startTime = Date.now();
    const estDuration = 21000;

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / estDuration) * 100));
      setAudioProgress(pct);
    }, 250);

    speakAsRodrigoOrChileanMaleAI({
      text: introText,
      slotId: 'intro',
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => {
        setIsPlayingAudio(false);
        setAudioProgress(100);
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      },
    });
  };

  const stopVoice = () => {
    stopAllVoicePlayback();
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
      title: '1. Háblame con tu Voz (Sin Tipear en tu iPhone)',
      icon: <Sparkles className="w-5 h-5 text-sky-400" />,
      desc: 'Toca el botón de micrófono en "Guía IA" o en el "Modo Esencial". Espero 1.4 segunditos cuando termines de hablar para no interrumpirte y te respondo con voz de hombre chileno.',
      actionText: 'Hablar con la IA',
      onAction: onOpenAI,
    },
    {
      title: '2. Tu Itinerario y Clima Día a Día',
      icon: <Calendar className="w-5 h-5 text-pink-400" />,
      desc: 'En "Itinerario" y "Clima" tienes tus paseos hora por hora y qué abrigo o ropa te conviene ponerte según la temperatura.',
      actionText: 'Ver Itinerario',
      onAction: onOpenSchedule,
    },
    {
      title: '3. Tu Diario de Viaje (Cámara & Fotos Offline)',
      icon: <Camera className="w-5 h-5 text-pink-400" />,
      desc: 'Saca fotos con tu iPhone y escribe notitas de cada lugar. Se guardan comprimidas en la memoria de tu teléfono sin usar internet.',
      actionText: 'Ver Itinerario',
      onAction: onOpenSchedule,
    },
    {
      title: '4. ¿Dónde Estoy? (GPS de Pulso Único)',
      icon: <MapPin className="w-5 h-5 text-emerald-400" />,
      desc: 'Toca "📍 ¿Dónde estoy?" para ubicarte en el mapa de calles o satélite en 1 segundo y apagar el GPS al tiro para cuidar tu batería.',
      actionText: 'Probar Ubicación',
      onAction: onRequestLocation,
    },
    {
      title: '5. 100% Sin Internet y Ultra-Ahorro de Batería',
      icon: <WifiOff className="w-5 h-5 text-amber-400" />,
      desc: 'Activa el botón "✨ Modo Simple" arriba cuando camines en la calle para ahorrar hasta un 60% de batería en tu iPhone.',
      actionText: 'Entendido, ¡gracias!',
      onAction: onClose,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl max-h-[92dvh] flex flex-col bg-slate-950 border border-pink-500/30 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg text-white">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-300">
                <span>Para mi Amorcito</span>
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
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-bold text-white">
                  {hasRealIntroVoice
                    ? '🎙️ Audio con la Voz Real de Rodrigo'
                    : 'Audio de Rodrigo (Voz de Hombre Chileno)'}
                </span>
              </div>
              {onOpenVoiceStudio && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenVoiceStudio();
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:underline"
                >
                  <Mic className="w-3 h-3" />
                  <span>{hasRealIntroVoice ? 'Cambiar grabación' : 'Grabar con mi voz'}</span>
                </button>
              )}
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
                    {isPlayingAudio ? '🔊 Escuchando a Rodrigo...' : '▶️ Toca para escuchar a Rodrigo'}
                  </span>
                  <span className="text-pink-400 font-mono text-[10px]">
                    {isPlayingAudio ? `${audioProgress}%` : '🇨🇱 Para mi Amorcito'}
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
                        isPlayingAudio ? 'bg-pink-400' : 'bg-slate-600'
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
