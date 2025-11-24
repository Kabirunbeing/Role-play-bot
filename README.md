# Role Play Bot

A full-stack AI character roleplay application featuring authentic anime character generation, custom character creation, and real-time conversations powered by Groq's Llama 3.3 70B model.

## Features

### 🎭 Character Creation
- **Authentic Anime Generator**: 
  - Generate characters with canon-accurate personalities and backstories.
  - Fetches real character images via Jikan API (MyAnimeList) when a name is provided.
  - Rate limited to 7 generations per 5 hours.
- **Manual Creator**: 
  - Design custom characters with detailed traits.
  - AI-powered backstory generator.
  - Choose from pre-made templates.
- **Limit**: Save up to 5 unique characters per user.

### 💬 Immersive Chat
- Real-time AI conversations powered by Groq (Llama 3.3 70B).
- Persistent chat history.
- Context-aware responses based on character personality and backstory.

### 🔐 Security & Tech
- **Frontend**: React 19, Vite, TailwindCSS (Cyberpunk Theme).
- **Backend**: Supabase (Auth, Database, RLS).
- **AI**: Groq Cloud API.

## Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/Kabirunbeing/Role-play-bot.git
   cd Role-play-bot
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```

## License

MIT
