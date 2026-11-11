import React, { useState } from 'react';
import {
  Heart,
  Volume2,
  VolumeX,
  Upload,
  RotateCcw,
  X,
  Mic,
  ShoppingBag,
  Calculator,
  MailOpen,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Headphones,
} from 'lucide-react';
import { unlockIOSAudio, speakAsRodrigoOrChileanMaleAI, stopAllVoicePlayback } from '../services/voiceService';

interface CatWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDailyLetter?: () => void;
  initialTab?: 'cat' | 'guide';
}

const CUSTOM_CAT_PHOTO_KEY = 'amorcito_custom_cat_photo_v2';
const DEFAULT_CAT_PHOTO = '/assets/gatito-amorcito.jpg?v=2';

const GUIDE_AUDIO_SCRIPT =
  '¡Hola mi amorcito lindo! Te cuento al tiro y súper cortito cómo usar tu app en Buenos Aires: ' +
  'Primero, en el botón Guía IA, tú mandas. Tócale el micrófono y dile con tu voz qué tienes ganas de hacer: quiero ver ropa usada, dónde tomo un cafecito o llévame a tiendas tipo Zara baratas, y él te guiará paso a paso. ' +
  'Segundo, en el botón Tiendas, toca los globitos rosados en el mapa para ver las mejores tiendas vintage estilo María La Vintage, outlets al cincuenta por ciento y mall chinos con sus calles exactas y precios. ' +
  'Tercero, en Cambio pesos, calcula al tiro cuánto sale cualquier prenda o comida en pesos chilenos sin internet. ' +
  'Cuarto, en Cartita, te dejé una cartita de amor todos los días con datos curiosos de Argentina y tips de moda. ' +
  'Y quinto, si necesitas cualquier ayuda, el botón rojo SOS novecientos once llama directo a la policía o manda tu GPS por WhatsApp. ' +
  '¡Pásalo increíble en Buenos Aires, mi amorcito!';

export const CatWelcomeModal: React.FC<CatWelcomeModalProps> = ({
  isOpen,
  onClose,
  onOpenDailyLetter,
  initialTab = 'cat',
}) => {
  const [activeTab, setActiveTab] = useState<'cat' | 'guide'>(initialTab);
  const [catPhotoSrc, setCatPhotoSrc] = useState<string>(() => {
    try {
      return localStorage.getItem(CUSTOM_CAT_PHOTO_KEY) || DEFAULT_CAT_PHOTO;
    } catch (_) {
      return DEFAULT_CAT_PHOTO;
    }
  });
  const [isSpeakingCat, setIsSpeakingCat] = useState(false);
  const [isSpeakingGuide, setIsSpeakingGuide] = useState(false);

  if (!isOpen) return null;

  const handlePlayCatGreeting = () => {
    unlockIOSAudio();
    stopAllVoicePlayback();
    setIsSpeakingGuide(false);
    if (isSpeakingCat) {
      setIsSpeakingCat(false);
      return;
    }
    speakAsRodrigoOrChileanMaleAI({
      text: 'Hola mamiii, que tengas un hermoso día, miaauu. Te esperamos en casita con Rodrigo, mi amorcito lindo.',
      onStart: () => setIsSpeakingCat(true),
      onEnd: () => setIsSpeakingCat(false),
    });
  };

  const handleToggleGuideAudio = () => {
    unlockIOSAudio();
    stopAllVoicePlayback();
    setIsSpeakingCat(false);
    if (isSpeakingGuide) {
      setIsSpeakingGuide(false);
      return;
    }
    speakAsRodrigoOrChileanMaleAI({
      text: GUIDE_AUDIO_SCRIPT,
      isAIResponse: true,
      onStart: () => setIsSpeakingGuide(true),
      onEnd: () => setIsSpeakingGuide(false),
    });
  };

  const handleUploadCustomPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 960;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setCatPhotoSrc(dataUrl);
          try {
            localStorage.setItem(CUSTOM_CAT_PHOTO_KEY, dataUrl);
          } catch (_) {}
        }
      };
      if (typeof ev.target?.result === 'string') {
        img.src = ev.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetPhoto = () => {
    setCatPhotoSrc(DEFAULT_CAT_PHOTO);
    try {
      localStorage.removeItem(CUSTOM_CAT_PHOTO_KEY);
    } catch (_) {}
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-slate-950 border-2 border-pink-500/60 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[94dvh]">
        
        {/* Navigation Tabs Header: Cat Greeting + How to Use Guide */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('cat')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'cat'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>🐱</span>
              <span>Mensaje Gatita</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'guide'
                  ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-pink-400" />
              <span>¿Cómo usar tu App?</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {activeTab === 'cat' && (
              <label
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors"
                title="Cambiar foto de la gatita"
              >
                <Upload className="w-3 h-3 text-pink-400" />
                <span className="hidden sm:inline">Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadCustomPhoto}
                />
              </label>
            )}

            {catPhotoSrc !== DEFAULT_CAT_PHOTO && activeTab === 'cat' && (
              <button
                onClick={handleResetPhoto}
                className="p-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300"
                title="Volver a la foto original"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => {
                stopAllVoicePlayback();
                onClose();
              }}
              className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label="Cerrar ventana"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TAB 1: CAT PHOTO & EXACT GREETING */}
        {activeTab === 'cat' && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Real Cat Photo */}
            <div className="relative w-full h-60 sm:h-64 bg-slate-900 overflow-hidden shrink-0">
              <img
                src={catPhotoSrc}
                alt="Hola mamiii que tengas un hermoso dia -_- , miaauu"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              {/* Floating Audio Playback Pill */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-600/90 border border-white/30 text-white text-xs font-extrabold shadow-lg">
                  <span>🐾</span>
                  <span>Mensaje de tu gatita 💕</span>
                </span>

                <button
                  onClick={handlePlayCatGreeting}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-lg border transition-all ${
                    isSpeakingCat
                      ? 'bg-emerald-600 border-white text-white animate-pulse'
                      : 'bg-slate-950/90 hover:bg-slate-900 border-pink-400/50 text-pink-200'
                  }`}
                >
                  {isSpeakingCat ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-pink-400" />}
                  <span>{isSpeakingCat ? 'Detener' : 'Escuchar 🔊'}</span>
                </button>
              </div>
            </div>

            {/* Exact Cat Message Bubble */}
            <div className="p-4 sm:p-5 space-y-3 text-center flex-1 flex flex-col justify-between">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-500/15 via-rose-500/15 to-purple-500/15 border border-pink-400/40 shadow-inner">
                <p className="text-base sm:text-lg font-extrabold text-white leading-snug tracking-tight">
                  "Hola mamiii que tengas un hermoso dia  -_- , miaauu"
                </p>
              </div>

              {/* Quick Audio & Visual Guide Invite Banner */}
              <div className="p-3 rounded-2xl bg-slate-900/95 border border-pink-500/30 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-pink-400" />
                    <span>¿Cómo usar tu app? (Voz Chilena o Lectura)</span>
                  </span>
                  <button
                    onClick={handleToggleGuideAudio}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all shadow-md ${
                      isSpeakingGuide
                        ? 'bg-emerald-600 text-white animate-pulse'
                        : 'bg-pink-600 hover:bg-pink-500 text-white'
                    }`}
                  >
                    {isSpeakingGuide ? <VolumeX className="w-3 h-3" /> : <Headphones className="w-3 h-3" />}
                    <span>{isSpeakingGuide ? 'Detener Voz' : '🔊 Escuchar Guía'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <p className="line-clamp-1 text-slate-300">
                    5 funciones explicadas en 30 segundos sin enredos
                  </p>
                  <button
                    onClick={() => setActiveTab('guide')}
                    className="text-pink-300 hover:text-white font-extrabold shrink-0 flex items-center gap-0.5 ml-2"
                  >
                    <span>Ver pasos</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {onOpenDailyLetter && (
                  <button
                    onClick={() => {
                      stopAllVoicePlayback();
                      onClose();
                      onOpenDailyLetter();
                    }}
                    className="flex-1 py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-pink-500/40 text-pink-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span>💌 Cartita de Hoy</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    unlockIOSAudio();
                    stopAllVoicePlayback();
                    onClose();
                  }}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>¡Entrar al Mapa, miaauu! 💕</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HOW TO USE THE APP (SIMPLE, VISUAL CARDS + CHILEAN AUDIO GUIDE) */}
        {activeTab === 'guide' && (
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 text-xs sm:text-sm">
            
            {/* Top Chilean Voice Player Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/70 via-rose-950/60 to-indigo-950/70 border-2 border-pink-500/50 flex items-center justify-between gap-3 shadow-lg">
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-300 block">
                  🇨🇱 Explicación con Voz de Hombre Chileno
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">
                  {isSpeakingGuide ? '🔊 Hablando explicación con voz chilena...' : 'Toca para que te lo explique por voz:'}
                </h3>
              </div>

              <button
                onClick={handleToggleGuideAudio}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 shadow-md transition-all ${
                  isSpeakingGuide
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white'
                }`}
              >
                {isSpeakingGuide ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Detener</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Escuchar Guía</span>
                  </>
                )}
              </button>
            </div>

            {/* Step 1: AI Chilean Voice Guide */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-pink-500/40 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-600 flex items-center justify-center text-white shrink-0 shadow-md mt-0.5">
                <Mic className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-white">
                    1. Botón "Guía IA" (Voz Chilena)
                  </h4>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-pink-500/20 text-pink-300 font-bold">¡Tú mandas!</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                  <strong>Cero horarios:</strong> Tócale el micrófono y dile con tu voz qué tienes ganas de hacer (*"quiero ver ropa usada"*, *"dónde tomo once"* o *"tiendas tipo Zara baratas"*). Te guiará paso a paso.
                </p>
              </div>
            </div>

            {/* Step 2: Vintage & Zara Map Layer */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-fuchsia-500/40 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-fuchsia-600 flex items-center justify-center text-white shrink-0 shadow-md mt-0.5">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-extrabold text-white">
                  2. Botón "Tiendas (10)" en el Mapa
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                  Toca los globitos rosados en el mapa de Buenos Aires para ver las 10 mejores tiendas de ropa usada (estilo @maria_la_vintage), outlets tipo Zara al 50% y mall chinos con calles y precios.
                </p>
              </div>
            </div>

            {/* Step 3: Currency Converter */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/40 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md mt-0.5">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-extrabold text-white">
                  3. Botón "Cambio $" (CLP ↔ ARS)
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                  Calcula al instante cuánto cuesta cualquier prenda o comida en pesos chilenos y propina. Funciona 100% offline para que compres tranquila en la calle.
                </p>
              </div>
            </div>

            {/* Step 4: Daily Love Letter */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-rose-500/40 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-md mt-0.5">
                <MailOpen className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-extrabold text-white">
                  4. Botón "Cartita 💌"
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                  Rodrigo te actualiza una cartita de amor cada día con datos entretenidos de Argentina y tips de moda vintage para que la leas o la escuches con su voz.
                </p>
              </div>
            </div>

            {/* Step 5: SOS Police */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-red-500/40 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-extrabold text-white">
                  5. Botón "🆘 SOS 911"
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                  Llama directo con 1 toque al <strong>911 (Policía de Buenos Aires)</strong>, <strong>Comisaría del Turista</strong>, <strong>107 (Ambulancia)</strong> o manda tu ubicación GPS por WhatsApp.
                </p>
              </div>
            </div>

            {/* Action Bar inside Guide */}
            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setActiveTab('cat')}
                className="py-2.5 px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-extrabold text-xs"
              >
                ← Volver a la foto de la gatita
              </button>

              <button
                onClick={() => {
                  unlockIOSAudio();
                  stopAllVoicePlayback();
                  onClose();
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>¡Entendido! Entrar a la App 💕</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
