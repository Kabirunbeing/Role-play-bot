import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';

const PERSONALITY_INFO = {
  friendly: { icon: 'F', color: 'neon-green' },
  sarcastic: { icon: 'S', color: 'neon-yellow' },
  wise: { icon: 'W', color: 'neon-cyan' },
  dark: { icon: 'D', color: 'neon-purple' },
  cheerful: { icon: 'C', color: 'neon-pink' },
};

export default function CharacterList() {
  const characters = useStore((state) => state.characters);
  const getFilteredCharacters = useStore((state) => state.getFilteredCharacters);
  const deleteCharacter = useStore((state) => state.deleteCharacter);
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const setActiveCharacter = useStore((state) => state.setActiveCharacter);
  const getMessages = useStore((state) => state.getMessages);
  const searchQuery = useStore((state) => state.searchQuery);
  const setSearchQuery = useStore((state) => state.setSearchQuery);
  const filterPersonality = useStore((state) => state.filterPersonality);
  const setFilterPersonality = useStore((state) => state.setFilterPersonality);
  const sortBy = useStore((state) => state.sortBy);
  const setSortBy = useStore((state) => state.setSortBy);
  const exportData = useStore((state) => state.exportData);
  const importData = useStore((state) => state.importData);

  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const filteredCharacters = getFilteredCharacters();

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also delete all chat history.`)) {
      deleteCharacter(id);
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roleplayforge-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      if (importData(data)) {
        alert('Data imported successfully!');
        setShowImportModal(false);
        setImportText('');
      } else {
        alert('Invalid data format');
      }
    } catch (e) {
      alert('Error parsing JSON: ' + e.message);
    }
  };

  if (characters.length === 0) {
    return (
      <div className="text-center py-20 fade-in">
        <div className="text-6xl sm:text-8xl mb-6 font-bold text-neon-cyan">0</div>
        <h2 className="text-2xl sm:text-3xl font-bold text-pure-white mb-3">No Characters Yet</h2>
        <p className="text-white/60 mb-8 text-base sm:text-lg">Create your first character to get started!</p>
        <Link to="/create" className="btn-primary">
          + Create Character
        </Link>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-pure-white mb-2">
            My <span className="text-neon-green">Characters</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base md:text-lg">
            {filteredCharacters.length} {filteredCharacters.length !== characters.length && `of ${characters.length}`} character{filteredCharacters.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link to="/create" className="btn-primary flex-1 sm:flex-none whitespace-nowrap">
            + New Character
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
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
              <option value="all">All Personalities</option>
              <option value="friendly">Friendly</option>
              <option value="sarcastic">Sarcastic</option>
              <option value="wise">Wise</option>
              <option value="dark">Dark</option>
              <option value="cheerful">Cheerful</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="mostChats">Most Chats</option>
              <option value="favorites">Favorites First</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Export/Import */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-dark-gray border border-white/20 text-white/80 rounded-lg hover:border-neon-green hover:text-neon-green transition-all text-sm"
          >
            Export Data
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-dark-gray border border-white/20 text-white/80 rounded-lg hover:border-neon-cyan hover:text-neon-cyan transition-all text-sm"
          >
            Import Data
          </button>
        </div>
      </div>

      {/* Characters Grid */}
      {filteredCharacters.length === 0 ? (
        <div className="text-center py-16 card">
          <svg className="w-24 h-24 mx-auto mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-xl font-bold text-pure-white mb-2">No characters found</h3>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCharacters.map((character, index) => {
            const personalityInfo = PERSONALITY_INFO[character.personality.toLowerCase()] || PERSONALITY_INFO.friendly;
            const messageCount = getMessages(character.id).length;

            return (
              <div
                key={character.id}
                className="card-hover border-white/10 group slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Character Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <Avatar character={character} size="lg" className="group-hover:scale-110 transition-transform" />
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-lg sm:text-2xl font-bold text-${personalityInfo.color} transition-colors truncate`}>
                        {character.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs sm:text-sm font-bold text-${personalityInfo.color} px-2 py-1 rounded bg-${personalityInfo.color}/20`}>
                          {personalityInfo.icon}
                        </span>
                        <span className="text-xs sm:text-sm text-white/60 capitalize font-medium">
                          {character.personality}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(character.id);
                    }}
                    className={`flex-shrink-0 p-2 rounded-lg transition-all duration-300 ${
                      character.isFavorite 
                        ? 'bg-neon-yellow/20 text-neon-yellow border border-neon-yellow' 
                        : 'bg-dark-gray text-white/40 border border-white/10 hover:border-neon-yellow hover:text-neon-yellow'
                    }`}
                    title={character.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg className="w-5 h-5" fill={character.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>

                {/* Backstory Preview */}
                <p className="text-white/70 text-xs sm:text-sm mb-4 line-clamp-3 leading-relaxed">
                  {character.backstory}
                </p>

                {/* Stats */}
                <div className="flex items-center space-x-3 sm:space-x-4 text-xs text-white/50 mb-5 pb-5 border-b border-white/10 font-mono">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {messageCount}
                  </span>
                  <span className="hidden sm:flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(character.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    to={`/chat/${character.id}`}
                    onClick={() => setActiveCharacter(character.id)}
                    className="flex-1 btn-primary text-center text-xs sm:text-sm py-2"
                  >
                    Chat
                  </Link>
                  <Link
                    to={`/edit/${character.id}`}
                    className="btn-secondary text-xs sm:text-sm px-3 sm:px-4"
                    title="Edit character"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(character.id, character.name)}
                    className="btn-danger text-xs sm:text-sm px-3 sm:px-4"
                    title="Delete character"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Export Modal */}
      <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Export Data">
        <div className="space-y-4">
          <p className="text-white/70">
            Export all your characters and conversations to a JSON file. You can use this to backup your data or transfer it to another device.
          </p>
          <div className="bg-dark-gray p-4 rounded-lg border border-white/10">
            <p className="text-sm text-white/60 mb-2">Export will include:</p>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• {characters.length} characters</li>
              <li>• All conversation history</li>
              <li>• Timestamps and metadata</li>
            </ul>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setShowExportModal(false)} className="btn-outline">
              Cancel
            </button>
            <button onClick={handleExport} className="btn-primary">
              Download JSON
            </button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Data">
        <div className="space-y-4">
          <p className="text-white/70">
            Paste your exported JSON data below. This will replace all your current data!
          </p>
          <div className="bg-neon-yellow/10 border border-neon-yellow/30 p-4 rounded-lg">
            <p className="text-sm text-neon-yellow font-medium">Warning: This will overwrite all existing characters and conversations!</p>
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste JSON data here..."
            className="w-full px-4 py-3 bg-dark-gray border border-white/20 rounded-lg text-pure-white placeholder-white/40 focus:outline-none focus:border-neon-cyan focus:shadow-neon-cyan transition-all duration-300 font-mono text-sm h-48 resize-none"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => { setShowImportModal(false); setImportText(''); }} className="btn-outline">
              Cancel
            </button>
            <button onClick={handleImport} disabled={!importText.trim()} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
              Import Data
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
