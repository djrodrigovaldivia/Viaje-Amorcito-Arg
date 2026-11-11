import React from 'react';
import {
  X,
  HelpCircle,
  Calendar,
  Sparkles,
  MapPin,
  WifiOff,
  Smartphone,
  Heart,
  Camera,
  CloudSun,
  BookOpen,
} from 'lucide-react';

interface UserHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSchedule: () => void;
  onOpenAI: () => void;
  onOpenDiary?: () => void;
  onOpenWeather?: () => void;
}

export const UserHelpModal: React.FC<UserHelpModalProps> = ({
  isOpen,
  onClose,
  onOpenSchedule,
  onOpenAI,
  onOpenDiary,
  onOpenWeather,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-400">
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Guía de Ayuda para María Ignacia</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                ¿Cómo usar tu App de Argentina 3D?
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {/* Welcome note from Rodrigo */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-sky-950/40 border border-pink-500/30 text-xs text-pink-200 leading-relaxed">
            <p className="font-semibold text-pink-300 text-sm mb-1">
              ¡Hola mi amorcito María Ignacia! 💕
            </p>
            Rodrigo te armó esta aplicación para que sea tu compañera inseparable en Argentina. Todo funciona <strong>100% offline</strong> en tu teléfono para cuando no tengas Wi-Fi en la calle.
          </div>

          {/* Guide Steps Grid */}
          <div className="space-y-3.5">
            {/* Step 1: Diario de Viaje y Fotos */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-950/70 border border-pink-500/30">
              <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 mt-0.5">
                <Camera className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>1. Diario de Viaje (Fotos con tu cámara & Notas)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-medium">¡Nuevo!</span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Pulsá <strong>"Diario"</strong> para tomar fotos directamente con la cámara de tu móvil o subir de tu galería. Podés escribir anécdotas, vincular cada recuerdo a un día de tu itinerario y poner cómo te sentís con emojis. <strong>Todo se guarda en tu teléfono aunque no tengas internet.</strong>
                </p>
              </div>
            </div>

            {/* Step 2: Clima & Qué empacar */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-950/70 border border-sky-500/30">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                <CloudSun className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>2. Clima y Qué empacar / vestir hoy</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-medium">¡Nuevo!</span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Tocá el botón <strong>"Clima"</strong> para consultar el tiempo de tu ubicación actual o de cada ciudad de tu itinerario. Te dice qué ropa ponerte (por ejemplo, abrigo térmico en el sur o ropa impermeable en Iguazú) con consejos de Rodrigo para vos.
                </p>
              </div>
            </div>

            {/* Step 3: Itinerario */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>3. Tu Itinerario y Actividades</span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  En <strong>"Itinerario"</strong> tenés organizados tus días con horarios, notas y atractivos. Podés marcar con un toque lo que ya visitaste, agregar nuevos planes y ver consejos de Rodrigo para cada jornada.
                </p>
              </div>
            </div>

            {/* Step 4: AI Assistant */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>4. Tu Asistente IA Inteligente (Online y Offline)</span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Pulsá <strong>"Guía IA"</strong> para chatear. Podés preguntarle horarios de museos, mejores heladerías o empanadas, cómo usar la tarjeta SUBE o qué empacar. Si no hay Wi-Fi, su motor offline te responde al instante.
                </p>
              </div>
            </div>

            {/* Step 5: GPS Location */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>5. Saber dónde estás con GPS</span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Tocá el botón <strong>"📍 Mi Ubicación"</strong> en el mapa. Aparecerá un pin con tu nombre y un corazón en Argentina, calculando la distancia al punto turístico más cercano.
                </p>
              </div>
            </div>

            {/* Step 6: Install PWA */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>6. Instalar en tu Pantalla de Inicio</span>
                </h4>
                <div className="text-xs text-slate-300 mt-1 space-y-1">
                  <p><strong>En iPhone (Safari):</strong> Tocá el botón <strong>Compartir</strong> (cuadrado con flecha hacia arriba) y elegí <strong>"Agregar a pantalla de inicio"</strong>.</p>
                  <p><strong>En Android (Chrome):</strong> Tocá los tres puntitos y seleccioná <strong>"Instalar App"</strong>.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Hecho con amor por Rodrigo</span>
            <Heart className="w-3 h-3 text-pink-500 fill-current" />
          </div>

          <div className="flex items-center gap-2">
            {onOpenDiary && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDiary();
                }}
                className="px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs font-semibold border border-pink-400/30"
              >
                Abrir Diario
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenSchedule();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
            >
              Ver Itinerario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
