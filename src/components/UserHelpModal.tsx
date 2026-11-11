import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  Volume2,
  VolumeX,
  Heart,
  Mic,
  ShoppingBag,
  Calculator,
  MailOpen,
  ShieldAlert,
} from 'lucide-react';
import { unlockIOSAudio, speakAsRodrigoOrChileanMaleAI, stopAllVoicePlayback } from '../services/voiceService';

interface UserHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSchedule: () => void;
  onOpenAI: () => void;
  onOpenDiary?: () => void;
  onOpenWeather?: () => void;
}

const GUIDE_AUDIO_SCRIPT =
  '¡Hola mi amorcito lindo! Te explico súper cortito cómo usar tu app en Buenos Aires: ' +
  'Primero: En el botón Guía IA, tú mandas. Tócale el micrófono y dile con tu voz qué tienes ganas de hacer: quiero ver ropa usada, dónde tomar once o buscar tiendas tipo Zara baratas, y él te guiará paso a paso. ' +
  'Segundo: En el botón Tiendas, toca los globitos rosados en el mapa para ver las mejores tiendas vintage, outlets al cincuenta por ciento y mall chinos con sus calles exactas y precios. ' +
  'Tercero: En Cambio pesos, calcula al tiro cuánto sale cualquier prenda o comida en pesos chilenos sin internet. ' +
  'Cuarto: En Cartita, te dejé una cartita de amor todos los días con datos de Argentina y tips de moda. ' +
  'Y quinto: Si necesitas cualquier ayuda, el botón rojo SOS novecientos once llama directo a la policía o manda tu GPS por WhatsApp. ' +
  '¡Pásalo increíble en Buenos Aires, mi amorcito!';

export const UserHelpModal: React.FC<UserHelpModalProps> = ({
  isOpen,
  onClose,
  onOpenAI,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isOpen) return null;

  const handleToggleAudio = () => {
    unlockIOSAudio();
    stopAllVoicePlayback();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    speakAsRodrigoOrChileanMaleAI({
      text: GUIDE_AUDIO_SCRIPT,
      isAIResponse: true,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-400">
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Para mi Amorcito 💕</span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                ¿Cómo usar tu App en Buenos Aires?
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              stopAllVoicePlayback();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs sm:text-sm">
          {/* Audio Player Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/70 via-rose-950/60 to-indigo-950/70 border-2 border-pink-500/50 flex items-center justify-between gap-3 shadow-lg">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-300 block">
                🇨🇱 Explicación con Voz de Hombre Chileno
              </span>
              <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                {isSpeaking ? '🔊 Escuchando explicación por voz...' : 'Toca para escucharla hablada:'}
              </h4>
            </div>

            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 shadow-md transition-all ${
                isSpeaking
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 text-white'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? 'Detener' : 'Escuchar Guía'}</span>
            </button>
          </div>

          {/* Step 1 */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-pink-500/40 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-600 flex items-center justify-center text-white shrink-0 mt-0.5">
              <Mic className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-extrabold text-white">1. Guía IA (Tú mandas)</h4>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-pink-500/20 text-pink-300 font-bold">Sin horarios</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Dile con tu voz qué tienes ganas de hacer (*"quiero ver ropa usada"*, *"dónde tomo once"* o *"tiendas tipo Zara baratas"*). Te guiará paso a paso.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-fuchsia-500/40 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-fuchsia-600 flex items-center justify-center text-white shrink-0 mt-0.5">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-white">2. Tiendas (10) en el Mapa</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Toca los globitos rosados en el mapa para ver tiendas de ropa usada (estilo @maria_la_vintage), outlets tipo Zara al 50% y mall chinos con calles y precios.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/40 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 mt-0.5">
              <Calculator className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-white">3. Cambio $ (CLP ↔ ARS)</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Calcula al tiro cuánto cuesta cualquier prenda o comida en pesos chilenos y propina. Funciona 100% offline para que compres tranquila en la calle.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-rose-500/40 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0 mt-0.5">
              <MailOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-white">4. Cartita de Rodrigo 💌</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Se actualiza cada día con datos curiosos de Argentina y tips de moda vintage para que la leas o la escuches con su voz.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-red-500/40 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-white">5. Botón 🆘 SOS 911</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Llama directo con 1 toque al 911 (Policía de Buenos Aires), Comisaría del Turista, Ambulancia 107 o manda tu ubicación GPS por WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950 shrink-0">
          <button
            onClick={() => {
              stopAllVoicePlayback();
              onClose();
              onOpenAI();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Hablar con Guía IA</span>
          </button>

          <button
            onClick={() => {
              stopAllVoicePlayback();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
          >
            ¡Entendido! 💕
          </button>
        </div>
      </div>
    </div>
  );
};
