import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import SearchBar from '../components/SearchBar';
import Avatar from '../components/Avatar';
import Groq from 'groq-sdk';
import { getGroqKey } from '../lib/supabase';

const PERSONALITY_INFO = {
  friendly: { icon: 'F', color: 'bg-neon-green' },
  sarcastic: { icon: 'S', color: 'bg-neon-yellow' },
  wise: { icon: 'W', color: 'bg-neon-cyan' },
  dark: { icon: 'D', color: 'bg-neon-purple' },
  cheerful: { icon: 'C', color: 'bg-neon-pink' },
};

const CONVERSATION_STARTERS = {
  friendly: [
    "Hey! How was your day?",
    "I need some advice...",
    "Want to hear something funny?",
    "Tell me about yourself!",
  ],
  sarcastic: [
    "Impress me.",
    "I've got a joke for you...",
    "What's your opinion on this?",
    "Challenge accepted?",
  ],
  wise: [
    "What is the meaning of life?",
    "Teach me something new.",
    "I seek guidance...",
    "Share your wisdom with me.",
  ],
  dark: [
    "Tell me a secret...",
    "What lurks in the shadows?",
    "Share your darkest thought.",
    "The night is young...",
  ],
  cheerful: [
    "Let's have some fun!",
    "What makes you happy?",
    "Tell me something exciting!",
    "Let's celebrate something!",
  ],
};

export default function Chat() {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const characters = useStore((state) => state.characters);
  const getMessages = useStore((state) => state.getMessages);
  const searchMessages = useStore((state) => state.searchMessages);
  const sendMessage = useStore((state) => state.sendMessage);
  const setActiveCharacter = useStore((state) => state.setActiveCharacter);
  const clearConversation = useStore((state) => state.clearConversation);
  const deleteMessage = useStore((state) => state.deleteMessage);
  const editMessage = useStore((state) => state.editMessage);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  
  const character = characters.find((c) => c.id === characterId);
  const allMessages = getMessages(characterId);
  const messages = messageSearch ? searchMessages(characterId, messageSearch) : allMessages;

  useEffect(() => {
    if (character) {
      setActiveCharacter(characterId);
    }
  }, [character, characterId, setActiveCharacter]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setShowSearch(!showSearch);
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setMessageSearch('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCopyMessage = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Delete this message?')) {
      deleteMessage(messageId);
    }
  };

  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditText(msg.text);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== messages.find(m => m.id === editingMessageId)?.text) {
      editMessage(editingMessageId, editText.trim());
    }
    setEditingMessageId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isTyping) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    // Add user message directly to store
    const addMessage = useStore.getState().addMessage;
    addMessage(characterId, message, true);

    // Prefer frontend key for quick availability checks, fall back to backend
    let apiKey = import.meta.env.VITE_GROQ_API_KEY;
    let keySource = 'frontend';
    
    if (!apiKey) {
      const { apiKey: storedKey, error: keyError } = await getGroqKey();
      if (keyError || !storedKey) {
        console.log('No API key available, using mock response');
        await sendMessage(message);
        setIsTyping(false);
        return;
      }
      apiKey = storedKey;
      keySource = 'backend';
    }

    console.log(`Using Groq API key from ${keySource}`);

    // Generate AI response
    try {
      const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
      
      // Create character-specific prompt
      const systemPrompt = `You are ${character.name}, a ${character.personality} character. Backstory: ${character.backstory}. Respond in character, matching your personality. Keep responses natural and conversational.`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.8,
        max_tokens: 500
      });
      
      const aiResponse = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not respond.';
      
      // Add AI response directly to store
      await new Promise(resolve => setTimeout(resolve, 800)); // Typing delay
      addMessage(characterId, aiResponse, false);
      
    } catch (error) {
      console.error('Groq API error:', error);
      
      // If quota exceeded, use mock response instead of error
      if (error.message?.includes('quota') || error.message?.includes('429')) {
        console.log('⚠️ API quota exceeded, using mock response');
        await sendMessage(message);
      } else {
        // Other errors - show error message
        await new Promise(resolve => setTimeout(resolve, 500));
        addMessage(characterId, 'I apologize, but I\'m having trouble responding right now. Please try again.', false);
      }
    }

    setIsTyping(false);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all messages with this character?')) {
      clearConversation(characterId);
    }
  };

  if (!character) {
    return (
      <div className="text-center py-20 fade-in">
        <div className="text-6xl sm:text-8xl mb-6 text-neon-pink font-bold">404</div>
        <h2 className="text-2xl sm:text-3xl font-bold text-pure-white mb-3">Character Not Found</h2>
        <p className="text-white/60 mb-8 text-base sm:text-lg">This character doesn't exist or has been deleted.</p>
        <Link to="/characters" className="btn-primary">
          View All Characters
        </Link>
      </div>
    );
  }

  const personalityInfo = PERSONALITY_INFO[character.personality.toLowerCase()] || PERSONALITY_INFO.friendly;

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)] flex flex-col fade-in">
      {/* Character Header */}
      <div className="card mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-white/20 p-4 sm:p-6 gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
          <Avatar character={character} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-pure-white truncate">{character.name}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${personalityInfo.color}`}></span>
              <span className="text-xs sm:text-sm text-white/60 capitalize font-medium">{character.personality}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="btn-secondary text-xs sm:text-sm py-2 px-3 sm:px-6 flex-1 sm:flex-none"
            title="Search messages (Ctrl+F)"
          >
            Search
          </button>
          <Link
            to={`/edit/${characterId}`}
            className="btn-secondary text-xs sm:text-sm py-2 px-3 sm:px-6 flex-1 sm:flex-none"
            title="Edit character"
          >
            Edit
          </Link>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="btn-secondary text-xs sm:text-sm py-2 px-3 sm:px-6 flex-1 sm:flex-none"
            >
              Clear
            </button>
          )}
          <Link to="/characters" className="btn-outline text-xs sm:text-sm py-2 px-3 sm:px-6 flex-1 sm:flex-none">
            Back
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="mb-4 slide-up">
          <SearchBar
            value={messageSearch}
            onChange={setMessageSearch}
            placeholder="Search messages... (Esc to close)"
          />
          {messageSearch && (
            <p className="text-xs text-white/60 mt-2 font-mono">
              Found {messages.length} of {allMessages.length} messages
            </p>
          )}
        </div>
      )}

      {/* Character Info */}
      <div className="card mb-4 bg-off-black border-white/20 p-4">
        <p className="text-xs sm:text-sm text-white/70 italic leading-relaxed line-clamp-2">"{character.backstory}"</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 card overflow-y-auto mb-4 space-y-3 sm:space-y-4 border-white/20 p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <Avatar character={character} size="xl" className="mx-auto mb-6" />
            <h3 className="text-xl sm:text-2xl font-bold text-pure-white mb-3">
              {allMessages.length > 0 ? 'No messages match your search' : `Start a Conversation with ${character.name}`}
            </h3>
            <p className="text-white/60 text-sm sm:text-lg mb-6">
              {allMessages.length > 0 ? 'Try different keywords' : 'Try these conversation starters:'}
            </p>
            {allMessages.length > 0 && messageSearch && (
              <button
                onClick={() => setMessageSearch('')}
                className="btn-outline text-sm mt-4"
              >
                Clear Search
              </button>
            )}
            
            {/* Conversation Starters */}
            {allMessages.length === 0 && !messageSearch && (
              <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                {CONVERSATION_STARTERS[character.personality.toLowerCase()]?.map((starter, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputMessage(starter);
                      document.querySelector('input[type="text"]')?.focus();
                    }}
                    className="px-4 py-3 bg-dark-gray border border-white/20 rounded-lg text-sm text-white/80 hover:border-neon-green hover:text-pure-white hover:bg-neon-green/10 transition-all duration-300 text-left"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} fade-in group`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-4 sm:px-5 py-3 sm:py-4 relative ${
                    msg.isUser
                      ? 'bg-neon-green text-pure-black font-medium'
                      : 'bg-dark-gray text-pure-white border border-white/20'
                  }`}
                >
                  {!msg.isUser && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Avatar character={character} size="xs" />
                      <span className="text-xs font-bold text-white/60 uppercase tracking-wider">{character.name}</span>
                    </div>
                  )}
                  
                  {/* Message Text or Edit Input */}
                  {editingMessageId === msg.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-3 py-2 bg-pure-black text-pure-white border border-white/30 rounded-lg focus:outline-none focus:border-neon-cyan text-xs sm:text-sm resize-none"
                        rows="3"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-neon-green text-pure-black rounded-md text-xs font-bold hover:bg-neon-green/80 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-white/20 text-white rounded-md text-xs hover:bg-white/30 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className={`text-xs font-mono ${msg.isUser ? 'text-pure-black/60' : 'text-white/40'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.edited && <span className="ml-2 italic">(edited)</span>}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Message Actions - Only show when not editing */}
                  {editingMessageId !== msg.id && (
                    <div className={`absolute ${msg.isUser ? '-left-2 top-1/2 -translate-x-full -translate-y-1/2' : '-right-2 top-1/2 translate-x-full -translate-y-1/2'} opacity-0 group-hover:opacity-100 transition-opacity flex ${msg.isUser ? 'flex-row-reverse' : 'flex-row'} gap-1`}>
                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopyMessage(msg.text, msg.id)}
                        className="p-1.5 bg-dark-gray border border-white/20 rounded-md hover:border-neon-cyan hover:bg-neon-cyan/10 transition-all"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <svg className="w-4 h-4 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>

                      {/* Edit Button - Only for user messages */}
                      {msg.isUser && (
                        <button
                          onClick={() => handleStartEdit(msg)}
                          className="p-1.5 bg-dark-gray border border-white/20 rounded-md hover:border-neon-yellow hover:bg-neon-yellow/10 transition-all"
                          title="Edit message"
                        >
                          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1.5 bg-dark-gray border border-white/20 rounded-md hover:border-neon-pink hover:bg-neon-pink/10 transition-all"
                        title="Delete message"
                      >
                        <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start fade-in">
                <div className="bg-dark-gray border border-white/20 rounded-xl px-4 sm:px-5 py-3 sm:py-4 max-w-[85%] sm:max-w-[75%]">
                  <div className="flex items-center space-x-2 mb-2">
                    <Avatar character={character} size="xs" />
                    <span className="text-xs font-bold text-white/60 uppercase tracking-wider">{character.name}</span>
                  </div>
                  <div className="flex space-x-1.5">
                    <span className="w-2 h-2 bg-neon-green rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-neon-yellow rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="card border-white/20 p-4">
        <div className="flex space-x-2 sm:space-x-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Message ${character.name}...`}
            className="flex-1 input-field text-sm sm:text-base"
            disabled={isTyping}
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap px-4 sm:px-6"
          >
            Send →
          </button>
        </div>
      </form>
    </div>
  );
}
