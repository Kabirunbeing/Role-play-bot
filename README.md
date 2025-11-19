# 🎭 RolePlayForge

A frontend-only web application for creating and chatting with fictional characters. Build unique personalities, craft compelling backstories, and engage in conversations that reflect each character's traits.

## ✨ Features

- **Character Creation**: Design characters with custom names, personalities, backstories, and avatars
- **Personality Types**: Choose from 5 distinct personalities:
  - 😊 **Friendly** - Warm, kind, and supportive
  - 😏 **Sarcastic** - Witty with a sharp tongue
  - 🧙 **Wise** - Thoughtful and philosophical
  - 🌑 **Dark** - Mysterious and brooding
  - 🌟 **Cheerful** - Bubbly and enthusiastic
- **Interactive Chat**: Real-time conversations with personality-based responses
- **Character Management**: View, edit, and delete your characters
- **Persistent Storage**: Characters and conversations saved in browser local storage
- **Dark RPG Theme**: Beautiful dark UI with purple accents

## 🚀 Quick Start

### Prerequisites
- Node.js (v20.17.0 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project**
   ```bash
   cd role-play
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🛠️ Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **React Router DOM 6** - Client-side routing
- **Zustand** - Lightweight state management
- **Tailwind CSS 3** - Utility-first styling
- **Local Storage** - Persistent data storage

## 📁 Project Structure

```
role-play/
├── src/
│   ├── components/
│   │   └── Layout.jsx          # Main layout with header/footer
│   ├── pages/
│   │   ├── Home.jsx            # Landing page
│   │   ├── CreateCharacter.jsx # Character creation form
│   │   ├── CharacterList.jsx   # List of all characters
│   │   └── Chat.jsx            # Chat interface
│   ├── store/
│   │   └── useStore.js         # Zustand store (state management)
│   ├── App.jsx                 # Main app with routing
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles + Tailwind
├── public/
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## 🎮 Usage Guide

### 1. Create a Character
1. Click "Create Your First Character" on the home page
2. Select an avatar emoji
3. Enter a character name
4. Choose a personality type
5. Write a compelling backstory (minimum 10 characters)
6. Click "Create & Start Chatting"

### 2. Chat with Characters
- Type messages in the input field
- Characters respond based on their personality
- Responses simulate typing delay (800-2000ms)
- All messages are saved automatically

### 3. Manage Characters
- View all characters in "My Characters" page
- See message counts and creation dates
- Delete characters (removes all chat history)
- Switch between characters anytime

## 🧪 Mock Response System

This is a **frontend-only MVP** with no backend or AI integration. Character responses are:
- **Hardcoded** templates based on personality type
- **Randomized** from a pool of preset responses
- **Personality-aware** - each type has unique response patterns

Example response templates:
- **Friendly**: "That's really interesting! Tell me more..."
- **Sarcastic**: "Oh, how fascinating... truly groundbreaking stuff."
- **Wise**: "In my years of experience, I've learned..."
- **Dark**: "The shadows whisper secrets you cannot comprehend..."
- **Cheerful**: "Oh my gosh, that's so exciting! 🌟"

## 🎨 Customization

### Add New Personality Types
Edit `src/pages/CreateCharacter.jsx`:
```javascript
const PERSONALITY_TYPES = [
  { value: 'custom', label: 'Custom', emoji: '🎭', description: 'Your description' },
  // ... existing types
];
```

Then add responses in `src/store/useStore.js`:
```javascript
const responses = {
  custom: [
    "Custom response 1",
    "Custom response 2",
  ],
  // ... existing responses
};
```

### Modify Theme Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  'accent-purple': '#8b5cf6', // Change to your color
  // ... other colors
}
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 📝 Future Enhancements (Post-MVP)

- [ ] Backend integration with real AI (OpenAI, Anthropic, etc.)
- [ ] User authentication
- [ ] Character images/avatars
- [ ] Voice chat with text-to-speech
- [ ] Export/import characters
- [ ] Share characters with other users
- [ ] Advanced personality customization
- [ ] Conversation history search
- [ ] Multiple conversation threads per character
- [ ] Character relationships and group chats

## 🐛 Known Limitations

- **No AI**: Responses are preset templates, not intelligent
- **Local Storage Only**: Data is browser-specific (not synced)
- **No Authentication**: Anyone with browser access can see characters
- **Limited Personalities**: Only 5 preset types
- **No Backend**: Cannot share or sync across devices

## 📄 License

This is an MVP project for demonstration purposes.

## 🙋 Support

For issues or questions:
1. Check the browser console for errors
2. Clear local storage: `localStorage.clear()` in browser console
3. Refresh the page

## 🎉 Credits

Built with ❤️ as a frontend-only MVP for RolePlayForge.

---

**Note**: This is a **mock application** with hardcoded responses. To make it production-ready, you'll need to integrate a backend API with actual AI/LLM capabilities.

