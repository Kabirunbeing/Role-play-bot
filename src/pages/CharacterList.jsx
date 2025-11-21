import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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
  const { user } = useAuth();
  const getMessages = useStore((state) => state.getMessages);
  const exportData = useStore((state) => state.exportData);
  const importData = useStore((state) => state.importData);

  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPersonality, setFilterPersonality] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState(null);
  const [importText, setImportText] = useState('');

  useEffect(() => {
    loadCharacters();
  }, [user]);

  const loadCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharacters(data || []);
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCharacters = characters.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         char.backstory.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPersonality = filterPersonality === 'all' || char.personality === filterPersonality;
    return matchesSearch && matchesPersonality;
  }).sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const handleDelete = (id, name) => {
    setCharacterToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!characterToDelete) return;

    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterToDelete.id);

      if (error) throw error;
      loadCharacters();
    } catch (error) {
      console.error('Error deleting character:', error);
      alert('Failed to delete character');
    } finally {
      setDeleteModalOpen(false);
      setCharacterToDelete(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-neon-green" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-white/60">Loading characters...</p>
        </div>
      </div>
    );
  }

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
        <div className="flex gap-3 w-full sm:w-auto">
          <Link to="/create" className="btn-primary flex-1 sm:flex-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Character</span>
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
              <option value="recent">Newest First</option>
              <option value="name">Name (A-Z)</option>
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
            className="btn-secondary text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredCharacters.map((character, index) => (
            <div
              key={character.id}
              className="relative bg-gradient-to-br from-dark-gray via-dark-gray to-off-black border border-white/10 rounded-xl p-3 sm:p-4 hover:border-neon-green/30 transition-all duration-300 group overflow-hidden slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-neon-green/0 via-neon-cyan/0 to-neon-pink/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-xl" />
              
              <div className="relative z-10">
                {/* Character Image */}
                <div className="mb-3 -m-3 sm:-m-4 -mt-3 sm:-mt-4">
                  {character.image_url ? (
                    <img 
                      src={character.image_url} 
                      alt={character.name}
                      className="w-full h-32 sm:h-40 object-cover rounded-t-xl group-hover:opacity-90 transition-all duration-300"
                    />
                  ) : (
                    <div className="w-full h-32 sm:h-40 bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center text-5xl font-bold text-neon-green rounded-t-xl">
                      {character.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Character Name Header */}
                <div className="mb-2.5">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-base sm:text-lg font-display font-bold text-pure-white group-hover:text-neon-green transition-colors leading-tight flex-1">
                      {character.name}
                    </h3>
                    <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse flex-shrink-0 mt-1.5" />
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neon-green/10 border border-neon-green/20 text-neon-green text-[10px] sm:text-xs font-medium">
                      {character.personality}
                    </span>
                    {character.age && (
                      <span className="text-[10px] sm:text-xs text-white/40 font-mono">
                        {character.age} years
                      </span>
                    )}
                    {character.gender && (
                      <span className="text-[10px] sm:text-xs text-white/40 font-mono">
                        • {character.gender}
                      </span>
                    )}
                  </div>
                </div>

                {/* Backstory */}
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-3 line-clamp-2 font-light">
                  {character.backstory}
                </p>

                {/* Metadata - Hidden on mobile */}
                <div className="hidden sm:flex items-center gap-4 text-xs text-white/40 mb-3 pb-3 border-b border-white/5 font-mono">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    0 messages
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(character.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    to={`/chat/${character.id}`}
                    className="flex-1 btn-primary text-xs sm:text-sm py-2 font-semibold group-hover:shadow-lg group-hover:shadow-neon-green/20"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="hidden sm:inline">Start Chat</span>
                    <span className="sm:hidden">Chat</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(character.id, character.name)}
                    className="btn-danger px-2 sm:px-4"
                    title="Delete character"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
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

      {/* Delete Character Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCharacterToDelete(null);
        }}
        title="Delete Character"
      >
        <div className="space-y-4">
          <p className="text-sm sm:text-base text-white/70">
            Are you sure you want to delete <span className="font-semibold text-pure-white">"{characterToDelete?.name}"</span>? 
            This will also delete all chat history.
          </p>
          <div className="bg-neon-pink/10 border border-neon-pink/30 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-neon-pink font-medium">
              ⚠️ This action cannot be undone.
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-2">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setCharacterToDelete(null);
              }}
              className="btn-outline w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="btn-danger w-full sm:w-auto"
            >
              Delete Character
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
