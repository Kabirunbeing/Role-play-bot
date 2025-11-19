import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { saveGroqKey, getGroqKey, deleteGroqKey } from '../lib/supabase';

export default function Settings() {
  const navigate = useNavigate();
  const characters = useStore((state) => state.characters);
  const exportData = useStore((state) => state.exportData);
  const importData = useStore((state) => state.importData);
  
  const [settings, setSettings] = useState({
    autoScroll: localStorage.getItem('autoScroll') !== 'false',
    typingSpeed: localStorage.getItem('typingSpeed') || 'normal',
    soundEnabled: localStorage.getItem('soundEnabled') === 'true',
    compactMode: localStorage.getItem('compactMode') === 'true',
  });

  const [showClearModal, setShowClearModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  
  // API Key management
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyMessage, setApiKeyMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    const { apiKey: key, error } = await getGroqKey();
    if (!error && key) {
      setHasApiKey(true);
      setApiKey(key);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setApiKeyMessage({ text: 'Please enter an API key', type: 'error' });
      return;
    }

    setApiKeyLoading(true);
    const { error } = await saveGroqKey(apiKey.trim());
    
    if (error) {
      setApiKeyMessage({ text: error.message, type: 'error' });
    } else {
      setApiKeyMessage({ text: 'API key saved successfully!', type: 'success' });
      setHasApiKey(true);
    }
    
    setApiKeyLoading(false);
    setTimeout(() => setApiKeyMessage({ text: '', type: '' }), 3000);
  };

  const handleDeleteApiKey = async () => {
    if (!window.confirm('Are you sure you want to delete your API key?')) return;
    
    setApiKeyLoading(true);
    const { error } = await deleteGroqKey();
    
    if (error) {
      setApiKeyMessage({ text: error.message, type: 'error' });
    } else {
      setApiKeyMessage({ text: 'API key deleted', type: 'success' });
      setHasApiKey(false);
      setApiKey('');
    }
    
    setApiKeyLoading(false);
    setTimeout(() => setApiKeyMessage({ text: '', type: '' }), 3000);
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    localStorage.setItem(key, value.toString());
  };

  const handleExportAll = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roleplayforge-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    try {
      const data = JSON.parse(importText);
      importData(data);
      setShowImportModal(false);
      setImportText('');
      alert('Data imported successfully!');
    } catch (error) {
      alert('Invalid JSON format. Please check your data.');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('This will delete ALL characters and conversations. Are you absolutely sure?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-pure-white mb-3">
          Settings
        </h1>
        <p className="text-white/60 text-lg">
          Customize your RolePlayForge experience
        </p>
      </div>

      {/* API Key Management */}
      <div className="card border-white/20 mb-6">
        <h2 className="text-2xl font-bold text-neon-green mb-6">🔑 Groq API Key</h2>
        
        <div className="space-y-4">
          <p className="text-white/60 text-sm">
            Your API key is securely stored in Supabase and never exposed to the frontend.
          </p>

          {apiKeyMessage.text && (
            <div className={`p-4 rounded-lg ${
              apiKeyMessage.type === 'error' 
                ? 'bg-neon-pink/10 border border-neon-pink/30 text-neon-pink' 
                : 'bg-neon-green/10 border border-neon-green/30 text-neon-green'
            }`}>
              {apiKeyMessage.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-pure-white mb-2 uppercase tracking-wide">
              API Key
            </label>
            <div className="flex gap-3">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasApiKey ? "••••••••••••••••" : "Enter your Groq API key"}
                className="input-field flex-1"
                disabled={apiKeyLoading}
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="px-4 py-2 bg-dark-gray border border-white/20 rounded-lg text-pure-white hover:bg-white/5 transition-colors"
                disabled={apiKeyLoading}
              >
                {showApiKey ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveApiKey}
              disabled={apiKeyLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {apiKeyLoading ? 'Saving...' : hasApiKey ? 'Update API Key' : 'Save API Key'}
            </button>
            
            {hasApiKey && (
              <button
                onClick={handleDeleteApiKey}
                disabled={apiKeyLoading}
                className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Key
              </button>
            )}
          </div>

          <div className="mt-4 p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg">
            <p className="text-sm text-neon-cyan font-medium mb-2">ℹ️ How to get your API key:</p>
            <ol className="text-sm text-white/70 space-y-1 ml-4 list-decimal">
              <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">Google AI Studio</a></li>
              <li>Click "Create API Key"</li>
              <li>Copy and paste it above</li>
            </ol>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="card border-white/20 mb-6">
        <h2 className="text-2xl font-bold text-neon-cyan mb-6">General</h2>
        
        <div className="space-y-6">
          {/* Auto Scroll */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-pure-white font-medium mb-1">Auto-scroll to new messages</h3>
              <p className="text-white/60 text-sm">Automatically scroll to bottom when new messages arrive</p>
            </div>
            <button
              onClick={() => handleSettingChange('autoScroll', !settings.autoScroll)}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                settings.autoScroll ? 'bg-neon-green' : 'bg-dark-gray'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-pure-white rounded-full transition-transform duration-300 ${
                  settings.autoScroll ? 'transform translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Typing Speed */}
          <div>
            <h3 className="text-pure-white font-medium mb-3">Character typing speed</h3>
            <div className="flex gap-2">
              {['fast', 'normal', 'slow'].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSettingChange('typingSpeed', speed)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium uppercase transition-all duration-300 ${
                    settings.typingSpeed === speed
                      ? 'bg-neon-cyan text-pure-black'
                      : 'bg-dark-gray text-white/60 hover:text-pure-white border border-white/10'
                  }`}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Effects */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-pure-white font-medium mb-1">Sound effects</h3>
              <p className="text-white/60 text-sm">Play sounds for new messages (Coming soon)</p>
            </div>
            <button
              onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                settings.soundEnabled ? 'bg-neon-green' : 'bg-dark-gray'
              }`}
              disabled
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-pure-white rounded-full transition-transform duration-300 ${
                  settings.soundEnabled ? 'transform translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-pure-white font-medium mb-1">Compact mode</h3>
              <p className="text-white/60 text-sm">Reduce spacing for more content on screen</p>
            </div>
            <button
              onClick={() => handleSettingChange('compactMode', !settings.compactMode)}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                settings.compactMode ? 'bg-neon-green' : 'bg-dark-gray'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-pure-white rounded-full transition-transform duration-300 ${
                  settings.compactMode ? 'transform translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card border-white/20 mb-6">
        <h2 className="text-2xl font-bold text-neon-purple mb-6">Data Management</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <h3 className="text-pure-white font-medium">Total Characters</h3>
              <p className="text-white/60 text-sm">{characters.length} characters created</p>
            </div>
            <span className="text-2xl font-bold text-neon-green">{characters.length}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <h3 className="text-pure-white font-medium">Storage Usage</h3>
              <p className="text-white/60 text-sm">Local browser storage</p>
            </div>
            <span className="text-sm font-mono text-white/60">
              {(JSON.stringify(localStorage).length / 1024).toFixed(2)} KB
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 pt-4">
            <button
              onClick={handleExportAll}
              className="btn-secondary w-full"
            >
              Export All Data
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="btn-secondary w-full"
            >
              Import Data
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-neon-pink/50 mb-6">
        <h2 className="text-2xl font-bold text-neon-pink mb-6">Danger Zone</h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-neon-pink/10 border border-neon-pink/30 rounded-lg">
            <h3 className="text-pure-white font-medium mb-2">Clear All Data</h3>
            <p className="text-white/60 text-sm mb-4">
              Permanently delete all characters, conversations, and settings. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowClearModal(true)}
              className="btn-danger"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-center">
        <button
          onClick={() => navigate(-1)}
          className="btn-outline"
        >
          Back
        </button>
      </div>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Data"
      >
        <div className="space-y-4">
          <p className="text-white/70 text-sm">
            Paste your exported JSON data below. This will merge with your existing data.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            className="input-field resize-none font-mono text-xs"
            placeholder='{"characters": [...], "conversations": [...]}'
          />
          <div className="flex space-x-3">
            <button
              onClick={() => setShowImportModal(false)}
              className="flex-1 btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleImportData}
              className="flex-1 btn-primary"
              disabled={!importText.trim()}
            >
              Import
            </button>
          </div>
        </div>
      </Modal>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Confirm Data Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-white/70 text-sm">
            Are you absolutely sure you want to delete everything? This will remove:
          </p>
          <ul className="list-disc list-inside text-white/60 text-sm space-y-1">
            <li>All {characters.length} characters</li>
            <li>All conversations and messages</li>
            <li>All app settings</li>
          </ul>
          <p className="text-neon-pink text-sm font-bold">
            This action is PERMANENT and cannot be undone!
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowClearModal(false)}
              className="flex-1 btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 btn-danger"
            >
              Delete Everything
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
