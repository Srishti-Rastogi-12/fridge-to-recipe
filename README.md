# 🍳 Fridge-to-Recipe

An AI-powered React application that transforms a list of available ingredients into an interactive recipe experience. Instead of displaying raw AI text, the application parses structured JSON returned by an LLM and renders an interactive cooking workflow with checklists, serving adjustments, and ingredient swaps.

---

## 📌 Features

- 🥕 Free-form ingredient input
- 🤖 AI-generated recipes using Gemini API
- 📋 Interactive cooking checklist
- 👨‍🍳 Adjustable serving sizes
- 🔄 Ingredient swap suggestions
- ⚡ Loading, error, and empty states
- 🛡 Robust JSON validation and error handling
- 📱 Responsive mobile-friendly UI
- 🎭 Mock Mode for offline testing

---

## 🛠 Tech Stack

### Frontend
- React (Hooks & Functional Components)
- Vite
- Tailwind CSS
- Lucide React

### Backend
- Node.js
- Express.js
- Gemini API
- dotenv
- CORS

---

## 📂 Project Structure

```text
fridge-to-recipe/
│
├── frontend/
├── backend/
└── README.md
```

---

## 🚀 Installation

### Clone the repository

```bash
git clone https://github.com/Srishti-Rastogi-12/fridge-to-recipe.git
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
node server.js
```

---

## 🎯 Usage

1. Enter the ingredients available in your fridge.
2. Click **Generate Recipe**.
3. The backend securely calls the Gemini API.
4. The AI returns structured JSON.
5. The frontend validates the JSON and renders an interactive recipe.

---

## 🤖 AI Usage

AI tools (ChatGPT and Antigravity) were used to assist with brainstorming, UI ideas, debugging, and implementation. All generated code was reviewed, tested, understood, and modified where required.

---

## ⚠ Known Limitations

- Depends on Gemini API availability.
- Free-tier API usage limits may apply.
- AI responses can occasionally require validation or fallback handling.
- Internet connection is required for API mode.

---

## ⏱ Time Spent

Approximately **8 hours**.

---

## 🔮 Future Improvements

- Save recipe history
- Dark/Light mode toggle
- Streaming AI responses
- Voice-guided cooking
- Nutrition information
- Shopping list generation

---

## 👩‍💻 Author

**Srishti Rastogi**

GitHub: https://github.com/Srishti-Rastogi-12
