import React, { useState, useRef, useEffect } from 'react';
import { DaySchedule } from '../types/schedule';
import { VINTAGE_AND_SHOPPING_SPOTS, VintageFashionSpot } from '../data/vintageFashionSpots';
import {
  DailyExchangeRates,
  getSavedExchangeRates,
  saveExchangeRates,
  syncDailyExchangeRates,
  getDailyRodrigoLetter,
  saveCustomRodrigoLetter,
  clearCustomRodrigoLetter,
} from '../services/currencyAndLetterService';
import {
  RodrigoVoiceSlotId,
  RodrigoVoiceRecording,
  RodrigoVoiceSettings,
  getAllRodrigoRecordings,
  saveRodrigoRecording,
  deleteRodrigoRecording,
  getRodrigoVoiceSettings,
  saveRodrigoVoiceSettings,
  speakAsRodrigoOrChileanMaleAI,
  stopAllVoicePlayback,
  unlockIOSAudio,
} from '../services/voiceService';
import {
  X,
  Heart,
  Calendar,
  MapPin,
  Camera,
  CloudSun,
  Sparkles,
  Volume2,
  VolumeX,
  Calculator,
  ShieldAlert,
  Phone,
  MailOpen,
  Navigation,
  ArrowRightLeft,
  CheckCircle2,
  Mic,
  Square,
  Upload,
  Trash2,
  Play,
  Sliders,
  RefreshCw,
  ShoppingBag,
  Edit3,
} from 'lucide-react';

export type QuickHubTab = 'menu' | 'calculator' | 'letters' | 'fashion' | 'voice-studio' | 'sos';

interface MariaQuickHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: DaySchedule[];
  userLocation: { lat: number; lng: number; address?: string } | null;
  onRequestLocation: () => void;
  onOpenSchedule: () => void;
  onOpenDiary: () => void;
  onOpenWeather: () => void;
  onOpenAI: (startWithMic?: boolean) => void;
  onOpenIntro: () => void;
  onOpenTrivia: () => void;
  onOpenDistance: () => void;
  onFlyToVintageSpot?: (spotId: string) => void;
  initialTab?: QuickHubTab;
}

interface LoveLetter {
  id: RodrigoVoiceSlotId;
  emoji: string;
  moment: string;
  title: string;
  content: string;
}

export const RODRIGO_LOVE_LETTERS: LoveLetter[] = [
  {
    id: 'letter-1',
    emoji: '✈️',
    moment: 'Ábrela cuando llegues a Argentina o al hotel',
    title: '¡Bienvenida a tu aventura, mi amorcito lindo!',
    content:
      'Mi amorcito preciosa: si estás leyendo o escuchando esto, es porque ya estás en Argentina viviendo este viaje tan lindo. Quiero que sepas que aunque mis pies no estén caminando al lado tuyo en este segundo, mi corazón viajó contigo en tu maleta. Hice cada detalle de esta aplicación pensando en cómo cuidarte, cómo hacerte todo más fácil en tu iPhone y cómo sacarte una sonrisa. Además te armé toda una capa en el mapa con tiendas de ropa usada estilo @maria_la_vintage, tiendas tipo Zara nada caras y mall chinos. Disfruta cada rincón y acuérdate a cada instante de lo mucho que te amo po, mi amorcito.',
  },
  {
    id: 'letter-2',
    emoji: '🥺',
    moment: 'Ábrela si me extrañas mientras caminas o vitrineas',
    title: 'Cuando me eches de menos en la calle...',
    content:
      '¡Hola mi amorcito! ¿Me estabas extrañando un poquito? Yo te extraño caleta, a cada minuto del día. Cierra los ojos tres segundos, respira profundo e imagina que te estoy dando uno de esos abrazos apretados que tanto nos gustan y un besito en la frente mientras te acompaño a mirar percheros de ropa linda. Nunca estás sola mi amorcito, porque estoy pendiente de ti y esperando que me muestres todas las joyitas que encontraste. ¡Te amo con toda mi alma!',
  },
  {
    id: 'letter-3',
    emoji: '🥐',
    moment: 'Ábrela cuando estés tomando once o un cafecito',
    title: 'Un cafecito y una medialuna contigo a la distancia',
    content:
      'Mi amorcito lindo, qué rico que hiciste una pausa después de caminar y vitrinear para descansar los pies y comer algo rico. Pídete una medialuna calentita o unos Franui de chocolate por mí. Me encanta imaginarte sentada tranquila, mirando la ciudad con esos ojitos tan hermosos que tienes y ese estilo único tuyo. Descansa bien las piernas y disfruta este ratito para ti po, mi vida.',
  },
  {
    id: 'letter-4',
    emoji: '🏔️',
    moment: 'Ábrela frente a un paisaje o lugar impresionante',
    title: 'Lo más hermoso de ese paisaje eres tú',
    content:
      'Sé que lo que tienes enfrente en este momento debe ser maravilloso, mi amorcito... pero te prometo que ni el monumento más famoso, ni la tienda más linda de Buenos Aires se comparan con lo preciosa que te ves tú sonriendo ahí. Saca una foto con el botón de tu Diario de Viaje para que quede guardada en tu iPhone y me la muestres al volver. ¡Eres el amor de mi vida!',
  },
  {
    id: 'letter-5',
    emoji: '🧥',
    moment: 'Ábrela si tienes frío o estás cansadita',
    title: 'Abrígate mucho y cuídate por mí, mi amorcito',
    content:
      'Amorcito mío, si sientes frío o ya estás cansada de tanto caminar con bolsas, hazme caso: ponte bien tu blazer o tu abrigo, tómate algo calentito y no te exijas de más. Este viaje es para que lo pases bacán a tu propio ritmo, sin ningún apuro. Si quieres volver al hotel a descansar calentita y probarte tranquila lo que compraste, hazlo con toda calma. Aquí te espero siempre con todo mi amor.',
  },
  {
    id: 'letter-6',
    emoji: '🌙',
    moment: 'Ábrela en la noche antes de dormir',
    title: 'Buenas noches, mi amorcito hermoso',
    content:
      'Ya terminó otro día increíble de tu viaje, mi amorcito. Espero que hoy hayas conocido lugares mágicos, que hayas vitrineado ropa preciosa y que te sientas feliz. Acuéstate cómoda, deja cargando tu iPhone para mañana y duerme súper tranquila. Desde Chile te mando el beso de buenas noches más dulce del mundo. Sueña bonito mi amorcito, mañana será otro gran día. ¡Te amo infinito!',
  },
];

const VOICE_SLOTS_META: { slotId: RodrigoVoiceSlotId; title: string; subtitle: string }[] = [
  {
    slotId: 'intro',
    title: '🎙️ Audio de Bienvenida Real de Rodrigo',
    subtitle: 'Suena cuando tu amorcito abre el mensaje de bienvenida de la app',
  },
  {
    slotId: 'ai-greeting',
    title: '💬 Saludo Corto para la Guía IA',
    subtitle: 'Ej: "¡Hola mi amorcito lindo, mira te cuento!" (suena antes de las respuestas de la IA)',
  },
  ...RODRIGO_LOVE_LETTERS.map((l, idx) => ({
    slotId: l.id,
    title: `${l.emoji} Cartita #${idx + 1}: ${l.title}`,
    subtitle: l.moment,
  })),
];

export const MariaQuickHubModal: React.FC<MariaQuickHubModalProps> = ({
  isOpen,
  onClose,
  schedule,
  userLocation,
  onRequestLocation,
  onOpenSchedule,
  onOpenDiary,
  onOpenWeather,
  onOpenAI,
  onFlyToVintageSpot,
  initialTab = 'menu',
}) => {
  const [activeTab, setActiveTab] = useState<QuickHubTab>(initialTab);

  // Daily Exchange Rates State (Live Day-to-Day Sync + Offline Cache)
  const [rates, setRates] = useState<DailyExchangeRates>(getSavedExchangeRates);
  const [isSyncingRates, setIsSyncingRates] = useState<boolean>(false);
  const [calcDirection, setCalcDirection] = useState<'ars_to_clp' | 'clp_to_ars'>('ars_to_clp');
  const [arsAmount, setArsAmount] = useState<string>('15000');
  const [clpAmount, setClpAmount] = useState<string>('20000');
  const [includeTip, setIncludeTip] = useState<boolean>(true);

  // Auto-Updating Daily Love Letter + 6 Moment Letters State
  const [dailyOffset, setDailyOffset] = useState<number>(0);
  const [isEditingCustomLetter, setIsEditingCustomLetter] = useState<boolean>(false);
  const [customTitleInput, setCustomTitleInput] = useState<string>('');
  const [customBodyInput, setCustomBodyInput] = useState<string>('');
  const [selectedLetter, setSelectedLetter] = useState<LoveLetter | 'daily'>('daily');
  const [speakingLetterId, setSpeakingLetterId] = useState<string | null>(null);

  // Fashion & Vintage Filter State
  const [fashionCategoryFilter, setFashionCategoryFilter] = useState<string>('all');

  // Rodrigo Real Voice Studio State
  const [recordings, setRecordings] = useState<Record<string, RodrigoVoiceRecording>>({});
  const [voiceSettings, setVoiceSettings] = useState<RodrigoVoiceSettings>(getRodrigoVoiceSettings);
  const [recordingSlotId, setRecordingSlotId] = useState<RodrigoVoiceSlotId | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [playingSlotId, setPlayingSlotId] = useState<string | null>(null);
  const [studioStatusMsg, setStudioStatusMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setRecordings(getAllRodrigoRecordings());
      setVoiceSettings(getRodrigoVoiceSettings());
      setRates(getSavedExchangeRates());

      // Auto-sync daily CLP <-> ARS exchange rate in background when online
      syncDailyExchangeRates(false).then((updated) => {
        setRates(updated);
      });
    } else {
      stopAllVoicePlayback();
      setSpeakingLetterId(null);
      setPlayingSlotId(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const dailyLetter = getDailyRodrigoLetter(schedule, userLocation, dailyOffset);

  const handleForceSyncRates = async () => {
    setIsSyncingRates(true);
    try {
      const updated = await syncDailyExchangeRates(true);
      setRates(updated);
    } finally {
      setIsSyncingRates(false);
    }
  };

  const handleManualRateChange = (newClpPer1000ArsStr: string) => {
    const val = parseFloat(newClpPer1000ArsStr);
    if (!isNaN(val) && val > 0) {
      const updated = saveExchangeRates({
        clpPer1000Ars: val,
        arsPer1000Clp: Math.round((1000 / val) * 1000),
        updatedAtLabel: 'Ajustado manualmente',
        source: 'manual',
      });
      setRates(updated);
    }
  };

  // Calculations for ARS -> CLP
  const numericArs = parseFloat(arsAmount.replace(/[^0-9.]/g, '')) || 0;
  const tipArs = includeTip ? Math.round(numericArs * 0.1) : 0;
  const totalArs = numericArs + tipArs;
  const totalInClp = Math.round((totalArs / 1000) * rates.clpPer1000Ars);
  const totalInUsd = (totalArs / (rates.arsPerUsdBlue || 1135)).toFixed(2);

  // Calculations for CLP -> ARS
  const numericClp = parseFloat(clpAmount.replace(/[^0-9.]/g, '')) || 0;
  const equivalentArs = Math.round((numericClp / 1000) * rates.arsPer1000Clp);
  const equivalentUsdFromClp = (numericClp / (rates.clpPerUsd || 980)).toFixed(2);

  const handleSpeakDailyLetter = () => {
    unlockIOSAudio();
    if (speakingLetterId === 'daily') {
      stopAllVoicePlayback();
      setSpeakingLetterId(null);
    } else {
      speakAsRodrigoOrChileanMaleAI({
        text: `${dailyLetter.title}. ${dailyLetter.content}`,
        slotId: 'letter-1',
        onStart: () => setSpeakingLetterId('daily'),
        onEnd: () => setSpeakingLetterId(null),
      });
    }
  };

  const handleSpeakLetter = (letter: LoveLetter) => {
    unlockIOSAudio();
    if (speakingLetterId === letter.id) {
      stopAllVoicePlayback();
      setSpeakingLetterId(null);
    } else {
      speakAsRodrigoOrChileanMaleAI({
        text: `${letter.title}. ${letter.content}`,
        slotId: letter.id,
        onStart: () => setSpeakingLetterId(letter.id),
        onEnd: () => setSpeakingLetterId(null),
      });
    }
  };

  // Start Recording Rodrigo's Real Voice with Microphone
  const handleStartRecording = async (slotId: RodrigoVoiceSlotId) => {
    unlockIOSAudio();
    stopAllVoicePlayback();
    setStudioStatusMsg(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStudioStatusMsg('Tu navegador no permite grabar directo; usa el botón "Subir Audio" al lado.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64DataUrl = reader.result as string;
          const meta = VOICE_SLOTS_META.find((m) => m.slotId === slotId);
          await saveRodrigoRecording(slotId, meta?.title || slotId, base64DataUrl, recordingSeconds);
          setRecordings(getAllRodrigoRecordings());
          setRecordingSlotId(null);
          setRecordingSeconds(0);
          setStudioStatusMsg('¡Voz real de Rodrigo guardada 100% offline en el teléfono! ❤️');
        };
        reader.readAsDataURL(blob);
      };

      setRecordingSlotId(slotId);
      setRecordingSeconds(0);
      recorder.start();

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (_) {
      setStudioStatusMsg('Permite el acceso al micrófono o sube un archivo de audio desde tu dispositivo.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleUploadAudioFile = (slotId: RodrigoVoiceSlotId, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64DataUrl = reader.result as string;
      const meta = VOICE_SLOTS_META.find((m) => m.slotId === slotId);
      await saveRodrigoRecording(slotId, meta?.title || slotId, base64DataUrl);
      setRecordings(getAllRodrigoRecordings());
      setStudioStatusMsg(`¡Audio "${file.name}" guardado con la voz de Rodrigo! ❤️`);
    };
    reader.readAsDataURL(file);
  };

  const nextActivityInfo = (() => {
    for (const day of schedule) {
      const pending = (day.activities || []).find((a) => !a.done);
      if (pending) {
        return { day, activity: pending };
      }
    }
    return null;
  })();

  const filteredFashionSpots: VintageFashionSpot[] = VINTAGE_AND_SHOPPING_SPOTS.filter(
    (s) => fashionCategoryFilter === 'all' || s.category === fashionCategoryFilter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[100dvh] sm:h-[90dvh] flex flex-col bg-slate-950 sm:border border-pink-500/40 sm:rounded-3xl shadow-2xl overflow-hidden text-slate-100 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* Top Romantic Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md shrink-0">
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Centro Fácil para mi Amorcito 💕
              </h2>
              <p className="text-[11px] text-pink-200/80">
                Cartita del Día + Ruta @maria_la_vintage / Zara + Cambio Día a Día 100% Offline
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopAllVoicePlayback();
              onClose();
            }}
            className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-3 sm:px-6 py-2.5 bg-slate-950 border-b border-slate-900 overflow-x-auto shrink-0 no-scrollbar">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'menu'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Menú Fácil</span>
          </button>

          <button
            onClick={() => setActiveTab('letters')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'letters'
                ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-pink-200 border border-pink-500/30 hover:bg-slate-800'
            }`}
          >
            <MailOpen className="w-3.5 h-3.5" />
            <span>💌 Cartita de Hoy & Rodrigo</span>
          </button>

          <button
            onClick={() => setActiveTab('fashion')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'fashion'
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md'
                : 'bg-slate-900 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>👗 Ropa Usada, Zara & Chinos</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'bg-slate-900 text-emerald-300 border border-emerald-500/30 hover:bg-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>💵 Cambio CLP ↔ ARS</span>
          </button>

          <button
            onClick={() => setActiveTab('voice-studio')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'voice-studio'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-sky-300 border border-sky-500/30 hover:bg-slate-800'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>🎙️ Voz de Rodrigo</span>
          </button>

          <button
            onClick={() => setActiveTab('sos')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'sos'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>🆘 SOS & Diccionario</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-950">
          {/* TAB 1: GIANT EASY MENU */}
          {activeTab === 'menu' && (
            <div className="space-y-5">
              {/* Giant Voice Trigger Card for Amorcito */}
              <button
                onClick={() => {
                  unlockIOSAudio();
                  onClose();
                  onOpenAI(true);
                }}
                className="w-full p-5 rounded-3xl bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white shadow-xl border border-white/20 flex items-center justify-between gap-4 text-left active:scale-[0.99] transition-transform"
              >
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/30 text-[11px] font-bold">
                    🎙️ MODO MANOS LIBRES PARA TU IPHONE
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold">
                    Toca acá para hablarme con tu voz, mi Amorcito 💕
                  </h3>
                  <p className="text-xs text-pink-100">
                    Pregúntame dónde comprar ropa usada, tiendas tipo Zara baratas, clima o direcciones
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <Mic className="w-8 h-8 text-white" />
                </div>
              </button>

              {/* Today's Rodrigo Letter & Fashion Tip Preview Banner */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-950/70 via-pink-950/60 to-purple-950/70 border border-pink-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-pink-300">
                    💌 Cartita y Tip de Moda de Hoy ({dailyLetter.dateKey})
                  </span>
                  <h4 className="text-sm sm:text-base font-extrabold text-white">
                    {dailyLetter.title}
                  </h4>
                  <p className="text-xs text-pink-100 line-clamp-2">
                    {dailyLetter.fashionTipOfTheDay.replace(/\*\*/g, '')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedLetter('daily');
                      setActiveTab('letters');
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-extrabold"
                  >
                    Leer Cartita de Hoy →
                  </button>
                  <button
                    onClick={() => setActiveTab('fashion')}
                    className="px-3.5 py-2 rounded-2xl bg-fuchsia-600/30 border border-fuchsia-400/50 text-fuchsia-200 text-xs font-extrabold"
                  >
                    👗 Ver 10 Tiendas
                  </button>
                </div>
              </div>

              {/* Fast SOS Emergency Banner */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-red-950/80 via-rose-950/60 to-slate-900 border-2 border-red-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-red-300">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>🆘 Emergencia Rápida en Buenos Aires (24 Horas)</span>
                  </span>
                  <h4 className="text-base font-extrabold text-white">
                    Policía 911 • Comisaría del Turista • Ambulancia 107
                  </h4>
                  <p className="text-xs text-red-100">
                    Llamada directa de 1 toque desde tu iPhone en cualquier barrio de Buenos Aires.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="tel:911"
                    className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg"
                  >
                    <Phone className="w-3.5 h-3.5 fill-current" />
                    <span>Llamar 911</span>
                  </a>
                  <button
                    onClick={() => setActiveTab('sos')}
                    className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-red-400/40 text-red-200 text-xs font-extrabold"
                  >
                    Ver todos los números →
                  </button>
                </div>
              </div>

              {/* 6 Giant Touch Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <button
                  onClick={() => setActiveTab('fashion')}
                  className="group p-5 rounded-3xl bg-slate-900 hover:bg-slate-800 border border-fuchsia-500/40 text-left transition-all flex flex-col justify-between gap-3 active:scale-95"
                >
                  <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center text-fuchsia-300">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      1. Ruta @maria_la_vintage, Zara & Chinos 👗
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Las 10 mejores tiendas de ropa usada, outlets tipo Zara baratos y mall chinos en el mapa.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('letters')}
                  className="group p-5 rounded-3xl bg-slate-900 hover:bg-slate-800 border border-rose-500/40 text-left transition-all flex flex-col justify-between gap-3 active:scale-95"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
                    <MailOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      2. Cartita de Hoy de Rodrigo 💌
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Se actualiza cada día con amor, datos de Argentina y tips de ropa usada.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('calculator')}
                  className="group p-5 rounded-3xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-left transition-all flex flex-col justify-between gap-3 active:scale-95"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      3. Cambio Día a Día CLP ↔ ARS 💵
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      1.000 ARS = ${rates.clpPer1000Ars} CLP ({rates.updatedAtLabel}).
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onRequestLocation();
                    onClose();
                  }}
                  className="group p-5 rounded-3xl bg-slate-900 hover:bg-slate-800 border border-pink-500/30 text-left transition-all flex flex-col justify-between gap-3 active:scale-95"
                >
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      4. ¿Dónde estoy ahora? (GPS)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Ubícate en el mapa en 1 segundo sin gastar datos ni batería.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenDiary();
                  }}
                  className="group p-5 rounded-3xl bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-left transition-all flex flex-col justify-between gap-3 active:scale-95"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      5. Sacar Foto / Mi Diario
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Usa la cámara de tu iPhone y guarda recuerdos 100% offline.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenWeather();
                  }}
                  className="group p-5 rounded-3xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-left transition-all flex flex-col justify-between gap-3 active:scale-95"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <CloudSun className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      6. Clima y Qué Abrigo Ponerme
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Mira la temperatura y qué ropa llevar hoy.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE DAY-TO-DAY CURRENCY & TIP CALCULATOR (CLP <-> ARS) */}
          {activeTab === 'calculator' && (
            <div className="space-y-5">
              <div className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-emerald-400" />
                        <span>Conversión Día a Día: Pesos Chilenos (CLP) ↔ Argentinos (ARS)</span>
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold">
                        ✅ {rates.updatedAtLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sincronizado con el cambio real del día y guardado en la memoria de tu iPhone para usarlo sin internet en las tiendas.
                    </p>
                  </div>

                  <button
                    onClick={handleForceSyncRates}
                    disabled={isSyncingRates}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRates ? 'animate-spin' : ''}`} />
                    <span>{isSyncingRates ? 'Actualizando...' : 'Actualizar Tasa de Hoy'}</span>
                  </button>
                </div>

                {/* Live Rate Summary Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
                    <span className="text-slate-400">🇦🇷 $1.000 ARS son:</span>
                    <span className="font-extrabold text-emerald-400 text-sm">
                      🇨🇱 ${rates.clpPer1000Ars.toLocaleString('es-CL')} CLP
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-sky-500/30 flex items-center justify-between">
                    <span className="text-slate-400">🇨🇱 $1.000 CLP te dan:</span>
                    <span className="font-extrabold text-sky-400 text-sm">
                      🇦🇷 ${rates.arsPer1000Clp.toLocaleString('es-AR')} ARS
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-purple-500/30 flex items-center justify-between">
                    <span className="text-slate-400">🇺🇸 1 Dólar en Arg:</span>
                    <span className="font-extrabold text-purple-300 text-sm">
                      ${rates.arsPerUsdBlue.toLocaleString('es-AR')} ARS
                    </span>
                  </div>
                </div>

                {/* Direction Switcher: ARS -> CLP vs CLP -> ARS */}
                <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
                  <button
                    onClick={() => setCalcDirection('ars_to_clp')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                      calcDirection === 'ars_to_clp'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇦🇷 Precio en Argentina (ARS) → 🇨🇱 ¿Cuánto es en Pesos Chilenos?
                  </button>
                  <button
                    onClick={() => setCalcDirection('clp_to_ars')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                      calcDirection === 'clp_to_ars'
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🇨🇱 Mis Pesos Chilenos (CLP) → 🇦🇷 ¿Cuántos Pesos Argentinos son?
                  </button>
                </div>

                {calcDirection === 'ars_to_clp' ? (
                  <>
                    {/* Quick Preset Amounts including Ropa Usada & Mall Chinos */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: '🏮 Bazar Chino ($4.500)', val: '4500' },
                        { label: '👚 Top Ropa Usada ($9.000)', val: '9000' },
                        { label: '👖 Falda / Jean ($15.000)', val: '15000' },
                        { label: '🧥 Blazer / Campera Vintage ($25.000)', val: '25000' },
                        { label: '🥩 Cena ($35.000)', val: '35000' },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          onClick={() => setArsAmount(preset.val)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            arsAmount === preset.val
                              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <label className="text-xs font-bold text-slate-400 block">
                          Precio en la etiqueta o cuenta en Pesos Argentinos (ARS $):
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={arsAmount}
                          onChange={(e) => setArsAmount(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-extrabold text-xl focus:outline-none focus:border-emerald-400"
                        />

                        <div className="pt-2 flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={includeTip}
                              onChange={(e) => setIncludeTip(e.target.checked)}
                              className="w-4 h-4 rounded accent-emerald-500"
                            />
                            <span className="text-xs font-semibold text-slate-300">
                              Sumar 10% propina si es restaurante (+${tipArs.toLocaleString('es-AR')} ARS)
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs text-slate-300">Total en Pesos Argentinos:</span>
                          <span className="text-lg font-extrabold text-white">
                            ${totalArs.toLocaleString('es-AR')} ARS
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-300">
                            🇨🇱 En Pesos Chilenos (CLP):
                          </span>
                          <span className="text-2xl font-extrabold text-emerald-400">
                            ${totalInClp.toLocaleString('es-CL')} CLP
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                          <span className="text-xs font-semibold text-sky-300">
                            🇺🇸 En Dólares (USD aprox.):
                          </span>
                          <span className="text-base font-bold text-sky-300">US$ {totalInUsd}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <label className="text-xs font-bold text-slate-400 block">
                        Monto en Pesos Chilenos (CLP $):
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={clpAmount}
                        onChange={(e) => setClpAmount(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-extrabold text-xl focus:outline-none focus:border-sky-400"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['10000', '20000', '50000', '100000'].map((val) => (
                          <button
                            key={val}
                            onClick={() => setClpAmount(val)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-sky-300"
                          >
                            ${Number(val).toLocaleString('es-CL')} CLP
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-950/60 to-slate-900 border border-sky-500/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-300">
                          🇦🇷 Equivalen en Pesos Argentinos a:
                        </span>
                        <span className="text-2xl font-extrabold text-sky-400">
                          ${equivalentArs.toLocaleString('es-AR')} ARS
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-xs text-slate-300">🇺🇸 En Dólares (USD):</span>
                        <span className="text-base font-bold text-white">
                          US$ {equivalentUsdFromClp}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Rate Adjuster */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Si te dieron un cambio específico en una casa de cambio, ajústalo acá:</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">1.000 ARS =</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={rates.clpPer1000Ars}
                      onChange={(e) => handleManualRateChange(e.target.value)}
                      className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-base"
                    />
                    <span className="text-slate-400">CLP</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RODRIGO'S AUTO-UPDATING DAILY LOVE LETTER + 6 LETTERS */}
          {activeTab === 'letters' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 space-y-2">
                <p className="text-xs font-bold text-pink-300 uppercase tracking-wider px-1">
                  Cartita Actualizada Día a Día:
                </p>

                {/* Daily Auto-Updating Letter Selector */}
                <button
                  onClick={() => {
                    stopAllVoicePlayback();
                    setSpeakingLetterId(null);
                    setSelectedLetter('daily');
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    selectedLetter === 'daily'
                      ? 'bg-gradient-to-r from-pink-600/40 via-rose-600/35 to-purple-600/40 border-pink-400 text-white shadow-lg ring-2 ring-pink-500/30'
                      : 'bg-slate-900 border-pink-500/30 text-slate-200'
                  }`}
                >
                  <span className="text-2xl shrink-0">💌</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/30 text-pink-200 text-[10px] font-extrabold">
                        ✨ HOY: {dailyLetter.dateKey}
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-white truncate mt-1">
                      {dailyLetter.title}
                    </h4>
                    <p className="text-[11px] text-pink-200/90 truncate">
                      Incluye Tip @maria_la_vintage / Zara + Dato Argentino
                    </p>
                  </div>
                </button>

                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 pt-2">
                  Cartitas para cada momento:
                </p>

                {RODRIGO_LOVE_LETTERS.map((letter) => {
                  const isSelected = selectedLetter !== 'daily' && selectedLetter.id === letter.id;
                  const hasRealAudio = !!recordings[letter.id];
                  return (
                    <button
                      key={letter.id}
                      onClick={() => {
                        stopAllVoicePlayback();
                        setSpeakingLetterId(null);
                        setSelectedLetter(letter);
                      }}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-600/30 to-purple-600/30 border-pink-400 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="text-xl shrink-0">{letter.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[10px] font-bold text-pink-300 truncate">
                            {letter.moment}
                          </p>
                          {hasRealAudio && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold shrink-0">
                              🎙️ Voz Real
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-extrabold text-white truncate mt-0.5">
                          {letter.title}
                        </h4>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="md:col-span-7 p-5 sm:p-6 rounded-3xl bg-slate-900 border border-pink-500/40 flex flex-col justify-between space-y-5">
                {selectedLetter === 'daily' ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-400 block">
                          💌 CARTITA DEL DÍA DE HOY ({dailyLetter.dateKey}) — SE ACTUALIZA SIEMPRE
                        </span>
                        <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug mt-0.5">
                          {dailyLetter.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDailyOffset((prev) => prev + 1)}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-200 text-xs font-bold border border-pink-500/30"
                          title="Rotar al siguiente tip de ropa usada, Zara y dato argentino"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-pink-400" />
                          <span>Otro Tip</span>
                        </button>

                        <button
                          onClick={handleSpeakDailyLetter}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 shadow-md ${
                            speakingLetterId === 'daily'
                              ? 'bg-pink-600 text-white animate-pulse'
                              : 'bg-pink-500/25 hover:bg-pink-500/35 text-pink-200 border border-pink-400/50'
                          }`}
                        >
                          {speakingLetterId === 'daily' ? (
                            <>
                              <VolumeX className="w-4 h-4" />
                              <span>Detener</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-4 h-4" />
                              <span>Escuchar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-slate-100 leading-relaxed whitespace-pre-line space-y-2 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                      {dailyLetter.content}
                    </div>

                    {/* Quick Button to Open the Fashion Layer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => setActiveTab('fashion')}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-xs font-extrabold shadow-md"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>👗 Ver las 10 Tiendas (@maria_la_vintage / Zara / Chinos)</span>
                      </button>

                      <button
                        onClick={() => {
                          setCustomTitleInput(dailyLetter.title);
                          setCustomBodyInput('');
                          setIsEditingCustomLetter(!isEditingCustomLetter);
                        }}
                        className="flex items-center gap-1 text-xs text-sky-400 hover:underline font-semibold"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Escribir nota personalizada de Rodrigo</span>
                      </button>
                    </div>

                    {isEditingCustomLetter && (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-sky-500/40 space-y-3">
                        <h4 className="text-xs font-extrabold text-sky-300">
                          ✏️ Actualizar el mensaje de hoy de Rodrigo (se suman automáticamente los tips de moda y Argentina):
                        </h4>
                        <input
                          type="text"
                          placeholder="Título de la cartita de hoy..."
                          value={customTitleInput}
                          onChange={(e) => setCustomTitleInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                        />
                        <textarea
                          rows={3}
                          placeholder="Escribe aquí tu mensaje para hoy, p. ej.: Mi amorcito lindo, hoy pasa a mirar chaquetas en Juan Perez..."
                          value={customBodyInput}
                          onChange={(e) => setCustomBodyInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          {dailyLetter.isCustomFromRodrigo && (
                            <button
                              onClick={() => {
                                clearCustomRodrigoLetter();
                                setDailyOffset(0);
                                setIsEditingCustomLetter(false);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
                            >
                              Restaurar automática
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (customBodyInput.trim()) {
                                saveCustomRodrigoLetter(
                                  customTitleInput.trim() || 'Cartita de Hoy de Rodrigo 💌',
                                  customBodyInput.trim()
                                );
                                setDailyOffset(0);
                                setIsEditingCustomLetter(false);
                              }
                            }}
                            className="px-4 py-1.5 rounded-xl bg-pink-600 text-white text-xs font-extrabold"
                          >
                            Guardar en la Cartita de Hoy ❤️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{selectedLetter.emoji}</span>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 block">
                            {selectedLetter.moment}
                          </span>
                          <h3 className="text-lg font-extrabold text-white leading-snug">
                            {selectedLetter.title}
                          </h3>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSpeakLetter(selectedLetter)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 shadow-md ${
                          speakingLetterId === selectedLetter.id
                            ? 'bg-pink-600 text-white animate-pulse'
                            : 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-400/40'
                        }`}
                      >
                        {speakingLetterId === selectedLetter.id ? (
                          <>
                            <VolumeX className="w-4 h-4" />
                            <span>Detener</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            <span>
                              {recordings[selectedLetter.id]
                                ? 'Escuchar Voz de Rodrigo'
                                : 'Escuchar con Voz'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-sm sm:text-base text-slate-100 leading-relaxed whitespace-pre-line italic">
                      "{selectedLetter.content}"
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-pink-300">
                  <span className="font-bold">Con todo mi amor, Rodrigo ❤️</span>
                  <button
                    onClick={() => setActiveTab('voice-studio')}
                    className="text-[11px] text-sky-400 hover:underline font-semibold"
                  >
                    🎙️ Grabar con mi propia voz →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RUTA @MARIA_LA_VINTAGE, ROPA USADA, TIENDAS TIPO ZARA ACCESIBLES & MALL CHINOS */}
          {activeTab === 'fashion' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-pink-950/70 via-fuchsia-950/60 to-slate-900 border border-pink-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-pink-500/25 border border-pink-400/40 text-pink-200 text-[10px] font-extrabold uppercase tracking-wider">
                      ✨ Curado para el estilo de @maria_la_vintage (Nada Caro)
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-white mt-1">
                      👗 Ruta Ropa Usada, Tendencia Tipo Zara & Mall Chinos en el Mapa
                    </h3>
                    <p className="text-xs text-slate-300">
                      Blazers oversize, chaquetas de gamuza/cuero, faldas midi, tops de encaje, Zara segunda mano, outlets al 50% OFF y bazares chinos gigantes.
                    </p>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { id: 'all', label: '✨ Todas las Tiendas (10)' },
                    { id: 'ropa_usada', label: '👗 Ropa Usada & Estilo @maria_la_vintage' },
                    { id: 'zara_tendencia', label: '🖤 Tipo Zara & Outlets Accesibles' },
                    { id: 'moda_mayorista', label: '👠 Mayorista Argerich (Zara a Precio Fábrica)' },
                    { id: 'mall_chino', label: '🏮 Mall Chinos & Lentes' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFashionCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                        fashionCategoryFilter === cat.id
                          ? 'bg-pink-600 border-pink-300 text-white shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredFashionSpots.map((spot) => (
                  <div
                    key={spot.id}
                    className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-pink-500/50 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{spot.emoji}</span>
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-400 block">
                              {spot.categoryLabel}
                            </span>
                            <h4 className="text-sm font-extrabold text-white leading-snug">
                              {spot.name}
                            </h4>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 font-semibold">
                        📍 {spot.neighborhood} — {spot.address}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                          💵 {spot.priceLevelArs} ({spot.approxClpNote})
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                          🕒 {spot.hours}
                        </span>
                      </div>

                      <p className="text-xs text-fuchsia-200 bg-fuchsia-950/30 border border-fuchsia-500/25 rounded-xl px-2.5 py-1.5">
                        <strong>✨ Qué buscar acá:</strong> {spot.styleVibe}
                      </p>

                      <p className="text-xs text-pink-200/90 italic">
                        💕 "{spot.rodrigoFashionTip}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          unlockIOSAudio();
                          speakAsRodrigoOrChileanMaleAI({
                            text: `${spot.shortTitle}. ${spot.rodrigoFashionTip}`,
                          });
                        }}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-200 text-xs font-bold"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                        <span>Escuchar Tip</span>
                      </button>

                      {onFlyToVintageSpot && (
                        <button
                          onClick={() => {
                            onClose();
                            onFlyToVintageSpot(spot.id);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-extrabold shadow"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>📍 Ver en el Mapa</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: RODRIGO'S REAL VOICE STUDIO & CHILEAN MALE VOICE CALIBRATOR */}
          {activeTab === 'voice-studio' && (
            <div className="space-y-5">
              <div className="p-5 rounded-3xl bg-slate-900 border border-sky-500/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Mic className="w-5 h-5 text-sky-400" />
                      <span>Estudio de Tu Voz Real (Modo Rodrigo) 🎙️❤️</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Graba con tu micrófono o sube un audio tuyo (de WhatsApp o tu celular) para que tu Amorcito escuche <strong>tu voz real</strong> 100% offline en su iPhone.
                    </p>
                  </div>
                </div>

                {studioStatusMsg && (
                  <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-between">
                    <span>{studioStatusMsg}</span>
                    <button onClick={() => setStudioStatusMsg(null)}>✕</button>
                  </div>
                )}

                <div className="space-y-2.5">
                  {VOICE_SLOTS_META.map((slot) => {
                    const savedRec = recordings[slot.slotId];
                    const isRecordingThis = recordingSlotId === slot.slotId;
                    const isPlayingThis = playingSlotId === slot.slotId;

                    return (
                      <div
                        key={slot.slotId}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-extrabold text-white">
                              {slot.title}
                            </h4>
                            {savedRec ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                                ✅ Grabado con tu voz
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                Usa voz masculina chilena IA
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{slot.subtitle}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {isRecordingThis ? (
                            <button
                              onClick={handleStopRecording}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-extrabold animate-pulse"
                            >
                              <Square className="w-3.5 h-3.5 fill-current" />
                              <span>Detener ({recordingSeconds}s)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartRecording(slot.slotId)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold"
                            >
                              <Mic className="w-3.5 h-3.5" />
                              <span>Grabar</span>
                            </button>
                          )}

                          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer">
                            <Upload className="w-3.5 h-3.5 text-sky-400" />
                            <span>Subir Audio</span>
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              onChange={(e) =>
                                handleUploadAudioFile(slot.slotId, e.target.files?.[0] || null)
                              }
                            />
                          </label>

                          {savedRec && (
                            <>
                              <button
                                onClick={() => {
                                  unlockIOSAudio();
                                  if (isPlayingThis) {
                                    stopAllVoicePlayback();
                                    setPlayingSlotId(null);
                                  } else {
                                    speakAsRodrigoOrChileanMaleAI({
                                      text: slot.title,
                                      slotId: slot.slotId,
                                      onStart: () => setPlayingSlotId(slot.slotId),
                                      onEnd: () => setPlayingSlotId(null),
                                    });
                                  }
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>{isPlayingThis ? 'Sonando...' : 'Probar'}</span>
                              </button>

                              <button
                                onClick={() => {
                                  deleteRodrigoRecording(slot.slotId);
                                  setRecordings(getAllRodrigoRecordings());
                                }}
                                className="p-1.5 rounded-xl bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400"
                                title="Borrar grabación"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calibrator for Dynamic Male Chilean AI Voice */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-pink-400" />
                      <span>Calibrar Timbre de Voz de Hombre Chileno (Para respuestas dinámicas de la IA)</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Ajusta qué tan grave o rápida suena la voz masculina cuando le responde sobre ropa usada, clima o direcciones.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      unlockIOSAudio();
                      speakAsRodrigoOrChileanMaleAI({
                        text: '¡Hola mi amorcito lindo! Aquí estoy cuidándote en tu viaje por Argentina po, te amo caleta.',
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold shrink-0"
                  >
                    🔊 Probar Voz Chilena
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      Timbre Masculino ({voiceSettings.pitch.toFixed(2)}):
                    </label>
                    <input
                      type="range"
                      min="0.65"
                      max="1.05"
                      step="0.02"
                      value={voiceSettings.pitch}
                      onChange={(e) => {
                        const updated = saveRodrigoVoiceSettings({
                          pitch: parseFloat(e.target.value),
                        });
                        setVoiceSettings(updated);
                      }}
                      className="w-full accent-pink-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Más grave</span>
                      <span>Más joven</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      Velocidad al hablar ({voiceSettings.rate.toFixed(2)}x):
                    </label>
                    <input
                      type="range"
                      min="0.82"
                      max="1.12"
                      step="0.02"
                      value={voiceSettings.rate}
                      onChange={(e) => {
                        const updated = saveRodrigoVoiceSettings({
                          rate: parseFloat(e.target.value),
                        });
                        setVoiceSettings(updated);
                      }}
                      className="w-full accent-sky-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Pausado</span>
                      <span>Rápido</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      Voz Neuronal (Con Wi-Fi):
                    </label>
                    <select
                      value={voiceSettings.neuralVoice}
                      onChange={(e) => {
                        const updated = saveRodrigoVoiceSettings({
                          neuralVoice: e.target.value as 'Puck' | 'Charon' | 'Fenrir',
                        });
                        setVoiceSettings(updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-base font-bold"
                    >
                      <option value="Puck">Hombre Joven Cálido (Puck)</option>
                      <option value="Charon">Hombre Sereno Profundo (Charon)</option>
                      <option value="Fenrir">Hombre Firme Protector (Fenrir)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SOS & CHILEAN-ARGENTINE DICTIONARY */}
          {activeTab === 'sos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900 border border-rose-500/30 space-y-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-rose-400" />
                  <span>Teléfonos de Emergencia en Argentina (1 Toque)</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  <a
                    href="tel:911"
                    className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-white"
                  >
                    <div>
                      <span className="font-extrabold text-rose-300 block">
                        🚨 911 — Emergencias Policiales
                      </span>
                      <span className="text-slate-400">Gratis desde cualquier celular en Argentina</span>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-rose-600 font-bold">Llamar 911</span>
                  </a>

                  <a
                    href="tel:107"
                    className="flex items-center justify-between p-3 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-white"
                  >
                    <div>
                      <span className="font-extrabold text-sky-300 block">
                        🚑 107 — Ambulancia / Emergencia Médica (SAME)
                      </span>
                      <span className="text-slate-400">Atención médica gratuita de urgencia</span>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-sky-600 font-bold">Llamar 107</span>
                  </a>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="font-extrabold text-white block">
                      🇨🇱 Consulado de Chile en Buenos Aires
                    </span>
                    <p className="text-slate-300">📍 Av. Roque Sáenz Peña 547 (Cerca del Obelisco)</p>
                    <p className="text-slate-400">📞 Teléfono: +54 11 4394-6582</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-sky-500/30 space-y-4">
                <h3 className="text-sm font-extrabold text-white">
                  🇨🇱 ↔ 🇦🇷 Diccionario de Moda y Calle para mi Amorcito
                </h3>
                <div className="space-y-2 text-xs">
                  {[
                    { cl: 'Tienda de Ropa Usada / Americana', ar: 'Feria Americana / Moda Circular' },
                    { cl: 'Chaqueta / Abrigo Largo', ar: 'Campera / Tapado de paño' },
                    { cl: 'Falda / Polera', ar: 'Pollera / Remera' },
                    { cl: 'Chaleco / Polerón', ar: 'Sweater / Buzo' },
                    { cl: 'Micro / Metro', ar: 'Colectivo (Bondi) / Subte' },
                    { cl: 'Tarjeta Bip!', ar: 'Tarjeta SUBE (o paga con tu iPhone)' },
                    { cl: 'Tomar Once', ar: 'Merendar (café con medialunas)' },
                    { cl: 'Pagar al contado con descuento', ar: '"Precio abonando en efectivo"' },
                  ].map((item) => (
                    <div
                      key={item.cl}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80"
                    >
                      <span className="font-bold text-pink-300">🇨🇱 {item.cl}</span>
                      <span className="text-sky-300 font-semibold text-right">🇦🇷 {item.ar}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
