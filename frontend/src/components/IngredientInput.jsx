import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, Database, FileJson, Sparkles, X, Plus } from 'lucide-react';

const FRIDGE_ITEMS = [
  { name: 'Tomatoes', icon: '🍅', category: 'veggie', color: 'border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400' },
  { name: 'Garlic', icon: '🧄', category: 'veggie', color: 'border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400' },
  { name: 'Onion', icon: '🧅', category: 'veggie', color: 'border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400' },
  { name: 'Mushrooms', icon: '🍄', category: 'veggie', color: 'border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400' },
  { name: 'Bell Peppers', icon: '🫑', category: 'veggie', color: 'border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400' },
  { name: 'Eggs', icon: '🥚', category: 'protein', color: 'border-rose-500/20 hover:bg-rose-500/10 text-rose-400' },
  { name: 'Chicken', icon: '🍗', category: 'protein', color: 'border-rose-500/20 hover:bg-rose-500/10 text-rose-400' },
  { name: 'Cheese', icon: '🧀', category: 'dairy', color: 'border-sky-500/20 hover:bg-sky-500/10 text-sky-400' },
  { name: 'Butter', icon: '🧈', category: 'dairy', color: 'border-sky-500/20 hover:bg-sky-500/10 text-sky-400' },
  { name: 'Cooked Rice', icon: '🌾', category: 'grain', color: 'border-amber-500/20 hover:bg-amber-500/10 text-amber-400' },
  { name: 'Bread', icon: '🍞', category: 'grain', color: 'border-amber-500/20 hover:bg-amber-500/10 text-amber-400' },
];

export default function IngredientInput({
  ingredients,
  onChangeIngredients,
  onSubmit,
  loading,
  mockMode,
  onToggleMockMode
}) {
  const textareaRef = useRef(null);
  const maxLength = 1000;

  // Local state for custom items added by the user
  const [customItems, setCustomItems] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_fridge_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // State for the custom item text input field
  const [customInput, setCustomInput] = useState('');

  // Add Ctrl+Enter keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!loading && ingredients.trim() !== '') {
          onSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ingredients, loading, onSubmit]);

  const handleTextareaChange = (e) => {
    if (e.target.value.length <= maxLength) {
      onChangeIngredients(e.target.value);
    }
  };

  // Helper to parse comma- or newline-separated text into clean tokens
  const getParsedChips = () => {
    return ingredients
      .split(/[\n,]+/)
      .map(i => i.trim())
      .filter(Boolean);
  };

  // Check if an item is already present in the user text list
  const getIsActive = (itemName) => {
    const normalizedName = itemName.toLowerCase();
    const chips = getParsedChips();
    return chips.some(chip => {
      const normalizedChip = chip.toLowerCase();
      // Match whole words or substrings to avoid partial mismatches
      return normalizedChip.includes(normalizedName) || normalizedName.includes(normalizedChip);
    });
  };

  // Toggle shelf item addition/removal
  const handleToggleFridgeItem = (item) => {
    if (loading) return;
    const chips = getParsedChips();
    const isActive = getIsActive(item.name);

    if (isActive) {
      // Remove item. Filter out chips that contain the name.
      const updatedChips = chips.filter(chip => {
        const normalizedChip = chip.toLowerCase();
        const normalizedItem = item.name.toLowerCase();
        return !normalizedChip.includes(normalizedItem) && !normalizedItem.includes(normalizedChip);
      });
      onChangeIngredients(updatedChips.join('\n'));
    } else {
      // Add item on a new line
      const suffix = ingredients.trim() === '' ? '' : '\n';
      onChangeIngredients(ingredients.trim() + suffix + `1 ${item.name.toLowerCase()}`);
    }
  };

  // Add custom item to the user's local shelf
  const handleAddCustomItem = (e) => {
    e.preventDefault();
    const name = customInput.trim();
    if (!name) return;

    // Capitalize first letter
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    // Check for duplicates in custom or default list
    const isDuplicate = 
      customItems.some(i => i.name.toLowerCase() === capitalized.toLowerCase()) ||
      FRIDGE_ITEMS.some(i => i.name.toLowerCase() === capitalized.toLowerCase());

    if (isDuplicate) {
      setCustomInput('');
      return;
    }

    const newItem = {
      name: capitalized,
      icon: '🍳',
      category: 'custom',
      color: 'border-purple-500/20 hover:bg-purple-500/10 text-purple-400'
    };

    const updated = [...customItems, newItem];
    setCustomItems(updated);
    localStorage.setItem('custom_fridge_items', JSON.stringify(updated));
    setCustomInput('');
  };

  // Delete a custom item from the shelf completely
  const handleDeleteCustomShelfItem = (e, itemToDelete) => {
    e.stopPropagation(); // Prevent toggling the item text
    const updated = customItems.filter(i => i.name !== itemToDelete.name);
    setCustomItems(updated);
    localStorage.setItem('custom_fridge_items', JSON.stringify(updated));

    // Also remove it from ingredients text if active
    const chips = getParsedChips();
    const updatedChips = chips.filter(chip => {
      const normalizedChip = chip.toLowerCase();
      const normalizedItem = itemToDelete.name.toLowerCase();
      return !normalizedChip.includes(normalizedItem) && !normalizedItem.includes(normalizedChip);
    });
    onChangeIngredients(updatedChips.join('\n'));
  };

  // Remove individual tag chip from parser
  const handleRemoveChip = (chipText) => {
    if (loading) return;
    const chips = getParsedChips();
    const updatedChips = chips.filter(c => c !== chipText);
    onChangeIngredients(updatedChips.join('\n'));
  };

  const loadSampleIngredients = () => {
    const samples = "2 eggs\n1 onion\n2 cloves garlic\n1 cup cooked rice\n50g cheese\n1 tbsp olive oil";
    onChangeIngredients(samples);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const charCount = ingredients.length;
  const parsedChips = getParsedChips();

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in print:hidden">
      
      {/* Visual Refrigerator + Input Container Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* PANEL 1: Interactive Refrigerator & Pantry Shelves (5/12 cols) */}
        <div className="md:col-span-5 flex flex-col justify-between glass-card rounded-3xl p-6 shadow-glass border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🚪</span>
              <div>
                <h3 className="font-bold text-slate-100 text-base sm:text-lg">Fridge Shelf</h3>
                <p className="text-xs text-slate-400">Click items to toggle them in your pan</p>
              </div>
            </div>

            {/* Refrigerator Shelf Visualization */}
            <div className="space-y-4">
              
              {/* Veggies row */}
              <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-900/60 shadow-inner">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-2">Veggies & Herbs</span>
                <div className="flex flex-wrap gap-2">
                  {FRIDGE_ITEMS.filter(i => i.category === 'veggie').map((item, idx) => {
                    const active = getIsActive(item.name);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleToggleFridgeItem(item)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                          active
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10'
                            : item.color
                        }`}
                        type="button"
                      >
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                        {active ? <X className="h-3 w-3 stroke-[2.5]" /> : <Plus className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Proteins row */}
              <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-900/60 shadow-inner">
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block mb-2">Proteins</span>
                <div className="flex flex-wrap gap-2">
                  {FRIDGE_ITEMS.filter(i => i.category === 'protein').map((item, idx) => {
                    const active = getIsActive(item.name);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleToggleFridgeItem(item)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                          active
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-md shadow-rose-500/10'
                            : item.color
                        }`}
                        type="button"
                      >
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                        {active ? <X className="h-3 w-3 stroke-[2.5]" /> : <Plus className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grains & Dairy Row */}
              <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-900/60 shadow-inner">
                <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block mb-2">Grains & Dairy</span>
                <div className="flex flex-wrap gap-2">
                  {FRIDGE_ITEMS.filter(i => i.category === 'grain' || i.category === 'dairy').map((item, idx) => {
                    const active = getIsActive(item.name);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleToggleFridgeItem(item)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                          active
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md shadow-amber-500/10'
                            : item.color
                        }`}
                        type="button"
                      >
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                        {active ? <X className="h-3 w-3 stroke-[2.5]" /> : <Plus className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Pantry Section */}
              <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-900/60 shadow-inner">
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mb-2">Custom Items Shelf</span>
                
                {customItems.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic mb-2.5 px-1">Your custom shelf is empty. Type a product below to add it!</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {customItems.map((item, idx) => {
                      const active = getIsActive(item.name);
                      return (
                        <button
                          key={idx}
                          onClick={() => handleToggleFridgeItem(item)}
                          className={`group/btn flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                            active
                              ? 'bg-purple-500/25 text-purple-300 border-purple-500 shadow-md'
                              : 'border-purple-500/10 hover:bg-purple-500/10 text-purple-400/90'
                          }`}
                          type="button"
                        >
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                          <span
                            onClick={(e) => handleDeleteCustomShelfItem(e, item)}
                            className="ml-1 p-0.5 rounded-md hover:bg-purple-500/30 text-purple-400 hover:text-rose-400 transition-colors"
                            title="Delete item from shelf"
                          >
                            <X className="h-2.5 w-2.5 stroke-[2.5]" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Add Custom Item Form */}
                <form onSubmit={handleAddCustomItem} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add item (e.g. Pasta, Spinach)..."
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    disabled={loading}
                    className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !customInput.trim()}
                    className="bg-purple-500/20 hover:bg-purple-500 hover:text-slate-950 border border-purple-500/40 text-purple-400 font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center justify-center shrink-0 disabled:bg-slate-900 disabled:text-slate-650 disabled:border-slate-850 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </form>
              </div>

            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900/60 text-slate-500 text-[10px] flex items-center justify-between">
            <span>Toggle items to sync with list</span>
            <span className="animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Live Sync
            </span>
          </div>
        </div>

        {/* PANEL 2: Text Area Input & Interactive Chip Parser (7/12 cols) */}
        <div className="md:col-span-7 flex flex-col justify-between glass-card rounded-3xl p-6 shadow-glass border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            {/* Header & Toggle Mode */}
            <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-900/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
                  <ChefHat className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-100 text-base sm:text-lg">Ingredients List</h3>
              </div>

              {/* Mode Toggle Switch */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 shadow-inner">
                <button
                  onClick={() => onToggleMockMode(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    mockMode ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-350'
                  }`}
                  type="button"
                >
                  <FileJson className="h-3 w-3" />
                  Mock
                </button>
                <button
                  onClick={() => onToggleMockMode(false)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    !mockMode ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-350'
                  }`}
                  type="button"
                >
                  <Database className="h-3 w-3" />
                  API
                </button>
              </div>
            </div>

            {/* Input Text Area */}
            <div className="mb-4">
              <textarea
                ref={textareaRef}
                id="ingredients-textarea"
                rows="4"
                className="w-full premium-input rounded-2xl p-4 text-sm sm:text-base resize-none focus:outline-none placeholder:text-slate-600"
                placeholder="Type quantities & items (e.g. 2 eggs, 1 tomato, garlic, olive oil)..."
                value={ingredients}
                onChange={handleTextareaChange}
                disabled={loading}
              />

              <div className="flex items-center justify-between mt-2 px-1">
                <button
                  type="button"
                  onClick={loadSampleIngredients}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors hover:underline"
                  disabled={loading}
                >
                  🍳 Auto-load sample recipe list
                </button>
                <span className="text-[10px] text-slate-500">
                  {charCount} / {maxLength}
                </span>
              </div>
            </div>

            {/* Dynamic Ingredient Tags Parser */}
            {parsedChips.length > 0 && (
              <div className="mb-5 bg-slate-950/30 p-3 rounded-2xl border border-slate-900/60 max-h-[88px] overflow-y-auto">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Parsed Ingredients:</span>
                <div className="flex flex-wrap gap-1.5">
                  {parsedChips.map((chip, cIdx) => (
                    <span
                      key={cIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-350 rounded-lg text-xs font-semibold hover:border-amber-500/40 hover:bg-amber-500/15 transition-all"
                    >
                      {chip}
                      <button
                        onClick={() => handleRemoveChip(chip)}
                        className="text-amber-500/60 hover:text-amber-300 transition-colors focus:outline-none"
                        disabled={loading}
                        type="button"
                        aria-label={`Remove ${chip}`}
                      >
                        <X className="h-3 w-3 stroke-[2.5]" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            {/* Generate Button */}
            <button
              onClick={onSubmit}
              disabled={loading || ingredients.trim() === ''}
              className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-base font-bold shadow-lg overflow-hidden transition-all duration-300 ${
                loading || ingredients.trim() === ''
                  ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 hover:text-white transform hover:-translate-y-0.5 shadow-orange-500/15 focus:ring-2 focus:ring-amber-500'
              }`}
              type="button"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-slate-500 border-t-slate-200 rounded-full animate-spin"></span>
                  Formulating cookbook...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate Interactive Walkthrough
                </span>
              )}
            </button>
            
            <p className="text-center text-[10px] text-slate-500 mt-2.5">
              Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-850 rounded text-slate-400 font-mono text-[9px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-850 rounded text-slate-400 font-mono text-[9px]">Enter</kbd> to submit.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
