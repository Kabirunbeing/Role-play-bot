import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Loader from '../components/Loader'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pure-black py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-yellow/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and Title */}
        <div className="text-center">
          <Link to="/signup" className="inline-block">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <span className="text-5xl font-bold text-neon-green animate-pulse">RF</span>
              <span className="text-2xl font-display font-bold text-pure-white">
                RolePlayForge
              </span>
            </div>
          </Link>
          <h2 className="text-4xl font-display font-bold text-pure-white mb-2">
            Welcome Back
          </h2>
          <p className="text-white/60 font-mono text-sm">
            Sign in to continue your journey
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-dark-gray border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-neon-pink/10 border border-neon-pink/30 p-4 animate-shake">
                <p className="text-sm text-neon-pink font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-pure-white mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-pure-white uppercase tracking-wide">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-neon-cyan hover:text-neon-green transition-colors font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-pure-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-white/60 text-sm">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-neon-green hover:text-neon-cyan font-bold transition-colors uppercase tracking-wide"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
