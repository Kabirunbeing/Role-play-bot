import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/create', label: 'Create' },
    { path: '/characters', label: 'Characters' },
    { path: '/search', label: 'Search' },
    { path: '/settings', label: 'Settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
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
                  <span className="text-xs xl:text-sm text-white/60 max-w-[120px] xl:max-w-none truncate">{user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="px-3 xl:px-4 py-2 rounded-lg text-xs xl:text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors whitespace-nowrap"
                  >
                    Sign Out
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
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="px-4 py-2 text-sm text-white/60">{user.email}</div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    Sign Out
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
