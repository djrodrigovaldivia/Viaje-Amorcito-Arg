import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DaySchedule } from '../types/schedule';
import { generateOfflineResponse } from '../utils/offlineAIEngine';
import {
  unlockIOSAudio,
  speakAsRodrigoOrChileanMaleAI,
  stopAllVoicePlayback,
  getRodrigoRecording,
} from '../services/voiceService';
import {
  X,
  Send,
  Sparkles,
  MapPin,
  Wifi,
  WifiOff,
  Heart,
  Volume2,
  VolumeX,
  Compass,
  Clock,
  HelpCircle,
  RotateCcw,
  Mic,
  MicOff,
  Radio,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'maria' | 'ai';
  text: string;
  time: string;
  isOffline?: boolean;
}

interface MariaAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: DaySchedule[];
  userLocation: { lat: number; lng: number; address?: string } | null;
  onRequestUserLocation: () => void;
  isOnline: boolean;
  onOpenHelp: () => void;
  autoStartMic?: boolean;
  onClearAutoStartMic?: () => void;
}

// Forum-researched optimal conversational turn-taking pause (1.4 seconds = 1400ms)
// Prevents the AI from interrupting her while she takes a breath or finishes her thought.
const CONVERSATIONAL_PAUSE_MS = 1400;

export const MariaAIAssistantModal: React.FC<MariaAIAssistantModalProps> = ({
  isOpen,
  onClose,
  itinerary,
  userLocation,
  onRequestUserLocation,
  isOnline,
  onOpenHelp,
  autoStartMic,
  onClearAutoStartMic,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `¡Hola mi amorcito lindo! 💕🇨🇱\n\nSoy tu guía personal en Argentina, hecho con todo el amor del mundo por Rodrigo para cuidarte y acompañarte a cada paso.\n\nToca el **botón del micrófono 🎙️** para hablarme con tu voz sin tener que tipear en tu iPhone (esperaré 1.4 segunditos cuando termines de hablar para que jamás nos pisemos al conversar), o toca cualquier botón rápido de abajo. ¡Funciono con Wi-Fi y también 100% sin internet en la calle po, mi amorcito!`,
      time: 'Ahora',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoSpeakReplies, setAutoSpeakReplies] = useState(true);

  // Voice Recognition & Conversational Pause States
  const [isListening, setIsListening] = useState(false);
  const [isWaitingPauseBuffer, setIsWaitingPauseBuffer] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptAccumulatorRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const clearVoiceTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (replyDelayTimerRef.current) {
      clearTimeout(replyDelayTimerRef.current);
      replyDelayTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Stop recognition and audio when modal closes to save iPhone battery
      clearVoiceTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      setIsWaitingPauseBuffer(false);
      stopAllVoicePlayback();
      setSpeakingMsgId(null);
    }
  }, [messages, isOpen]);

  const speakReplyNaturally = useCallback(
    (msgId: string, text: string, withConversationalDelay = false) => {
      clearVoiceTimers();
      // If triggered right after voice input, add a gentle 650ms pre-speech breath after the 1.4s silence detection
      // so the transition from her speaking to his voice feels 100% human and unhurried.
      const delay = withConversationalDelay ? 650 : 80;
      replyDelayTimerRef.current = setTimeout(() => {
        speakAsRodrigoOrChileanMaleAI({
          text,
          isAIResponse: true,
          onStart: () => setSpeakingMsgId(msgId),
          onEnd: () => setSpeakingMsgId(null),
        });
      }, delay);
    },
    []
  );

  const handleSendMessage = useCallback(
    async (textToSend?: string, fromVoiceInput = false) => {
      const query = (textToSend ?? inputText).trim();
      if (!query || isLoading) return;

      unlockIOSAudio();
      stopAllVoicePlayback();
      setSpeakingMsgId(null);

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'maria',
        text: query,
        time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setLiveTranscript('');
      transcriptAccumulatorRef.current = '';
      setIsWaitingPauseBuffer(false);
      setIsLoading(true);

      const finishWithReply = (replyText: string, offlineFlag: boolean) => {
        const replyId = `reply-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: replyId,
            sender: 'ai',
            text: replyText,
            time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
            isOffline: offlineFlag,
          },
        ]);
        setIsLoading(false);

        if (autoSpeakReplies || fromVoiceInput) {
          speakReplyNaturally(replyId, replyText, fromVoiceInput);
        }
      };

      // Offline mode: wait 900ms so the response doesn't feel robotic/instantaneous and never collides with her voice
      if (!navigator.onLine) {
        setTimeout(() => {
          const offlineReply = generateOfflineResponse({
            message: query,
            itinerary,
            userLocation,
          });
          finishWithReply(offlineReply, true);
        }, 900);
        return;
      }

      try {
        const startTime = Date.now();
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            itinerary,
            userLocation,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const reply =
          data.reply || generateOfflineResponse({ message: query, itinerary, userLocation });

        // Ensure at least 900ms of natural thinking pace so it never interrupts her
        const elapsed = Date.now() - startTime;
        const remainingWait = Math.max(0, 900 - elapsed);
        setTimeout(() => {
          finishWithReply(reply, false);
        }, remainingWait);
      } catch (_) {
        const offlineReply = generateOfflineResponse({
          message: query,
          itinerary,
          userLocation,
        });
        finishWithReply(offlineReply, true);
      }
    },
    [inputText, isLoading, itinerary, userLocation, autoSpeakReplies, speakReplyNaturally]
  );

  // Start / Stop Microphone Speech Recognition with 1.4s Conversational Silence Buffer
  const handleToggleMicrophone = useCallback(() => {
    unlockIOSAudio();
    stopAllVoicePlayback();
    setSpeakingMsgId(null);
    setVoiceError(null);

    if (isListening || isWaitingPauseBuffer) {
      clearVoiceTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      setIsWaitingPauseBuffer(false);
      const pendingText = (transcriptAccumulatorRef.current || liveTranscript).trim();
      if (pendingText) {
        handleSendMessage(pendingText, true);
      }
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceError(
        'Mi amorcito, usa el micrófono del teclado de tu iPhone (abajo a la derecha) para dictarme tu mensaje 💕'
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.lang = 'es-CL';
      recognition.interimResults = true;
      // On iOS Safari, continuous=false is more stable, while our 1.4s silence timer buffers the end of speech
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      transcriptAccumulatorRef.current = '';
      setLiveTranscript('');
      setIsListening(true);
      setIsWaitingPauseBuffer(false);

      const scheduleConversationalSend = (currentText: string) => {
        if (!currentText.trim()) return;
        clearVoiceTimers();
        setIsWaitingPauseBuffer(true);
        silenceTimerRef.current = setTimeout(() => {
          setIsListening(false);
          setIsWaitingPauseBuffer(false);
          try {
            recognition.stop();
          } catch (_) {}
          handleSendMessage(currentText.trim(), true);
        }, CONVERSATIONAL_PAUSE_MS);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalStr = '';
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalStr += res[0].transcript + ' ';
          } else {
            interim += res[0].transcript;
          }
        }
        const combined = (finalStr + interim).trim();
        if (combined) {
          transcriptAccumulatorRef.current = combined;
          setLiveTranscript(combined);
          setInputText(combined);
          // Every time she speaks a word, reset the 1.4s conversational silence timer!
          scheduleConversationalSend(combined);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          setIsListening(false);
          setIsWaitingPauseBuffer(false);
          return;
        }
        setIsListening(false);
        setIsWaitingPauseBuffer(false);
        setVoiceError(
          'Permite el micrófono en Safari (o usa el micrófono del teclado de tu iPhone) para hablarme, mi amorcito 💕'
        );
      };

      recognition.onend = () => {
        setIsListening(false);
        const captured = transcriptAccumulatorRef.current.trim();
        if (captured && !silenceTimerRef.current) {
          // Wait the full 1.4s conversational pause before sending so we never cut her off
          setIsWaitingPauseBuffer(true);
          silenceTimerRef.current = setTimeout(() => {
            setIsWaitingPauseBuffer(false);
            handleSendMessage(captured, true);
          }, CONVERSATIONAL_PAUSE_MS);
        }
      };

      recognition.start();
    } catch (_) {
      setIsListening(false);
      setVoiceError('Toca el micrófono de tu teclado de iPhone para dictarme, mi amorcito 💕');
    }
  }, [isListening, isWaitingPauseBuffer, liveTranscript, handleSendMessage]);

  // Trigger auto-start microphone when opened from Essential Mode giant voice button
  useEffect(() => {
    if (isOpen && autoStartMic) {
      onClearAutoStartMic?.();
      const t = setTimeout(() => {
        handleToggleMicrophone();
      }, 250);
      return () => clearTimeout(t);
    }
  }, [isOpen, autoStartMic, onClearAutoStartMic, handleToggleMicrophone]);

  if (!isOpen) return null;

  const handleSpeechToggle = (msgId: string, text: string) => {
    unlockIOSAudio();
    if (speakingMsgId === msgId) {
      stopAllVoicePlayback();
      setSpeakingMsgId(null);
    } else {
      speakReplyNaturally(msgId, text, false);
    }
  };

  const hasRodrigoGreeting = !!getRodrigoRecording('ai-greeting');

  const quickChips = [
    { label: '⛅ ¿Qué abrigo me pongo hoy?', query: '¿Qué clima hace y qué abrigo me pongo hoy?' },
    { label: '📍 ¿Dónde estoy parada?', query: '¿Dónde estoy ahora y qué tengo cerca?' },
    { label: '🗓️ ¿Qué me toca hoy?', query: '¿Cuál es mi itinerario y horarios de hoy?' },
    { label: '🍦 ¿Dónde tomo once o helado?', query: '¿Dónde puedo tomar once o comer helados ricos?' },
    { label: '🚇 ¿Cómo uso el Subte y la micro?', query: '¿Cómo funciona el Subte, los colectivos y el cambio de pesos?' },
    { label: '💌 Extraño a Rodrigo', query: 'Extraño a Rodrigo' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl h-[100dvh] sm:h-[88dvh] flex flex-col bg-slate-950 sm:border border-slate-800 sm:rounded-3xl shadow-2xl overflow-hidden text-slate-100 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-slate-950 flex items-center justify-center text-[8px] text-white">
                ❤️
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  Guía para mi Amorcito 💕
                </h3>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isOnline
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <Wifi className="w-2.5 h-2.5" />
                      <span>Wi-Fi</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-2.5 h-2.5" />
                      <span>100% Offline</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-pink-300/90 font-medium">
                {hasRodrigoGreeting
                  ? '🎙️ Con la voz real de Rodrigo + Guía Chileno'
                  : '🇨🇱 Voz de hombre chileno • Pausa natural 1.4s'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Auto-Speak Replies Toggle */}
            <button
              onClick={() => {
                unlockIOSAudio();
                const next = !autoSpeakReplies;
                setAutoSpeakReplies(next);
                if (!next) {
                  stopAllVoicePlayback();
                  setSpeakingMsgId(null);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                autoSpeakReplies
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
              title="Activar o desactivar que te hable en voz alta automáticamente"
            >
              {autoSpeakReplies ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Voz Activa</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mudo</span>
                </>
              )}
            </button>

            <button
              onClick={onRequestUserLocation}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-pink-300 border border-pink-500/30 text-xs font-semibold transition-colors"
              title="Actualizar mi ubicación GPS en 1 segundo"
            >
              <MapPin className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">Mi GPS</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Voice Listening / 1.4s Conversational Buffer Banner */}
        {(isListening || isWaitingPauseBuffer) && (
          <div className="px-4 py-3 bg-gradient-to-r from-pink-950/90 via-rose-950/90 to-indigo-950/90 border-b border-pink-500/40 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-pink-600 flex items-center justify-center shrink-0 shadow-lg">
                <Radio className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-pink-200">
                  {isWaitingPauseBuffer
                    ? '⏳ Esperando 1.4s por si quieres decir algo más, mi amorcito...'
                    : '🎙️ Escuchándote con atención, mi amorcito... ¡Habla tranquila!'}
                </p>
                <p className="text-xs text-white truncate font-medium mt-0.5">
                  {liveTranscript ? `"${liveTranscript}"` : 'Di por ejemplo: "¿Qué ropa me pongo hoy?"'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleMicrophone}
              className="px-3 py-1.5 rounded-xl bg-white text-pink-700 font-extrabold text-xs shrink-0 shadow-md"
            >
              Enviar ahora
            </button>
          </div>
        )}

        {voiceError && (
          <div className="px-4 py-2 bg-amber-950/80 border-b border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
            <span>{voiceError}</span>
            <button onClick={() => setVoiceError(null)} className="text-amber-300 font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-950">
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';
            const isSpeakingThis = speakingMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-4 shadow-md ${
                    isAI
                      ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
                      : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-tr-sm'
                  }`}
                >
                  {isAI && (
                    <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-slate-800">
                      <span className="text-[11px] font-bold text-pink-400 flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-current" />
                        <span>Tu Guía Chileno (De Rodrigo para Amorcito)</span>
                      </span>

                      <button
                        onClick={() => handleSpeechToggle(msg.id, msg.text)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                          isSpeakingThis
                            ? 'bg-pink-600 text-white'
                            : 'bg-slate-800 text-sky-300 hover:bg-slate-700'
                        }`}
                      >
                        {isSpeakingThis ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>Detener voz</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Escuchar voz</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</div>

                  <div className="mt-2 flex items-center justify-end gap-2 text-[10px] opacity-70">
                    {msg.isOffline && <span>⚡ Respuesta Offline Instantánea</span>}
                    <span>{msg.time}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-slate-900 border border-pink-500/30 rounded-2xl rounded-tl-sm p-4 text-xs text-pink-200 flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-pink-400 fill-current animate-pulse" />
                <span>Pensando un segundito para responderte bien, mi amorcito... 💕</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick 1-Tap Chips for Amorcito */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-900 overflow-x-auto flex items-center gap-2 shrink-0 no-scrollbar">
          {quickChips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleSendMessage(chip.query, false)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold whitespace-nowrap transition-colors shrink-0 active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Bottom Voice + Text Input Bar (16px font size on mobile prevents iPhone Safari auto-zoom) */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            {/* Giant Microphone Button for Hands-Free Voice */}
            <button
              type="button"
              onClick={handleToggleMicrophone}
              className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl font-extrabold text-xs sm:text-sm transition-all shrink-0 shadow-lg active:scale-95 ${
                isListening || isWaitingPauseBuffer
                  ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white ring-4 ring-pink-500/40'
                  : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white'
              }`}
              title="Hablar con mi voz sin tipear"
            >
              {isListening || isWaitingPauseBuffer ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span>Escuchando...</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>🎙️ Hablar</span>
                </>
              )}
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(undefined, false);
              }}
              className="flex-1 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="O escribe acá, mi amorcito..."
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 focus:border-pink-500 focus:outline-none text-base text-white placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white transition-colors shrink-0"
                title="Enviar mensaje"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
