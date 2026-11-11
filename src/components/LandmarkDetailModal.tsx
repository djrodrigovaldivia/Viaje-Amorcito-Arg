import React, { useState } from 'react';
import { Landmark } from '../data/landmarks';
import { ThreeLandmarkModel } from './ThreeLandmarkModel';
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  MapPin,
  Calendar,
  Compass,
  Award,
  BookOpen,
  Copy,
  Check,
  Share2,
} from 'lucide-react';

interface LandmarkDetailModalProps {
  landmark: Landmark | null;
  onClose: () => void;
  onFlyTo: (landmark: Landmark) => void;
}

export const LandmarkDetailModal: React.FC<LandmarkDetailModalProps> = ({
  landmark,
  onClose,
  onFlyTo,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'model3d'>('info');
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!landmark) return null;

  const copyCoordinates = () => {
    const text = `${landmark.coordinates.lat.toFixed(6)}, ${landmark.coordinates.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleToggleVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(landmark.audioNarration);
      utterance.lang = 'es-AR';
      utterance.rate = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const esVoice =
        voices.find((v) => v.lang.includes('es-AR')) ||
        voices.find((v) => v.lang.includes('es-419')) ||
        voices.find((v) => v.lang.startsWith('es'));
      if (esVoice) utterance.voice = esVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇦🇷</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  {landmark.regionName} • {landmark.province}
                </span>
                {landmark.unesco && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                    <Award className="w-3 h-3" />
                    UNESCO
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {landmark.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Tab Selector */}
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'info'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Información
              </button>
              <button
                onClick={() => setActiveTab('model3d')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'model3d'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Modelo 3D</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'model3d' ? (
            <div className="h-[520px] w-full">
              <ThreeLandmarkModel landmark={landmark} height="100%" />
            </div>
          ) : (
            <>
              {/* Hero Image & Quick Stats Banner */}
              <div className="relative rounded-2xl overflow-hidden h-64 sm:h-80 w-full border border-slate-800 shadow-xl group">
                <img
                  src={landmark.imageUrl}
                  alt={landmark.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-sky-300 border border-sky-400/30 text-xs font-semibold shadow-md">
                    {landmark.categoryLabel}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 border border-amber-400/30 text-xs font-semibold shadow-md">
                    ⭐ {landmark.badge}
                  </span>
                </div>

                {/* Audioguide Voice play button overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <button
                    onClick={handleToggleVoice}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold backdrop-blur-md shadow-xl transition-all ${
                      isSpeaking
                        ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-400/40'
                        : 'bg-slate-900/90 hover:bg-sky-600 text-white border border-slate-700 hover:border-sky-400'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-4 h-4 fill-current" />
                        <span>Detener Narración</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>Reproducir Audioguía en Español</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyCoordinates}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 text-slate-300 text-xs font-medium hover:text-white transition-colors"
                      title="Copiar coordenadas geográficas"
                    >
                      {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCoords ? 'Copiadas' : 'Coordenadas'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Technical Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Altitud</span>
                  <span className="text-lg font-bold text-sky-400 mt-1">
                    {landmark.elevation.toLocaleString()} msnm
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Sobre nivel del mar</span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Ubicación</span>
                  <span className="text-sm font-bold text-white mt-1 truncate">
                    {landmark.province}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{landmark.regionName}</span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Época / Origen</span>
                  <span className="text-sm font-bold text-amber-300 mt-1">
                    {landmark.yearBuiltOrFormed || 'Milenario'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Historia geológica/civil</span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Mejor Época</span>
                  <span className="text-xs font-bold text-emerald-400 mt-1 leading-tight">
                    {landmark.bestSeason}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Clima favorable</span>
                </div>
              </div>

              {/* Description & Long History */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>Historia y Significado Cultural</span>
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {landmark.description}
                </p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {landmark.longHistory}
                </p>
              </div>

              {/* Highlights & Curiosities side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Highlights */}
                <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl space-y-2.5">
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Aspectos Destacados</span>
                  </h4>
                  <ul className="space-y-2">
                    {landmark.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-sky-400 font-bold mt-0.5">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Curiosities */}
                <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl space-y-2.5">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>¿Sabías qué? (Curiosidades y Leyendas)</span>
                  </h4>
                  <ul className="space-y-2">
                    {landmark.curiosities.map((c, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-amber-400 font-bold mt-0.5">✦</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={() => {
              onFlyTo(landmark);
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all"
          >
            <MapPin className="w-4 h-4" />
            <span>Volar a este monumento en el mapa</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'info' ? 'model3d' : 'info')}
            className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>{activeTab === 'info' ? 'Ver Gemelo 3D interactivo' : 'Volver a información'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
