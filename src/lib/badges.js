// Badge definitions and configuration

export const BADGE_TYPES = {
    // User Achievement Badges
    FIRST_CHARACTER: 'first_character',
    FIVE_CHARACTERS: 'five_characters',
    FIRST_CHAT: 'first_chat',
    CHATTY_USER: 'chatty_user', // 100 messages
    CONVERSATION_MASTER: 'conversation_master', // 500 messages
    COMMUNITY_CREATOR: 'community_creator', // Made a character public
    SOCIAL_BUTTERFLY: 'social_butterfly', // Liked 10 characters

    // Character-specific Badges  
    POPULAR_CHARACTER: 'popular_character', // 50+ likes
    SUPER_POPULAR: 'super_popular', // 100+ likes
    VIRAL_CHARACTER: 'viral_character', // 500+ likes
    WELL_DEVELOPED: 'well_developed', // Character has 200+ messages
};

export const BADGES = {
    // ========== USER BADGES ==========
    [BADGE_TYPES.FIRST_CHARACTER]: {
        id: BADGE_TYPES.FIRST_CHARACTER,
        name: 'First Creation',
        description: 'Created your first character',
        icon: '🎭',
        color: 'neon-green',
        tier: 'bronze',
        requirement: 'Create 1 character',
    },

    [BADGE_TYPES.FIVE_CHARACTERS]: {
        id: BADGE_TYPES.FIVE_CHARACTERS,
        name: 'Character Collector',
        description: 'Created 5 unique characters',
        icon: '👥',
        color: 'neon-cyan',
        tier: 'silver',
        requirement: 'Create 5 characters',
    },

    [BADGE_TYPES.FIRST_CHAT]: {
        id: BADGE_TYPES.FIRST_CHAT,
        name: 'Breaking the Ice',
        description: 'Started your first conversation',
        icon: '💬',
        color: 'neon-green',
        tier: 'bronze',
        requirement: 'Send 1 message',
    },

    [BADGE_TYPES.CHATTY_USER]: {
        id: BADGE_TYPES.CHATTY_USER,
        name: 'Chatty',
        description: 'Sent 100 messages across all characters',
        icon: '🗨️',
        color: 'neon-yellow',
        tier: 'silver',
        requirement: 'Send 100 messages',
    },

    [BADGE_TYPES.CONVERSATION_MASTER]: {
        id: BADGE_TYPES.CONVERSATION_MASTER,
        name: 'Conversation Master',
        description: 'Sent 500 messages - you love to chat!',
        icon: '💎',
        color: 'neon-purple',
        tier: 'gold',
        requirement: 'Send 500 messages',
    },

    [BADGE_TYPES.COMMUNITY_CREATOR]: {
        id: BADGE_TYPES.COMMUNITY_CREATOR,
        name: 'Community Creator',
        description: 'Shared a character with the community',
        icon: '🌟',
        color: 'neon-pink',
        tier: 'silver',
        requirement: 'Make 1 character public',
    },

    [BADGE_TYPES.SOCIAL_BUTTERFLY]: {
        id: BADGE_TYPES.SOCIAL_BUTTERFLY,
        name: 'Social Butterfly',
        description: 'Liked 10 different characters',
        icon: '🦋',
        color: 'neon-cyan',
        tier: 'bronze',
        requirement: 'Like 10 characters',
    },

    // ========== CHARACTER BADGES ==========
    [BADGE_TYPES.POPULAR_CHARACTER]: {
        id: BADGE_TYPES.POPULAR_CHARACTER,
        name: 'Popular',
        description: 'This character has 50+ likes',
        icon: '❤️',
        color: 'neon-pink',
        tier: 'silver',
        requirement: '50 likes',
        isCharacterBadge: true,
    },

    [BADGE_TYPES.SUPER_POPULAR]: {
        id: BADGE_TYPES.SUPER_POPULAR,
        name: 'Super Popular',
        description: 'This character has 100+ likes!',
        icon: '🔥',
        color: 'neon-pink',
        tier: 'gold',
        requirement: '100 likes',
        isCharacterBadge: true,
    },

    [BADGE_TYPES.VIRAL_CHARACTER]: {
        id: BADGE_TYPES.VIRAL_CHARACTER,
        name: 'Viral',
        description: 'This character went viral with 500+ likes!',
        icon: '⚡',
        color: 'neon-yellow',
        tier: 'legendary',
        requirement: '500 likes',
        isCharacterBadge: true,
    },

    [BADGE_TYPES.WELL_DEVELOPED]: {
        id: BADGE_TYPES.WELL_DEVELOPED,
        name: 'Well Developed',
        description: 'This character has deep conversations (200+ messages)',
        icon: '📖',
        color: 'neon-cyan',
        tier: 'silver',
        requirement: '200 messages',
        isCharacterBadge: true,
    },
};

// Badge tier colors for UI
export const BADGE_TIER_COLORS = {
    bronze: {
        bg: 'from-amber-900/20 to-amber-800/20',
        border: 'border-amber-600/40',
        text: 'text-amber-500',
        glow: 'shadow-amber-500/20',
    },
    silver: {
        bg: 'from-gray-400/20 to-gray-300/20',
        border: 'border-gray-400/40',
        text: 'text-gray-300',
        glow: 'shadow-gray-300/20',
    },
    gold: {
        bg: 'from-yellow-600/20 to-yellow-500/20',
        border: 'border-yellow-500/40',
        text: 'text-yellow-400',
        glow: 'shadow-yellow-400/20',
    },
    legendary: {
        bg: 'from-purple-600/20 via-pink-600/20 to-purple-600/20',
        border: 'border-purple-500/40',
        text: 'text-purple-300',
        glow: 'shadow-purple-400/30',
    },
};

// Helper function to check if user has a badge
export function hasBadge(userBadges, badgeId) {
    return userBadges?.some(badge => badge.badge_id === badgeId) || false;
}

// Helper function to get user's unlocked badges
export function getUserBadges(userBadges) {
    return userBadges?.map(ub => BADGES[ub.badge_id]).filter(Boolean) || [];
}

// Helper function to get character badges based on stats
export function getCharacterBadges(likeCount, messageCount) {
    const badges = [];

    // Check like-based badges
    if (likeCount >= 500) {
        badges.push(BADGES[BADGE_TYPES.VIRAL_CHARACTER]);
    } else if (likeCount >= 100) {
        badges.push(BADGES[BADGE_TYPES.SUPER_POPULAR]);
    } else if (likeCount >= 50) {
        badges.push(BADGES[BADGE_TYPES.POPULAR_CHARACTER]);
    }

    // Check message-based badges
    if (messageCount >= 200) {
        badges.push(BADGES[BADGE_TYPES.WELL_DEVELOPED]);
    }

    return badges;
}
