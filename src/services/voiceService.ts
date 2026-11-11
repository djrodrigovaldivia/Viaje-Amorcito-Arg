// Servicio Integral de Voz: Estudio de Voz Real de Rodrigo + Voz Masculina Chilena (Online Gemini TTS & Offline iPhone iOS)

export type RodrigoVoiceSlotId =
  | 'intro'
  | 'ai-greeting'
  | 'letter-1'
  | 'letter-2'
  | 'letter-3'
  | 'letter-4'
  | 'letter-5'
  | 'letter-6';

export interface RodrigoVoiceRecording {
  slotId: RodrigoVoiceSlotId;
  label: string;
  audioDataUrl: string; // base64 audio/webm, audio/mp4, audio/mpeg, audio/wav
  updatedAt: string;
  durationSec?: number;
}

export interface RodrigoVoiceSettings {
  pitch: number; // 0.65 to 1.15 (default 0.86 for warm masculine Chilean voice on iPhone)
  rate: number; // 0.80 to 1.15 (default 0.96)
  neuralVoice: 'Puck' | 'Charon' | 'Fenrir';
  playRodrigoGreetingBeforeAI: boolean;
  preferOfflineBatterySaverVoice: boolean;
}

const DB_NAME = 'maria_ignacia_argentina_diary_db';
const VOICE_STORE_KEY_PREFIX = 'rodrigo_real_voice_v1_';
const SETTINGS_KEY = 'rodrigo_voice_settings_v1';

const DEFAULT_SETTINGS: RodrigoVoiceSettings = {
  pitch: 0.86,
  rate: 0.96,
  neuralVoice: 'Puck',
  playRodrigoGreetingBeforeAI: true,
  preferOfflineBatterySaverVoice: false,
};

// In-memory cache for neural TTS WAV clips to save battery and bandwidth
const ttsAudioCache = new Map<string, string>();

// Shared HTML5 Audio element for iOS Safari unlock compatibility
let sharedAudioElement: HTMLAudioElement | null = null;
let iosAudioUnlocked = false;

function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudioElement && typeof window !== 'undefined') {
    sharedAudioElement = new Audio();
    sharedAudioElement.preload = 'auto';
  }
  return sharedAudioElement!;
}

/**
 * Unlocks iOS Safari WebKit audio and speechSynthesis during a direct user tap
 * so that audio triggered after the 1.4-second conversational pause is never blocked.
 */
export function unlockIOSAudio(): void {
  if (typeof window === 'undefined' || iosAudioUnlocked) return;
  try {
    // 1. Unlock HTML5 Audio element with a tiny silent WAV data URI
    const audio = getSharedAudio();
    audio.src =
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    audio.volume = 0.01;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          audio.pause();
          audio.volume = 1.0;
          iosAudioUnlocked = true;
        })
        .catch(() => {});
    }

    // 2. Warm up WebKit speechSynthesis with an empty utterance
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const silentUtterance = new SpeechSynthesisUtterance(' ');
      silentUtterance.volume = 0;
      silentUtterance.rate = 2;
      window.speechSynthesis.speak(silentUtterance);
    }
  } catch (_) {}
}

/**
 * Load & Save Rodrigo's Voice Calibration Settings
 */
export function getRodrigoVoiceSettings(): RodrigoVoiceSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (_) {}
  return DEFAULT_SETTINGS;
}

export function saveRodrigoVoiceSettings(settings: Partial<RodrigoVoiceSettings>): RodrigoVoiceSettings {
  const updated = { ...getRodrigoVoiceSettings(), ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (_) {}
  return updated;
}

/**
 * Save a real voice recording from Rodrigo (stored in IndexedDB/localStorage for 100% offline iPhone playback)
 */
export async function saveRodrigoRecording(
  slotId: RodrigoVoiceSlotId,
  label: string,
  audioDataUrl: string,
  durationSec?: number
): Promise<RodrigoVoiceRecording> {
  const record: RodrigoVoiceRecording = {
    slotId,
    label,
    audioDataUrl,
    updatedAt: new Date().toISOString(),
    durationSec,
  };

  try {
    localStorage.setItem(`${VOICE_STORE_KEY_PREFIX}${slotId}`, JSON.stringify(record));
  } catch (e) {
    console.warn('Storage quota warning when saving voice recording:', e);
  }

  return record;
}

export function getRodrigoRecording(slotId: RodrigoVoiceSlotId): RodrigoVoiceRecording | null {
  try {
    const raw = localStorage.getItem(`${VOICE_STORE_KEY_PREFIX}${slotId}`);
    if (raw) return JSON.parse(raw) as RodrigoVoiceRecording;
  } catch (_) {}
  return null;
}

export function getAllRodrigoRecordings(): Record<string, RodrigoVoiceRecording> {
  const result: Record<string, RodrigoVoiceRecording> = {};
  const slots: RodrigoVoiceSlotId[] = [
    'intro',
    'ai-greeting',
    'letter-1',
    'letter-2',
    'letter-3',
    'letter-4',
    'letter-5',
    'letter-6',
  ];
  for (const slot of slots) {
    const rec = getRodrigoRecording(slot);
    if (rec) result[slot] = rec;
  }
  return result;
}

export function deleteRodrigoRecording(slotId: RodrigoVoiceSlotId): void {
  try {
    localStorage.removeItem(`${VOICE_STORE_KEY_PREFIX}${slotId}`);
  } catch (_) {}
}

/**
 * Selects the best Male Chilean / Latin American voice available on iPhone (iOS) / Android / Desktop,
 * strictly blocking Spain (es-ES) voices and prioritizing male voices.
 */
export function selectBestChileanMaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Filter to Spanish voices, strictly excluding Spain (es-ES)
  const spanishVoices = voices.filter((v) => {
    const lang = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    const isSpanish = lang.startsWith('es');
    const isSpain =
      lang.includes('es-es') ||
      lang.includes('es_es') ||
      name.includes('spain') ||
      name.includes('españa') ||
      name.includes('mónica') ||
      name.includes('monica') ||
      name.includes('jorge') ||
      name.includes('marisol') ||
      name.includes('alvaro') ||
      name.includes('elvira');
    return isSpanish && !isSpain;
  });

  const pool = spanishVoices.length > 0 ? spanishVoices : voices.filter((v) => v.lang.toLowerCase().startsWith('es'));
  if (pool.length === 0) return null;

  // Known male voice identifiers across iOS, macOS, Android, Chrome, Edge
  const maleKeywords = [
    'carlos',
    'diego',
    'juan',
    'andrés',
    'andres',
    'rodrigo',
    'tomas',
    'tomás',
    'alonso',
    'gonzalo',
    'lorenzo',
    'pablo',
    'rocko',
    'reed',
    'eddy',
    'grandpa',
    'male',
    'hombre',
  ];

  const femaleKeywords = [
    'paulina',
    'francisca',
    'mónica',
    'monica',
    'helena',
    'laura',
    'sabina',
    'paloma',
    'angelica',
    'angélica',
    'dalia',
    'salome',
    'salomé',
    'female',
    'mujer',
    'flo',
    'sandy',
    'shelley',
  ];

  // Score each voice
  let bestVoice = pool[0];
  let bestScore = -999;

  for (const v of pool) {
    let score = 0;
    const lang = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();

    // Language preference: Chile (es-CL) first, then Latin America (es-419, es-MX, es-US, es-AR, es-CO)
    if (lang.includes('cl')) score += 50;
    else if (lang.includes('419') || lang.includes('mx') || lang.includes('us')) score += 35;
    else if (lang.includes('ar') || lang.includes('co') || lang.includes('pe')) score += 25;

    // Male vs Female name matching
    if (maleKeywords.some((k) => name.includes(k))) score += 80;
    if (femaleKeywords.some((k) => name.includes(k))) score -= 60;

    // Prefer enhanced/natural voices on iOS
    if (name.includes('enhanced') || name.includes('premium') || name.includes('natural')) {
      score += 20;
    }

    if (score > bestScore) {
      bestScore = score;
      bestVoice = v;
    }
  }

  return bestVoice;
}

/**
 * Stops any currently playing audio or speech synthesis
 */
export function stopAllVoicePlayback(): void {
  if (typeof window === 'undefined') return;
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (sharedAudioElement) {
      sharedAudioElement.pause();
      sharedAudioElement.currentTime = 0;
    }
  } catch (_) {}
}

/**
 * Plays a data URL audio file (either Rodrigo's real recorded voice or Gemini neural WAV)
 */
function playAudioDataUrl(
  dataUrl: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): void {
  try {
    const audio = getSharedAudio();
    audio.pause();
    audio.src = dataUrl;
    audio.volume = 1.0;
    audio.onplay = () => onStart?.();
    audio.onended = () => onEnd?.();
    audio.onerror = () => onError?.();
    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => {
        onError?.();
      });
    }
  } catch (_) {
    onError?.();
  }
}

/**
 * Speaks text using the local iPhone/browser SpeechSynthesis tuned to a warm Chilean male voice
 */
export function speakWithLocalChileanMaleVoice(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const settings = getRodrigoVoiceSettings();
    const cleanText = text
      .replace(/[*_#`~>•]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const chosenVoice = selectBestChileanMaleVoice();

    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang || 'es-CL';
    } else {
      utterance.lang = 'es-CL';
    }

    utterance.pitch = settings.pitch;
    utterance.rate = settings.rate;

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
  } catch (_) {
    onEnd?.();
  }
}

/**
 * Master voice function:
 * 1. If a `slotId` is provided and Rodrigo recorded his REAL voice for that slot, plays Rodrigo's real voice!
 * 2. If `isAIResponse` is true and Rodrigo recorded an `'ai-greeting'` clip, plays Rodrigo's real greeting first, then reads the response!
 * 3. Uses Gemini 3.8 Male Chilean Neural Voice ('Puck'/'Charon'/'Fenrir') when online (and not in extreme battery saver),
 *    or falls back instantaneously to the local iPhone Male Chilean voice offline.
 */
export async function speakAsRodrigoOrChileanMaleAI(options: {
  text: string;
  slotId?: RodrigoVoiceSlotId;
  isAIResponse?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}): Promise<void> {
  const { text, slotId, isAIResponse, onStart, onEnd } = options;
  stopAllVoicePlayback();

  const settings = getRodrigoVoiceSettings();

  // 1. Check if this exact slot has a real voice recording from Rodrigo
  if (slotId) {
    const realRec = getRodrigoRecording(slotId);
    if (realRec && realRec.audioDataUrl) {
      playAudioDataUrl(realRec.audioDataUrl, onStart, onEnd, () => {
        speakWithLocalChileanMaleVoice(text, onStart, onEnd);
      });
      return;
    }
  }

  // Helper to speak the main body text (neural online or local offline)
  const speakMainText = async (alreadyStarted = false) => {
    const triggerStart = () => {
      if (!alreadyStarted) onStart?.();
    };

    const cleanCacheKey = `${settings.neuralVoice}:${text.slice(0, 300)}`;
    if (ttsAudioCache.has(cleanCacheKey)) {
      playAudioDataUrl(ttsAudioCache.get(cleanCacheKey)!, triggerStart, onEnd, () => {
        speakWithLocalChileanMaleVoice(text, triggerStart, onEnd);
      });
      return;
    }

    if (navigator.onLine && !settings.preferOfflineBatterySaverVoice) {
      try {
        const res = await fetch('/api/ai/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voiceName: settings.neuralVoice,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            const dataUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
            ttsAudioCache.set(cleanCacheKey, dataUrl);
            playAudioDataUrl(dataUrl, triggerStart, onEnd, () => {
              speakWithLocalChileanMaleVoice(text, triggerStart, onEnd);
            });
            return;
          }
        }
      } catch (_) {
        // Fallback to local voice seamlessly
      }
    }

    speakWithLocalChileanMaleVoice(text, triggerStart, onEnd);
  };

  // 2. If it's an AI response and Rodrigo recorded a short real voice greeting ('ai-greeting'), play his real voice first!
  if (isAIResponse && settings.playRodrigoGreetingBeforeAI) {
    const greetingRec = getRodrigoRecording('ai-greeting');
    if (greetingRec && greetingRec.audioDataUrl) {
      onStart?.();
      playAudioDataUrl(
        greetingRec.audioDataUrl,
        undefined,
        () => {
          setTimeout(() => {
            speakMainText(true);
          }, 250);
        },
        () => {
          speakMainText(true);
        }
      );
      return;
    }
  }

  await speakMainText(false);
}
