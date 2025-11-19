import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import StatsCard from '../components/StatsCard';

export default function Home() {
  const characters = useStore((state) => state.characters);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center py-12 md:py-16 fade-in">
        <div className="mb-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-pure-white mb-4 leading-tight px-4">
            Welcome to <br className="sm:hidden" />
            <span className="text-neon-green text-neon-glow pulse-glow">RolePlayForge</span>
          </h1>
        </div>
        
        <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed px-4">
          Create fictional characters with unique personalities and backstories, 
          <br className="hidden sm:block" />
          then chat with them in an immersive interface.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
          <Link to="/create" className="btn-primary text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4">
            Create Character
          </Link>
          {characters.length > 0 && (
            <Link to="/characters" className="btn-outline text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4">
              View Characters ({characters.length})
            </Link>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 slide-up">
        <div className="card-hover group">
          <div className="text-3xl sm:text-4xl mb-4 group-hover:scale-110 transition-transform font-bold text-neon-green">CC</div>
          <h3 className="text-lg sm:text-xl font-bold mb-3 text-pure-white">Create Characters</h3>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed">
            Design unique personalities with names, traits, and rich backstories.
          </p>
        </div>

        <div className="card-hover group">
          <div className="text-3xl sm:text-4xl mb-4 group-hover:scale-110 transition-transform font-bold text-neon-cyan">IC</div>
          <h3 className="text-lg sm:text-xl font-bold mb-3 text-pure-white">Interactive Chat</h3>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed">
            Have conversations that reflect each character's unique personality.
          </p>
        </div>

        <div className="card-hover group sm:col-span-2 lg:col-span-1">
          <div className="text-3xl sm:text-4xl mb-4 group-hover:scale-110 transition-transform font-bold text-neon-purple">BW</div>
          <h3 className="text-lg sm:text-xl font-bold mb-3 text-pure-white">Build Your World</h3>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed">
            Create multiple characters and explore different narrative possibilities.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      {characters.length > 0 && (
        <div className="slide-up">
          <StatsCard />
        </div>
      )}

      {/* Getting Started */}
      {characters.length === 0 && (
        <div className="card bg-off-black border-neon-green/30 slide-up">
          <h3 className="text-xl sm:text-2xl font-bold mb-6 text-neon-green">Getting Started</h3>
          <ol className="space-y-4 text-sm sm:text-base text-white/70">
            <li className="flex items-start">
              <span className="font-bold text-neon-green mr-3 text-lg sm:text-xl flex-shrink-0">1.</span>
              <span className="pt-1">Click "Create Character" to design a new character</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-neon-cyan mr-3 text-lg sm:text-xl flex-shrink-0">2.</span>
              <span className="pt-1">Give them a name, personality type, and backstory</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-neon-yellow mr-3 text-lg sm:text-xl flex-shrink-0">3.</span>
              <span className="pt-1">Start chatting and watch them respond based on their personality!</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
