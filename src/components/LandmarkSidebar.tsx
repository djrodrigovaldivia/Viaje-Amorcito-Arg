import React, { useState, useMemo } from 'react';
import { Landmark, REGIONS, CATEGORIES } from '../data/landmarks';
import {
  Search,
  Filter,
  Sparkles,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Award,
  Layers,
} from 'lucide-react';

interface LandmarkSidebarProps {
  landmarks: Landmark[];
  selectedLandmark: Landmark;
  onSelectLandmark: (landmark: Landmark) => void;
  onOpenDetails: (landmark: Landmark) => void;
  onOpen3DModal: (landmark: Landmark) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const LandmarkSidebar: React.FC<LandmarkSidebarProps> = ({
  landmarks,
  selectedLandmark,
  onSelectLandmark,
  onOpenDetails,
  onOpen3DModal,
  isOpen,
  onToggleOpen,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLandmarks = useMemo(() => {
    return landmarks.filter((l) => {
      const matchesRegion = selectedRegion === 'all' || l.region === selectedRegion;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        l.name.toLowerCase().includes(query) ||
        l.province.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query) ||
        l.categoryLabel.toLowerCase().includes(query);
      return matchesRegion && matchesQuery;
    });
  }, [landmarks, selectedRegion, searchQuery]);

  return (
    <>
      {/* Toggle button when closed */}
      {!isOpen && (
        <button
          onClick={onToggleOpen}
          className="absolute top-20 left-4 z-30 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 text-sky-400 font-semibold text-xs shadow-2xl transition-all"
          title="Abrir panel de monumentos"
        >
          <Layers className="w-4 h-4" />
          <span>Explorar Monumentos ({landmarks.length})</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Main Sidebar */}
      <aside
        className={`absolute top-16 bottom-20 left-4 z-30 w-84 sm:w-96 flex flex-col bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🇦🇷</span>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Monumentos de Argentina
                </h3>
                <p className="text-[11px] text-sky-400 font-medium">
                  {filteredLandmarks.length} de {landmarks.length} destinos
                </p>
              </div>
            </div>

            <button
              onClick={onToggleOpen}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Ocultar panel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, provincia o atractivo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-sky-500"
            />
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {REGIONS.map((reg) => (
              <button
                key={reg.id}
                onClick={() => setSelectedRegion(reg.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                  selectedRegion === reg.id
                    ? 'bg-sky-500 text-white font-semibold shadow-sm'
                    : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{reg.icon}</span>
                <span>{reg.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Landmarks Card List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredLandmarks.map((landmark) => {
            const isSelected = landmark.id === selectedLandmark.id;

            return (
              <div
                key={landmark.id}
                onClick={() => onSelectLandmark(landmark)}
                className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-sky-950/40 border-sky-400/80 shadow-lg shadow-sky-500/10 ring-1 ring-sky-400/50'
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/80'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-800 shadow-md">
                    <img
                      src={landmark.imageUrl}
                      alt={landmark.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                    {landmark.unesco && (
                      <div className="absolute bottom-1 right-1 bg-amber-500/90 text-slate-950 p-0.5 rounded-sm">
                        <Award className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Texts */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider truncate">
                        {landmark.province}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {landmark.elevation.toLocaleString()} m
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors truncate">
                      {landmark.shortTitle}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {landmark.badge}
                    </p>
                  </div>
                </div>

                {/* Bottom Quick Action buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500">
                    {landmark.categoryLabel}
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onOpen3DModal(landmark)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-400/30 text-[10px] font-semibold transition-colors"
                      title="Ver modelo 3D digital"
                    >
                      <Sparkles className="w-3 h-3 text-sky-400" />
                      <span>Gemelo 3D</span>
                    </button>

                    <button
                      onClick={() => onOpenDetails(landmark)}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold transition-colors"
                      title="Ver ficha cultural completa"
                    >
                      Ficha
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredLandmarks.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-xs">
              No se encontraron monumentos para esta búsqueda.
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
