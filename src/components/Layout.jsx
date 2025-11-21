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
    { path: '/characters', label: 'Characters' },
    { path: '/settings', label: 'Settings' },
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
                  className={`px-2 xl:px-3 py-2 rounded-lg text-xs xl:text-sm font-medium uppercase tracking-wide transition-all duration-300 ${
                    location.pathname === link.path
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
                className="lg:hidden p-2 rounded-lg text-pure-white hover:bg-white/5 hover:text-neon-green transition-all relative group"
                aria-label="Toggle menu"
              >
                <svg className={`w-6 h-6 transition-transform duration-300 ${mobileMenuOpen ? 'rotate-180' : 'group-hover:rotate-45'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  ) : (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </>
                  )}
                </svg>
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
                  className={`block px-4 py-3 rounded-lg text-sm font-medium uppercase tracking-wide transition-all duration-300 ${
                    location.pathname === link.path
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
      <footer className="bg-off-black border-t border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About Section */}
            <div>
              <h3 className="text-neon-green font-bold text-lg mb-3 flex items-center gap-2">
                <span className="text-2xl">🎭</span>
                RolePlayForge
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Create immersive AI characters and engage in dynamic roleplay conversations powered by advanced language models.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-white/60 hover:text-neon-cyan transition-colors">Features</a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-neon-cyan transition-colors">Privacy Policy</a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-neon-cyan transition-colors">Terms of Service</a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-neon-cyan transition-colors">Contact</a>
                </li>
              </ul>
            </div>

            {/* Tech Stack */}
            <div>
              <h4 className="text-white font-semibold mb-3">Powered By</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-dark-gray border border-neon-green/20 text-neon-green text-xs rounded-full">
                  React
                </span>
                <span className="px-3 py-1 bg-dark-gray border border-neon-cyan/20 text-neon-cyan text-xs rounded-full">
                  Supabase
                </span>
                <span className="px-3 py-1 bg-dark-gray border border-neon-pink/20 text-neon-pink text-xs rounded-full">
                  Groq AI
                </span>
                <span className="px-3 py-1 bg-dark-gray border border-neon-yellow/20 text-neon-yellow text-xs rounded-full">
                  Tailwind
                </span>
              </div>
              <div className="mt-4">
                <a href="https://github.com/Kabirunbeing/Role-play-bot" target="_blank" rel="noopener noreferrer" 
                   className="text-white/40 hover:text-neon-green transition-colors inline-block">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm font-mono">
              © 2025 RolePlayForge. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-neon-green text-xs font-bold">■</span>
              <span className="text-neon-cyan text-xs font-bold">■</span>
              <span className="text-neon-yellow text-xs font-bold">■</span>
              <span className="text-neon-pink text-xs font-bold">■</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
