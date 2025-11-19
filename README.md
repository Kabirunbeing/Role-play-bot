# Role Play Bot

Full-stack AI character roleplay application with authentication and real-time conversations powered by Groq's Llama 3.3 70B model.

## Tech Stack

**Frontend**
- React 19 with Vite 7
- Tailwind CSS (neon cyberpunk theme)
- Zustand for state management
- React Router DOM 6

**Backend**
- Supabase (PostgreSQL database)
- Supabase Auth (email/password authentication)
- Row Level Security policies

**AI**
- Groq Cloud API
- Llama 3.3 70B Versatile model
- 30 requests per minute free tier

## Features

- User authentication with signup/login
- Create custom characters with personalities and backstories
- Real-time AI chat powered by Groq
- Secure API key storage in backend
- Persistent chat history
- Character management (create, edit, delete)
- Protected routes for authenticated users

## Setup

1. Clone the repository
```bash
git clone https://github.com/Kabirunbeing/Role-play-bot.git
cd Role-play-bot
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file with your credentials
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

4. Set up Supabase database
```sql
CREATE TABLE user_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  groq_api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys" ON user_api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys" ON user_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON user_api_keys
  FOR UPDATE USING (auth.uid() = user_id);
```

5. Run development server
```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

MIT

