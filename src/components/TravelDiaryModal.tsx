import React, { useState, useEffect, useRef } from 'react';
import { DiaryEntry, MoodTag } from '../types/diary';
import { DaySchedule } from '../types/schedule';
import { LANDMARKS } from '../data/landmarks';
import {
  getAllDiaryEntries,
  saveDiaryEntry,
  deleteDiaryEntry,
  compressImageFile,
} from '../services/indexedDBService';
import {
  X,
  Camera,
  Image as ImageIcon,
  Heart,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Sparkles,
  Share2,
  Check,
  ChevronDown,
  Navigation,
  BookOpen,
  Filter,
} from 'lucide-react';

interface TravelDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: DaySchedule[];
  userLocation: { lat: number; lng: number; address?: string } | null;
  onRequestUserLocation: () => void;
  selectedDayNumber?: number;
}

const MOODS: { emoji: MoodTag; label: string }[] = [
  { emoji: '😍', label: '¡Enamorada!' },
  { emoji: '🥰', label: 'Feliz con amor' },
  { emoji: '✨', label: 'Mágico' },
  { emoji: '🏔️', label: 'Aventurera' },
  { emoji: '☕', label: 'Cafecito & relax' },
  { emoji: '🍷', label: 'Brindis' },
  { emoji: '❄️', label: 'Fresquito' },
  { emoji: '☀️', label: 'Día soñado' },
  { emoji: '🌿', label: 'Naturaleza pura' },
  { emoji: '🍦', label: 'Momento dulce' },
];

export const TravelDiaryModal: React.FC<TravelDiaryModalProps> = ({
  isOpen,
  onClose,
  schedule,
  userLocation,
  onRequestUserLocation,
  selectedDayNumber,
}) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterDay, setActiveFilterDay] = useState<number | 'all'>(selectedDayNumber || 'all');
  const [isAdding, setIsAdding] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [locationName, setLocationName] = useState('');
  const [dayNumber, setDayNumber] = useState<number>(selectedDayNumber || 1);
  const [landmarkId, setLandmarkId] = useState('');
  const [mood, setMood] = useState<MoodTag>('😍');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  // Hidden inputs for camera vs gallery
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Load entries when opening
  useEffect(() => {
    if (!isOpen) return;
    loadEntries();
    if (selectedDayNumber) {
      setActiveFilterDay(selectedDayNumber);
      setDayNumber(selectedDayNumber);
    }
  }, [isOpen, selectedDayNumber]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const all = await getAllDiaryEntries();
      setEntries(all);
    } catch (err) {
      console.error('Error loading diary entries:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Handle Photo Selection
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingPhoto(true);
      const compressed = await compressImageFile(file);
      setPhotoPreview(compressed);
    } catch (err) {
      console.error('Photo compression error:', err);
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  // Pre-fill location from GPS or current schedule
  const handleUseCurrentLocation = () => {
    if (userLocation) {
      const nearest = LANDMARKS.find((l) => {
        const d = Math.hypot(l.coordinates.lat - userLocation.lat, l.coordinates.lng - userLocation.lng);
        return d < 0.25;
      });
      setLocationName(
        nearest ? `${nearest.shortTitle}, ${nearest.province}` : `Cerca de ${userLocation.lat.toFixed(3)}, ${userLocation.lng.toFixed(3)} (Argentina)`
      );
    } else {
      onRequestUserLocation();
      const currentDaySchedule = schedule.find((d) => d.dayNumber === dayNumber);
      if (currentDaySchedule) {
        setLocationName(currentDaySchedule.city);
      }
    }
  };

  // Submit New Diary Entry
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !photoPreview && !notes.trim()) return;

    const now = new Date();
    const entryDate = now.toISOString().split('T')[0];
    const entryTime = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    const newEntry: DiaryEntry = {
      id: `diary-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      date: entryDate,
      time: entryTime,
      title: title.trim() || 'Recuerdo de Argentina',
      notes: notes.trim(),
      photoUrl: photoPreview || undefined,
      locationName: locationName.trim() || (schedule.find((s) => s.dayNumber === dayNumber)?.city || 'Argentina'),
      dayNumber: dayNumber || undefined,
      landmarkId: landmarkId || undefined,
      mood: mood,
      favorite: false,
    };

    await saveDiaryEntry(newEntry);
    await loadEntries();

    // Reset form
    setTitle('');
    setNotes('');
    setLocationName('');
    setPhotoPreview(null);
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Deseas borrar esta nota del diario?')) {
      await deleteDiaryEntry(id);
      await loadEntries();
    }
  };

  // Share / Copy diary summary
  const handleShareDiary = () => {
    if (entries.length === 0) return;
    let text = `📖 *Diario de Viaje de María Ignacia por Argentina* 💕\n\n`;
    entries.forEach((e) => {
      text += `${e.mood} *${e.title}* (${e.locationName})\n`;
      if (e.dayNumber) text += `📅 Día ${e.dayNumber} • ${e.time} hs\n`;
      if (e.notes) text += `"${e.notes}"\n`;
      text += `\n`;
    });
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Filtered entries
  const filteredEntries = entries.filter((e) => {
    if (activeFilterDay === 'all') return true;
    return e.dayNumber === activeFilterDay;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <BookOpen className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
                  Diario de Viaje
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  📸 Fotos & Notas 100% Offline
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Recuerdos de María Ignacia</span>
                <Heart className="w-4 h-4 text-pink-400 fill-current" />
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <button
                onClick={handleShareDiary}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-700"
                title="Copiar texto del diario para compartir"
              >
                {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedShare ? '¡Copiado!' : 'Compartir'}</span>
              </button>
            )}

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-pink-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdding ? 'Ver Diario' : 'Nueva Foto / Nota'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar by Itinerary Day */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto scrollbar-none text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-semibold whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span>Filtrar por día:</span>
          </span>

          <button
            onClick={() => setActiveFilterDay('all')}
            className={`px-3 py-1 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeFilterDay === 'all'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todos ({entries.length})
          </button>

          {schedule.map((day) => {
            const countForDay = entries.filter((e) => e.dayNumber === day.dayNumber).length;
            const isSelected = activeFilterDay === day.dayNumber;

            return (
              <button
                key={day.id || day.dayNumber}
                onClick={() => setActiveFilterDay(day.dayNumber)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>Día {day.dayNumber} ({day.city})</span>
                {countForDay > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
                    {countForDay}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* New Entry Form Box */}
          {isAdding && (
            <form
              onSubmit={handleSaveEntry}
              className="p-5 rounded-3xl bg-slate-950 border border-pink-500/40 shadow-xl space-y-4 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Guardar un recuerdo de tu viaje
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Se guarda en la memoria de tu celu
                </span>
              </div>

              {/* Photo Input Buttons (Camera or Gallery) */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Hidden input for mobile camera */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />
                {/* Hidden input for photo library */}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tomar Foto con Cámara</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                  <span>Elegir de Galería</span>
                </button>
              </div>

              {/* Photo Preview if selected */}
              {isCompressingPhoto && (
                <div className="text-xs text-sky-400 animate-pulse text-center py-2">
                  Optimizando foto para que no ocupe espacio...
                </div>
              )}

              {photoPreview && (
                <div className="relative w-full sm:w-64 h-48 rounded-2xl overflow-hidden border-2 border-pink-500/50 shadow-md group mx-auto sm:mx-0">
                  <img src={photoPreview} alt="Vista previa" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-rose-400 hover:bg-slate-900 transition-colors"
                    title="Quitar foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-950/80 text-emerald-300 font-mono">
                    ✓ Lista para guardar
                  </div>
                </div>
              )}

              {/* Title & Mood */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Título o momento:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. ¡Probando empanadas en San Telmo! / Primera vista del glaciar"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    ¿Cómo te sentís?:
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {MOODS.map((m) => (
                      <button
                        key={m.emoji}
                        type="button"
                        onClick={() => setMood(m.emoji)}
                        className={`text-lg p-1.5 rounded-xl transition-all ${
                          mood === m.emoji
                            ? 'bg-pink-500/30 ring-2 ring-pink-500 scale-110'
                            : 'hover:bg-slate-800 opacity-60 hover:opacity-100'
                        }`}
                        title={m.label}
                      >
                        {m.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes Area */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Tu nota, anécdota o lo que más te gustó:
                </label>
                <textarea
                  rows={3}
                  placeholder="Escribí lo que sentiste, qué comiste, si hacía frío o calor, o cualquier detalle lindo para no olvidarlo jamás..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Day & Location linking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Vincular al día del itinerario:
                  </label>
                  <select
                    value={dayNumber}
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10);
                      setDayNumber(num);
                      const targetDay = schedule.find((d) => d.dayNumber === num);
                      if (targetDay && !locationName) {
                        setLocationName(targetDay.city);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                  >
                    {schedule.map((day) => (
                      <option key={day.id || day.dayNumber} value={day.dayNumber}>
                        Día {day.dayNumber}: {day.city} - {day.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-400">
                      Lugar o ubicación:
                    </label>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="text-[10px] text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{userLocation ? 'Usar GPS actual' : 'Detectar GPS'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Ej. Puerto Madero, Buenos Aires / Cataratas del Iguazú"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  Guardar en mi Diario
                </button>
              </div>
            </form>
          )}

          {/* Entries Grid */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
              Cargando tus recuerdos guardados...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-slate-950/40 border border-dashed border-slate-800 space-y-3">
              <div className="w-14 h-14 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center mx-auto">
                <Camera className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white">
                {activeFilterDay === 'all'
                  ? 'Todavía no hay fotos o notas guardadas'
                  : `No hay recuerdos registrados para el Día ${activeFilterDay}`}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                María Ignacia, cada foto o nota que guardes acá quedará disponible aunque no tengas internet ni Wi-Fi.
              </p>
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-bold text-xs shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar el primer recuerdo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEntries.map((entry) => {
                const linkedDay = schedule.find((s) => s.dayNumber === entry.dayNumber);

                return (
                  <div
                    key={entry.id}
                    className="group relative bg-slate-950/80 border border-slate-800 hover:border-pink-500/40 rounded-3xl overflow-hidden shadow-lg transition-all flex flex-col justify-between"
                  >
                    {/* Photo if present */}
                    {entry.photoUrl && (
                      <div
                        className="relative w-full h-52 bg-slate-900 cursor-pointer overflow-hidden"
                        onClick={() => setFullscreenPhoto(entry.photoUrl!)}
                      >
                        <img
                          src={entry.photoUrl}
                          alt={entry.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/20">
                          <span>{entry.mood}</span>
                          <span>{entry.date}</span>
                        </div>
                        <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-full bg-slate-950/80 text-[10px] text-pink-300 font-semibold border border-pink-400/30">
                          Tocá para ampliar 🔍
                        </div>
                      </div>
                    )}

                    {/* Entry Details */}
                    <div className="p-4 space-y-2 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-pink-400 font-semibold">
                          <span className="text-base">{entry.mood}</span>
                          <span>{entry.title}</span>
                        </div>

                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-850 transition-colors"
                          title="Borrar nota"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {entry.notes && (
                        <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                          "{entry.notes}"
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-400">
                        {entry.dayNumber && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>Día {entry.dayNumber} {linkedDay ? `(${linkedDay.city})` : ''}</span>
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-sky-400" />
                          <span>{entry.locationName}</span>
                        </span>

                        <span className="text-slate-500 ml-auto font-mono">
                          {entry.time} hs
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Sweet Message */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 text-xs">
          <div className="flex items-center gap-2 text-pink-300 text-xs">
            <Heart className="w-3.5 h-3.5 fill-current text-pink-400" />
            <span>Guardá todos tus momentos mágicos en Argentina para que los revivamos juntos al volver.</span>
          </div>

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 text-xs font-semibold border border-pink-400/30 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Sacar Foto</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Photo Modal */}
      {fullscreenPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md cursor-pointer animate-in fade-in"
          onClick={() => setFullscreenPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={fullscreenPhoto}
              alt="Foto ampliada"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-slate-700 shadow-2xl"
            />
            <button
              onClick={() => setFullscreenPhoto(null)}
              className="mt-3 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
            >
              Cerrar foto
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
