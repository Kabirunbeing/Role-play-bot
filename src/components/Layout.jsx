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
                className="lg:hidden p-2 rounded-lg text-pure-white hover:bg-white/5 hover:text-neon-green transition-all"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
      <footer className="bg-off-black border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/60 text-sm font-mono">RolePlayForge • Frontend MVP • Mock Responses</p>
          <div className="mt-3 flex justify-center space-x-4">
            <span className="text-neon-green text-xs font-bold">■</span>
            <span className="text-neon-cyan text-xs font-bold">■</span>
            <span className="text-neon-yellow text-xs font-bold">■</span>
            <span className="text-neon-pink text-xs font-bold">■</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
