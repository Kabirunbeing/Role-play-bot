export default function Loader() {
  return (
    <div className="fixed inset-0 bg-pure-black/95 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="relative">
        {/* Outer rotating rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 border-4 border-neon-green/20 border-t-neon-green rounded-full animate-spin"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 border-4 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin-slow"></div>
        </div>
        
        {/* Center logo */}
        <div className="relative z-10 flex items-center justify-center w-24 h-24">
          <span className="text-4xl font-bold text-neon-green animate-pulse">RF</span>
        </div>
        
        {/* Glowing orbs */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-neon-green/10 rounded-full blur-2xl animate-pulse"></div>
        </div>
      </div>
      
      {/* Loading text */}
      <div className="absolute bottom-1/3 text-center">
        <p className="text-pure-white font-mono text-sm animate-pulse">Loading your experience...</p>
      </div>
    </div>
  )
}
