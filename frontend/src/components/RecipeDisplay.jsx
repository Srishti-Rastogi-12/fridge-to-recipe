import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Flame, 
  Check, 
  RotateCcw, 
  Lightbulb, 
  Sparkles,
  Printer,
  Play,
  Pause,
  RotateCw
} from 'lucide-react';

// STYLISH INLINE STEP TIMER COMPONENT
function StepTimer({ minutes, stepId }) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Sync state if step changes or resets
  useEffect(() => {
    setSecondsLeft(minutes * 60);
    setIsRunning(false);
  }, [minutes, stepId]);

  useEffect(() => {
    let interval = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = (e) => {
    e.stopPropagation(); // Avoid checking off the step
    setIsRunning(prev => !prev);
  };

  const handleReset = (e) => {
    e.stopPropagation(); // Avoid checking off the step
    setIsRunning(false);
    setSecondsLeft(minutes * 60);
  };

  const totalSeconds = minutes * 60;
  const percentage = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
  const isFinished = secondsLeft === 0;

  return (
    <div className={`flex items-center gap-3.5 mt-3.5 px-3.5 py-2.5 rounded-2xl border transition-all duration-350 ${
      isFinished
        ? 'bg-rose-500/10 border-rose-500/30 animate-pulse text-rose-400'
        : isRunning
        ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
        : 'bg-slate-950/60 border-slate-900 text-slate-350'
    } w-fit print:hidden`}>
      
      {/* Circular SVG Progress Timer */}
      <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
        <svg className="w-9 h-9 transform -rotate-90">
          <circle cx="18" cy="18" r="15" className="stroke-slate-800/80" strokeWidth="2.5" fill="transparent" />
          <circle 
            cx="18" 
            cy="18" 
            r="15" 
            className={`transition-all duration-1000 ${isFinished ? 'stroke-rose-500' : 'stroke-amber-500'}`} 
            strokeWidth="2.5" 
            fill="transparent" 
            strokeDasharray={2 * Math.PI * 15}
            strokeDashoffset={2 * Math.PI * 15 * (1 - percentage / 100)}
          />
        </svg>
        <span className="absolute text-[9px] font-mono font-bold tracking-tight">
          {isFinished ? "🔔" : formatTime(secondsLeft)}
        </span>
      </div>

      <div className="flex flex-col pr-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Cook Timer
        </span>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={handlePlayPause}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-sm ${
              isFinished
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-not-allowed'
                : isRunning
                ? 'bg-slate-900 text-amber-400 border border-amber-500/30'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400 hover:scale-105'
            }`}
            disabled={isFinished}
            type="button"
          >
            {isRunning ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 rounded-lg text-[10px] font-bold transition-all"
            type="button"
          >
            <RotateCw className="h-2.5 w-2.5" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecipeDisplay({ recipe, onReset }) {
  const [currentServings, setCurrentServings] = useState(recipe.servings || 2);
  const [activeSwaps, setActiveSwaps] = useState({});
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    setCurrentServings(recipe.servings || 2);
    setActiveSwaps({});
    setCompletedSteps([]);
  }, [recipe]);

  const handleServingsChange = (amount) => {
    setCurrentServings(prev => Math.max(1, Math.min(20, prev + amount)));
  };

  const handleSwapClick = (ingredientIndex, swapName) => {
    setActiveSwaps(prev => {
      const next = { ...prev };
      if (next[ingredientIndex] === swapName) {
        delete next[ingredientIndex];
      } else {
        next[ingredientIndex] = swapName;
      }
      return next;
    });
  };

  const handleStepToggle = (stepId) => {
    setCompletedSteps(prev => {
      if (prev.includes(stepId)) {
        return prev.filter(id => id !== stepId);
      } else {
        return [...prev, stepId];
      }
    });
  };

  // Helper to parse steps for cooking minutes (e.g. "sauté for 3 minutes", "simmer for 12 mins")
  const parseCookingMinutes = (instruction) => {
    const match = instruction.match(/(\d+)\s*(?:minute|minutes|min|mins)\b/i);
    if (match) {
      const mins = parseInt(match[1], 10);
      if (mins > 0) return mins;
    }
    return null;
  };

  const totalSteps = recipe.steps.length;
  const completedCount = completedSteps.length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const currentStepHighlightId = recipe.steps.find(step => !completedSteps.includes(step.id))?.id;

  const scaleQuantity = (qty) => {
    if (!qty || qty === 0) return null;
    const baseServings = recipe.servings || 2;
    const scaled = (qty * currentServings) / baseServings;
    return Number(scaled.toFixed(2));
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-6 p-1 sm:p-0 animate-fade-in print:bg-white print:text-black">
      
      {/* Confetti Steam Celebration overlay when 100% complete */}
      {progressPercent === 100 && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-around items-end opacity-20">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="text-amber-500 text-3xl animate-bounce"
              style={{
                animationDuration: `${1.5 + Math.random() * 2}s`,
                animationDelay: `${Math.random() * 1.5}s`,
                transform: `translateY(${Math.random() * 100}px)`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons Panel */}
      <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 rounded-xl transition-all text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <RotateCcw className="h-4 w-4" />
          Enter Different Ingredients
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 rounded-xl transition-all text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <Printer className="h-4 w-4" />
          Print Cook Book
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 mb-8 border border-slate-800/80 relative overflow-hidden shadow-glass">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-wrap gap-2.5 items-center mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              recipe.difficulty.toLowerCase() === 'easy' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                : recipe.difficulty.toLowerCase() === 'medium'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
            }`}>
              <Flame className="h-3.5 w-3.5" />
              {recipe.difficulty}
            </span>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-900 text-slate-350 border border-slate-800">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              {recipe.cookTime}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-100 mb-4 tracking-tight leading-tight">
            {recipe.title}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
            {recipe.description}
          </p>
        </div>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Ingredients checklist (5/12 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="glass-card rounded-3xl p-6 border border-slate-800/80 shadow-glass">
            
            {/* Header + Servings adjust */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-900/60">
              <div>
                <h3 className="font-bold text-slate-100 text-lg">Ingredients Checklist</h3>
                <p className="text-xs text-slate-400">Scale quantities up or down</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-inner p-1">
                  <button
                    onClick={() => handleServingsChange(-1)}
                    disabled={currentServings <= 1}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-100 disabled:text-slate-700 disabled:cursor-not-allowed hover:bg-slate-900 rounded-lg transition-colors font-extrabold text-sm focus:outline-none"
                    aria-label="Decrease servings"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-black text-amber-400">
                    {currentServings}
                  </span>
                  <button
                    onClick={() => handleServingsChange(1)}
                    disabled={currentServings >= 20}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-100 disabled:text-slate-700 disabled:cursor-not-allowed hover:bg-slate-900 rounded-lg transition-colors font-extrabold text-sm focus:outline-none"
                    aria-label="Increase servings"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <ul className="space-y-4">
              {recipe.ingredients.map((ing, idx) => {
                const isSwapped = activeSwaps[idx] !== undefined;
                const activeName = isSwapped ? activeSwaps[idx] : ing.name;
                const scaledQty = scaleQuantity(ing.quantity);

                return (
                  <li key={idx} className="group flex flex-col gap-2 pb-4 border-b border-slate-900/60 last:border-b-0 last:pb-0">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-amber-500/80 group-hover:scale-125 transition-transform" />
                      
                      <div className="flex-1">
                        <div className="text-slate-200 text-sm font-semibold">
                          {scaledQty && (
                            <span className="text-amber-400 font-black mr-1 text-base">
                              {scaledQty}
                            </span>
                          )}
                          {ing.unit && (
                            <span className="text-slate-400 text-xs mr-2 font-medium">
                              {ing.unit}
                            </span>
                          )}
                          <span className={isSwapped ? 'text-teal-400 transition-colors' : 'text-slate-200'}>
                            {activeName}
                          </span>
                          
                          {isSwapped && (
                            <span className="inline-block ml-2 text-[9px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded-md font-mono">
                              swapped from {ing.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Swap chips */}
                    {ing.swaps && ing.swaps.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pl-4 mt-1 print:hidden">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mr-1">Swap:</span>
                        {ing.swaps.map((swap, sIdx) => {
                          const isActive = activeSwaps[idx] === swap;
                          return (
                            <button
                              key={sIdx}
                              onClick={() => handleSwapClick(idx, swap)}
                              className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold transition-all duration-200 ${
                                isActive
                                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 shadow-sm'
                                  : 'bg-slate-950/40 text-slate-500 border-slate-900 hover:border-slate-800 hover:text-slate-350'
                              }`}
                              type="button"
                            >
                              {swap}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

          </div>
        </div>

        {/* Cooking steps progression (7/12 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-glass flex flex-col flex-1 relative overflow-hidden">
            
            {/* Header & Progress tracker */}
            <div className="mb-6 relative z-10">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-bold text-slate-100 text-lg">Interactive Walkthrough</h3>
                  <p className="text-xs text-slate-400">Click steps to complete them</p>
                </div>
                
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-lg font-mono text-sm font-bold animate-pulse">
                  {progressPercent}% Done
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 border border-slate-850 h-2.5 rounded-full overflow-hidden relative shadow-inner">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Steps checklist */}
            <div className="space-y-4 flex-1 relative z-10">
              {recipe.steps.map((step, idx) => {
                const isCompleted = completedSteps.includes(step.id);
                const isHighlighted = step.id === currentStepHighlightId;
                const timerMins = parseCookingMinutes(step.instruction);

                return (
                  <div
                    key={step.id}
                    onClick={() => handleStepToggle(step.id)}
                    className={`group cursor-pointer flex gap-4 p-4 rounded-2xl border transition-all duration-350 ${
                      isCompleted
                        ? 'bg-slate-950/40 border-slate-900/60 opacity-50'
                        : isHighlighted
                        ? 'bg-amber-500/5 border-amber-500/40 shadow-lg shadow-amber-500/5 relative overflow-hidden'
                        : 'bg-slate-900/20 border-slate-850 hover:bg-slate-900/40 hover:border-slate-800'
                    }`}
                  >
                    {isHighlighted && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-orange-500"></div>
                    )}

                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStepToggle(step.id);
                      }}
                      className={`mt-0.5 w-6 h-6 flex items-center justify-center rounded-lg border-2 transition-all duration-350 focus:outline-none ${
                        isCompleted
                          ? 'bg-amber-500 border-amber-500 text-slate-950 rotate-0 scale-100 hover:scale-95'
                          : isHighlighted
                          ? 'border-amber-500 bg-slate-950 hover:bg-amber-500/10 hover:scale-110'
                          : 'border-slate-700 bg-slate-950 hover:border-slate-500 hover:scale-105'
                      }`}
                      aria-checked={isCompleted}
                    >
                      {isCompleted && <Check className="h-4 w-4 stroke-[3] animate-fade-in" />}
                    </button>

                    {/* Step body */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isCompleted ? 'text-slate-600' : isHighlighted ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          Step {idx + 1}
                        </span>
                        
                        {isHighlighted && (
                          <span className="flex items-center gap-0.5 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                            <Sparkles className="h-2 w-2" /> COOKING
                          </span>
                        )}
                      </div>

                      <p className={`text-sm sm:text-base leading-relaxed ${
                        isCompleted 
                          ? 'text-slate-500 line-through decoration-slate-600/50' 
                          : 'text-slate-200 font-medium'
                      }`}>
                        {step.instruction}
                      </p>

                      {/* Render step timer if parsed and step is not complete */}
                      {timerMins && !isCompleted && (
                        <StepTimer minutes={timerMins} stepId={step.id} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Success state */}
            {progressPercent === 100 && (
              <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 animate-pulse relative z-10">
                <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Congratulations Chef!</h4>
                  <p className="text-xs text-emerald-500/95 font-medium">All instructions successfully checked off. Ready to plate!</p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Chef Tips */}
      {recipe.tips && recipe.tips.length > 0 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-glass">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Lightbulb className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-lg">Culinary Secret Tips</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipe.tips.map((tip, idx) => (
              <div key={idx} className="flex gap-3 p-4 bg-slate-950/40 border border-slate-900 rounded-2xl">
                <div className="text-amber-500 font-black text-sm mt-0.5">
                  #{(idx + 1)}
                </div>
                <p className="text-slate-350 text-xs sm:text-sm leading-relaxed">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
