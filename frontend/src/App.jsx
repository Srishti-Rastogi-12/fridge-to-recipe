import React, { useState, useEffect, useRef } from 'react';
import { 
  ChefHat, 
  Sparkles, 
  UtensilsCrossed, 
  HelpCircle, 
  Loader2,
  FileJson,
  Database,
  ArrowRight
} from 'lucide-react';
import IngredientInput from './components/IngredientInput';
import RecipeDisplay from './components/RecipeDisplay';
import ErrorFallback from './components/ErrorFallback';
import { mockRecipes } from './components/mockData';
import { validateAndParseRecipe } from './utils/jsonValidator';

const LOADING_MESSAGES = [
  "Rummaging through your refrigerator...",
  "Consulting our virtual master chefs...",
  "Preheating the digital skillet...",
  "Chopping, dicing, and prepping the ingredients...",
  "Formatting the perfect interactive recipe...",
  "Plating the presentation...",
  "Almost ready! Adding a pinch of digital salt..."
];

export default function App() {
  const [ingredients, setIngredients] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState(null);
  const [recipe, setRecipe] = useState(null);
  
  // Defaulting mockMode to true so it works out of the box
  const [mockMode, setMockMode] = useState(true);

  const abortControllerRef = useRef(null);
  const latestRequestIdRef = useRef(0);

  // Rotate through loading messages while generating
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingMsgIdx(0);
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  // Handle generating the recipe
  const handleGenerateRecipe = async () => {
    if (ingredients.trim() === '') return;

    // Reset previous error and initialize loading
    setError(null);
    setLoading(true);

    // Track request identity to prevent stale overrides
    const requestId = Date.now();
    latestRequestIdRef.current = requestId;

    // Abort active previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 1. MOCK MODE IMPLEMENTATION
    if (mockMode) {
      // Simulate network delay for premium feel
      setTimeout(() => {
        if (latestRequestIdRef.current !== requestId) return;
        
        // Randomly select one of the mock recipes
        const randomIdx = Math.floor(Math.random() * mockRecipes.length);
        const selectedRecipe = mockRecipes[randomIdx];
        
        setRecipe(selectedRecipe);
        setLoading(false);
      }, 2000);
      return;
    }

    // 2. API MODE IMPLEMENTATION
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients }),
        signal: controller.signal,
      });

      // Handle bad request status codes from the server
      if (!response.ok) {
        let errData;
        try {
          errData = await response.json();
        } catch (e) {
          errData = { message: 'Server returned a critical error.' };
        }
        
        throw new Error(errData.message || `Server returned status ${response.status}`);
      }

      const data = await response.json();

      // Ensure we are processing the most recent request
      if (latestRequestIdRef.current !== requestId) {
        return;
      }

      // Safe JSON Parsing & Validation
      const result = validateAndParseRecipe(data.recipeRaw);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to parse recipe schema.');
      }

      setRecipe(result.recipe);
      setLoading(false);

    } catch (err) {
      // Ignore errors caused by explicit AbortController cancellations
      if (err.name === 'AbortError') {
        return;
      }

      if (latestRequestIdRef.current === requestId) {
        console.error('Recipe generation error:', err);
        setError(err.message || 'An unexpected error occurred.');
        setLoading(false);
      }
    }
  };

  // Reset function to clear current recipe and enter new ingredients
  const handleReset = () => {
    setRecipe(null);
    setError(null);
    // Retain ingredients in textarea for convenience
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden">
      
      {/* Dynamic ambient color glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Premium Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleReset}>
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl shadow-md shadow-orange-500/10">
              <UtensilsCrossed className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-amber-400 bg-clip-text text-transparent">
              FridgeToRecipe
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border transition-all ${
              mockMode 
                ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${mockMode ? 'bg-teal-400' : 'bg-amber-400 animate-pulse'}`}></span>
              {mockMode ? 'Mock Mode Active' : 'API Mode Active'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 z-10 flex flex-col gap-8">
        
        {/* Gradient Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-4">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-100 tracking-tight leading-[1.1] mb-4">
            Turn Leftovers Into <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">Culinary Masterpieces</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            Stop staring blankly at your shelves. Paste your ingredients and let AI design an interactive cooking walkthrough formatted exactly for you.
          </p>
        </section>

        {/* Input Panel - Show when there is no recipe loaded and we are not loading */}
        {!recipe && !loading && !error && (
          <IngredientInput
            ingredients={ingredients}
            onChangeIngredients={setIngredients}
            onSubmit={handleGenerateRecipe}
            loading={loading}
            mockMode={mockMode}
            onToggleMockMode={setMockMode}
          />
        )}

        {/* Loading Spinner / Skeleton Experience */}
        {loading && (
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-pulse">
            
            {/* Entertaining Message */}
            <div className="glass-card rounded-2xl p-5 border border-amber-500/20 flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
              <span className="text-sm sm:text-base font-medium text-amber-400 transition-all duration-300">
                {LOADING_MESSAGES[loadingMsgIdx]}
              </span>
            </div>

            {/* Shimmer Recipe Display Skeleton */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-900 flex flex-col gap-6">
              {/* Badge & Title Skeleton */}
              <div className="flex gap-2">
                <div className="w-16 h-5 rounded-md shimmer-bg"></div>
                <div className="w-24 h-5 rounded-md shimmer-bg"></div>
              </div>
              <div className="w-2/3 h-10 rounded-xl shimmer-bg"></div>
              <div className="w-full h-16 rounded-xl shimmer-bg"></div>

              {/* Two Column Skeleton Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-4">
                <div className="md:col-span-5 flex flex-col gap-4">
                  <div className="w-full h-8 rounded-lg shimmer-bg"></div>
                  <div className="w-full h-40 rounded-2xl shimmer-bg"></div>
                </div>
                <div className="md:col-span-7 flex flex-col gap-4">
                  <div className="w-full h-8 rounded-lg shimmer-bg"></div>
                  <div className="w-full h-12 rounded-xl shimmer-bg"></div>
                  <div className="w-full h-12 rounded-xl shimmer-bg"></div>
                  <div className="w-full h-12 rounded-xl shimmer-bg"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Fallback Panel */}
        {error && !loading && (
          <ErrorFallback
            error={error}
            onRetry={handleGenerateRecipe}
          />
        )}

        {/* Recipe Display Dashboard */}
        {recipe && !loading && !error && (
          <RecipeDisplay
            recipe={recipe}
            onReset={handleReset}
          />
        )}

        {/* Empty State Banner (Shown when no active ingredient input exists and we're not cooking) */}
        {!recipe && !loading && !error && ingredients.trim() === '' && (
          <div className="w-full max-w-md mx-auto mt-6 text-center animate-fade-in">
            <div className="glass-card rounded-2xl p-6 border border-slate-900 shadow-inner flex flex-col items-center">
              <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-slate-500 border border-slate-800 shadow-inner mb-4">
                <ChefHat className="h-6 w-6 stroke-[1.5]" />
              </div>
              <h4 className="font-bold text-slate-300 text-sm tracking-tight mb-1">Your Chef's Book is Empty</h4>
              <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
                Add some eggs, flour, tomatoes, or anything else you need to use up to watch the AI build custom steps.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950 py-6 mt-12 text-center text-slate-600 text-xs">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 FridgeToRecipe. Built with React, Express, TailwindCSS, & Gemini API.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Security</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Contact Chef Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
