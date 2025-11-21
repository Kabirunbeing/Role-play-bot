import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Check if we're in recovery mode (from email link)
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true)
      }
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error } = await updatePassword(newPassword)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pure-black py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-neon-green/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-pink/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and Title */}
        <div className="text-center">
          <Link to="/login" className="inline-block">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <span className="text-5xl font-bold text-neon-green animate-pulse">RF</span>
              <span className="text-2xl font-display font-bold text-pure-white">
                RolePlayForge
              </span>
            </div>
          </Link>
          <h2 className="text-4xl font-display font-bold text-pure-white mb-2">
            Reset Password
          </h2>
          <p className="text-white/60 font-mono text-sm">
            Enter your new password below
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-dark-gray border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          {!isRecoveryMode ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-neon-yellow/10 border border-neon-yellow/30 rounded-full mb-4">
                <svg className="w-8 h-8 text-neon-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-pure-white mb-2">Invalid Reset Link</h3>
              <p className="text-white/60 text-sm mb-6">
                This password reset link is invalid or has expired.
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Back to Login
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-neon-pink/10 border border-neon-pink/30 p-4 animate-shake">
                  <p className="text-sm text-neon-pink font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-neon-green/10 border border-neon-green/30 p-4">
                  <p className="text-sm text-neon-green font-medium">
                    ✓ Password updated successfully! Redirecting...
                  </p>
                </div>
              )}

              {/* New Password */}
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-white/80 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="new-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-off-black border border-white/10 rounded-lg text-pure-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-green focus:border-transparent transition-all"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-white/80 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-off-black border border-white/10 rounded-lg text-pure-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-green focus:border-transparent transition-all"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full btn-primary py-3 text-base font-semibold"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Updating...</span>
                  </div>
                ) : success ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Updated!</span>
                  </div>
                ) : (
                  'Update Password'
                )}
              </button>

              {/* Back to Login */}
              <div className="text-center">
                <Link to="/login" className="text-sm text-neon-cyan hover:text-neon-green transition-colors font-medium">
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
