import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import StatsCard from '../components/StatsCard';

export default function Home() {
  const characters = useStore((state) => state.characters);
  const [publicCharacters, setPublicCharacters] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  useEffect(() => {
    loadPublicCharacters();
  }, []);

  const loadPublicCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(8); // Show only 8 characters on homepage

      if (error) throw error;
      setPublicCharacters(data || []);
    } catch (error) {
      console.error('Error loading public characters:', error);
    } finally {
      setLoadingGallery(false);
    }
  };

  const PERSONALITY_COLORS = {
    friendly: 'neon-green',
    sarcastic: 'neon-yellow',
    wise: 'neon-cyan',
    dark: 'neon-purple',
    cheerful: 'neon-pink',
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fixed"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1614726365723-49cfae9278b7?q=80&w=2576&auto=format&fit=crop')`,
        }}
      >
        <div className="absolute inset-0 bg-pure-black/80 backdrop-blur-[2px] bg-gradient-to-b from-pure-black/90 via-pure-black/70 to-pure-black/90"></div>

        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-neon-green/20 rounded-full blur-[100px] animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-[120px] animate-float-delayed"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-neon-cyan/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '4s' }}></div>
          <div className="absolute -top-20 right-1/3 w-64 h-64 bg-neon-pink/20 rounded-full blur-[100px] animate-float-delayed" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20">

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-16">
          <div className="inline-block mb-3 sm:mb-4 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 backdrop-blur-md animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-neon-green text-[10px] sm:text-sm font-bold tracking-wider uppercase">Next Gen Roleplay</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50 mb-4 sm:mb-6 tracking-tight leading-tight drop-shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            RolePlay<span className="text-neon-green text-neon-glow">Forge</span>
          </h1>

          <p className="text-base sm:text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-light px-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            Immerse yourself in a world of <span className="text-white font-medium">authentic characters</span>.
            Create, chat, and explore infinite narratives with AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 w-full animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link
              to="/create"
              className="group relative w-auto min-w-[200px] sm:min-w-0 px-5 py-2.5 sm:px-8 sm:py-4 bg-neon-green text-pure-black font-bold text-sm sm:text-lg rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,255,65,0.3)] flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Create Character
              </span>
            </Link>

            {characters.length > 0 ? (
              <Link
                to="/characters"
                className="group w-auto min-w-[200px] sm:min-w-0 px-5 py-2.5 sm:px-8 sm:py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold text-sm sm:text-lg rounded-xl transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:scale-105 flex items-center justify-center"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  My Characters ({characters.length})
                </span>
              </Link>
            ) : (
              <Link
                to="/generate-anime"
                className="group w-auto min-w-[200px] sm:min-w-0 px-5 py-2.5 sm:px-8 sm:py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold text-sm sm:text-lg rounded-xl transition-all duration-300 hover:bg-white/10 hover:border-neon-pink/50 hover:text-neon-pink hover:scale-105 flex items-center justify-center"
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl">✨</span>
                  Generate Anime
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Features Grid - Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl w-full">
          {[
            {
              icon: "🎭",
              title: "Authentic Anime",
              desc: "Generate canon-accurate profiles with real images from Jikan API.",
              color: "text-neon-pink",
              border: "group-hover:border-neon-pink/50"
            },
            {
              icon: "🧠",
              title: "Deep Personality",
              desc: "AI that remembers context and stays in character.",
              color: "text-neon-cyan",
              border: "group-hover:border-neon-cyan/50"
            },
            {
              icon: "⚡",
              title: "Instant Chat",
              desc: "Real-time, low-latency conversations powered by Llama 3.3.",
              color: "text-neon-green",
              border: "group-hover:border-neon-green/50"
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              className={`group p-6 sm:p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 ${feature.border} ${idx === 2 ? 'sm:col-span-2 lg:col-span-1' : ''} animate-fade-in-up`}
              style={{ animationDelay: `${0.5 + (idx * 0.1)}s` }}
            >
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
              <h3 className={`text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white ${feature.color}`}>{feature.title}</h3>
              <p className="text-sm sm:text-base text-white/60 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        {characters.length > 0 && (
          <div className="mt-16 w-full max-w-4xl slide-up delay-100">
            <div className="p-1 rounded-2xl bg-gradient-to-r from-neon-green/20 via-neon-cyan/20 to-neon-purple/20">
              <div className="bg-pure-black/90 backdrop-blur-xl rounded-xl p-6">
                <StatsCard />
              </div>
            </div>
          </div>
        )}

        {/* Community Gallery Section */}
        {!loadingGallery && publicCharacters.length > 0 && (
          <div className="mt-20 w-full max-w-6xl animate-fade-in-up">
            {/* Section Header */}
            <div className="text-center mb-10">
              <div className="inline-block mb-3 px-4 py-1.5 rounded-full bg-neon-pink/10 border border-neon-pink/20 backdrop-blur-md">
                <span className="text-neon-pink text-sm font-bold tracking-wider uppercase">Community Creations</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-pure-white mb-4">
                Explore the <span className="text-neon-pink">Gallery</span>
              </h2>
              <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-2">
                Discover amazing characters created by our talented community of users.
              </p>
              <p className="text-sm text-white/50">
                These characters were made by people just like you using RolePlayForge! ✨
              </p>
            </div>

            {/* Characters Grid Preview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {publicCharacters.map((character, index) => (
                <Link
                  key={character.id}
                  to={`/chat/${character.id}`}
                  className="group relative bg-gradient-to-br from-dark-gray/50 via-dark-gray/50 to-off-black/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-neon-pink/50 transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Character Image */}
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    {character.image_url ? (
                      <img
                        src={character.image_url}
                        alt={character.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br from-${PERSONALITY_COLORS[character.personality]}/20 to-${PERSONALITY_COLORS[character.personality]}/30 flex items-center justify-center text-4xl font-bold text-${PERSONALITY_COLORS[character.personality]}`}>
                        {character.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Character Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-pure-white group-hover:text-neon-pink transition-colors line-clamp-1 mb-1">
                      {character.name}
                    </h3>
                    <span className={`inline-block px-2 py-0.5 rounded-md bg-${PERSONALITY_COLORS[character.personality]}/10 border border-${PERSONALITY_COLORS[character.personality]}/20 text-${PERSONALITY_COLORS[character.personality]} text-xs font-medium`}>
                      {character.personality}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center">
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30 text-neon-pink font-bold text-lg rounded-xl transition-all duration-300 hover:from-neon-pink/30 hover:to-neon-purple/30 hover:border-neon-pink/50 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,0,110,0.3)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View Full Gallery
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

