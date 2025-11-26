import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SearchBar from '../components/SearchBar';
import Badge from '../components/Badge';
import { getCharacterBadges } from '../lib/badges';

const PERSONALITY_COLORS = {
    friendly: 'neon-green',
    sarcastic: 'neon-yellow',
    wise: 'neon-cyan',
    dark: 'neon-purple',
    cheerful: 'neon-pink',
};

const FILTER_OPTIONS = [
    { value: 'all', label: 'All Personalities' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'sarcastic', label: 'Sarcastic' },
    { value: 'wise', label: 'Wise' },
    { value: 'dark', label: 'Dark' },
    { value: 'cheerful', label: 'Cheerful' },
];

const SORT_OPTIONS = [
    { value: 'popular', label: '🔥 Most Popular' },
    { value: 'newest', label: '✨ Newest First' },
    { value: 'oldest', label: '🕐 Oldest First' },
    { value: 'name', label: '📝 Name (A-Z)' },
];

export default function Gallery() {
    const { user } = useAuth();
    const [characters, setCharacters] = useState([]);
    const [featuredCharacter, setFeaturedCharacter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPersonality, setFilterPersonality] = useState('all');
    const [sortBy, setSortBy] = useState('popular');
    const [userLikes, setUserLikes] = useState(new Set());
    const [likeCounts, setLikeCounts] = useState({});

    useEffect(() => {
        loadGalleryData();
    }, []);

    const loadGalleryData = async () => {
        try {
            // Load all public characters
            const { data: charactersData, error: charError } = await supabase
                .from('characters')
                .select('*')
                .eq('is_public', true)
                .order('created_at', { ascending: false });

            if (charError) {
                console.error('Error loading characters:', charError);
                throw charError;
            }

            console.log('Loaded characters:', charactersData);

            // Load like counts for all characters
            const { data: likesData, error: likesError } = await supabase
                .from('character_likes')
                .select('character_id, user_id');

            if (likesError) throw likesError;

            // Process like counts
            const counts = {};
            const userLikeSet = new Set();

            likesData?.forEach(like => {
                counts[like.character_id] = (counts[like.character_id] || 0) + 1;
                if (like.user_id === user?.id) {
                    userLikeSet.add(like.character_id);
                }
            });

            setLikeCounts(counts);
            setUserLikes(userLikeSet);
            setCharacters(charactersData || []);

            // Select featured character of the day (deterministic based on date)
            if (charactersData && charactersData.length > 0) {
                const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
                const featuredIndex = dayOfYear % charactersData.length;
                setFeaturedCharacter(charactersData[featuredIndex]);
            }
        } catch (error) {
            console.error('Error loading gallery data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (characterId) => {
        if (!user) {
            alert('Please log in to like characters');
            return;
        }

        const isLiked = userLikes.has(characterId);

        try {
            if (isLiked) {
                // Unlike
                const { error } = await supabase
                    .from('character_likes')
                    .delete()
                    .eq('character_id', characterId)
                    .eq('user_id', user.id);

                if (error) throw error;

                setUserLikes(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(characterId);
                    return newSet;
                });

                setLikeCounts(prev => ({
                    ...prev,
                    [characterId]: Math.max(0, (prev[characterId] || 1) - 1)
                }));
            } else {
                // Like
                const { error } = await supabase
                    .from('character_likes')
                    .insert([{ character_id: characterId, user_id: user.id }]);

                if (error) throw error;

                setUserLikes(prev => new Set([...prev, characterId]));
                setLikeCounts(prev => ({
                    ...prev,
                    [characterId]: (prev[characterId] || 0) + 1
                }));
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            alert('Failed to update like. Please try again.');
        }
    };

    // Filter and sort characters
    const filteredCharacters = characters
        .filter(char => {
            const matchesSearch =
                char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                char.backstory.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPersonality = filterPersonality === 'all' || char.personality === filterPersonality;
            return matchesSearch && matchesPersonality;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'popular':
                    return (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0);
                case 'newest':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-neon-green" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-white/60">Loading gallery...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-pure-white mb-3">
                    Character <span className="text-neon-pink">Gallery</span>
                </h1>
                <p className="text-white/60 text-base sm:text-lg md:text-xl">
                    Discover and interact with amazing characters from our community 🌟
                </p>
            </div>

            {/* Featured Character of the Day */}
            {featuredCharacter && (
                <div className="mb-10 slide-up">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="text-2xl">⭐</div>
                        <h2 className="text-2xl sm:text-3xl font-display font-bold text-neon-yellow">
                            Featured Character
                        </h2>
                        <div className="text-2xl">⭐</div>
                    </div>

                    <div className="relative bg-gradient-to-br from-neon-yellow/20 via-neon-pink/10 to-neon-cyan/20 border-2 border-neon-yellow/50 rounded-2xl p-1 overflow-hidden group">
                        {/* Animated gradient border */}
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-yellow via-neon-pink to-neon-cyan opacity-50 blur-xl group-hover:opacity-75 transition-opacity duration-500" />

                        <div className="relative bg-dark-gray rounded-xl overflow-hidden">
                            <div className="grid md:grid-cols-2 gap-6 p-6">
                                {/* Featured Image */}
                                <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
                                    {featuredCharacter.image_url ? (
                                        <img
                                            src={featuredCharacter.image_url}
                                            alt={featuredCharacter.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-neon-yellow/30 to-neon-pink/30 flex items-center justify-center text-8xl font-bold text-neon-yellow">
                                            {featuredCharacter.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 bg-neon-yellow text-pure-black px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                                        TODAY'S PICK
                                    </div>
                                </div>

                                {/* Featured Info */}
                                <div className="flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-3xl font-display font-bold text-pure-white mb-3 flex items-center gap-2">
                                            {featuredCharacter.name}
                                            <span className={`text-${PERSONALITY_COLORS[featuredCharacter.personality]} text-2xl`}>
                                                ✨
                                            </span>
                                        </h3>

                                        <div className="flex flex-wrap items-center gap-3 mb-4">
                                            <span className={`px-3 py-1 rounded-lg bg-${PERSONALITY_COLORS[featuredCharacter.personality]}/20 border border-${PERSONALITY_COLORS[featuredCharacter.personality]}/40 text-${PERSONALITY_COLORS[featuredCharacter.personality]} text-sm font-semibold`}>
                                                {featuredCharacter.personality}
                                            </span>
                                            {featuredCharacter.age && (
                                                <span className="text-white/60 text-sm">{featuredCharacter.age} years</span>
                                            )}
                                            {featuredCharacter.gender && (
                                                <span className="text-white/60 text-sm">• {featuredCharacter.gender}</span>
                                            )}
                                        </div>

                                        <p className="text-white/80 text-base leading-relaxed mb-4">
                                            {featuredCharacter.backstory}
                                        </p>

                                        <div className="flex items-center gap-4 text-sm text-white/50 mb-4">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-5 h-5 text-neon-pink" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                                </svg>
                                                {likeCounts[featuredCharacter.id] || 0} likes
                                            </span>
                                            <span>•</span>
                                            <span>
                                                Created {new Date(featuredCharacter.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Link
                                            to={`/chat/${featuredCharacter.id}`}
                                            className="flex-1 btn-primary"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            Start Chat
                                        </Link>
                                        <button
                                            onClick={() => handleLike(featuredCharacter.id)}
                                            className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${userLikes.has(featuredCharacter.id)
                                                ? 'bg-neon-pink text-pure-black'
                                                : 'bg-dark-gray border border-white/20 text-white/70 hover:border-neon-pink/50'
                                                }`}
                                        >
                                            <svg className="w-6 h-6" fill={userLikes.has(featuredCharacter.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters and Search */}
            <div className="mb-8 space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Search */}
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search characters..."
                        className="sm:col-span-2 lg:col-span-1"
                    />

                    {/* Personality Filter */}
                    <div className="relative">
                        <select
                            value={filterPersonality}
                            onChange={(e) => setFilterPersonality(e.target.value)}
                            className="w-full px-4 py-3 bg-dark-gray border border-white/20 rounded-lg text-pure-white focus:outline-none focus:border-neon-cyan focus:shadow-neon-cyan transition-all duration-300 appearance-none cursor-pointer"
                        >
                            {FILTER_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-4 py-3 bg-dark-gray border border-white/20 rounded-lg text-pure-white focus:outline-none focus:border-neon-cyan focus:shadow-neon-cyan transition-all duration-300 appearance-none cursor-pointer"
                        >
                            {SORT_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between text-sm">
                    <p className="text-white/60">
                        Showing <span className="text-neon-green font-semibold">{filteredCharacters.length}</span> of{' '}
                        <span className="text-pure-white font-semibold">{characters.length}</span> characters
                    </p>
                    {(searchQuery || filterPersonality !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilterPersonality('all');
                            }}
                            className="text-neon-cyan hover:text-neon-cyan/80 transition-colors"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* Characters Grid */}
            {filteredCharacters.length === 0 ? (
                <div className="text-center py-20 card">
                    <svg className="w-24 h-24 mx-auto mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-2xl font-bold text-pure-white mb-2">No characters found</h3>
                    <p className="text-white/60 mb-4">Try adjusting your search or filters</p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setFilterPersonality('all');
                        }}
                        className="btn-outline text-sm"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCharacters.map((character, index) => (
                        <div
                            key={character.id}
                            className="relative bg-gradient-to-br from-dark-gray via-dark-gray to-off-black border border-white/10 rounded-xl overflow-hidden hover:border-neon-green/30 transition-all duration-300 group slide-up"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            {/* Glow effect on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-neon-green/0 via-neon-cyan/0 to-neon-pink/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />

                            <div className="relative">
                                {/* Character Image */}
                                <div className="relative h-48 overflow-hidden">
                                    {character.image_url ? (
                                        <img
                                            src={character.image_url}
                                            alt={character.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br from-${PERSONALITY_COLORS[character.personality]}/20 to-${PERSONALITY_COLORS[character.personality]}/30 flex items-center justify-center text-6xl font-bold text-${PERSONALITY_COLORS[character.personality]}`}>
                                            {character.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    {/* Like button overlay */}
                                    <button
                                        onClick={() => handleLike(character.id)}
                                        className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all duration-300 group/like"
                                    >
                                        <svg
                                            className={`w-5 h-5 transition-all duration-300 ${userLikes.has(character.id)
                                                ? 'text-neon-pink fill-neon-pink scale-110'
                                                : 'text-white/70 group-hover/like:text-neon-pink group-hover/like:scale-110'
                                                }`}
                                            fill={userLikes.has(character.id) ? 'currentColor' : 'none'}
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>

                                    {/* Likes count badge */}
                                    {likeCounts[character.id] > 0 && (
                                        <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm flex items-center gap-1 text-xs text-white font-semibold">
                                            <svg className="w-4 h-4 text-neon-pink" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                            </svg>
                                            {likeCounts[character.id]}
                                        </div>
                                    )}
                                </div>

                                {/* Character Info */}
                                <div className="p-4">
                                    <div className="mb-3">
                                        <h3 className="text-lg font-display font-bold text-pure-white group-hover:text-neon-green transition-colors mb-2 line-clamp-1">
                                            {character.name}
                                        </h3>

                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-${PERSONALITY_COLORS[character.personality]}/10 border border-${PERSONALITY_COLORS[character.personality]}/20 text-${PERSONALITY_COLORS[character.personality]} text-xs font-medium`}>
                                                {character.personality}
                                            </span>
                                            {character.age && (
                                                <span className="text-xs text-white/40">{character.age}y</span>
                                            )}
                                            {character.gender && (
                                                <span className="text-xs text-white/40">• {character.gender}</span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-white/60 text-sm leading-relaxed mb-4 line-clamp-3">
                                        {character.backstory}
                                    </p>

                                    {/* Character Badges */}
                                    {(() => {
                                        const characterBadges = getCharacterBadges(
                                            likeCounts[character.id] || 0,
                                            0 // Message count - TODO: add when messages table exists
                                        );
                                        return characterBadges.length > 0 && (
                                            <div className="flex gap-2 mb-4">
                                                {characterBadges.map(badge => (
                                                    <Badge key={badge.id} badge={badge} size="sm" />
                                                ))}
                                            </div>
                                        );
                                    })()}

                                    {/* Action Button */}
                                    <Link
                                        to={`/chat/${character.id}`}
                                        className="w-full btn-primary text-sm group-hover:shadow-lg group-hover:shadow-neon-green/30"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Start Chat
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
