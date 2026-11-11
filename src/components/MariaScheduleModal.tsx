import React, { useState, useEffect } from 'react';
import { DaySchedule, ActivityItem } from '../types/schedule';
import { LANDMARKS } from '../data/landmarks';
import { DEFAULT_MARIA_SCHEDULE } from '../data/defaultSchedule';
import { WeatherData, getCityWeather } from '../services/weatherService';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
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
} from 'lucide-react';

interface MariaScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: DaySchedule[];
  onUpdateSchedule: (newSchedule: DaySchedule[]) => void;
  onFlyToLandmarkId: (landmarkId: string) => void;
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
  onAskAIAboutSchedule,
  onOpenWeatherModal,
  onOpenDiaryForDay,
  isOnline,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [dayWeather, setDayWeather] = useState<WeatherData | null>(null);

  // New activity form states
  const [newTime, setNewTime] = useState('11:00');
  const [newTitle, setNewTitle] = useState('');
  const [newLandmarkId, setNewLandmarkId] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const currentDay = schedule[selectedDayIndex] || schedule[0];

  // Load weather for selected day's city (works offline via built-in Argentine climate engine)
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
      notes: newNotes.trim() || undefined,
      done: false,
    };

    const updated = schedule.map((day, idx) => {
      if (idx !== selectedDayIndex) return day;
      return {
        ...day,
        activities: [...day.activities, newAct].sort((a, b) => (a.time || '').localeCompare(b.time || '')),
      };
    });

    onUpdateSchedule(updated);
    setNewTitle('');
    setNewNotes('');
    setIsAddingActivity(false);
  };

  const handleAddNewDay = () => {
    const newDayNumber = schedule.length + 1;
    const newDay: DaySchedule = {
      id: `dia-${Date.now()}`,
      dayNumber: newDayNumber,
      title: `Día ${newDayNumber} en Argentina`,
      city: 'Buenos Aires',
      tipsForMaria: 'Tip: Agendá tiempo para descansar y disfrutar un rico café.',
      activities: [
        {
          id: `act-${Date.now()}-1`,
          time: '10:00',
          title: 'Paseo matutino o excursión',
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
    if (window.confirm('¿Deseas restablecer el itinerario recomendado por Rodrigo?')) {
      onUpdateSchedule(DEFAULT_MARIA_SCHEDULE);
      setSelectedDayIndex(0);
    }
  };

  const handleShareSchedule = () => {
    let summary = `🇦🇷 *Itinerario de María Ignacia por Argentina* 💕\n\n`;
    schedule.forEach((day) => {
      summary += `*Día ${day.dayNumber}: ${day.title}* (${day.city})\n`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
                  Itinerario Personal
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  💾 Guardado en tu dispositivo
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Días de María Ignacia en Argentina</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareSchedule}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-700"
              title="Copiar resumen del itinerario para compartir"
            >
              {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedShare ? '¡Copiado!' : 'Copiar'}</span>
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
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {schedule.map((day, idx) => {
              const isSelected = idx === selectedDayIndex;
              const pendingCount = day.activities.filter((a) => !a.done).length;

              return (
                <button
                  key={day.id || idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Día {day.dayNumber}</span>
                  {pendingCount > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
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
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold border border-dashed border-sky-400/40 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Día</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={onAskAIAboutSchedule}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-300 text-xs font-semibold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Consultar a la IA</span>
            </button>
          </div>
        </div>

        {/* Selected Day View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {currentDay && (
            <>
              {/* Day Title and City Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div>
                  <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                    Día {currentDay.dayNumber} • {currentDay.city}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                    {currentDay.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Quick Action: Travel Diary Photos for this Day */}
                  <button
                    onClick={() => {
                      onOpenDiaryForDay(currentDay.dayNumber);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-pink-300 text-xs font-bold transition-all shadow-sm"
                    title="Ver o guardar fotos y notas de este día"
                  >
                    <Camera className="w-4 h-4 text-pink-400" />
                    <span>Fotos / Diario del Día</span>
                  </button>

                  <button
                    onClick={() => setIsAddingActivity(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nueva Actividad</span>
                  </button>

                  {schedule.length > 1 && (
                    <button
                      onClick={handleDeleteCurrentDay}
                      className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 transition-colors"
                      title="Eliminar este día"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Weather & What to pack Card for this Scheduled Destination */}
              {dayWeather && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/30 border border-sky-500/30 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-2xl">
                        {dayWeather.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                            Clima en {dayWeather.cityName} ({dayWeather.region})
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                            {dayWeather.isLive ? 'En vivo' : 'Offline'}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-white mt-0.5">
                          {dayWeather.temperature}°C • {dayWeather.conditionText}
                          {dayWeather.minTemp !== undefined && ` (Min ${dayWeather.minTemp}° / Max ${dayWeather.maxTemp}°)`}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenWeatherModal(dayWeather.cityName)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-xs font-semibold transition-all self-start sm:self-auto"
                    >
                      <CloudSun className="w-3.5 h-3.5" />
                      <span>Ver Pronóstico Completo</span>
                    </button>
                  </div>

                  {/* Packing Quick Tips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
                    <div className="flex items-start gap-2 text-slate-300">
                      <Shirt className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-200">Qué ropa llevar: </span>
                        <span>{dayWeather.packingAdvice.clothing[0]}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-300">
                      <Luggage className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-200">En la cartera: </span>
                        <span>{dayWeather.packingAdvice.accessories[0]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rodrigo's Loving Tip for this Day */}
              {currentDay.tipsForMaria && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-pink-950/30 border border-pink-800/40 text-pink-200 text-xs leading-relaxed">
                  <Heart className="w-4 h-4 text-pink-400 shrink-0 mt-0.5 fill-current" />
                  <div>
                    <span className="font-bold text-pink-300 block mb-0.5">
                      Consejo especial de Rodrigo para vos:
                    </span>
                    {currentDay.tipsForMaria}
                  </div>
                </div>
              )}

              {/* New Activity Form Modal / Box */}
              {isAddingActivity && (
                <form
                  onSubmit={handleAddActivity}
                  className="p-4 rounded-2xl bg-slate-950 border border-sky-500/40 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                      Agregar Actividad para el Día {currentDay.dayNumber}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingActivity(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Horario estimado:</label>
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">Nombre de la actividad:</label>
                      <input
                        type="text"
                        placeholder="Ej. Merienda en Café Tortoni / Paseo en barco"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Vincular a monumento 3D (opcional):</label>
                      <select
                        value={newLandmarkId}
                        onChange={(e) => setNewLandmarkId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="">Ninguno</option>
                        {LANDMARKS.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.shortTitle} ({l.province})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Notas o recordatorios:</label>
                      <input
                        type="text"
                        placeholder="Ej. Llevar abrigo o comprar entrada antes"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md"
                    >
                      Guardar Actividad
                    </button>
                  </div>
                </form>
              )}

              {/* Activities List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Actividades Programadas ({currentDay.activities.length})</span>
                  <span className="text-[10px] text-slate-500 normal-case">
                    Tocá el círculo para marcar como hecha
                  </span>
                </h4>

                {currentDay.activities.map((activity) => {
                  const linkedLandmark = LANDMARKS.find((l) => l.id === activity.landmarkId);

                  return (
                    <div
                      key={activity.id}
                      className={`flex items-start justify-between gap-3 p-4 rounded-2xl border transition-all ${
                        activity.done
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleActivity(activity.id)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          {activity.done ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-500" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {activity.time && (
                              <span className="text-xs font-bold text-sky-400 font-mono px-2 py-0.5 rounded-md bg-sky-950/60 border border-sky-800/50">
                                {activity.time} hs
                              </span>
                            )}
                            <span
                              className={`text-sm font-semibold text-white ${
                                activity.done ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {activity.title}
                            </span>
                          </div>

                          {activity.notes && (
                            <p className="text-xs text-slate-400 mt-1 leading-snug">
                              {activity.notes}
                            </p>
                          )}

                          {linkedLandmark && (
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => {
                                  onFlyToLandmarkId(linkedLandmark.id);
                                  onClose();
                                }}
                                className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 transition-colors"
                              >
                                <MapPin className="w-3 h-3" />
                                <span>Ver {linkedLandmark.shortTitle} en el mapa</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800"
                        title="Eliminar actividad"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {currentDay.activities.length === 0 && (
                  <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
                    No hay actividades para este día aún.{' '}
                    <button
                      onClick={() => setIsAddingActivity(true)}
                      className="text-sky-400 underline font-semibold ml-1"
                    >
                      Agregar la primera
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/90 text-xs">
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer itinerario</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenDiaryForDay(currentDay?.dayNumber || 1)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/30 text-pink-300 font-semibold transition-all"
            >
              <Camera className="w-4 h-4 text-pink-400" />
              <span>Ver Fotos del Diario</span>
            </button>

            <button
              onClick={onAskAIAboutSchedule}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold shadow-md shadow-sky-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Preguntar a la IA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
