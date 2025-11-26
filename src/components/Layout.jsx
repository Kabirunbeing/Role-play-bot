import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/create', label: 'Create' },
    { path: '/generate-anime', label: 'Anime Gen' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/badges', label: 'Badges' },
    { path: '/characters', label: 'Characters' },
  ];

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-off-black border-b border-white/10 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0" onClick={() => setMobileMenuOpen(false)}>
              <span className="text-2xl sm:text-3xl transition-transform group-hover:scale-110 font-bold text-neon-green">RF</span>
              <span className="text-base sm:text-lg md:text-xl font-display font-bold text-pure-white group-hover:text-neon-green transition-colors">
                RolePlayForge
              </span>
            </Link>

            {/* Desktop Navigation - Hidden on smaller screens */}
            <nav className="hidden lg:flex space-x-1 xl:space-x-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-2 xl:px-3 py-2 rounded-lg text-xs xl:text-sm font-medium uppercase tracking-wide transition-all duration-300 ${location.pathname === link.path
                    ? 'bg-neon-green text-pure-black font-bold shadow-neon-green'
                    : 'text-pure-white hover:bg-white/5 hover:text-neon-green'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Desktop User Menu */}
              {user && (
                <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-gray border border-white/10 rounded-lg">
                    <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                    <span className="text-xs xl:text-sm text-white/80 max-w-[120px] xl:max-w-none truncate font-medium">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoggingOut ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Logging out...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-green/50 transition-all duration-300 relative group"
                aria-label="Toggle menu"
              >
                <div className="w-5 h-4 sm:w-6 sm:h-5 flex flex-col justify-center items-center gap-1.5 sm:gap-2 relative">
                  <span
                    className={`w-full h-0.5 bg-gradient-to-r from-neon-green to-neon-cyan rounded-full transition-all duration-300 ease-in-out ${mobileMenuOpen
                      ? 'rotate-45 translate-y-1 sm:translate-y-1.25 shadow-[0_0_8px_rgba(0,255,65,0.6)]'
                      : 'group-hover:shadow-[0_0_4px_rgba(0,255,65,0.4)]'
                      }`}
                  />
                  <span
                    className={`w-full h-0.5 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full transition-all duration-300 ease-in-out ${mobileMenuOpen
                      ? '-rotate-45 -translate-y-1 sm:-translate-y-1.25 shadow-[0_0_8px_rgba(0,255,65,0.6)]'
                      : 'group-hover:shadow-[0_0_4px_rgba(0,255,65,0.4)]'
                      }`}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="lg:hidden pb-4 pt-2 space-y-2 fade-in">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium uppercase tracking-wide transition-all duration-300 ${location.pathname === link.path
                    ? 'bg-neon-green text-pure-black font-bold shadow-neon-green'
                    : 'text-pure-white hover:bg-white/5 hover:text-neon-green'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
              {/* Mobile User Menu */}
              {user && (
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="px-4 py-2 bg-dark-gray border border-white/10 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                    <span className="text-sm text-white/80 font-medium truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    disabled={isLoggingOut}
                    className="w-full px-4 py-3 rounded-lg text-sm font-medium bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoggingOut ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Logging out...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative bg-off-black border-t border-white/10 py-12 sm:py-16 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-neon-green/5 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-neon-purple/5 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 mb-10 sm:mb-12">
            {/* About Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">🎭</span>
                <h3 className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-cyan">
                  RolePlayForge
                </h3>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Create immersive AI characters and engage in dynamic roleplay conversations powered by advanced language models.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://github.com/Kabirunbeing/Role-play-bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-green/50 rounded-lg transition-all duration-300"
                  aria-label="GitHub"
                >
                  <svg className="w-5 h-5 text-white/60 group-hover:text-neon-green transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-neon-green to-neon-cyan rounded-full"></span>
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="group flex items-center gap-2 text-white/60 hover:text-neon-green transition-all duration-200">
                    <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="group flex items-center gap-2 text-white/60 hover:text-neon-green transition-all duration-200">
                    <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="group flex items-center gap-2 text-white/60 hover:text-neon-green transition-all duration-200">
                    <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="group flex items-center gap-2 text-white/60 hover:text-neon-green transition-all duration-200">
                    <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Tech Stack */}
            <div className="space-y-4">
              <h4 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-neon-cyan to-neon-purple rounded-full"></span>
                Powered By
              </h4>
              <div className="flex flex-wrap gap-2">
                <span className="group px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-neon-green/20 hover:border-neon-green/50 text-neon-green text-xs font-medium rounded-full transition-all duration-300 hover:shadow-[0_0_10px_rgba(0,255,65,0.2)]">
                  React
                </span>
                <span className="group px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-neon-cyan/20 hover:border-neon-cyan/50 text-neon-cyan text-xs font-medium rounded-full transition-all duration-300 hover:shadow-[0_0_10px_rgba(0,255,255,0.2)]">
                  Supabase
                </span>
                <span className="group px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-neon-pink/20 hover:border-neon-pink/50 text-neon-pink text-xs font-medium rounded-full transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,0,255,0.2)]">
                  Groq AI
                </span>
                <span className="group px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-neon-yellow/20 hover:border-neon-yellow/50 text-neon-yellow text-xs font-medium rounded-full transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,255,0,0.2)]">
                  Tailwind
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-xs sm:text-sm font-medium">
              © 2025 <span className="text-neon-green">RolePlayForge</span>. All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-[0_0_6px_rgba(0,255,65,0.6)]"></span>
                <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_6px_rgba(0,255,255,0.6)]" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-neon-purple rounded-full animate-pulse shadow-[0_0_6px_rgba(128,0,255,0.6)]" style={{ animationDelay: '0.4s' }}></span>
                <span className="w-2 h-2 bg-neon-pink rounded-full animate-pulse shadow-[0_0_6px_rgba(255,0,255,0.6)]" style={{ animationDelay: '0.6s' }}></span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
