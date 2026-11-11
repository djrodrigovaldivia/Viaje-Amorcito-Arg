import React, { useState } from 'react';
import { Heart, Sparkles, Volume2, Upload, RotateCcw, X } from 'lucide-react';
import { unlockIOSAudio, speakAsRodrigoOrChileanMaleAI, stopAllVoicePlayback } from '../services/voiceService';

interface CatWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDailyLetter?: () => void;
}

const CUSTOM_CAT_PHOTO_KEY = 'amorcito_custom_cat_photo_v1';
const DEFAULT_CAT_PHOTO = '/assets/gatito-amorcito.jpg';

export const CatWelcomeModal: React.FC<CatWelcomeModalProps> = ({
  isOpen,
  onClose,
  onOpenDailyLetter,
}) => {
  const [catPhotoSrc, setCatPhotoSrc] = useState<string>(() => {
    try {
      return localStorage.getItem(CUSTOM_CAT_PHOTO_KEY) || DEFAULT_CAT_PHOTO;
    } catch (_) {
      return DEFAULT_CAT_PHOTO;
    }
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isOpen) return null;

  const handlePlayGreeting = () => {
    unlockIOSAudio();
    stopAllVoicePlayback();
    speakAsRodrigoOrChileanMaleAI({
      text: 'Hola mamiii, que tengas un hermoso día, miaauu. Te esperamos en casita con Rodrigo, mi amorcito lindo.',
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
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
      <div className="relative w-full max-w-md bg-slate-950 border-2 border-pink-500/50 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92dvh]">
        {/* Top Close & Photo Options Bar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <label
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-[11px] font-bold text-slate-200 cursor-pointer shadow-lg backdrop-blur-sm transition-colors"
              title="Cambiar o subir la foto desde tu celular o computador (queda guardada 100% offline)"
            >
              <Upload className="w-3 h-3 text-pink-400" />
              <span>Cambiar foto</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadCustomPhoto}
              />
            </label>
            {catPhotoSrc !== DEFAULT_CAT_PHOTO && (
              <button
                onClick={handleResetPhoto}
                className="p-1.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-slate-300"
                title="Volver a la foto por defecto"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              stopAllVoicePlayback();
              onClose();
            }}
            className="p-2 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white shadow-lg transition-colors"
            aria-label="Cerrar saludo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cat Photo Container */}
        <div className="relative w-full h-72 sm:h-80 bg-slate-900 overflow-hidden shrink-0">
          <img
            src={catPhotoSrc}
            alt="Hola mamiii que tengas un hermoso dia -_- , miaauu"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-transparent" />

          {/* Cute Floating Paw Badge */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-600/90 border border-white/30 text-white text-xs font-extrabold shadow-lg">
              <span>🐾</span>
              <span>Mensaje desde casita para ti 💕</span>
            </span>

            <button
              onClick={handlePlayGreeting}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold shadow-lg border transition-all ${
                isSpeaking
                  ? 'bg-emerald-600 border-white text-white animate-pulse'
                  : 'bg-slate-950/90 hover:bg-slate-900 border-pink-400/50 text-pink-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-pink-400" />
              <span>{isSpeaking ? 'Escuchando...' : 'Escuchar 🔊'}</span>
            </button>
          </div>
        </div>

        {/* Exact Message Bubble Requested by Rodrigo */}
        <div className="p-5 sm:p-6 space-y-4 text-center overflow-y-auto">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/15 via-rose-500/15 to-purple-500/15 border border-pink-400/40 shadow-inner">
            <p className="text-lg sm:text-xl font-extrabold text-white leading-snug tracking-tight">
              "Hola mamiii que tengas un hermoso dia  -_- , miaauu"
            </p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Aquí te estamos cuidando y acompañando en cada pasito por Argentina, mi Amorcito lindo 🐱❤️
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            {onOpenDailyLetter && (
              <button
                onClick={() => {
                  stopAllVoicePlayback();
                  onClose();
                  onOpenDailyLetter();
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-pink-500/40 text-pink-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>💌 Ver Cartita y Tips de Hoy</span>
              </button>
            )}

            <button
              onClick={() => {
                unlockIOSAudio();
                stopAllVoicePlayback();
                onClose();
              }}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>¡Gracias mi bebé, miaauu! 💕</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
