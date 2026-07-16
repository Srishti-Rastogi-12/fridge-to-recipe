/**
 * Clean markdown fences and extract potential JSON string from a text block.
 * Handles cases where the model writes: "Here is your recipe: ```json ... ``` Enjoy!"
 * @param {string} rawString 
 * @returns {string} cleaned string
 */
export function extractJsonString(rawString) {
  if (!rawString || typeof rawString !== 'string') {
    return '';
  }

  let cleaned = rawString.trim();

  // Remove markdown blocks if they enclose the whole string
  // e.g. ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/, '');

  // If there's still text before/after the JSON, search for the first '{' and last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

/**
 * Validates the parsed recipe object against the required schema.
 * Replaces missing/invalid values with safe defaults.
 * @param {any} data 
 * @returns {object} sanitized recipe object
 */
export function sanitizeRecipeSchema(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Parsed response is not a valid JSON object.');
  }

  const recipe = {};

  // Title validation
  recipe.title = typeof data.title === 'string' && data.title.trim() !== ''
    ? data.title.trim()
    : 'Custom AI Recipe';

  // Description validation
  recipe.description = typeof data.description === 'string' && data.description.trim() !== ''
    ? data.description.trim()
    : 'A delicious recipe custom-made from your refrigerator ingredients.';

  // Servings validation (must be a positive number)
  let servings = parseInt(data.servings, 10);
  if (isNaN(servings) || servings <= 0) {
    servings = 2;
  }
  recipe.servings = servings;

  // CookTime validation
  recipe.cookTime = typeof data.cookTime === 'string' && data.cookTime.trim() !== ''
    ? data.cookTime.trim()
    : '20 mins';

  // Difficulty validation
  recipe.difficulty = typeof data.difficulty === 'string' && data.difficulty.trim() !== ''
    ? data.difficulty.trim()
    : 'Easy';

  // Ingredients validation
  recipe.ingredients = [];
  if (Array.isArray(data.ingredients)) {
    data.ingredients.forEach((ing, index) => {
      if (!ing || typeof ing !== 'object') return;

      const name = typeof ing.name === 'string' && ing.name.trim() !== ''
        ? ing.name.trim()
        : `Ingredient ${index + 1}`;

      // Handle quantity scaling (should be a positive float/int)
      let quantity = parseFloat(ing.quantity);
      if (isNaN(quantity) || quantity < 0) {
        quantity = 0; // 0 represents "to taste" or no specified amount
      }

      const unit = typeof ing.unit === 'string'
        ? ing.unit.trim()
        : '';

      const swaps = Array.isArray(ing.swaps)
        ? ing.swaps.filter(s => typeof s === 'string' && s.trim() !== '').map(s => s.trim())
        : [];

      recipe.ingredients.push({
        name,
        quantity,
        unit,
        swaps
      });
    });
  }

  // Ensure at least one ingredient exists
  if (recipe.ingredients.length === 0) {
    recipe.ingredients.push({
      name: 'Water or Oil',
      quantity: 1,
      unit: 'pinch',
      swaps: []
    });
  }

  // Steps validation
  recipe.steps = [];
  if (Array.isArray(data.steps)) {
    data.steps.forEach((step, index) => {
      if (!step || typeof step !== 'object') return;

      const instruction = typeof step.instruction === 'string' && step.instruction.trim() !== ''
        ? step.instruction.trim()
        : 'Prepare ingredients and cook to taste.';

      const id = parseInt(step.id, 10) || (index + 1);

      recipe.steps.push({
        id,
        instruction
      });
    });
  } else {
    recipe.steps.push({
      id: 1,
      instruction: 'Combine all ingredients in a pan and cook over medium heat.'
    });
  }

  // Sort steps by ID to ensure sequence
  recipe.steps.sort((a, b) => a.id - b.id);

  // Tips validation
  recipe.tips = [];
  if (Array.isArray(data.tips)) {
    recipe.tips = data.tips.filter(tip => typeof tip === 'string' && tip.trim() !== '').map(tip => tip.trim());
  }

  return recipe;
}

/**
 * Main parse & validation entry point. Never crashes.
 * @param {string} rawResponse 
 * @returns {object} { success: boolean, recipe: object|null, error: string|null }
 */
export function validateAndParseRecipe(rawResponse) {
  if (!rawResponse || typeof rawResponse !== 'string' || rawResponse.trim() === '') {
    return {
      success: false,
      recipe: null,
      error: 'Empty response received from the backend.'
    };
  }

  try {
    const cleanedString = extractJsonString(rawResponse);
    if (!cleanedString) {
      return {
        success: false,
        recipe: null,
        error: 'Could not find JSON boundaries in the response text.'
      };
    }

    const parsedJson = JSON.parse(cleanedString);
    const sanitizedRecipe = sanitizeRecipeSchema(parsedJson);

    return {
      success: true,
      recipe: sanitizedRecipe,
      error: null
    };

  } catch (err) {
    console.error('JSON parsing/validation failed:', err);
    return {
      success: false,
      recipe: null,
      error: `JSON Validation Error: ${err.message || 'Failed to parse recipe response.'}`
    };
  }
}
