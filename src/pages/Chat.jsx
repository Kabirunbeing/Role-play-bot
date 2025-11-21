import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Avatar from '../components/Avatar';
import Groq from 'groq-sdk';
import { supabase, getGroqKey } from '../lib/supabase';

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
  
  const setActiveCharacter = useStore((state) => state.setActiveCharacter);
  
  const [character, setCharacter] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  
  const messages = allMessages;

  useEffect(() => {
    async function loadData() {
      try {
        // Load character
        const { data: charData, error: charError } = await supabase
          .from('characters')
          .select('*')
          .eq('id', characterId)
          .single();

        if (charError) throw charError;
        setCharacter(charData);
        setActiveCharacter(characterId);

        // Load messages
        const { data: msgData, error: msgError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('character_id', characterId)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;
        setAllMessages(msgData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        navigate('/characters');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [characterId, setActiveCharacter, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Delete this message?')) {
      try {
        const { error } = await supabase
          .from('chat_messages')
          .delete()
          .eq('id', messageId);

        if (error) throw error;
        setAllMessages(prev => prev.filter(msg => msg.id !== messageId));
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditText(msg.message);
  };

  const handleSaveEdit = async () => {
    const currentMsg = messages.find(m => m.id === editingMessageId);
    if (editText.trim() && editText !== currentMsg?.message) {
      try {
        const { error } = await supabase
          .from('chat_messages')
          .update({ message: editText.trim(), updated_at: new Date().toISOString() })
          .eq('id', editingMessageId);

        if (error) throw error;
        
        setAllMessages(prev => prev.map(msg => 
          msg.id === editingMessageId 
            ? { ...msg, message: editText.trim(), updated_at: new Date().toISOString() }
            : msg
        ));
      } catch (error) {
        console.error('Error updating message:', error);
      }
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

    // Save user message to database
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: userMsg, error: userMsgError } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: userData.user.id,
          character_id: characterId,
          message: message,
          is_user: true
        }])
        .select()
        .single();

      if (userMsgError) throw userMsgError;
      
      // Add to local state immediately
      setAllMessages(prev => [...prev, userMsg]);
    } catch (error) {
      console.error('Error saving user message:', error);
    }

    // Fetch Groq API key from backend
    const { apiKey, error: keyError } = await getGroqKey();
    
    if (keyError || !apiKey) {
      console.error('Failed to fetch API key from backend:', keyError);
      setAllMessages(prev => [...prev, {
        id: Date.now() + 1,
        message: 'Sorry, I cannot respond right now. Please try again later.',
        is_user: false,
        created_at: new Date().toISOString()
      }]);
      setIsTyping(false);
      return;
    }

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
      
      // Save AI response to database
      await new Promise(resolve => setTimeout(resolve, 800)); // Typing delay
      
      const { data: userData } = await supabase.auth.getUser();
      const { data: aiMsg, error: aiMsgError } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: userData.user.id,
          character_id: characterId,
          message: aiResponse,
          is_user: false
        }])
        .select()
        .single();

      if (aiMsgError) throw aiMsgError;
      
      // Add to local state
      setAllMessages(prev => [...prev, aiMsg]);
      
    } catch (error) {
      console.error('Groq API error:', error);
      
      // Show error message
      const { data: userData } = await supabase.auth.getUser();
      const errorMsg = 'I apologize, but I\'m having trouble responding right now. Please try again.';
      
      const { data: errMsg } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: userData.user.id,
          character_id: characterId,
          message: errorMsg,
          is_user: false
        }])
        .select()
        .single();

      if (errMsg) {
        setAllMessages(prev => [...prev, errMsg]);
      }
    }

    setIsTyping(false);
  };

  const handleClearChat = async () => {
    if (window.confirm('Clear all messages with this character?')) {
      try {
        const { error } = await supabase
          .from('chat_messages')
          .delete()
          .eq('character_id', characterId);

        if (error) throw error;
        setAllMessages([]);
      } catch (error) {
        console.error('Error clearing chat:', error);
      }
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
          <p className="text-white/60">Loading character...</p>
        </div>
      </div>
    );
  }

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
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Link
            to={`/edit/${characterId}`}
            className="btn-icon"
            title="Edit character"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="btn-danger text-sm px-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          )}
          <Link to="/characters" className="btn-outline text-sm px-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
        </div>
      </div>

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
              Start a Conversation with {character.name}
            </h3>
            <p className="text-white/60 text-sm sm:text-lg mb-6">
              Try these conversation starters:
            </p>
            
            {/* Conversation Starters */}
            {allMessages.length === 0 && (
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
                className={`flex ${msg.is_user ? 'justify-end' : 'justify-start'} fade-in group`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-4 sm:px-5 py-3 sm:py-4 relative ${
                    msg.is_user
                      ? 'bg-neon-green text-pure-black font-medium'
                      : 'bg-dark-gray text-pure-white border border-white/20'
                  }`}
                >
                  {!msg.is_user && (
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
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className={`text-xs font-mono ${msg.is_user ? 'text-pure-black/60' : 'text-white/40'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.updated_at !== msg.created_at && <span className="ml-2 italic">(edited)</span>}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Message Actions - Only show when not editing */}
                  {editingMessageId !== msg.id && (
                    <div className={`absolute ${msg.is_user ? '-left-2 top-1/2 -translate-x-full -translate-y-1/2' : '-right-2 top-1/2 translate-x-full -translate-y-1/2'} opacity-0 group-hover:opacity-100 transition-opacity flex ${msg.is_user ? 'flex-row-reverse' : 'flex-row'} gap-1`}>
                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopyMessage(msg.message, msg.id)}
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
                      {msg.is_user && (
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
            className="btn-primary"
          >
            {isTyping ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </>
            ) : (
              <>
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
