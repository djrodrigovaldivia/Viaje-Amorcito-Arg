import React, { useState, useRef, useEffect } from 'react';
import { DaySchedule } from '../types/schedule';
import { ARGENTINA_CITIES, findNearestArgentineCity } from '../services/weatherService';
import { generateOfflineResponse } from '../utils/offlineAIEngine';
import {
  getSavedExchangeRates,
  syncDailyExchangeRates,
  getDailyRodrigoLetter,
  DailyExchangeRates,
} from '../services/currencyAndLetterService';
import {
  unlockIOSAudio,
  speakAsRodrigoOrChileanMaleAI,
  stopAllVoicePlayback,
  getRodrigoRecording,
} from '../services/voiceService';
import { QuickHubTab } from './MariaQuickHubModal';
import {
  Mic,
  Calendar,
  CloudSun,
  Calculator,
  Camera,
  Navigation,
  MailOpen,
  Volume2,
  VolumeX,
  Heart,
  BatteryCharging,
  WifiOff,
  Wifi,
  Map,
  Radio,
  Sparkles,
  ShieldAlert,
  ShoppingBag,
} from 'lucide-react';

interface EssentialModeViewProps {
  schedule: DaySchedule[];
  userLocation: { lat: number; lng: number; address?: string } | null;
  isOnline: boolean;
  onRequestLocation: () => void;
  onSwitchToMapMode: () => void;
  onOpenSOS: () => void;
  onOpenWeather: () => void;
  onOpenDiary: () => void;
  onOpenAI: (startWithMic?: boolean) => void;
  onOpenQuickHub: (tab: QuickHubTab) => void;
  onOpenCatGreeting?: () => void;
}

const CONVERSATIONAL_PAUSE_MS = 1400;

export const EssentialModeView: React.FC<EssentialModeViewProps> = ({
  schedule,
  userLocation,
  isOnline,
  onRequestLocation,
  onSwitchToMapMode,
  onOpenSOS,
  onOpenWeather,
  onOpenDiary,
  onOpenAI,
  onOpenQuickHub,
  onOpenCatGreeting,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isWaitingPause, setIsWaitingPause] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [quickReply, setQuickReply] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [rates, setRates] = useState<DailyExchangeRates>(getSavedExchangeRates);
  const [isSpeakingDailyLetter, setIsSpeakingDailyLetter] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef<string>('');

  useEffect(() => {
    setRates(getSavedExchangeRates());
    if (isOnline) {
      syncDailyExchangeRates(false).then((updated) => setRates(updated));
    }
  }, [isOnline]);

  const dailyLetter = getDailyRodrigoLetter(schedule, userLocation, 0);

  // Current city weather estimate (0 network drain)
  const currentCity = userLocation
    ? findNearestArgentineCity(userLocation.lat, userLocation.lng)
    : ARGENTINA_CITIES[0];

  const hasRodrigoVoice =
    !!getRodrigoRecording('intro') ||
    !!getRodrigoRecording('ai-greeting') ||
    !!getRodrigoRecording('letter-1');

  const clearTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const askQuickQuestion = async (questionText: string) => {
    const q = questionText.trim();
    if (!q) return;

    unlockIOSAudio();
    stopAllVoicePlayback();
    setIsSpeaking(false);
    setIsSpeakingDailyLetter(false);
    setIsThinking(true);
    setLiveTranscript(q);

    const deliverAnswer = (answer: string) => {
      setIsThinking(false);
      setQuickReply(answer);
      setTimeout(() => {
        speakAsRodrigoOrChileanMaleAI({
          text: answer,
          isAIResponse: true,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
      }, 500);
    };

    if (!navigator.onLine) {
      setTimeout(() => {
        const reply = generateOfflineResponse({
          message: q,
          itinerary: schedule,
          userLocation,
        });
        deliverAnswer(reply);
      }, 800);
      return;
    }

    try {
      const start = Date.now();
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          itinerary: schedule,
          userLocation,
        }),
      });
      if (!res.ok) throw new Error('fallback');
      const data = await res.json();
      const reply =
        data.reply ||
        generateOfflineResponse({ message: q, itinerary: schedule, userLocation });
      const wait = Math.max(0, 800 - (Date.now() - start));
      setTimeout(() => deliverAnswer(reply), wait);
    } catch (_) {
      const reply = generateOfflineResponse({
        message: q,
        itinerary: schedule,
        userLocation,
      });
      deliverAnswer(reply);
    }
  };

  const handleToggleDirectVoice = () => {
    unlockIOSAudio();
    stopAllVoicePlayback();
    setIsSpeaking(false);
    setIsSpeakingDailyLetter(false);

    if (isListening || isWaitingPause) {
      clearTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      setIsWaitingPause(false);
      if (transcriptRef.current.trim()) {
        askQuickQuestion(transcriptRef.current.trim());
      }
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      onOpenAI(true);
      return;
    }

    try {
      const rec = new SpeechRec();
      recognitionRef.current = rec;
      rec.lang = 'es-CL';
      rec.interimResults = true;
      rec.continuous = false;

      transcriptRef.current = '';
      setLiveTranscript('');
      setQuickReply(null);
      setIsListening(true);
      setIsWaitingPause(false);

      const resetPauseTimer = (text: string) => {
        if (!text.trim()) return;
        clearTimers();
        setIsWaitingPause(true);
        silenceTimerRef.current = setTimeout(() => {
          setIsListening(false);
          setIsWaitingPause(false);
          try {
            rec.stop();
          } catch (_) {}
          askQuickQuestion(text.trim());
        }, CONVERSATIONAL_PAUSE_MS);
      };

      rec.onresult = (event: any) => {
        let str = '';
        for (let i = 0; i < event.results.length; i++) {
          str += event.results[i][0].transcript + ' ';
        }
        const cleaned = str.trim();
        if (cleaned) {
          transcriptRef.current = cleaned;
          setLiveTranscript(cleaned);
          resetPauseTimer(cleaned);
        }
      };

      rec.onerror = () => {
        setIsListening(false);
        setIsWaitingPause(false);
      };

      rec.onend = () => {
        setIsListening(false);
        const captured = transcriptRef.current.trim();
        if (captured && !silenceTimerRef.current) {
          setIsWaitingPause(true);
          silenceTimerRef.current = setTimeout(() => {
            setIsWaitingPause(false);
            askQuickQuestion(captured);
          }, CONVERSATIONAL_PAUSE_MS);
        }
      };

      rec.start();
    } catch (_) {
      onOpenAI(true);
    }
  };

  return (
    <div className="w-full h-full bg-black text-slate-100 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 pb-24 select-none">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Top OLED Battery & Offline Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800/90 text-xs">
          <div className="flex items-center gap-2">
            <BatteryCharging className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-emerald-300">
              Modo OLED iPhone (Ahorro Máximo de Batería)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenCatGreeting && (
              <button
                onClick={onOpenCatGreeting}
                className="px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-200 text-[11px] font-extrabold"
              >
                🐱 Miau
              </button>
            )}
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-sky-300 font-semibold">
                <Wifi className="w-3 h-3" /> Wi-Fi Activo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-bold">
                <WifiOff className="w-3 h-3" /> 100% Offline Activo
              </span>
            )}
          </div>
        </div>

        {/* GIANT CENTRAL VOICE CARD FOR AMORCITO */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-slate-950 to-black border-2 border-pink-500/50 shadow-2xl space-y-4 text-center">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-extrabold">
              <Heart className="w-3.5 h-3.5 fill-current text-pink-400" />
              <span>
                {hasRodrigoVoice
                  ? 'Con la Voz Real de Rodrigo + Guía Chileno'
                  : 'Guía con Voz de Hombre Chileno'}
              </span>
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white pt-1">
              ¡Hola mi Amorcito lindo! 💕
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Toca el micrófono gigante y háblame tranquila (espero 1.4s cuando termines para no interrumpirte).
            </p>
          </div>

          {/* Giant Thumb-Friendly Microphone Button */}
          <button
            onClick={handleToggleDirectVoice}
            className={`w-full py-5 px-6 rounded-3xl font-extrabold text-base sm:text-lg flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${
              isListening || isWaitingPause
                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white ring-4 ring-pink-500/40'
                : 'bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              {isListening || isWaitingPause ? (
                <Radio className="w-8 h-8 text-white animate-pulse" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </div>
            <span>
              {isWaitingPause
                ? '⏳ Esperando 1.4s por si agregas algo más, mi amorcito...'
                : isListening
                ? '🎙️ Escuchándote, mi amorcito... (Toca para enviar ya)'
                : '🎙️ TOCA AQUÍ PARA HABLARME'}
            </span>
          </button>

          {/* Live Transcript or Thinking State */}
          {liveTranscript && (
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-pink-200 font-medium">
              🗣️ Dijiste: <strong>"{liveTranscript}"</strong>
            </div>
          )}

          {isThinking && (
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-pink-500/30 text-xs text-pink-200 font-bold">
              💕 Pensando un segundito para responderte bien, mi amorcito...
            </div>
          )}

          {/* Instant Voice & Text Answer Box */}
          {quickReply && !isThinking && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-pink-500/40 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-extrabold text-pink-400">
                  ❤️ Respuesta para mi Amorcito:
                </span>
                <button
                  onClick={() => {
                    unlockIOSAudio();
                    if (isSpeaking) {
                      stopAllVoicePlayback();
                      setIsSpeaking(false);
                    } else {
                      speakAsRodrigoOrChileanMaleAI({
                        text: quickReply,
                        isAIResponse: true,
                        onStart: () => setIsSpeaking(true),
                        onEnd: () => setIsSpeaking(false),
                      });
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-pink-600 text-white text-xs font-bold"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Detener Voz</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Volver a Escuchar</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-slate-100 whitespace-pre-line leading-relaxed">
                {quickReply}
              </p>
            </div>
          )}

          {/* Quick 1-Tap Voice Questions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              {
                label: '👗 Ropa Usada & Zara Barato',
                q: '¿Dónde hay tiendas de ropa usada estilo @maria_la_vintage, tiendas tipo Zara baratas y mall chinos?',
              },
              { label: '⛅ ¿Qué abrigo me pongo?', q: '¿Qué clima hace y qué abrigo me pongo hoy?' },
              { label: '📍 ¿Dónde estoy ahora?', q: '¿Dónde estoy parada ahora y qué hay cerca?' },
              { label: '💌 Extraño a Rodrigo', q: 'Extraño a Rodrigo' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => askQuickQuestion(item.q)}
                className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 active:scale-95 transition-transform"
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => onOpenAI(false)}
            className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-sky-400 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Abrir Chat Completo de la Guía IA →</span>
          </button>
        </div>

        {/* TODAY'S AUTO-UPDATING LOVE LETTER & @MARIA_LA_VINTAGE FASHION TIP CARD */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-950 border border-pink-500/40 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-400 block">
                💌 CARTITA Y TIP DE MODA DE HOY ({dailyLetter.dateKey})
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                {dailyLetter.title}
              </h3>
            </div>
            <button
              onClick={() => {
                unlockIOSAudio();
                if (isSpeakingDailyLetter) {
                  stopAllVoicePlayback();
                  setIsSpeakingDailyLetter(false);
                } else {
                  speakAsRodrigoOrChileanMaleAI({
                    text: `${dailyLetter.title}. ${dailyLetter.content}`,
                    slotId: 'letter-1',
                    onStart: () => setIsSpeakingDailyLetter(true),
                    onEnd: () => setIsSpeakingDailyLetter(false),
                  });
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-pink-600 text-white text-xs font-extrabold shrink-0"
            >
              {isSpeakingDailyLetter ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Detener</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Escuchar</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-pink-100/95 leading-relaxed">
            {dailyLetter.fashionTipOfTheDay.replace(/\*\*/g, '')}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => onOpenQuickHub('letters')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-pink-500/30 text-pink-200 text-xs font-extrabold"
            >
              💌 Leer Cartita Completa
            </button>
            <button
              onClick={() => onOpenQuickHub('fashion')}
              className="px-3.5 py-2 rounded-xl bg-fuchsia-600/25 hover:bg-fuchsia-600/35 border border-fuchsia-400/40 text-fuchsia-200 text-xs font-extrabold flex items-center gap-1"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>👗 Ver 10 Tiendas (@maria_la_vintage / Zara / Chinos)</span>
            </button>
          </div>
        </div>

        {/* 6 ESSENTIAL DAILY TRAVEL CARDS FOR HER IPHONE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Fashion & Vintage Map Layer */}
          <button
            onClick={() => onOpenQuickHub('fashion')}
            className="p-4 rounded-3xl bg-slate-950 border border-slate-800 hover:border-fuchsia-500/50 text-left flex items-start gap-3.5 active:scale-[0.99] transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-fuchsia-400 block">
                1. Ropa Usada, Zara & Chinos
              </span>
              <h3 className="text-sm font-extrabold text-white truncate mt-0.5">
                Ruta @maria_la_vintage (10 Tiendas)
              </h3>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                Juan Perez, Galpón, Aguirre, Argerich y Barrio Chino
              </p>
            </div>
          </button>

          {/* Card 2: Instant Currency & Tip Calculator */}
          <button
            onClick={() => onOpenQuickHub('calculator')}
            className="p-4 rounded-3xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left flex items-start gap-3.5 active:scale-[0.99] transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Calculator className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                2. Cambio Día a Día CLP ↔ ARS
              </span>
              <h3 className="text-sm font-extrabold text-white mt-0.5">
                $1.000 ARS = ${rates.clpPer1000Ars} CLP
              </h3>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {rates.updatedAtLabel}
              </p>
            </div>
          </button>

          {/* Card 3: Fast SOS Police 911 & Emergency */}
          <button
            onClick={onOpenSOS}
            className="p-4 rounded-3xl bg-gradient-to-r from-red-950/80 to-slate-950 border-2 border-red-500/60 hover:border-red-400 text-left flex items-start gap-3.5 active:scale-[0.99] transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-300 block">
                3. 🆘 SOS Emergencia Policial (1 Toque)
              </span>
              <h3 className="text-sm font-extrabold text-white truncate mt-0.5">
                Llamar 911 Policía / Enviar mi GPS
              </h3>
              <p className="text-xs text-red-200/90 truncate mt-0.5">
                Policía Buenos Aires, Ambulancia 107 y Consulado
              </p>
            </div>
          </button>

          {/* Card 4: Weather & What to Wear */}
          <button
            onClick={onOpenWeather}
            className="p-4 rounded-3xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left flex items-start gap-3.5 active:scale-[0.99] transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <CloudSun className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block">
                4. Clima y Qué Ponerme
              </span>
              <h3 className="text-sm font-extrabold text-white truncate mt-0.5">
                {currentCity.name}: {currentCity.typicalNovTemp.min}°C a {currentCity.typicalNovTemp.max}°C
              </h3>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {currentCity.defaultPacking.clothing[0]}
              </p>
            </div>
          </button>

          {/* Card 5: Camera & Travel Diary */}
          <button
            onClick={onOpenDiary}
            className="p-4 rounded-3xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-left flex items-start gap-3.5 active:scale-[0.99] transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 block">
                5. Sacar Foto / Mi Diario
              </span>
              <h3 className="text-sm font-extrabold text-white mt-0.5">
                Guardar Foto y Nota Offline
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Queda guardada en la memoria de tu iPhone
              </p>
            </div>
          </button>

          {/* Card 6: GPS & Street Map */}
          <button
            onClick={() => {
              onRequestLocation();
              onSwitchToMapMode();
            }}
            className="p-4 rounded-3xl bg-slate-950 border border-slate-800 hover:border-pink-500/50 text-left flex items-start gap-3.5 active:scale-[0.99] transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
              <Navigation className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-400 block">
                6. ¿Dónde Estoy? (GPS + Mapa)
              </span>
              <h3 className="text-sm font-extrabold text-white mt-0.5">
                {userLocation ? `Ubicada cerca de ${currentCity.name}` : 'Detectar mi ubicación GPS'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Abrir mapa con nombre de calles y tiendas
              </p>
            </div>
          </button>
        </div>

        {/* Bottom Quick Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <button
            onClick={() => onOpenQuickHub('voice-studio')}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-950 border border-sky-500/30 text-sky-300 text-xs font-extrabold flex items-center justify-center gap-1.5"
          >
            <Mic className="w-4 h-4" />
            <span>🎙️ Grabar Voz de Rodrigo</span>
          </button>

          <button
            onClick={onOpenSOS}
            className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>🆘 SOS Policía 911</span>
          </button>

          <button
            onClick={onSwitchToMapMode}
            className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
          >
            <Map className="w-4 h-4 text-sky-400" />
            <span>🗺️ Ver Mapa de Calles y Tiendas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
