import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Avatar from '../components/Avatar';

export default function Search() {
  const characters = useStore((state) => state.characters);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIn, setSearchIn] = useState('all'); // all, names, backstories, messages
  const [filterPersonality, setFilterPersonality] = useState('all');
  const [filterFavorites, setFilterFavorites] = useState(false);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { characters: [], messages: [], total: 0 };

    const query = searchQuery.toLowerCase();
    const results = {
      characters: [],
      messages: [],
      total: 0,
    };

    characters.forEach(character => {
      // Apply personality filter
      if (filterPersonality !== 'all' && character.personality.toLowerCase() !== filterPersonality) {
        return;
      }

      // Apply favorites filter
      if (filterFavorites && !character.isFavorite) {
        return;
      }

      let characterMatch = false;
      const matchedMessages = [];

      // Search in character name
      if ((searchIn === 'all' || searchIn === 'names') && character.name.toLowerCase().includes(query)) {
        characterMatch = true;
      }

      // Search in backstory
      if ((searchIn === 'all' || searchIn === 'backstories') && character.backstory.toLowerCase().includes(query)) {
        characterMatch = true;
      }

      // Search in messages
      if (searchIn === 'all' || searchIn === 'messages') {
        character.conversations?.forEach(conv => {
          conv.messages?.forEach(msg => {
            if (msg.text.toLowerCase().includes(query)) {
              matchedMessages.push({
                ...msg,
                conversationId: conv.id,
                character: character,
              });
            }
          });
        });
      }

      if (characterMatch) {
        results.characters.push(character);
      }

      if (matchedMessages.length > 0) {
        results.messages.push(...matchedMessages);
      }
    });

    results.total = results.characters.length + results.messages.length;
    return results;
  }, [characters, searchQuery, searchIn, filterPersonality, filterFavorites]);

  const getPersonalityInfo = (personality) => {
    const info = {
      friendly: { icon: 'F', color: 'neon-green' },
      sarcastic: { icon: 'S', color: 'neon-pink' },
      wise: { icon: 'W', color: 'neon-purple' },
      dark: { icon: 'D', color: 'neon-yellow' },
      cheerful: { icon: 'C', color: 'neon-cyan' },
    };
    return info[personality.toLowerCase()] || info.friendly;
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-neon-yellow/30 text-neon-yellow px-1 rounded">{part}</mark>
        : part
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="fade-in">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-pure-white mb-2">
          <span className="text-neon-green">⌕</span> Advanced Search
        </h1>
        <p className="text-white/60">Search across characters, backstories, and conversations</p>
      </div>

      {/* Search Box */}
      <div className="card slide-up">
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for anything..."
            className="input-field w-full pl-12 text-lg"
            autoFocus
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-pure-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid sm:grid-cols-3 gap-3">
          <select
            value={searchIn}
            onChange={(e) => setSearchIn(e.target.value)}
            className="input-field"
          >
            <option value="all">Search in: All</option>
            <option value="names">Names Only</option>
            <option value="backstories">Backstories Only</option>
            <option value="messages">Messages Only</option>
          </select>

          <select
            value={filterPersonality}
            onChange={(e) => setFilterPersonality(e.target.value)}
            className="input-field"
          >
            <option value="all">All Personalities</option>
            <option value="friendly">Friendly</option>
            <option value="sarcastic">Sarcastic</option>
            <option value="wise">Wise</option>
            <option value="dark">Dark</option>
            <option value="cheerful">Cheerful</option>
          </select>

          <label className="flex items-center gap-3 px-4 py-2 bg-pure-black/50 rounded-lg border border-white/10 cursor-pointer hover:border-neon-yellow/50 transition-all">
            <input
              type="checkbox"
              checked={filterFavorites}
              onChange={(e) => setFilterFavorites(e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-pure-black/50 text-neon-yellow focus:ring-neon-yellow focus:ring-offset-0"
            />
            <span className="text-sm text-white/80">Favorites Only</span>
          </label>
        </div>
      </div>

      {/* Results */}
      {!searchQuery ? (
        <div className="card text-center py-16 slide-up">
          <svg className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-xl sm:text-2xl text-white/80 mb-2">Start Searching</p>
          <p className="text-white/60 max-w-md mx-auto">
            Enter a search query to find characters, backstories, or specific messages
          </p>
        </div>
      ) : searchResults.total === 0 ? (
        <div className="card text-center py-16 slide-up">
          <div className="text-6xl sm:text-8xl mb-6 font-bold text-neon-pink">0</div>
          <p className="text-xl sm:text-2xl text-white/80 mb-2">No Results Found</p>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            No matches for "<span className="text-neon-yellow">{searchQuery}</span>". Try different keywords or adjust your filters.
          </p>
          <button onClick={() => setSearchQuery('')} className="btn-outline inline-block">
            Clear Search
          </button>
        </div>
      ) : (
        <div className="space-y-6 slide-up">
          {/* Results Summary */}
          <div className="card bg-gradient-to-r from-neon-green/10 to-neon-cyan/10 border-neon-green/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-pure-white mb-1">
                  {searchResults.total} Result{searchResults.total !== 1 ? 's' : ''} Found
                </h2>
                <p className="text-sm text-white/60">
                  {searchResults.characters.length} character{searchResults.characters.length !== 1 ? 's' : ''}, {searchResults.messages.length} message{searchResults.messages.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-4xl font-bold text-neon-green">{searchResults.total}</div>
            </div>
          </div>

          {/* Character Results */}
          {searchResults.characters.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-pure-white mb-4 flex items-center gap-2">
                <span className="text-neon-green">▸</span> Characters ({searchResults.characters.length})
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.characters.map(character => {
                  const personalityInfo = getPersonalityInfo(character.personality);
                  const totalMessages = character.conversations?.reduce(
                    (sum, conv) => sum + (conv.messages?.length || 0),
                    0
                  ) || 0;

                  return (
                    <div key={character.id} className="card card-hover group">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar character={character} size="md" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-bold text-pure-white mb-1 group-hover:text-neon-cyan transition-colors truncate">
                            {highlightText(character.name, searchQuery)}
                          </h4>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 bg-${personalityInfo.color}/20 text-${personalityInfo.color} rounded text-xs border border-${personalityInfo.color}/30`}>
                            <span className="font-bold">{personalityInfo.icon}</span>
                            {character.personality}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-white/60 mb-4 line-clamp-2">
                        {highlightText(character.backstory, searchQuery)}
                      </p>
                      <div className="flex gap-2">
                        <Link to={`/chat/${character.id}`} className="btn-primary text-sm py-2 flex-1">
                          Chat
                        </Link>
                        <Link to={`/character/${character.id}`} className="btn-outline text-sm py-2 flex-1">
                          Profile
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message Results */}
          {searchResults.messages.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-pure-white mb-4 flex items-center gap-2">
                <span className="text-neon-cyan">▸</span> Messages ({searchResults.messages.length})
              </h3>
              <div className="space-y-3">
                {searchResults.messages.slice(0, 50).map((message, index) => (
                  <Link
                    key={index}
                    to={`/chat/${message.character.id}`}
                    className="card card-hover block"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <Avatar character={message.character} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-pure-white">{message.character.name}</span>
                          <span className="text-xs text-white/40">
                            {new Date(message.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-white/70">
                          {highlightText(message.text, searchQuery)}
                        </p>
                        <span className="text-xs text-white/40 mt-1 inline-block">
                          {message.sender === 'user' ? 'You' : message.character.name}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {searchResults.messages.length > 50 && (
                  <p className="text-center text-sm text-white/60 py-4">
                    Showing first 50 of {searchResults.messages.length} messages
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
