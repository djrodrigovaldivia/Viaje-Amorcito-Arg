import React, { useState } from 'react';
import {
  X,
  Phone,
  ShieldAlert,
  MapPin,
  Copy,
  Check,
  Share2,
  Navigation,
  Heart,
} from 'lucide-react';

interface SOSEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: { lat: number; lng: number; address?: string } | null;
  onRequestLocation: () => void;
}

export const SOSEmergencyModal: React.FC<SOSEmergencyModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  onRequestLocation,
}) => {
  const [copiedCoords, setCopiedCoords] = useState(false);

  if (!isOpen) return null;

  const lat = userLocation?.lat ?? -34.6037;
  const lng = userLocation?.lng ?? -58.3816;
  const googleMapsUrl = `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

  const emergencyWhatsAppText = encodeURIComponent(
    `🆘 Hola, estoy en Buenos Aires y necesito ayuda o compartir mi ubicación actual: ${googleMapsUrl}`
  );

  const handleCopyLocation = () => {
    navigator.clipboard.writeText(
      `Estoy en Buenos Aires en esta ubicación exacta: ${googleMapsUrl}`
    );
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg max-h-[92dvh] flex flex-col bg-slate-950 border-2 border-red-500/70 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-red-950 via-rose-950 to-slate-950 border-b border-red-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/40 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-300 block">
                Asistencia Rápida 24 Horas • Buenos Aires
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                🆘 SOS Policía y Emergencias
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {/* 1. GIANT 911 POLICE BUTTON */}
          <a
            href="tel:911"
            className="w-full p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white shadow-xl shadow-red-600/30 border-2 border-white/30 flex items-center justify-between gap-3 active:scale-[0.98] transition-all"
          >
            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-black/30 text-[10px] font-extrabold uppercase tracking-wider">
                🚓 Llamada Inmediata Gratis
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold leading-tight">
                LLAMAR AL 911 (POLICÍA)
              </h3>
              <p className="text-xs text-red-100">
                Policía de la Ciudad de Buenos Aires — Toca para llamar al tiro
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white text-red-600 flex items-center justify-center shrink-0 shadow-md">
              <Phone className="w-7 h-7 fill-current" />
            </div>
          </a>

          {/* 2. GPS LOCATION SHARING (WHATSAPP & COPY) */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-pink-500/40 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-pink-400 shrink-0" />
                <span className="text-xs font-extrabold text-white">
                  📍 Tu Ubicación GPS para Enviar por WhatsApp
                </span>
              </div>
              <button
                onClick={onRequestLocation}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-pink-600/25 border border-pink-400/40 text-pink-200 text-[11px] font-bold"
              >
                <Navigation className="w-3 h-3" />
                <span>Actualizar GPS</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 font-mono bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              {userLocation
                ? `Lat: ${userLocation.lat.toFixed(5)}, Lng: ${userLocation.lng.toFixed(5)} (Buenos Aires)`
                : 'Toca "Actualizar GPS" o envía tu ubicación directa por WhatsApp'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={`https://wa.me/?text=${emergencyWhatsAppText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar mi GPS por WhatsApp</span>
              </a>

              <button
                onClick={handleCopyLocation}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
              >
                {copiedCoords ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">¡Link de Mapa Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-sky-400" />
                    <span>Copiar Link de mi Ubicación</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3. TOURIST POLICE BUENOS AIRES (COMISARÍA DEL TURISTA) */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-sky-500/40 space-y-2.5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 block">
                Especial para Turistas en CABA (24 hs)
              </span>
              <h4 className="text-sm font-extrabold text-white">
                👮‍♂️ Defensoría y Comisaría del Turista (Buenos Aires)
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                📍 Av. Corrientes 436 (Centro) • Asistencia policial, pérdida de documentos o denuncias.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="tel:08009995000"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Llamar 0800-999-5000</span>
              </a>
              <a
                href="tel:+5491150509260"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-sky-500/40 text-sky-200 text-xs font-extrabold"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>+54 9 11 5050-9260</span>
              </a>
            </div>
          </div>

          {/* 4. MEDICAL AMBULANCE 107 (SAME) & CHILEAN CONSULATE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href="tel:107"
              className="p-3.5 rounded-3xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 flex items-center justify-between gap-2"
            >
              <div>
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase block">
                  Emergencia Médica Gratis
                </span>
                <h4 className="text-sm font-extrabold text-white">🚑 Ambulancia 107 (SAME)</h4>
                <p className="text-[11px] text-slate-400">Toca para llamar al 107</p>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold shrink-0">
                107
              </span>
            </a>

            <a
              href="tel:+541143946582"
              className="p-3.5 rounded-3xl bg-slate-900 hover:bg-slate-800 border border-pink-500/40 flex items-center justify-between gap-2"
            >
              <div>
                <span className="text-[10px] font-extrabold text-pink-400 uppercase block">
                  Av. Roque Sáenz Peña 547
                </span>
                <h4 className="text-sm font-extrabold text-white">🇨🇱 Consulado de Chile</h4>
                <p className="text-[11px] text-slate-400">+54 11 4394-6582</p>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-pink-600 text-white text-xs font-extrabold shrink-0">
                Llamar
              </span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-pink-300 font-semibold">
            <Heart className="w-3.5 h-3.5 fill-current text-pink-400" />
            <span>Cuídate mucho, mi Amorcito 💕</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
