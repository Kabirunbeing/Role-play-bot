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
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  
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
    // Load user's image generation count
    async function loadImageCount() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        try {
          const { data, error } = await supabase
            .from('chat_messages')
            .select('id')
            .eq('user_id', userData.user.id)
            .eq('character_id', characterId)
            .not('image_url', 'is', null);

          if (error && !error.message.includes('column')) throw error;
          setImageCount(data?.length || 0);
        } catch (queryError) {
          console.warn('Image count query failed (column may not exist):', queryError);
          setImageCount(0);
        }
      } catch (error) {
        console.error('Error loading image count:', error);
        setImageCount(0);
      }
    }
    loadImageCount();
  }, [characterId, allMessages]);

  const startRecording = async (e) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      // Track initial position for swipe
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      startXRef.current = clientX;
      currentXRef.current = clientX;
      setSwipeOffset(0);
      setIsCancelled(false);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        if (!isCancelled) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await transcribeAudio(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
        setSwipeOffset(0);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access error:', error);
      alert('Please allow microphone access to use voice input');
    }
  };

  const handleSwipe = (e) => {
    if (!isRecording) return;
    
    // Prevent scrolling while recording
    if (e.cancelable) {
      e.preventDefault();
    }
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    currentXRef.current = clientX;
    const diff = startXRef.current - clientX;
    
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 120)); // Max swipe distance
      
      // Cancel if swiped more than 100px to the left
      if (diff > 100 && !isCancelled) {
        setIsCancelled(true);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      setIsTranscribing(true);
      const { apiKey, error: keyError } = await getGroqKey();
      
      if (keyError || !apiKey) {
        throw new Error('Failed to get API key');
      }

      const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
      const audioFile = new File([audioBlob], 'voice.webm', { type: 'audio/webm' });

      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3',
        language: 'en'
      });

      setInputMessage(transcription.text);
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

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

  const handleGenerateImage = async (prompt) => {
    if (imageCount >= 5) {
      alert('You have reached the maximum limit of 5 images for this character.');
      return;
    }

    // Force state update and wait for render
    await new Promise(resolve => {
      setGeneratingImage(true);
      setTimeout(resolve, 800);
    });

    try {

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error('User not authenticated');
      }

      // Using Pollinations.ai - free image generation API
      // Generate contextual image based on user's roleplay prompt with character
      const imagePrompt = `${prompt} featuring ${character.name}, ${character.personality} character, detailed, cinematic, high quality`;
      const encodedPrompt = encodeURIComponent(imagePrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${Date.now()}`;

      // Pre-load image to ensure it works
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Save image message to database
      const insertData = {
        user_id: userData.user.id,
        character_id: characterId,
        message: `🖼️ ${prompt}`,
        is_user: true
      };

      // Try to add image_url if column exists, otherwise just save without it
      try {
        insertData.image_url = imageUrl;
        const { data: imageMsg, error: imageMsgError } = await supabase
          .from('chat_messages')
          .insert([insertData])
          .select()
          .single();

        if (imageMsgError) throw imageMsgError;
        setAllMessages(prev => [...prev, imageMsg]);
      } catch (dbError) {
        // If image_url column doesn't exist, create a local message object
        console.warn('Database insertion failed, using local state:', dbError);
        const localMsg = {
          id: Date.now(),
          ...insertData,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setAllMessages(prev => [...prev, localMsg]);
      }

      setImageCount(prev => prev + 1);
    } catch (error) {
      console.error('Error generating image:', error);
      alert(`Failed to generate image: ${error.message || 'Unknown error'}`);
    } finally {
      setGeneratingImage(false);
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

    // Detect image generation requests
    const imageKeywords = ['generate image', 'create image', 'show me', 'draw', 'picture of', 'image of', 'visualize'];
    const isImageRequest = imageKeywords.some(keyword => message.toLowerCase().includes(keyword));

    if (isImageRequest && imageCount < 5) {
      // Extract the actual prompt after the keyword
      let imagePrompt = message;
      for (const keyword of imageKeywords) {
        if (message.toLowerCase().includes(keyword)) {
          const parts = message.split(new RegExp(keyword, 'i'));
          if (parts[1]) {
            imagePrompt = parts[1].trim();
          }
          break;
        }
      }
      await handleGenerateImage(imagePrompt || message);
      return;
    }

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
      const systemPrompt = `You are ${character.name}, a ${character.personality} character. Backstory: ${character.backstory}. 

IMPORTANT RULES:
- Keep responses SHORT and CONCISE (2-4 sentences maximum)
- Respond naturally as if texting or chatting
- Match your ${character.personality} personality
- Be conversational, not verbose
- Don't write long paragraphs or explanations`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 150,
        top_p: 0.9
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
                      {msg.image_url && (
                        <img 
                          src={msg.image_url} 
                          alt="Generated" 
                          className="w-full max-w-sm rounded-lg mb-2 border border-white/10"
                          loading="lazy"
                        />
                      )}
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
            
            {/* Generating Image Indicator */}
            {generatingImage && (
              <div className="flex justify-start">
                <div className="bg-neon-purple/20 border border-neon-purple/30 rounded-2xl rounded-bl-md px-4 py-3 max-w-[75%]">
                  <div className="flex items-center space-x-3">
                    <svg className="animate-spin h-5 w-5 text-neon-purple" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-neon-purple">Generating image...</p>
                      <p className="text-xs text-white/50">This may take a few seconds</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

      {/* Image Prompt Suggestions */}
      {imageCount < 5 && (
        <div className="bg-off-black border-t border-white/10 px-4 py-2 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-xs text-white/40 whitespace-nowrap">💡 Try:</span>
            <button
              onClick={() => setInputMessage(`show me ${character.name}'s portrait`)}
              className="text-xs bg-neon-purple/20 text-neon-purple px-3 py-1.5 rounded-full hover:bg-neon-purple/30 transition-all whitespace-nowrap"
            >
              Show portrait
            </button>
            <button
              onClick={() => setInputMessage('create image of the scene we are in')}
              className="text-xs bg-neon-blue/20 text-neon-blue px-3 py-1.5 rounded-full hover:bg-neon-blue/30 transition-all whitespace-nowrap"
            >
              Current scene
            </button>
            <button
              onClick={() => setInputMessage(`visualize ${character.name} in action`)}
              className="text-xs bg-neon-pink/20 text-neon-pink px-3 py-1.5 rounded-full hover:bg-neon-pink/30 transition-all whitespace-nowrap"
            >
              Action shot
            </button>
            <button
              onClick={() => setInputMessage('picture of the location')}
              className="text-xs bg-neon-yellow/20 text-neon-yellow px-3 py-1.5 rounded-full hover:bg-neon-yellow/30 transition-all whitespace-nowrap"
            >
              Location
            </button>
          </div>
        </div>
      )}

      {/* Fixed Input Area - Messenger Style */}
      <form onSubmit={handleSend} className="bg-off-black border-t border-white/10 px-3 sm:px-4 py-3 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Voice Recording Button */}
          <div className="relative group flex items-center">
            {/* Cancel text that appears when swiping */}
            {isRecording && (
              <div 
                className="absolute right-full mr-1.5 sm:mr-2 flex items-center transition-opacity pointer-events-none"
                style={{ opacity: swipeOffset > 30 ? 1 : 0 }}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-neon-pink mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                  isCancelled ? 'text-neon-pink' : 'text-white/60'
                }`}>
                  {isCancelled ? 'Cancelled' : 'Slide to cancel'}
                </span>
              </div>
            )}
            
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseMove={handleSwipe}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchMove={handleSwipe}
              onTouchEnd={stopRecording}
              disabled={isTyping || generatingImage || isTranscribing}
              className={`p-2 sm:p-2.5 rounded-full transition-all shrink-0 touch-none select-none ${
                isRecording
                  ? 'bg-neon-pink text-pure-black animate-pulse scale-110'
                  : isTranscribing
                  ? 'bg-neon-purple/30 text-neon-purple'
                  : 'bg-dark-gray/50 text-white/60 hover:bg-neon-purple/20 hover:text-neon-purple'
              }`}
              style={{
                transform: isRecording ? `translateX(-${swipeOffset}px) scale(1.1)` : undefined,
                transition: 'transform 0.1s ease-out',
                touchAction: 'none'
              }}
            >
            {isTranscribing ? (
              <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          
          {/* Tooltip on hover */}
          {!isRecording && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-pure-black border border-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <p className="text-xs text-white font-medium mb-0.5">🎤 Hold & Speak</p>
              <p className="text-[10px] text-white/60">Swipe left to cancel</p>
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-pure-black"></div>
              </div>
            </div>
          )}
        </div>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isRecording ? 'Recording...' : isTranscribing ? 'Converting to text...' : `Message ${character.name}...`}
            className="flex-1 min-w-0 bg-dark-gray/50 text-pure-white placeholder-white/40 border border-white/10 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:border-neon-green/50 transition-colors"
            disabled={isTyping || generatingImage || isRecording || isTranscribing}
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping || generatingImage || isRecording || isTranscribing}
            className={`p-2 sm:p-2.5 rounded-full transition-all shrink-0 ${
              inputMessage.trim() && !isTyping && !generatingImage && !isRecording && !isTranscribing
                ? 'bg-neon-green text-pure-black hover:bg-neon-green/80'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            {isTyping || generatingImage ? (
              <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* Generating Image Modal */}
      <Modal
        isOpen={generatingImage}
        onClose={() => {}}
        title="Generating Image"
        size="sm"
      >
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col items-center justify-center py-4 sm:py-8">
            {/* Animated spinner */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6">
              <svg className="animate-spin h-16 w-16 sm:h-20 sm:w-20 text-neon-purple" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl sm:text-2xl">🎨</span>
              </div>
            </div>
            
            <h3 className="text-base sm:text-lg font-semibold text-pure-white mb-1 sm:mb-2 text-center px-2">Creating your image...</h3>
            <p className="text-xs sm:text-sm text-white/60 text-center max-w-xs px-4">
              AI is generating a unique image based on your prompt
            </p>
          </div>
          
          <div className="bg-neon-purple/10 border border-neon-purple/30 p-3 sm:p-4 rounded-lg">
            <p className="text-[10px] sm:text-xs text-neon-purple font-medium text-center">
              ✨ This may take a few seconds
            </p>
          </div>
        </div>
      </Modal>

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
