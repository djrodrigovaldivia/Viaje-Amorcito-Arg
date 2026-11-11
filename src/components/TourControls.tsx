import React, { useState, useEffect, useRef } from 'react';
import { Landmark } from '../data/landmarks';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music,
  HelpCircle,
  Route,
  Sparkles,
  Info,
  Calendar,
  Heart,
  BookOpen,
  CloudSun,
  Camera,
} from 'lucide-react';

interface TourControlsProps {
  landmarks: Landmark[];
  selectedLandmark: Landmark;
  onSelectLandmark: (landmark: Landmark) => void;
  onOpenDetails: (landmark: Landmark) => void;
  onOpenTrivia: () => void;
  onOpenDistance: () => void;
  onOpen3DModel: (landmark: Landmark) => void;
  onOpenSchedule: () => void;
  onOpenDiary: () => void;
  onOpenWeather: () => void;
  onOpenAI: () => void;
  onOpenHelp: () => void;
}

export const TourControls: React.FC<TourControlsProps> = ({
  landmarks,
  selectedLandmark,
  onSelectLandmark,
  onOpenDetails,
  onOpenTrivia,
  onOpenDistance,
  onOpen3DModel,
  onOpenSchedule,
  onOpenDiary,
  onOpenWeather,
  onOpenAI,
  onOpenHelp,
}) => {
  const [isPlayingAutoTour, setIsPlayingAutoTour] = useState(false);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [isAmbientSoundOn, setIsAmbientSoundOn] = useState(false);
  const [tourSpeed, setTourSpeed] = useState<number>(14); // seconds per stop

  // Web Audio Context reference for ambient soundscape
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const ambientOscsRef = useRef<{ stop: () => void }[]>([]);

  // Find index of current landmark
  const currentIndex = landmarks.findIndex((l) => l.id === selectedLandmark.id);

  // Auto-tour timer
  useEffect(() => {
    if (!isPlayingAutoTour) return;

    const timer = setInterval(() => {
      const nextIdx = (currentIndex + 1) % landmarks.length;
      onSelectLandmark(landmarks[nextIdx]);
    }, tourSpeed * 1000);

    return () => clearInterval(timer);
  }, [isPlayingAutoTour, currentIndex, landmarks, onSelectLandmark, tourSpeed]);

  // Speech Synthesis Audioguide Handler (Male Chilean Voice)
  const speakNarration = (text: string) => {
    if (typeof window === 'undefined') return;
    import('../services/voiceService').then(({ speakAsRodrigoOrChileanMaleAI, unlockIOSAudio }) => {
      unlockIOSAudio();
      speakAsRodrigoOrChileanMaleAI({
        text: `Mira mi amorcito: ${text}`,
        onStart: () => setIsSpeakingAudio(true),
        onEnd: () => setIsSpeakingAudio(false),
      });
    });
  };

  const toggleSpeech = () => {
    if (isSpeakingAudio) {
      import('../services/voiceService').then(({ stopAllVoicePlayback }) => {
        stopAllVoicePlayback();
        setIsSpeakingAudio(false);
      });
    } else {
      speakNarration(selectedLandmark.audioNarration);
    }
  };

  // If auto-tour is on, automatically narrate landmark
  useEffect(() => {
    if (isPlayingAutoTour) {
      speakNarration(selectedLandmark.audioNarration);
    }
  }, [selectedLandmark.id, isPlayingAutoTour]);

  // Web Audio procedural ambient soundscape (gentle breeze & Andean tones)
  const toggleAmbientSound = () => {
    if (isAmbientSoundOn) {
      // Turn off
      ambientOscsRef.current.forEach((o) => o.stop());
      ambientOscsRef.current = [];
      setIsAmbientSoundOn(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = audioCtxRef.current || new AudioCtx();
        audioCtxRef.current = ctx;

        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.08, ctx.currentTime);
        masterGain.connect(ctx.destination);
        ambientGainRef.current = masterGain;

        // White noise for soft patagonian wind / waterfall breeze
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Lowpass filter to simulate deep wind
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, ctx.currentTime);

        const windGain = ctx.createGain();
        windGain.gain.setValueAtTime(0.04, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(windGain);
        windGain.connect(masterGain);
        whiteNoise.start();

        // Harmonious Andean drone chord (Pentatonic A minor: A2, E3, A3, C4)
        const freqs = [110, 164.81, 220, 261.63];
        const oscList: { stop: () => void }[] = [];

        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          const lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.2 + idx * 0.1, ctx.currentTime);
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(0.02, ctx.currentTime);
          lfo.connect(lfoGain.gain);

          const oscGain = ctx.createGain();
          oscGain.gain.setValueAtTime(0.025, ctx.currentTime);

          osc.connect(oscGain);
          oscGain.connect(masterGain);

          osc.start();
          lfo.start();

          oscList.push({
            stop: () => {
              try {
                osc.stop();
                lfo.stop();
              } catch (_) {}
            },
          });
        });

        oscList.push({
          stop: () => {
            try {
              whiteNoise.stop();
            } catch (_) {}
          },
        });

        ambientOscsRef.current = oscList;
        setIsAmbientSoundOn(true);
      } catch (err) {
        console.error('Ambient audio error:', err);
      }
    }
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % landmarks.length;
    onSelectLandmark(landmarks[nextIdx]);
  };

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + landmarks.length) % landmarks.length;
    onSelectLandmark(landmarks[prevIdx]);
  };

  return (
    <div className="w-full bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-4 py-3 text-slate-100 shadow-2xl z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Landmark Title & Region Tag */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group cursor-pointer" onClick={() => onOpenDetails(selectedLandmark)}>
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-sky-400/40 shadow-md">
              <img
                src={selectedLandmark.imageUrl}
                alt={selectedLandmark.shortTitle}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="absolute inset-0 rounded-xl ring-2 ring-sky-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-slate-950/40">
              <Info className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                Parada {currentIndex + 1} de {landmarks.length}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] text-slate-400 font-medium">
                {selectedLandmark.province}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>{selectedLandmark.name}</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Center: Tour Player Controls */}
        <div className="flex items-center gap-2 md:gap-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl px-4 py-2 shadow-inner">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Parada anterior"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlayingAutoTour(!isPlayingAutoTour)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all shadow-md ${
              isPlayingAutoTour
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-2 ring-amber-400/50'
                : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white'
            }`}
          >
            {isPlayingAutoTour ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pausar Tour</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Tour Automático</span>
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Siguiente parada"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-800 mx-1 hidden sm:block" />

          {/* Audioguide Voice Button */}
          <button
            onClick={toggleSpeech}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              isSpeakingAudio
                ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-300 animate-pulse'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title="Escuchar narración en español"
          >
            {isSpeakingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
                <span>Detener Voz</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Audioguía</span>
              </>
            )}
          </button>

          {/* Ambient Soundscape Button */}
          <button
            onClick={toggleAmbientSound}
            className={`p-2 rounded-xl text-xs transition-all ${
              isAmbientSoundOn
                ? 'bg-indigo-500/25 border border-indigo-400 text-indigo-300'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isAmbientSoundOn ? 'Silenciar atmósfera andina' : 'Activar sonido ambiental'}
          >
            <Music className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Maria's Travel Diary */}
          <button
            onClick={onOpenDiary}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 border border-pink-400/40 text-pink-300 text-xs font-semibold transition-all shadow-sm"
            title="Diario de Viaje: Fotos y notas guardadas en tu teléfono"
          >
            <Camera className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Diario</span>
          </button>

          {/* Weather & Packing */}
          <button
            onClick={onOpenWeather}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-300 text-xs font-semibold transition-all shadow-sm"
            title="Clima actual y qué empacar"
          >
            <CloudSun className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Clima</span>
          </button>

          {/* Maria's Itinerary */}
          <button
            onClick={onOpenSchedule}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm"
            title="Ver y editar tu itinerario en Argentina"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden md:inline">Itinerario</span>
          </button>

          {/* AI Guide for Maria Ignacia */}
          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20"
            title="Consultar a la IA sobre horarios, consejos y lugares"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Guía IA</span>
          </button>

          {/* 3D Model Modal Trigger */}
          <button
            onClick={() => onOpen3DModel(selectedLandmark)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-300 text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Gemelo 3D</span>
          </button>

          {/* Help walkthrough modal */}
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-semibold transition-all"
            title="Ayuda: cómo usar la app"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Ayuda</span>
          </button>
        </div>
      </div>
    </div>
  );
};
