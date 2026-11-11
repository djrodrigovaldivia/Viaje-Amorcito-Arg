import React, { useState, useEffect } from 'react';
import { DaySchedule } from '../types/schedule';
import {
  WeatherData,
  getCityWeather,
  ARGENTINA_CITIES,
  ArgentineCityCoordinate,
  findNearestArgentineCity,
} from '../services/weatherService';
import {
  X,
  CloudSun,
  MapPin,
  Wind,
  Droplets,
  Thermometer,
  Sparkles,
  Heart,
  Navigation,
  RefreshCw,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Shirt,
  Luggage,
} from 'lucide-react';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: DaySchedule[];
  userLocation: { lat: number; lng: number; address?: string } | null;
  onRequestUserLocation: () => void;
  isOnline: boolean;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  schedule,
  userLocation,
  onRequestUserLocation,
  isOnline,
}) => {
  const [selectedCityName, setSelectedCityName] = useState<string>('Buenos Aires');
  const [currentLocationWeather, setCurrentLocationWeather] = useState<WeatherData | null>(null);
  const [scheduleWeatherMap, setScheduleWeatherMap] = useState<Record<string, WeatherData>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'itinerary'>('current');

  // When opened, load weather for user location and schedule
  useEffect(() => {
    if (!isOpen) return;

    loadWeatherData();
  }, [isOpen, userLocation]);

  const loadWeatherData = async () => {
    setLoading(true);

    try {
      // 1. Weather for where she is
      if (userLocation) {
        const userWeather = await getCityWeather('Ubicación Actual', userLocation.lat, userLocation.lng);
        setCurrentLocationWeather(userWeather);
        setSelectedCityName(userWeather.cityName);
      } else {
        const defaultWeather = await getCityWeather(selectedCityName);
        setCurrentLocationWeather(defaultWeather);
      }

      // 2. Weather for each destination in itinerary
      const weatherMap: Record<string, WeatherData> = {};
      for (const day of schedule) {
        if (!weatherMap[day.city]) {
          const w = await getCityWeather(day.city);
          weatherMap[day.city] = w;
        }
      }
      setScheduleWeatherMap(weatherMap);
    } catch (err) {
      console.error('Weather loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCityManually = async (cityName: string) => {
    setSelectedCityName(cityName);
    setLoading(true);
    try {
      const w = await getCityWeather(cityName);
      setCurrentLocationWeather(w);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <CloudSun className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  Clima & Ropa Recomendada
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                    isOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isOnline ? '🌤️ Pronóstico en vivo' : '📱 Modo Clima Offline'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>¿Qué clima te espera, María Ignacia?</span>
                <Heart className="w-4 h-4 text-pink-400 fill-current" />
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadWeatherData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Actualizar clima"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs: Donde estoy vs Itinerario */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-950/40 text-xs font-bold">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'current'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Navigation className="w-4 h-4 text-sky-300" />
            <span>Donde estoy hoy (Mi ubicación)</span>
          </button>

          <button
            onClick={() => setActiveTab('itinerary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'itinerary'
                ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-md shadow-pink-600/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4 text-pink-300" />
            <span>Clima por Destinos del Itinerario ({schedule.length} días)</span>
          </button>
        </div>

        {/* Tab 1: Current Location Weather & Packing */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'current' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Location Picker / GPS Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-pink-400" />
                  <span className="text-xs text-slate-300 font-medium">
                    ¿Dónde estás en este momento?:
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={onRequestUserLocation}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 text-xs font-semibold transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{userLocation ? 'Ubicación GPS activa' : 'Detectar con mi GPS'}</span>
                  </button>

                  <select
                    value={selectedCityName}
                    onChange={(e) => handleSelectCityManually(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none"
                  >
                    {ARGENTINA_CITIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.province})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Weather Hero Card for Current Location */}
              {currentLocationWeather && (
                <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-sky-950/40 to-slate-950 border border-sky-500/30 shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                          {currentLocationWeather.region}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          • {currentLocationWeather.updatedAt}
                        </span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                        {currentLocationWeather.cityName}
                      </h3>
                      <p className="text-sm text-slate-300 mt-1 flex items-center gap-2">
                        <span className="text-xl">{currentLocationWeather.icon}</span>
                        <span>{currentLocationWeather.conditionText}</span>
                      </p>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter">
                        {currentLocationWeather.temperature}°
                      </span>
                      <div className="text-xs text-slate-400">
                        <span>C</span>
                        {currentLocationWeather.apparentTemperature && (
                          <div className="text-[11px] text-sky-300 font-medium">
                            ST {currentLocationWeather.apparentTemperature}°C
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Wind & Humidity Badges */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-800 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                      <Wind className="w-4 h-4 text-sky-400" />
                      <span>Viento: {currentLocationWeather.windSpeed} km/h</span>
                    </div>

                    {currentLocationWeather.humidity && (
                      <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                        <Droplets className="w-4 h-4 text-sky-400" />
                        <span>Humedad: {currentLocationWeather.humidity}%</span>
                      </div>
                    )}

                    {currentLocationWeather.minTemp !== undefined && currentLocationWeather.maxTemp !== undefined && (
                      <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                        <Thermometer className="w-4 h-4 text-amber-400" />
                        <span>Min {currentLocationWeather.minTemp}° / Max {currentLocationWeather.maxTemp}°</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rodrigo's Loving Advice for Current Weather */}
              {currentLocationWeather && (
                <div className="p-4 rounded-2xl bg-pink-950/30 border border-pink-800/40 text-pink-200 text-xs leading-relaxed flex items-start gap-3">
                  <Heart className="w-5 h-5 text-pink-400 shrink-0 fill-current mt-0.5" />
                  <div>
                    <span className="font-bold text-pink-300 block mb-0.5">
                      Consejo de abrigo de Rodrigo para acá:
                    </span>
                    {currentLocationWeather.packingAdvice.rodrigoTip}
                  </div>
                </div>
              )}

              {/* Packing / What to wear today */}
              {currentLocationWeather && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Clothing */}
                  <div className="p-5 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                      <Shirt className="w-4 h-4" />
                      <span>Ropa recomendada para hoy</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {currentLocationWeather.packingAdvice.clothing.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Accessories & Essentials */}
                  <div className="p-5 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                      <Luggage className="w-4 h-4" />
                      <span>En tu cartera o mochila</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {currentLocationWeather.packingAdvice.accessories.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Destination Schedule Weather */}
          {activeTab === 'itinerary' && (
            <div className="space-y-4 animate-in fade-in">
              <p className="text-xs text-slate-300">
                Mirá el clima y consejos de qué empacar para cada día y ciudad de tu itinerario:
              </p>

              <div className="space-y-4">
                {schedule.map((day) => {
                  const weather = scheduleWeatherMap[day.city];

                  return (
                    <div
                      key={day.id || day.dayNumber}
                      className="p-5 rounded-3xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div>
                          <span className="text-[11px] font-semibold text-pink-400 uppercase tracking-wider">
                            Día {day.dayNumber} • {day.city}
                          </span>
                          <h4 className="text-base font-bold text-white mt-0.5">
                            {day.title}
                          </h4>
                        </div>

                        {weather && (
                          <div className="flex items-center gap-3 bg-slate-900 px-3.5 py-1.5 rounded-2xl border border-slate-800">
                            <span className="text-2xl">{weather.icon}</span>
                            <div>
                              <div className="text-base font-bold text-white leading-none">
                                {weather.temperature}°C
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {weather.conditionText}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Packing guidance for this destination */}
                      {weather && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                          <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800/60">
                            <span className="font-bold text-sky-400 block mb-1">
                              👕 Qué ropa empacar para {day.city}:
                            </span>
                            <ul className="space-y-1 text-slate-300 text-[11px]">
                              {weather.packingAdvice.clothing.slice(0, 3).map((c, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <span className="text-emerald-400">•</span>
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800/60">
                            <span className="font-bold text-amber-400 block mb-1">
                              🎒 Infaltables en la mochila:
                            </span>
                            <ul className="space-y-1 text-slate-300 text-[11px]">
                              {weather.packingAdvice.accessories.slice(0, 3).map((a, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <span className="text-amber-400">•</span>
                                  <span>{a}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Rodrigo tip */}
                      {weather?.packingAdvice.rodrigoTip && (
                        <div className="text-[11px] text-pink-300 bg-pink-950/20 px-3 py-2 rounded-xl border border-pink-900/30 flex items-center gap-2">
                          <Heart className="w-3.5 h-3.5 fill-current text-pink-400 shrink-0" />
                          <span>{weather.packingAdvice.rodrigoTip}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 text-xs">
          <div className="text-slate-400">
            Los datos se guardan para que puedas ver el pronóstico sin gastar tus datos en Argentina.
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
