import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
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

  const handleDeleteMessage = (messageId) => {
    setMessageToDelete(messageId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageToDelete);

      if (error) throw error;
      setAllMessages(prev => prev.filter(msg => msg.id !== messageToDelete));
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setDeleteModalOpen(false);
      setMessageToDelete(null);
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
    <div className="fixed inset-0 bg-pure-black flex flex-col">
      {/* Fixed Header - Messenger Style */}
      <div className="bg-off-black border-b border-white/10 px-4 py-3 flex items-center space-x-3 shrink-0">
        <Link 
          to="/characters" 
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
          title="Back to characters"
        >
          <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        
        <Avatar character={character} size="md" />
        
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-pure-white truncate">{character.name}</h2>
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${personalityInfo.color} animate-pulse`}></span>
            <span className="text-xs text-white/50">Active now</span>
          </div>
        </div>
      </div>

      {/* Messages Container - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Avatar character={character} size="xl" className="mb-4" />
            <h3 className="text-lg font-semibold text-pure-white mb-2">
              Start chatting with {character.name}
            </h3>
            <p className="text-sm text-white/50 mb-6 max-w-sm">
              {character.backstory}
            </p>
            
            {/* Conversation Starters */}
            {allMessages.length === 0 && (
              <div className="w-full max-w-md space-y-2">
                <p className="text-xs text-white/40 mb-3">Tap to start:</p>
                {CONVERSATION_STARTERS[character.personality.toLowerCase()]?.map((starter, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputMessage(starter);
                      document.querySelector('input[type="text"]')?.focus();
                    }}
                    className="w-full px-4 py-3 bg-dark-gray/50 border border-white/10 rounded-2xl text-sm text-white/70 hover:border-neon-green/50 hover:bg-neon-green/5 transition-all text-left"
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
                className={`flex ${msg.is_user ? 'justify-end' : 'justify-start'} group`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 relative ${
                    msg.is_user
                      ? 'bg-neon-green text-pure-black rounded-br-md'
                      : 'bg-dark-gray/80 text-pure-white rounded-bl-md'
                  }`}
                >
                  {/* Message Text or Edit Input */}
                  {editingMessageId === msg.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-3 py-2 bg-pure-black text-pure-white border border-white/30 rounded-lg focus:outline-none focus:border-neon-cyan text-sm resize-none"
                        rows="3"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1.5 bg-neon-green text-pure-black rounded-lg text-xs font-semibold hover:bg-neon-green/80"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs hover:bg-white/20"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${msg.is_user ? 'text-pure-black/50' : 'text-white/40'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.updated_at !== msg.created_at && <span className="ml-1.5">(edited)</span>}
                      </p>
                    </>
                  )}

                  {/* Message Actions - Simplified for messenger style */}
                  {editingMessageId !== msg.id && (
                    <div className={`absolute ${msg.is_user ? '-left-20 top-1/2 -translate-y-1/2' : '-right-20 top-1/2 -translate-y-1/2'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopyMessage(msg.message, msg.id)}
                        className="p-1.5 bg-dark-gray/90 rounded-full hover:bg-neon-cyan/20 transition-all"
                        title="Copy"
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
                          className="p-1.5 bg-dark-gray/90 rounded-full hover:bg-neon-yellow/20 transition-all"
                          title="Edit"
                        >
                          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1.5 bg-dark-gray/90 rounded-full hover:bg-neon-pink/20 transition-all"
                        title="Delete"
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
              <div className="flex justify-start">
                <div className="bg-dark-gray/80 rounded-2xl rounded-bl-md px-4 py-3 max-w-[75%]">
                  <div className="flex space-x-1.5">
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Fixed Input Area - Messenger Style */}
      <form onSubmit={handleSend} className="bg-off-black border-t border-white/10 px-4 py-3 shrink-0">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Message ${character.name}...`}
            className="flex-1 bg-dark-gray/50 text-pure-white placeholder-white/40 border border-white/10 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-neon-green/50 transition-colors"
            disabled={isTyping}
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className={`p-2.5 rounded-full transition-all ${
              inputMessage.trim() && !isTyping
                ? 'bg-neon-green text-pure-black hover:bg-neon-green/80'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            {isTyping ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* Delete Message Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setMessageToDelete(null);
        }}
        title="Delete Message"
      >
        <div className="space-y-4">
          <p className="text-sm sm:text-base text-white/70">
            Are you sure you want to delete this message?
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
                setMessageToDelete(null);
              }}
              className="btn-outline w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteMessage}
              className="btn-danger w-full sm:w-auto"
            >
              Delete Message
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
