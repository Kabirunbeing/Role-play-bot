# 🏆 Badges & Achievements System

## Overview
The Badges & Achievements system gamifies your roleplay experience by rewarding users for leur milestones and activities.

## Features

### User Badges 👤
Earned by users for personal achievements:

| Badge | Icon | Requirement | Tier |
|-------|------|-------------|------|
| **First Creation** | 🎭 | Create 1 character | Bronze |
| **Character Collector** | 👥 | Create 5 characters | Silver |
| **Breaking the Ice** | 💬 | Send 1 message | Bronze |
| **Chatty** | 🗨️ | Send 100 messages | Silver |
| **Conversation Master** | 💎 | Send 500 messages | Gold |
| **Community Creator** | 🌟 | Make 1 character public | Silver |
| **Social Butterfly** | 🦋 | Like 10 characters | Bronze |

### Character Badges 🎭
Earned by individual characters based on their popularity:

| Badge | Icon | Requirement | Tier |
|-------|------|-------------|------|
| **Popular** | ❤️ | 50+ likes | Silver |
| **Super Popular** | 🔥 | 100+ likes | Gold |
| **Viral** | ⚡ | 500+ likes | Legendary |
| **Well Developed** | 📖 | 200+ messages | Silver |

## Database Setup

Run this SQL in your Supabase SQL Editor:

```bash
f:\giant\role-play\database\badges-setup.sql
```

This creates:
- `user_badges` table
- Helper functions for badge checking
- RLS policies for security

## File Structure

```
src/
├── lib/
│   └── badges.js               # Badge definitions & helper functions
├── components/
│   └── Badge.jsx              # Reusable badge component
├── pages/
│   ├── Badges.jsx             # Badges showcase page
│   └── Gallery.jsx            # Updated with character badges
└── App.jsx                    # Added /badges route

database/
└── badges-setup.sql            # Database migration
```

## How Badges Work

### Automatic Unlocking
Badges are checked and unlocked automatically when:
- User creates a character
- User sends messages
- User makes a character public
- User likes characters

### Manual Checking (Current Implementation)
For now, badges are checked when users visit the `/badges` page. The system:
1. Loads user stats (character count, message count, likes given, etc.)
2. Compares against badge requirements
3. Displays progress for locked badges

### Character Badges
Character badges are calculated on-the-fly based on:
- Like count from `character_likes` table
- Message count (TODO: when messages table exists)

## Using the Badge Component

```jsx
import Badge from '../components/Badge';
import { BADGES, BADGE_TYPES } from '../lib/badges';

// Display a single badge
<Badge 
  badge={BADGES[BADGE_TYPES.FIRST_CHARACTER]} 
  size="md"           // sm, md, lg, xl
  showTooltip={true}  // Show info on hover
  locked={false}      // Locked or unlocked state
/>
```

## Badge Tiers

Badges come in 4 tiers with different visual styles:

- **Bronze** 🥉 - Beginner achievements (amber colors)
- **Silver** 🥈 - Intermediate achievements (gray/white colors)
- **Gold** 🥇 - Advanced achievements (yellow/gold colors)  
- **Legendary** 💫 - Rare, exceptional achievements (purple/pink gradient)

## Pages

### `/badges` - Badges Showcase
- View all unlocked badges
- See locked badges with progress bars
- Track stats (characters created, messages sent, etc.)
- Beautiful grid layout with animations

### `/gallery` - Character Badges Display
 - Character cards show achievement badges
- Hover over badges to see details
- Badges appear for popular characters

## Future Enhancements

1. **Automatic Badge Unlocking**
   - Set up triggers/functions to unlock badges in real-time
   - Show toast notifications when badges are unlocked

2. **Badge Notifications**
   - Animated popup when a new badge is unlocked
   - Sound effects and confetti animations

3. **Badge Showcase on Profile**
   - Display top 3 badges on user profile
   - "Favorite Badge" selector

4. **Leaderboards**
   - Top badge collectors
   - Rarest badge holders

5. **More Badge Types**
   - Weekly/monthly active user
   - First to 1000 messages
   - Early adopter badge
   - Beta tester badge

## Testing

1. Run the database setup SQL
2. Create some characters to unlock badges
3. Visit `/badges` to see your achievements
4. Make characters public to earn Community Creator badge
5. Like characters in the gallery to work towards Social Butterfly

---

Built with ❤️ for RolePlayForge 🎭
