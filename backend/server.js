const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Endpoint to generate recipe from ingredients
app.post('/api/generate', async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || typeof ingredients !== 'string' || ingredients.trim() === '') {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Please provide a non-empty string of ingredients.'
    });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === 'your_llm_api_key_here') {
    console.warn('[WARNING] API key is missing or default. Backend falling back to Mock Mode.');
    
    const fallbackRecipes = [
      {
        "title": "Aromatic Garlic Herb Fried Rice",
        "description": "An incredibly comforting, quick-fry garlic rice using cooked rice, fluffy eggs, and aromatic sautéed onions, seasoned with pepper and soy sauce.",
        "servings": 2,
        "cookTime": "12 mins",
        "difficulty": "Easy",
        "ingredients": [
          { "name": "Cooked Rice", "quantity": 2, "unit": "cups", "swaps": ["Quinoa", "Cauliflower Rice"] },
          { "name": "Garlic Cloves", "quantity": 4, "unit": "cloves", "swaps": ["Shallots"] },
          { "name": "Eggs", "quantity": 2, "unit": "pcs", "swaps": ["Tofu (scrambled)"] },
          { "name": "Butter", "quantity": 1.5, "unit": "tbsp", "swaps": ["Olive Oil", "Sesame Oil"] },
          { "name": "Soy Sauce", "quantity": 1, "unit": "tbsp", "swaps": ["Tamari"] }
        ],
        "steps": [
          { "id": 1, "instruction": "Sauté the garlic: Heat the butter in a large pan or wok over medium heat. Add sliced garlic and fry until golden-brown and crispy." },
          { "id": 2, "instruction": "Scramble eggs: Push garlic to the side, crack eggs in, and scramble quickly until set." },
          { "id": 3, "instruction": "Toss in the rice: Add cooked rice, breaking up clumps, and turn the heat to high." },
          { "id": 4, "instruction": "Season & Stir-fry: Drizzle soy sauce over rice and stir-fry for 2-3 minutes. Serve hot." }
        ],
        "tips": [
          "Using cold day-old rice prevents it from turning mushy.",
          "Top with green onions or sesame seeds for extra crunch."
        ]
      },
      {
        "title": "Rustic Tomato Garlic Scramble",
        "description": "A vibrant egg scramble cooked with ripe diced tomatoes, fresh garlic, and melted cheddar cheese.",
        "servings": 2,
        "cookTime": "15 mins",
        "difficulty": "Easy",
        "ingredients": [
          { "name": "Eggs", "quantity": 4, "unit": "pcs", "swaps": ["Egg Whites"] },
          { "name": "Ripe Tomatoes", "quantity": 2, "unit": "pcs", "swaps": ["Cherry Tomatoes"] },
          { "name": "Garlic Cloves", "quantity": 2, "unit": "cloves", "swaps": ["Onion Powder"] },
          { "name": "Cheese", "quantity": 50, "unit": "g", "swaps": ["Feta", "Mozzarella"] },
          { "name": "Olive Oil", "quantity": 1, "unit": "tbsp", "swaps": ["Butter"] }
        ],
        "steps": [
          { "id": 1, "instruction": "Prep veggies: Mince garlic and dice tomatoes into small cubes." },
          { "id": 2, "instruction": "Whisk eggs: Whisk eggs with salt and pepper until frothy." },
          { "id": 3, "instruction": "Sauté: Heat oil, sauté garlic for 1 minute, then add tomatoes for 3 minutes until softened." },
          { "id": 4, "instruction": "Cook eggs: Pour in eggs, scramble gently on medium-low heat, and stir in cheese right before serving." }
        ],
        "tips": [
          "Take the pan off the heat slightly early; eggs continue cooking from residual heat.",
          "Serve with toasted sourdough or crusty bread."
        ]
      }
    ];

    const randomIndex = Math.floor(Math.random() * fallbackRecipes.length);
    const mockResponse = fallbackRecipes[randomIndex];
    
    // Simulate network delay of 1.5 seconds for realistic AI processing feel
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return res.status(200).json({
      recipeRaw: JSON.stringify(mockResponse)
    });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `You are a recipe generator.
Return ONLY valid JSON.
No markdown.
No explanations.
No extra text.

Schema:
{
  "title": "",
  "description": "",
  "servings": 2,
  "cookTime": "",
  "difficulty": "",
  "ingredients": [
    {
      "name": "",
      "quantity": 1,
      "unit": "",
      "swaps": ["", ""]
    }
  ],
  "steps": [
    {
      "id": 1,
      "instruction": ""
    }
  ],
  "tips": []
}

If the ingredients provided below are insufficient or random, still construct a recipe. You may add common seasoning/pantry staples (like salt, pepper, oil, water) and list them. Always use the JSON schema.

User Ingredients:
${ingredients.trim()}
`;

  // Define timeout controller (30 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      return res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: 'The backend or Gemini API rate limit has been exceeded. Please try again later.'
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API returned error status:', response.status, errorData);
      return res.status(502).json({
        error: 'Bad Gateway',
        message: `Gemini API returned status ${response.status}. Failed to generate recipe.`,
        details: errorData
      });
    }

    const data = await response.json();
    
    // Extract candidate text from Gemini response structure
    const candidate = data.candidates?.[0];
    const textResponse = candidate?.content?.parts?.[0]?.text;

    if (!textResponse || textResponse.trim() === '') {
      return res.status(500).json({
        error: 'Empty Response',
        message: 'The AI model returned an empty recipe. Please try again.'
      });
    }

    // Return the response directly to the frontend.
    // The frontend will parse and validate the JSON.
    return res.status(200).json({
      recipeRaw: textResponse
    });

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.error('Gemini API call timed out.');
      return res.status(504).json({
        error: 'Gateway Timeout',
        message: 'The request to generate a recipe timed out (30s). Please try again with fewer ingredients or try later.'
      });
    }

    console.error('Unexpected error in /api/generate:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred on the server.'
    });
  }
});

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

// Catch-all route for unhandled requests
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Endpoint does not exist.' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`Fridge-to-Recipe Backend listening on port ${PORT}`);
  console.log(`API endpoint available at: http://localhost:${PORT}/api/generate`);
  console.log(`==================================================`);
});
