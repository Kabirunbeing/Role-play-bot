import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Mock response generator based on character personality
const generateMockResponse = (character, userMessage) => {
  const responses = {
    friendly: [
      "That's really interesting! Tell me more about that.",
      "I totally understand what you mean!",
      "Thanks for sharing that with me!",
      "That sounds amazing! What happened next?",
    ],
    sarcastic: [
      "Oh, how fascinating... truly groundbreaking stuff.",
      "Wow, I've never heard anything like that before... *eye roll*",
      "Right, because that's exactly how things work.",
      "Sure, and I'm the queen of England.",
    ],
    wise: [
      "In my years of experience, I've learned that such matters require careful thought.",
      "Consider this from a different perspective, young one.",
      "Wisdom comes not from knowing, but from understanding.",
      "The path you seek may not be the one you expect.",
    ],
    dark: [
      "The shadows whisper secrets you cannot comprehend...",
      "Interesting... your words echo through the void.",
      "Darkness is not to be feared, but understood.",
      "I sense a deeper truth beneath your words.",
    ],
    cheerful: [
      "Oh my gosh, that's so exciting!",
      "Yay! I love talking about this!",
      "This is going to be so much fun!",
      "You always have the best stories!",
    ],
  };

  const personalityResponses = responses[character.personality.toLowerCase()] || responses.friendly;
  const randomResponse = personalityResponses[Math.floor(Math.random() * personalityResponses.length)];
  
  return randomResponse;
};

export const useStore = create(
  persist(
    (set, get) => ({
      // Characters
      characters: [],
      activeCharacterId: null,
      searchQuery: '',
      filterPersonality: 'all',
      sortBy: 'newest', // newest, oldest, name, mostChats, favorites

      // Search and filter
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterPersonality: (personality) => set({ filterPersonality: personality }),
      setSortBy: (sortBy) => set({ sortBy }),

      // Get filtered and sorted characters
      getFilteredCharacters: () => {
        const state = get();
        let filtered = [...state.characters];

        // Apply search
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.name.toLowerCase().includes(query) ||
              c.personality.toLowerCase().includes(query) ||
              c.backstory.toLowerCase().includes(query)
          );
        }

        // Apply personality filter
        if (state.filterPersonality !== 'all') {
          filtered = filtered.filter(
            (c) => c.personality.toLowerCase() === state.filterPersonality
          );
        }

        // Apply sorting
        switch (state.sortBy) {
          case 'oldest':
            filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
          case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'mostChats':
            filtered.sort((a, b) => {
              const aMessages = state.conversations.filter((m) => m.characterId === a.id).length;
              const bMessages = state.conversations.filter((m) => m.characterId === b.id).length;
              return bMessages - aMessages;
            });
            break;
          case 'favorites':
            filtered.sort((a, b) => {
              if (a.isFavorite && !b.isFavorite) return -1;
              if (!a.isFavorite && b.isFavorite) return 1;
              return new Date(b.createdAt) - new Date(a.createdAt);
            });
            break;
          case 'newest':
          default:
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        }

        return filtered;
      },

      // Add a new character
      addCharacter: (character) => {
        const newCharacter = {
          id: Date.now().toString(),
          ...character,
          isFavorite: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          characters: [...state.characters, newCharacter],
        }));
        return newCharacter.id;
      },

      // Update character
      updateCharacter: (id, updates) => {
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      // Toggle favorite status
      toggleFavorite: (id) => {
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
          ),
        }));
      },

      // Delete a character
      deleteCharacter: (id) => {
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
          activeCharacterId: state.activeCharacterId === id ? null : state.activeCharacterId,
          conversations: state.conversations.filter((conv) => conv.characterId !== id),
        }));
      },

      // Bulk delete characters
      bulkDeleteCharacters: (ids) => {
        set((state) => ({
          characters: state.characters.filter((c) => !ids.includes(c.id)),
          activeCharacterId: ids.includes(state.activeCharacterId) ? null : state.activeCharacterId,
          conversations: state.conversations.filter((conv) => !ids.includes(conv.characterId)),
        }));
      },

      // Set active character for chatting
      setActiveCharacter: (id) => {
        set({ activeCharacterId: id });
      },

      // Get active character
      getActiveCharacter: () => {
        const state = get();
        return state.characters.find((c) => c.id === state.activeCharacterId);
      },

      // Export data
      exportData: () => {
        const state = get();
        return {
          characters: state.characters,
          conversations: state.conversations,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        };
      },

      // Import data
      importData: (data) => {
        if (data.characters && Array.isArray(data.characters)) {
          set({
            characters: data.characters,
            conversations: data.conversations || [],
          });
          return true;
        }
        return false;
      },

      // Get statistics
      getStats: () => {
        const state = get();
        const totalMessages = state.conversations.length;
        const totalCharacters = state.characters.length;
        const personalities = {};
        
        state.characters.forEach((c) => {
          const personality = c.personality.toLowerCase();
          personalities[personality] = (personalities[personality] || 0) + 1;
        });

        return {
          totalCharacters,
          totalMessages,
          personalities,
          mostActiveCharacter: state.characters.reduce((max, char) => {
            const count = state.conversations.filter((m) => m.characterId === char.id).length;
            const maxCount = state.conversations.filter((m) => m.characterId === max?.id).length || 0;
            return count > maxCount ? char : max;
          }, null),
        };
      },

      // Conversations (chat messages)
      conversations: [],

      // Add a message to conversation
      addMessage: (characterId, message, isUser = true) => {
        const newMessage = {
          id: Date.now().toString() + Math.random(),
          characterId,
          text: message,
          isUser,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          conversations: [...state.conversations, newMessage],
        }));
      },

      // Get messages for a character
      getMessages: (characterId) => {
        const state = get();
        return state.conversations.filter((msg) => msg.characterId === characterId);
      },

      // Search messages
      searchMessages: (characterId, query) => {
        const state = get();
        const messages = state.getMessages(characterId);
        if (!query) return messages;
        
        return messages.filter((msg) =>
          msg.text.toLowerCase().includes(query.toLowerCase())
        );
      },

      // Send message and get mock response
      sendMessage: async (message) => {
        const state = get();
        const character = state.getActiveCharacter();
        
        if (!character) return;

        // Add user message
        state.addMessage(character.id, message, true);

        // Simulate typing delay (varied by personality)
        const delays = {
          friendly: 800,
          sarcastic: 1200,
          wise: 1500,
          dark: 1000,
          cheerful: 600,
        };
        const baseDelay = delays[character.personality.toLowerCase()] || 1000;
        await new Promise((resolve) => setTimeout(resolve, baseDelay + Math.random() * 800));

        // Generate and add mock response
        const response = generateMockResponse(character, message);
        state.addMessage(character.id, response, false);
      },

      // Clear all messages for a character
      clearConversation: (characterId) => {
        set((state) => ({
          conversations: state.conversations.filter((msg) => msg.characterId !== characterId),
        }));
      },

      // Delete a specific message
      deleteMessage: (messageId) => {
        set((state) => ({
          conversations: state.conversations.filter((msg) => msg.id !== messageId),
        }));
      },

      // Edit a specific message
      editMessage: (messageId, newText) => {
        set((state) => ({
          conversations: state.conversations.map((msg) =>
            msg.id === messageId
              ? { ...msg, text: newText, edited: true, editedAt: new Date().toISOString() }
              : msg
          ),
        }));
      },

      // Clear all data
      clearAllData: () => {
        set({
          characters: [],
          conversations: [],
          activeCharacterId: null,
          searchQuery: '',
          filterPersonality: 'all',
          sortBy: 'newest',
        });
      },
    }),
    {
      name: 'roleplayforge-storage',
    }
  )
);
