# Role-Play Bot

An immersive AI-powered character roleplay platform that enables users to create, customize, and engage in dynamic conversations with anime characters through advanced language models.

## ✨ Key Features

### 🎭 Dual Character Creation System

#### Authentic Anime Character Generator
- **Canon-Accurate Generation**: Leverages AI to create characters with authentic personalities, traits, and backstories faithful to their source material
- **Official Character Artwork**: Automatically fetches genuine character images from MyAnimeList via the Jikan API when character names are provided
- **Usage Limits**: Rate-limited to 7 character generations per 5-hour window to ensure fair resource allocation

#### Custom Character Creator
- **Granular Customization**: Design unique characters with comprehensive personality traits, appearance details, and behavioral characteristics
- **AI-Assisted Backstory Generation**: Automatically generate rich, coherent character histories using advanced language models
- **Template Library**: Jumpstart creation with pre-configured character templates
- **Character Gallery**: Each user can save and manage up to 5 distinct characters in their personal collection

### 💬 Interactive Roleplay Experience

- **Advanced AI Conversations**: Powered by Groq's Llama 3.3 70B model for natural, contextually-aware dialogue
- **Persistent Chat History**: All conversations are automatically saved and retrievable across sessions
- **Character-Driven Responses**: AI adapts its responses based on each character's unique personality, backstory, and established traits
- **Real-Time Interaction**: Seamless, low-latency communication for an engaging roleplay experience

### 🏆 Achievements & Progression

- **Badge System**: Unlock achievements for character creation, conversation milestones, and platform engagement
- **User Statistics**: Track your roleplay journey with detailed metrics and progress indicators
- **Character-Specific Badges**: Earn unique badges tied to individual character interactions

### 🔐 Technical Architecture

- **Frontend**: React 19 with Vite for optimized development and build performance
- **Styling**: TailwindCSS with a custom cyberpunk-inspired design system
- **Backend**: Supabase providing authentication, PostgreSQL database, and Row-Level Security (RLS)
- **AI Integration**: Groq Cloud API for high-performance language model inference
- **State Management**: Zustand for efficient client-side state handling

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn package manager
- Supabase account with a configured project

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Kabirunbeing/Role-play-bot.git
   cd Role-play-bot
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Launch Development Server**
   ```bash
   npm run dev
   ```

   The application will be accessible at `http://localhost:5173` (or the next available port).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Kabirunbeing/Role-play-bot/issues).
