import React, { useState, useEffect } from 'react';
import { DaySchedule, ActivityItem } from '../types/schedule';
import { LANDMARKS } from '../data/landmarks';
import { VINTAGE_AND_SHOPPING_SPOTS } from '../data/vintageFashionSpots';
import { DEFAULT_MARIA_SCHEDULE } from '../data/defaultSchedule';
import { WeatherData, getCityWeather } from '../services/weatherService';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  MapPin,
  Sparkles,
  Heart,
  RotateCcw,
  Copy,
  Check,
  CloudSun,
  Camera,
  Shirt,
  Luggage,
  ShoppingBag,
} from 'lucide-react';

interface MariaScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: DaySchedule[];
  onUpdateSchedule: (newSchedule: DaySchedule[]) => void;
  onFlyToLandmarkId: (landmarkId: string) => void;
  onFlyToVintageSpot?: (spotId: string) => void;
  onAskAIAboutSchedule: () => void;
  onOpenWeatherModal: (cityName?: string) => void;
  onOpenDiaryForDay: (dayNumber: number) => void;
  isOnline: boolean;
}

export const MariaScheduleModal: React.FC<MariaScheduleModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onUpdateSchedule,
  onFlyToLandmarkId,
  onFlyToVintageSpot,
  onAskAIAboutSchedule,
  onOpenWeatherModal,
  onOpenDiaryForDay,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [dayWeather, setDayWeather] = useState<WeatherData | null>(null);

  // New activity form states
  const [newTime, setNewTime] = useState('11:00');
  const [newTitle, setNewTitle] = useState('');
  const [newLandmarkId, setNewLandmarkId] = useState('');
  const [newVintageSpotId, setNewVintageSpotId] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const currentDay = schedule[selectedDayIndex] || schedule[0];

  useEffect(() => {
    if (!isOpen || !currentDay) return;
    let cancelled = false;

    getCityWeather(currentDay.city).then((w) => {
      if (!cancelled) setDayWeather(w);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, currentDay?.city, selectedDayIndex]);

  if (!isOpen) return null;

  const handleToggleActivity = (actId: string) => {
    const updated = schedule.map((day, idx) => {
      if (idx !== selectedDayIndex) return day;
      return {
        ...day,
        activities: day.activities.map((act) =>
          act.id === actId ? { ...act, done: !act.done } : act
        ),
      };
    });
    onUpdateSchedule(updated);
  };

  const handleDeleteActivity = (actId: string) => {
    const updated = schedule.map((day, idx) => {
      if (idx !== selectedDayIndex) return day;
      return {
        ...day,
        activities: day.activities.filter((act) => act.id !== actId),
      };
    });
    onUpdateSchedule(updated);
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      time: newTime,
      title: newTitle.trim(),
      landmarkId: newLandmarkId || undefined,
      vintageSpotId: newVintageSpotId || undefined,
      notes: newNotes.trim() || undefined,
      done: false,
    };

    const updated = schedule.map((day, idx) => {
      if (idx !== selectedDayIndex) return day;
      return {
        ...day,
        activities: [...day.activities, newAct].sort((a, b) =>
          (a.time || '').localeCompare(b.time || '')
        ),
      };
    });

    onUpdateSchedule(updated);
    setNewTitle('');
    setNewNotes('');
    setNewLandmarkId('');
    setNewVintageSpotId('');
    setIsAddingActivity(false);
  };

  const handleAddNewDay = () => {
    const newDayNumber = schedule.length + 1;
    const newDay: DaySchedule = {
      id: `dia-${Date.now()}`,
      dayNumber: newDayNumber,
      title: `Día ${newDayNumber} en Buenos Aires`,
      city: 'Buenos Aires (CABA)',
      tipsForMaria: 'Tip de Rodrigo: Agendá tiempo para descansar y disfrutar un rico café.',
      activities: [
        {
          id: `act-${Date.now()}-1`,
          time: '10:30',
          title: 'Paseo por Buenos Aires',
          done: false,
        },
      ],
    };
    const updated = [...schedule, newDay];
    onUpdateSchedule(updated);
    setSelectedDayIndex(updated.length - 1);
  };

  const handleDeleteCurrentDay = () => {
    if (schedule.length <= 1) return;
    const updated = schedule.filter((_, idx) => idx !== selectedDayIndex);
    onUpdateSchedule(updated);
    setSelectedDayIndex(Math.max(0, selectedDayIndex - 1));
  };

  const handleResetToDefault = () => {
    onUpdateSchedule(DEFAULT_MARIA_SCHEDULE);
    setSelectedDayIndex(0);
    setConfirmReset(false);
  };

  const handleShareSchedule = () => {
    let summary = `🇦🇷 *Mis 3 Días en Buenos Aires (Ruta Mi Amorcito 💕)*\n\n`;
    schedule.forEach((day) => {
      summary += `*${day.title}* (${day.city})\n`;
      day.activities.forEach((act) => {
        summary += `  ${act.done ? '✅' : '⏳'} ${act.time ? `[${act.time}] ` : ''}${act.title}\n`;
      });
      summary += `\n`;
    });

    navigator.clipboard.writeText(summary);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92dvh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shrink-0">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold text-pink-400 uppercase tracking-wider">
                  Plan Primera Vez • 3 Días en CABA
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-extrabold tracking-tight text-white truncate">
                Tus 3 Días en Buenos Aires, mi Amorcito 💕
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleShareSchedule}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-700"
              title="Copiar resumen del itinerario"
            >
              {copiedShare ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{copiedShare ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days Horizontal Tab Navigation */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-slate-800/80 bg-slate-950/40 gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {schedule.map((day, idx) => {
              const isSelected = idx === selectedDayIndex;
              const pendingCount = day.activities.filter((a) => !a.done).length;

              return (
                <button
                  key={day.id || idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Día {day.dayNumber}</span>
                  {pendingCount > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={handleAddNewDay}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold border border-dashed border-sky-400/40 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Día</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onOpenWeatherModal('Buenos Aires')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-300 text-xs font-bold transition-all"
            >
              <CloudSun className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Clima BA</span>
            </button>
          </div>
        </div>

        {/* Selected Day View */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
          {currentDay && (
            <>
              {/* Day Title and City Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div>
                  <span className="text-[11px] font-bold text-pink-400 uppercase tracking-wider">
                    📍 {currentDay.city}
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                    {currentDay.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => onOpenDiaryForDay(currentDay.dayNumber)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-pink-300 text-xs font-bold transition-all"
                  >
                    <Camera className="w-3.5 h-3.5 text-pink-400" />
                    <span>Fotos Día {currentDay.dayNumber}</span>
                  </button>

                  <button
                    onClick={() => setIsAddingActivity(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>

                  {schedule.length > 1 && (
                    <button
                      onClick={handleDeleteCurrentDay}
                      className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 transition-colors"
                      title="Eliminar este día"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Weather & Packing Quick Bar */}
              {dayWeather && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/30 border border-sky-500/30">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{dayWeather.icon}</span>
                      <div>
                        <span className="text-[10px] font-bold text-sky-400 uppercase block">
                          Clima en Buenos Aires
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {dayWeather.temperature}°C • {dayWeather.conditionText}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenWeatherModal('Buenos Aires')}
                      className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-xs font-bold"
                    >
                      Pronóstico
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 text-xs">
                    <div className="flex items-start gap-1.5 text-slate-300">
                      <Shirt className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-100">Look hoy:</strong>{' '}
                        {dayWeather.packingAdvice.clothing[0]}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-300">
                      <Luggage className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-100">Llevar:</strong>{' '}
                        {dayWeather.packingAdvice.accessories[0]}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rodrigo's Loving Tip for this Day */}
              {currentDay.tipsForMaria && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-pink-950/30 border border-pink-800/40 text-pink-100 text-xs leading-relaxed">
                  <Heart className="w-4 h-4 text-pink-400 shrink-0 mt-0.5 fill-current" />
                  <div>
                    <span className="font-extrabold text-pink-300 block mb-0.5">
                      💌 Consejo de Rodrigo para tu Día {currentDay.dayNumber}:
                    </span>
                    {currentDay.tipsForMaria}
                  </div>
                </div>
              )}

              {/* New Activity Form */}
              {isAddingActivity && (
                <form
                  onSubmit={handleAddActivity}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-sky-500/40 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-sky-400 uppercase">
                      Nueva Parada — Día {currentDay.dayNumber}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingActivity(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Hora:</label>
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">Actividad:</label>
                      <input
                        type="text"
                        placeholder="Ej. Visitar tienda vintage o tomar café"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Vincular a Tienda de Moda (opcional):
                      </label>
                      <select
                        value={newVintageSpotId}
                        onChange={(e) => setNewVintageSpotId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="">Ninguna</option>
                        {VINTAGE_AND_SHOPPING_SPOTS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.emoji} {s.shortTitle} ({s.neighborhood})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Notas:</label>
                      <input
                        type="text"
                        placeholder="Dirección o recordatorio"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md"
                    >
                      Guardar Parada
                    </button>
                  </div>
                </form>
              )}

              {/* Activities List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Paradas del Día ({currentDay.activities.length})</span>
                  <span className="text-[10px] text-slate-500 normal-case">
                    Tocá el círculo cuando ya hayas ido
                  </span>
                </h4>

                {currentDay.activities.map((activity) => {
                  const linkedLandmark = LANDMARKS.find((l) => l.id === activity.landmarkId);
                  const linkedVintageSpot = VINTAGE_AND_SHOPPING_SPOTS.find(
                    (s) => s.id === activity.vintageSpotId
                  );

                  return (
                    <div
                      key={activity.id}
                      className={`flex items-start justify-between gap-2.5 p-3.5 rounded-2xl border transition-all ${
                        activity.done
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                          : 'bg-slate-950/85 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleActivity(activity.id)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                        >
                          {activity.done ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-500" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {activity.time && (
                              <span className="text-[11px] font-bold text-sky-300 font-mono px-2 py-0.5 rounded-md bg-sky-950/60 border border-sky-800/50">
                                {activity.time} hs
                              </span>
                            )}
                            <span
                              className={`text-xs sm:text-sm font-extrabold text-white ${
                                activity.done ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {activity.title}
                            </span>
                          </div>

                          {activity.notes && (
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                              {activity.notes}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {linkedVintageSpot && onFlyToVintageSpot && (
                              <button
                                onClick={() => {
                                  onFlyToVintageSpot(linkedVintageSpot.id);
                                  onClose();
                                }}
                                className="flex items-center gap-1 text-[11px] font-extrabold text-pink-200 hover:text-white px-2.5 py-1 rounded-xl bg-pink-600/30 hover:bg-pink-600/50 border border-pink-400/50 transition-colors"
                              >
                                <ShoppingBag className="w-3 h-3 text-pink-300" />
                                <span>
                                  📍 Ver {linkedVintageSpot.shortTitle} en el Mapa (
                                  {linkedVintageSpot.address})
                                </span>
                              </button>
                            )}

                            {linkedLandmark && (
                              <button
                                onClick={() => {
                                  onFlyToLandmarkId(linkedLandmark.id);
                                  onClose();
                                }}
                                className="flex items-center gap-1 text-[11px] font-bold text-sky-300 hover:text-white px-2.5 py-1 rounded-xl bg-sky-500/15 hover:bg-sky-500/30 border border-sky-500/40 transition-colors"
                              >
                                <MapPin className="w-3 h-3" />
                                <span>📍 Ver {linkedLandmark.shortTitle} en el Mapa</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800 shrink-0"
                        title="Eliminar parada"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/90 text-xs">
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-rose-300 font-bold">¿Restablecer los 3 días en BA?</span>
              <button
                onClick={handleResetToDefault}
                className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold"
              >
                Sí, restablecer
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer plan de 3 días</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onAskAIAboutSchedule}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-extrabold shadow-md transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Preguntarle a tu Guía IA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
