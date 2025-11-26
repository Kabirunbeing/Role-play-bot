import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BADGES, BADGE_TYPES, hasBadge, getUserBadges } from '../lib/badges';
import Badge from '../components/Badge';

export default function Badges() {
    const { user } = useAuth();
    const [userBadges, setUserBadges] = useState([]);
    const [stats, setStats] = useState({
        characterCount: 0,
        messageCount: 0,
        publicCharacterCount: 0,
        likeCount: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadBadgesAndStats();
        }
    }, [user]);

    const loadBadgesAndStats = async () => {
        try {
            // Load user's unlocked badges
            const { data: badgesData } = await supabase
                .from('user_badges')
                .select('*')
                .eq('user_id', user.id);

            setUserBadges(badgesData || []);

            // Load user stats
            const { data: characters } = await supabase
                .from('characters')
                .select('id, is_public')
                .eq('user_id', user.id);

            const { data: likes } = await supabase
                .from('character_likes')
                .select('id')
                .eq('user_id', user.id);

            // For now, set message count to 0 (you can add messages table later)
            setStats({
                characterCount: characters?.length || 0,
                messageCount: 0, // TODO: Count from messages table
                publicCharacterCount: characters?.filter(c => c.is_public).length || 0,
                likeCount: likes?.length || 0,
            });
        } catch (error) {
            console.error('Error loading badges and stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const unlockedBadges = getUserBadges(userBadges);
    const allBadgesList = Object.values(BADGES).filter(b => !b.isCharacterBadge);
    const lockedBadges = allBadgesList.filter(
        badge => !hasBadge(userBadges, badge.id)
    );

    // Calculate progress for next badges
    const getProgress = (badgeId) => {
        switch (badgeId) {
            case BADGE_TYPES.FIRST_CHARACTER:
                return Math.min((stats.characterCount / 1) * 100, 100);
            case BADGE_TYPES.FIVE_CHARACTERS:
                return Math.min((stats.characterCount / 5) * 100, 100);
            case BADGE_TYPES.SOCIAL_BUTTERFLY:
                return Math.min((stats.likeCount / 10) * 100, 100);
            case BADGE_TYPES.CHATTY_USER:
                return Math.min((stats.messageCount / 100) * 100, 100);
            case BADGE_TYPES.CONVERSATION_MASTER:
                return Math.min((stats.messageCount / 500) * 100, 100);
            case BADGE_TYPES.COMMUNITY_CREATOR:
                return Math.min((stats.publicCharacterCount / 1) * 100, 100);
            default:
                return 0;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-neon-green" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-white/60">Loading badges...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-pure-white mb-3">
                    Your <span className="text-neon-yellow">Badges</span>
                </h1>
                <p className="text-white/60 text-base sm:text-lg md:text-xl">
                    Unlock achievements and show off your accomplishments! 🏆
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                <div className="card text-center">
                    <div className="text-3xl mb-2">🎭</div>
                    <div className="text-2xl font-bold text-neon-green">{stats.characterCount}</div>
                    <div className="text-xs text-white/60">Characters Created</div>
                </div>
                <div className="card text-center">
                    <div className="text-3xl mb-2">💬</div>
                    <div className="text-2xl font-bold text-neon-cyan">{stats.messageCount}</div>
                    <div className="text-xs text-white/60">Messages Sent</div>
                </div>
                <div className="card text-center">
                    <div className="text-3xl mb-2">🌟</div>
                    <div className="text-2xl font-bold text-neon-pink">{stats.publicCharacterCount}</div>
                    <div className="text-xs text-white/60">Public Characters</div>
                </div>
                <div className="card text-center">
                    <div className="text-3xl mb-2">❤️</div>
                    <div className="text-2xl font-bold text-neon-purple">{stats.likeCount}</div>
                    <div className="text-xs text-white/60">Likes Given</div>
                </div>
            </div>

            {/* Unlocked Badges */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl sm:text-3xl font-display font-bold text-pure-white">
                        Unlocked Badges
                    </h2>
                    <span className="px-3 py-1 rounded-full bg-neon-green/20 border border-neon-green/40 text-neon-green text-sm font-bold">
                        {unlockedBadges.length}/{allBadgesList.length}
                    </span>
                </div>

                {unlockedBadges.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                        {unlockedBadges.map((badge) => (
                            <div key={badge.id} className="flex flex-col items-center">
                                <Badge badge={badge} size="lg" />
                                <p className="text-xs text-white/70 mt-2 text-center">{badge.name}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card text-center py-12">
                        <div className="text-6xl mb-4">🔒</div>
                        <p className="text-white/60 mb-2">No badges unlocked yet</p>
                        <p className="text-sm text-white/40">Start creating and chatting to earn badges!</p>
                    </div>
                )}
            </div>

            {/* Locked Badges (with progress) */}
            <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-pure-white mb-6">
                    Locked Badges
                </h2>

                {lockedBadges.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {lockedBadges.map((badge) => {
                            const progress = getProgress(badge.id);
                            const isInProgress = progress > 0 && progress < 100;

                            return (
                                <div
                                    key={badge.id}
                                    className="relative card hover:border-white/30 transition-all duration-300"
                                >
                                    <div className="flex items-start gap-4">
                                        <Badge badge={badge} size="md" locked={true} showTooltip={false} />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white/70 mb-1">{badge.name}</h3>
                                            <p className="text-xs text-white/50 mb-2">{badge.description}</p>
                                            <p className="text-xs text-white/40 font-mono mb-2">
                                                {badge.requirement}
                                            </p>

                                            {/* Progress Bar */}
                                            {isInProgress && (
                                                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full transition-all duration-500"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            )}
                                            {isInProgress && (
                                                <p className="text-xs text-neon-green mt-1">{Math.round(progress)}% Complete</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="card text-center py-12">
                        <div className="text-6xl mb-4">🎉</div>
                        <p className="text-neon-green text-xl font-bold mb-2">All Badges Unlocked!</p>
                        <p className="text-white/60">You've earned every badge. Amazing!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
