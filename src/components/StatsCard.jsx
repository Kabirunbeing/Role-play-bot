import { useStore } from '../store/useStore';
import Avatar from './Avatar';

export default function StatsCard() {
  const getStats = useStore((state) => state.getStats);
  const stats = getStats();

  const personalityColors = {
    friendly: 'text-neon-green',
    sarcastic: 'text-neon-yellow',
    wise: 'text-neon-cyan',
    dark: 'text-neon-purple',
    cheerful: 'text-neon-pink',
  };

  return (
    <div className="card bg-off-black border-neon-cyan/30 fade-in">
      <h3 className="text-xl font-bold mb-6 text-pure-white flex items-center">
        <svg className="w-6 h-6 mr-2 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Your Statistics
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-dark-gray rounded-lg border border-white/10 hover:border-neon-green/50 transition-all">
          <p className="text-4xl font-bold text-neon-green mb-1">{stats.totalCharacters}</p>
          <p className="text-xs text-white/60 uppercase tracking-wider">Characters</p>
        </div>
        <div className="text-center p-4 bg-dark-gray rounded-lg border border-white/10 hover:border-neon-cyan/50 transition-all">
          <p className="text-4xl font-bold text-neon-cyan mb-1">{stats.totalMessages}</p>
          <p className="text-xs text-white/60 uppercase tracking-wider">Messages</p>
        </div>
        <div className="text-center p-4 bg-dark-gray rounded-lg border border-white/10 hover:border-neon-yellow/50 transition-all">
          <p className="text-4xl font-bold text-neon-yellow mb-1">
            {Object.keys(stats.personalities).length}
          </p>
          <p className="text-xs text-white/60 uppercase tracking-wider">Personalities</p>
        </div>
        <div className="text-center p-4 bg-dark-gray rounded-lg border border-white/10 hover:border-neon-pink/50 transition-all">
          <p className="text-4xl font-bold text-neon-pink mb-1">
            {stats.mostActiveCharacter ? '1' : '—'}
          </p>
          <p className="text-xs text-white/60 uppercase tracking-wider">Most Active</p>
        </div>
      </div>

      {/* Personality breakdown */}
      {Object.keys(stats.personalities).length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-white/80 mb-3 uppercase tracking-wider">
            Personality Distribution
          </h4>
          <div className="space-y-2">
            {Object.entries(stats.personalities).map(([personality, count]) => (
              <div key={personality} className="flex items-center justify-between">
                <span className={`capitalize font-medium ${personalityColors[personality] || 'text-white'}`}>
                  {personality}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-dark-gray rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${personalityColors[personality]?.replace('text-', 'bg-') || 'bg-white'} transition-all duration-500`}
                      style={{ width: `${(count / stats.totalCharacters) * 100}%` }}
                    />
                  </div>
                  <span className="text-white/60 text-sm font-mono w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.mostActiveCharacter && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-white/60 uppercase tracking-wider mb-2">Most Active Character</p>
          <div className="flex items-center space-x-3">
            <Avatar character={stats.mostActiveCharacter} size="lg" />
            <div>
              <p className="font-bold text-pure-white">{stats.mostActiveCharacter.name}</p>
              <p className="text-xs text-white/60 capitalize">{stats.mostActiveCharacter.personality}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
