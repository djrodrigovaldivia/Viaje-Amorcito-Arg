import React, { useState, useRef, useEffect } from 'react';
import { DaySchedule } from '../types/schedule';
import { generateOfflineResponse } from '../utils/offlineAIEngine';
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
}

export const MariaAIAssistantModal: React.FC<MariaAIAssistantModalProps> = ({
  isOpen,
  onClose,
  itinerary,
  userLocation,
  onRequestUserLocation,
  isOnline,
  onOpenHelp,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `¡Hola mi querida María Ignacia! 💕🇦🇷\n\nSoy tu asistente de viaje personal en Argentina, preparado con todo el amor por Rodrigo para cuidarte y guiarte en cada rincón.\n\nPodés preguntarme sobre tus horarios, qué hacer en tus días libres, dónde estás parada con tu GPS, o pedirme recomendaciones de comida, paseos y transporte. ¡Incluso si te quedas sin Wi-Fi en la calle sigo funcionando para vos!`,
      time: 'Ahora',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'maria',
      text: query,
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // If browser is offline or user lacks internet, use offline engine immediately
    if (!navigator.onLine) {
      setTimeout(() => {
        const offlineReply = generateOfflineResponse({
          message: query,
          itinerary,
          userLocation,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: `reply-${Date.now()}`,
            sender: 'ai',
            text: offlineReply,
            time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            isOffline: true,
          },
        ]);
        setIsLoading(false);
      }, 350);
      return;
    }

    // Try calling server-side Gemini API
    try {
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
      const reply = data.reply || generateOfflineResponse({ message: query, itinerary, userLocation });

      setMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          isOffline: false,
        },
      ]);
    } catch (err) {
      console.warn('Network or AI API error, switching to Offline Smart Engine:', err);
      // Fallback seamlessly to offline engine
      const offlineReply = generateOfflineResponse({
        message: query,
        itinerary,
        userLocation,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          sender: 'ai',
          text: `${offlineReply}\n\n*(Nota: Respuesta procesada con la guía local de tu teléfono por falta de Wi-Fi)*`,
          time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          isOffline: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeechToggle = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#•]/g, ''));
      utterance.lang = 'es-AR';
      utterance.rate = 0.95;

      utterance.onstart = () => setSpeakingMsgId(msgId);
      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl h-[88vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-pink-500 border-2 border-slate-900 flex items-center justify-center text-[8px] text-white">
                ❤️
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Guía IA de María Ignacia</span>
                </h3>

                {/* Connectivity Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    isOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <Wifi className="w-2.5 h-2.5" />
                      <span>Wi-Fi Activo</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-2.5 h-2.5" />
                      <span>Modo Offline</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Creada por Rodrigo con amor • Respuestas online y offline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenHelp}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold border border-slate-700 transition-colors"
              title="Ver guía de ayuda sobre cómo usar la app"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ayuda</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => handleSendMessage('¿Dónde estoy parada y qué monumentos tengo cerca?')}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-sky-300 whitespace-nowrap transition-colors border border-slate-700"
          >
            <MapPin className="w-3 h-3 text-sky-400" />
            <span>¿Dónde estoy?</span>
          </button>

          <button
            onClick={() => handleSendMessage('¿Qué clima hace hoy y qué ropa me conviene empacar o ponerme?')}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-[11px] font-medium text-sky-300 whitespace-nowrap transition-colors border border-sky-400/40"
          >
            <span>🌤️ ¿Qué clima hace y qué me pongo?</span>
          </button>

          <button
            onClick={() => handleSendMessage('¿Cómo uso el Diario de Viaje para guardar fotos con mi cámara?')}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-[11px] font-medium text-pink-300 whitespace-nowrap transition-colors border border-pink-400/40"
          >
            <span>📸 Mi Diario de Fotos</span>
          </button>

          <button
            onClick={() => handleSendMessage('¿Cuál es mi itinerario y los horarios de hoy?')}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-300 whitespace-nowrap transition-colors border border-slate-700"
          >
            <Clock className="w-3 h-3 text-sky-400" />
            <span>Mis horarios de hoy</span>
          </button>

          <button
            onClick={() => handleSendMessage('¿A qué hora abren las Cataratas del Iguazú y el Teatro Colón?')}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-amber-300 whitespace-nowrap transition-colors border border-slate-700"
          >
            <span>⏰ Horarios de apertura</span>
          </button>

          <button
            onClick={() => handleSendMessage('¿Dónde comer los mejores helados de dulce de leche y empanadas?')}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-pink-300 whitespace-nowrap transition-colors border border-slate-700"
          >
            <span>🍴 Helados & Comida</span>
          </button>

          <button
            onClick={() => handleSendMessage('¿Cómo me muevo en Buenos Aires? ¿Cómo consigo la tarjeta SUBE?')}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-emerald-300 whitespace-nowrap transition-colors border border-slate-700"
          >
            <span>🚇 Tarjeta SUBE</span>
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {isAI && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-md text-xs sm:text-sm leading-relaxed ${
                    isAI
                      ? 'bg-slate-950/80 border border-slate-800 text-slate-200'
                      : 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-slate-800/50 text-[10px] text-slate-400">
                    <span>{msg.time}</span>

                    {isAI && (
                      <div className="flex items-center gap-2">
                        {msg.isOffline && (
                          <span className="text-amber-400 text-[9px] font-mono">
                            Modo Local Offline
                          </span>
                        )}
                        <button
                          onClick={() => handleSpeechToggle(msg.id, msg.text)}
                          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                          title="Escuchar mensaje en voz alta"
                        >
                          {speakingMsgId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                          <span>{speakingMsgId === msg.id ? 'Parar' : 'Escuchar'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <Sparkles className="w-4 h-4 text-sky-400 animate-spin" />
              <span>Pensando la mejor respuesta para vos, María Ignacia...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={onRequestUserLocation}
              className={`p-2.5 rounded-xl border transition-all ${
                userLocation
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Compartir o actualizar mi ubicación GPS actual"
            >
              <MapPin className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder="Preguntale a tu guía sobre horarios, lugares, traslados..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-sky-400"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-40 text-white font-bold transition-all shadow-md shadow-sky-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
