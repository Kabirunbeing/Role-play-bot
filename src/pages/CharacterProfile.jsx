import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import Avatar from '../components/Avatar';

export default function CharacterProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const character = useStore((state) => state.characters.find(c => c.id === id));
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const deleteCharacter = useStore((state) => state.deleteCharacter);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center fade-in">
        <div className="text-6xl sm:text-8xl mb-6 text-neon-pink font-bold">404</div>
        <p className="text-xl sm:text-2xl text-white/80 mb-8">Character not found</p>
        <Link to="/characters" className="btn-primary">
          Back to Characters
        </Link>
      </div>
    );
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const conversations = character.conversations || [];
    const allMessages = conversations.flatMap(conv => conv.messages || []);
    const userMessages = allMessages.filter(m => m.sender === 'user');
    const charMessages = allMessages.filter(m => m.sender === 'character');
    
    const avgUserMsgLength = userMessages.length > 0
      ? Math.round(userMessages.reduce((sum, m) => sum + m.text.length, 0) / userMessages.length)
      : 0;
    
    const avgCharMsgLength = charMessages.length > 0
      ? Math.round(charMessages.reduce((sum, m) => sum + m.text.length, 0) / charMessages.length)
      : 0;

    const firstMessage = allMessages[0]?.timestamp || character.createdAt;
    const lastMessage = allMessages[allMessages.length - 1]?.timestamp || character.createdAt;
    const daysSinceCreation = Math.ceil((new Date() - new Date(character.createdAt)) / (1000 * 60 * 60 * 24));
    
    return {
      totalMessages: allMessages.length,
      userMessages: userMessages.length,
      charMessages: charMessages.length,
      avgUserMsgLength,
      avgCharMsgLength,
      conversationCount: conversations.length,
      firstMessageDate: new Date(firstMessage),
      lastMessageDate: new Date(lastMessage),
      daysSinceCreation,
      messagesPerDay: allMessages.length > 0 ? (allMessages.length / daysSinceCreation).toFixed(1) : 0,
    };
  }, [character]);

  const handleDelete = () => {
    deleteCharacter(id);
    navigate('/characters');
  };

  const getPersonalityInfo = (personality) => {
    const info = {
      friendly: { icon: 'F', color: 'neon-green', description: 'Warm and approachable' },
      sarcastic: { icon: 'S', color: 'neon-pink', description: 'Witty and ironic' },
      wise: { icon: 'W', color: 'neon-purple', description: 'Thoughtful and profound' },
      dark: { icon: 'D', color: 'neon-yellow', description: 'Mysterious and intense' },
      cheerful: { icon: 'C', color: 'neon-cyan', description: 'Upbeat and energetic' },
    };
    return info[personality.toLowerCase()] || info.friendly;
  };

  const personalityInfo = getPersonalityInfo(character.personality);

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 fade-in">
        <button 
          onClick={() => navigate(-1)}
          className="btn-outline"
        >
          ← Back
        </button>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-pure-white">
          Character <span className="text-neon-green">Profile</span>
        </h1>
      </div>

      {/* Profile Card */}
      <div className="card slide-up">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center lg:items-start gap-4">
            <Avatar character={character} size="xl" />
            <button
              onClick={() => toggleFavorite(character.id)}
              className={`btn-outline ${character.isFavorite ? 'border-neon-yellow text-neon-yellow' : ''}`}
            >
              <svg className="w-5 h-5 mr-2 inline-block" fill={character.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              {character.isFavorite ? 'Favorited' : 'Add to Favorites'}
            </button>
          </div>

          {/* Info Section */}
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-pure-white mb-2">{character.name}</h2>
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-2 px-4 py-2 bg-${personalityInfo.color}/20 text-${personalityInfo.color} rounded-lg border border-${personalityInfo.color}/30 font-medium`}>
                  <span className="text-lg font-bold">{personalityInfo.icon}</span>
                  {character.personality}
                </span>
                <span className="text-sm text-white/60">
                  Created {new Date(character.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-pure-white mb-2">Backstory</h3>
              <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{character.backstory}</p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Link to={`/chat/${character.id}`} className="btn-primary">
                Start Chatting
              </Link>
              <Link to={`/edit/${character.id}`} className="btn-outline">
                Edit Character
              </Link>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="btn-outline border-neon-pink/30 text-neon-pink hover:bg-neon-pink/10"
              >
                Delete Character
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 slide-up">
        <div className="card bg-gradient-to-br from-neon-green/20 to-transparent border-neon-green/30">
          <div className="text-sm text-white/60 mb-2">Total Messages</div>
          <div className="text-3xl font-bold text-neon-green">{stats.totalMessages}</div>
        </div>
        <div className="card bg-gradient-to-br from-neon-cyan/20 to-transparent border-neon-cyan/30">
          <div className="text-sm text-white/60 mb-2">Conversations</div>
          <div className="text-3xl font-bold text-neon-cyan">{stats.conversationCount}</div>
        </div>
        <div className="card bg-gradient-to-br from-neon-yellow/20 to-transparent border-neon-yellow/30">
          <div className="text-sm text-white/60 mb-2">Messages/Day</div>
          <div className="text-3xl font-bold text-neon-yellow">{stats.messagesPerDay}</div>
        </div>
        <div className="card bg-gradient-to-br from-neon-purple/20 to-transparent border-neon-purple/30">
          <div className="text-sm text-white/60 mb-2">Days Active</div>
          <div className="text-3xl font-bold text-neon-purple">{stats.daysSinceCreation}</div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card slide-up">
          <h3 className="text-xl font-bold text-pure-white mb-6 flex items-center gap-2">
            <span className="text-neon-green">▸</span> Message Breakdown
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-white/60">Your Messages</span>
                <span className="text-sm font-medium text-pure-white">{stats.userMessages}</span>
              </div>
              <div className="h-3 bg-pure-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-neon-green rounded-full"
                  style={{ width: `${stats.totalMessages > 0 ? (stats.userMessages / stats.totalMessages) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-white/60">Character Messages</span>
                <span className="text-sm font-medium text-pure-white">{stats.charMessages}</span>
              </div>
              <div className="h-3 bg-pure-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-neon-cyan rounded-full"
                  style={{ width: `${stats.totalMessages > 0 ? (stats.charMessages / stats.totalMessages) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card slide-up">
          <h3 className="text-xl font-bold text-pure-white mb-6 flex items-center gap-2">
            <span className="text-neon-cyan">▸</span> Average Message Length
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Your average</span>
              <span className="text-2xl font-bold text-neon-green">{stats.avgUserMsgLength} chars</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Character average</span>
              <span className="text-2xl font-bold text-neon-cyan">{stats.avgCharMsgLength} chars</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="card slide-up">
        <h3 className="text-xl font-bold text-pure-white mb-6 flex items-center gap-2">
          <span className="text-neon-yellow">▸</span> Activity Timeline
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 text-sm text-white/60">Created</div>
            <div className="flex-1 h-px bg-white/10"></div>
            <div className="text-sm font-medium text-pure-white">
              {new Date(character.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          {stats.totalMessages > 0 && (
            <>
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm text-white/60">First Chat</div>
                <div className="flex-1 h-px bg-white/10"></div>
                <div className="text-sm font-medium text-pure-white">
                  {stats.firstMessageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm text-white/60">Last Chat</div>
                <div className="flex-1 h-px bg-white/10"></div>
                <div className="text-sm font-medium text-pure-white">
                  {stats.lastMessageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-pure-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
          <div className="card max-w-md w-full slide-up">
            <h3 className="text-2xl font-bold text-neon-pink mb-4">Delete Character?</h3>
            <p className="text-white/70 mb-6">
              Are you sure you want to delete <span className="text-pure-white font-bold">{character.name}</span>? 
              This will permanently delete the character and all conversation history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="btn-primary bg-neon-pink/20 text-neon-pink border-neon-pink/50 hover:bg-neon-pink/30 flex-1"
              >
                Delete Forever
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
