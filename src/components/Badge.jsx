import { BADGE_TIER_COLORS } from '../lib/badges';

export default function Badge({ badge, size = 'md', showTooltip = true, locked = false }) {
    const sizes = {
        sm: 'w-8 h-8 text-base',
        md: 'w-12 h-12 text-2xl',
        lg: 'w-16 h-16 text-3xl',
        xl: 'w-20 h-20 text-4xl',
    };

    const tierStyle = BADGE_TIER_COLORS[badge.tier] || BADGE_TIER_COLORS.bronze;

    return (
        <div className="group relative inline-block">
            {/* Badge Icon */}
            <div
                className={`
          ${sizes[size]}
          rounded-full
          bg-gradient-to-br ${locked ? 'from-gray-800/40 to-gray-900/40' : tierStyle.bg}
          border-2 ${locked ? 'border-gray-700/40' : tierStyle.border}
          flex items-center justify-center
          transition-all duration-300
          ${locked ? 'grayscale opacity-40' : `hover:scale-110 hover:shadow-lg ${tierStyle.glow}`}
          ${locked ? '' : 'animate-pulse-glow'}
        `}
            >
                <span className={locked ? 'opacity-50' : ''}>{badge.icon}</span>
            </div>

            {/* Tier Badge (small indicator) */}
            {!locked && size !== 'sm' && (
                <div
                    className={`
            absolute -bottom-1 -right-1
            px-1.5 py-0.5 rounded-full
            text-[8px] font-bold uppercase
            bg-gradient-to-r ${tierStyle.bg}
            border ${tierStyle.border}
            ${tierStyle.text}
          `}
                >
                    {badge.tier}
                </div>
            )}

            {/* Locked Indicator */}
            {locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                    <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                </div>
            )}

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    <div className="bg-dark-gray border border-white/20 rounded-lg p-3 shadow-xl min-w-[200px] backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{badge.icon}</span>
                            <h4 className={`font-bold ${locked ? 'text-white/50' : tierStyle.text}`}>
                                {badge.name}
                            </h4>
                        </div>
                        <p className={`text-xs ${locked ? 'text-white/40' : 'text-white/70'} mb-1`}>
                            {badge.description}
                        </p>
                        <p className="text-xs text-white/40 font-mono">
                            {locked ? `🔒 ${badge.requirement}` : `✓ Unlocked`}
                        </p>
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-px">
                        <div className="w-2 h-2 bg-dark-gray border-r border-b border-white/20 rotate-45" />
                    </div>
                </div>
            )}
        </div>
    );
}

// Pulse glow animation for unlocked badges
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse-glow {
    0%, 100% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.2);
    }
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 3s ease-in-out infinite;
  }
`;
document.head.appendChild(style);
