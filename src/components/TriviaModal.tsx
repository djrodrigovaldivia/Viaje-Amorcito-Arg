import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Landmark } from '../data/landmarks';
import {
  X,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Sparkles,
  MapPin,
} from 'lucide-react';

interface TriviaModalProps {
  landmarks: Landmark[];
  isOpen: boolean;
  onClose: () => void;
  onFlyToLandmark: (landmark: Landmark) => void;
}

export const TriviaModal: React.FC<TriviaModalProps> = ({
  landmarks,
  isOpen,
  onClose,
  onFlyToLandmark,
}) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const currentLandmark = landmarks[currentQuestionIdx];
  const trivia = currentLandmark.trivia;

  const handleSelectOption = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);

    if (idx === trivia.correctIndex) {
      setScore((prev) => prev + 1);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#38bdf8', '#f59e0b', '#ffffff'],
      });
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx + 1 < landmarks.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsCompleted(true);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setScore(0);
    setIsCompleted(false);
  };

  const getRank = (finalScore: number, total: number) => {
    const ratio = finalScore / total;
    if (ratio >= 0.85) return { title: 'Embajador de la República 🇦🇷', desc: '¡Conocés cada rincón y secreto de la geografía argentina con maestría absoluta!' };
    if (ratio >= 0.6) return { title: 'Tropero Patagónico & Gaucho Guía 🐎', desc: '¡Gran conocimiento de los paisajes, historias y cumbres de nuestro país!' };
    if (ratio >= 0.35) return { title: 'Viajero Aventurero 🧭', desc: 'Buen recorrido; seguí explorando los monumentos en 3D para dominar cada postal.' };
    return { title: 'Turista Curioso 🎒', desc: 'Estás iniciando tu viaje por Argentina; recorré cada landmark con la audioguía.' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇦🇷</span>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                <span>Desafío Criollo: ¿Cuánto sabés de Argentina?</span>
              </h3>
              <p className="text-xs text-sky-400 font-medium">
                Pregunta {currentQuestionIdx + 1} de {landmarks.length}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!isCompleted ? (
            <div className="space-y-5">
              {/* Landmark card prompt */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <img
                  src={currentLandmark.imageUrl}
                  alt={currentLandmark.shortTitle}
                  className="w-16 h-16 rounded-xl object-cover border border-sky-400/30"
                />
                <div>
                  <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                    {currentLandmark.province}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {currentLandmark.shortTitle}
                  </h4>
                </div>
              </div>

              {/* Question */}
              <div className="text-base font-semibold text-slate-100 leading-snug">
                {trivia.question}
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {trivia.options.map((opt, idx) => {
                  const isChosen = selectedAnswer === idx;
                  const isCorrect = idx === trivia.correctIndex;
                  const hasAnswered = selectedAnswer !== null;

                  let style = 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-sky-400 hover:bg-slate-800';
                  if (hasAnswered) {
                    if (isCorrect) {
                      style = 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold';
                    } else if (isChosen) {
                      style = 'bg-rose-500/20 border-rose-400 text-rose-200';
                    } else {
                      style = 'bg-slate-950/40 border-slate-800 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-sm text-left transition-all ${style}`}
                    >
                      <span>{opt}</span>
                      {hasAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {hasAnswered && isChosen && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation note when answered */}
              {selectedAnswer !== null && (
                <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-800/60 text-xs text-sky-200 leading-relaxed animate-in fade-in">
                  <div className="font-bold text-sky-400 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Dato histórico:</span>
                  </div>
                  {trivia.explanation}
                </div>
              )}

              {/* Next Question action */}
              {selectedAnswer !== null && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      onFlyToLandmark(currentLandmark);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    <span>Volar a este monumento</span>
                  </button>

                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    {currentQuestionIdx + 1 < landmarks.length ? 'Siguiente Pregunta →' : 'Ver Resultados Finales 🏆'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Results Screen */
            <div className="text-center py-6 space-y-5">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20">
                <Trophy className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase font-semibold text-sky-400 tracking-wider">
                  Tu puntaje criollo
                </span>
                <h4 className="text-3xl font-extrabold text-white">
                  {score} / {landmarks.length} aciertos
                </h4>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 max-w-md mx-auto">
                <div className="text-base font-bold text-amber-300">
                  {getRank(score, landmarks.length).title}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {getRank(score, landmarks.length).desc}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all border border-slate-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Jugar de Nuevo</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  Continuar el Tour 3D
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
