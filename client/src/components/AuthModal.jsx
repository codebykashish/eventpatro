import { useState, useEffect, useRef } from 'react'
import {
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Landmark,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './AuthModal.css'

const AuthModal = () => {
  const { authModal, closeAuthModal, switchAuthModalMode, login, signup, verifyOtp, resendOtp } =
    useAuth()

  // Internal mode: 'login' | 'signup' | 'verify'
  const [mode, setMode] = useState(authModal.mode || 'login')

  // Synchronize with external context mode changes
  useEffect(() => {
    if (authModal.isOpen) {
      setMode(authModal.mode || 'login')
      setError('')
      setSuccess('')
    }
  }, [authModal.isOpen, authModal.mode])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && authModal.isOpen) {
        closeAuthModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [authModal.isOpen, closeAuthModal])

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [verifyEmail, setVerifyEmail] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendTimer, setResendTimer] = useState(60)

  const otpInputRefs = useRef([])

  // Resend timer countdown
  useEffect(() => {
    if (mode === 'verify' && resendTimer > 0) {
      const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [mode, resendTimer])

  if (!authModal.isOpen) return null

  // Password criteria for signup
  const password = signupForm.password
  const criteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(loginForm.email, loginForm.password)
      closeAuthModal()
    } catch (err) {
      if (err.isUnverified) {
        setVerifyEmail(err.email || loginForm.email)
        setMode('verify')
        setError('Please enter the 6-digit code sent to your email.')
      } else {
        setError(err.message || 'Login failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Signup Submit
  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!criteria.length || !criteria.upper || !criteria.number || !criteria.special) {
      setError('Please satisfy all password security requirements')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await signup(signupForm)
      if (res.requiresVerification) {
        setVerifyEmail(signupForm.email)
        setMode('verify')
        setResendTimer(60)
        setSuccess('Account created! Please check your email for the 6-digit code.')
      } else {
        closeAuthModal()
      }
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/[^0-9]/g, '')
    if (!cleanVal && value) return
    const newDigits = [...otpDigits]
    newDigits[index] = cleanVal ? cleanVal[cleanVal.length - 1] : ''
    setOtpDigits(newDigits)
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (!pasted) return
    const newDigits = pasted.split('').concat(Array(6 - pasted.length).fill(''))
    setOtpDigits(newDigits)
    const nextIdx = Math.min(pasted.length, 5)
    otpInputRefs.current[nextIdx]?.focus()
  }

  // Handle OTP Submit
  const handleVerifySubmit = async (e) => {
    e.preventDefault()
    const code = otpDigits.join('')
    if (code.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await verifyOtp(verifyEmail, code)
      closeAuthModal()
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0 || isSubmitting) return
    setError('')
    try {
      await resendOtp(verifyEmail)
      setSuccess('A new 6-digit code has been sent to your email.')
      setResendTimer(60)
    } catch (err) {
      setError(err.message || 'Failed to resend code')
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="auth-modal-close"
          onClick={closeAuthModal}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Left Side: Burgundy Brand Panel */}
        <div className="auth-modal-brand">
          <div className="modal-brand-badge">
            <Landmark size={22} color="#fff" />
            <span>Eventpatro</span>
          </div>
          <h3 className="modal-brand-title">Your Campus. Our Events.</h3>
          <p className="modal-brand-desc">
            Discover workshops, seminars, and hackathons that help you learn, grow, and belong.
          </p>

          <div className="modal-brand-perks">
            <div className="perk-row">
              <ShieldCheck size={16} />
              <span>Verified Sunway College Access</span>
            </div>
            <div className="perk-row">
              <Check size={16} />
              <span>1-Click Event Registrations</span>
            </div>
            <div className="perk-row">
              <Check size={16} />
              <span>Real-time Attendance & Alerts</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Auth Form */}
        <div className="auth-modal-content">
          {/* Mode Switch Tabs (hidden during OTP verify) */}
          {mode !== 'verify' && (
            <div className="auth-modal-tabs">
              <button
                type="button"
                className={`modal-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setMode('login')
                  switchAuthModalMode('login')
                  setError('')
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`modal-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signup')
                  switchAuthModalMode('signup')
                  setError('')
                }}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Feedback banners */}
          {error && (
            <div className="modal-banner banner-error">
              <AlertCircle size={15} /> <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="modal-banner banner-success">
              <CheckCircle2 size={15} /> <span>{success}</span>
            </div>
          )}

          {/* ── Mode 1: Login Form ── */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="modal-form">
              <div className="modal-field">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kashish@sunway.edu.np"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
              </div>

              <div className="modal-field">
                <label>Password</label>
                <div className="modal-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="modal-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="modal-footer-switch">
                <span>New to Eventpatro? </span>
                <button
                  type="button"
                  className="modal-link-btn"
                  onClick={() => {
                    setMode('signup')
                    switchAuthModalMode('signup')
                    setError('')
                  }}
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* ── Mode 2: Signup Form ── */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="modal-form">
              <div className="modal-row-2">
                <div className="modal-field">
                  <label>First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Kashish"
                    value={signupForm.firstName}
                    onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })}
                  />
                </div>
                <div className="modal-field">
                  <label>Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Dhami"
                    value={signupForm.lastName}
                    onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-row-2">
                <div className="modal-field">
                  <label>Student ID</label>
                  <input
                    type="text"
                    required
                    placeholder="SUN12345"
                    value={signupForm.studentId}
                    onChange={(e) => setSignupForm({ ...signupForm, studentId: e.target.value })}
                  />
                </div>
                <div className="modal-field">
                  <label>College / Personal Email</label>
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-row-2">
                <div className="modal-field">
                  <label>Password</label>
                  <div className="modal-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 8 characters"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="modal-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="modal-field">
                  <label>Confirm Password</label>
                  <div className="modal-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm password"
                      value={signupForm.confirmPassword}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, confirmPassword: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="modal-eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex="-1"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password criteria chips */}
              <div className="modal-criteria-wrap">
                <span className={`criteria-chip ${criteria.length ? 'met' : ''}`}>8+ Chars</span>
                <span className={`criteria-chip ${criteria.upper ? 'met' : ''}`}>Uppercase</span>
                <span className={`criteria-chip ${criteria.number ? 'met' : ''}`}>Number</span>
                <span className={`criteria-chip ${criteria.special ? 'met' : ''}`}>Special</span>
              </div>

              <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Complete Registration'}
              </button>

              <div className="modal-footer-switch">
                <span>Already have an account? </span>
                <button
                  type="button"
                  className="modal-link-btn"
                  onClick={() => {
                    setMode('login')
                    switchAuthModalMode('login')
                    setError('')
                  }}
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* ── Mode 3: OTP Verification Form ── */}
          {mode === 'verify' && (
            <div className="modal-otp-wrap">
              <h4 className="modal-otp-title">Verify Email Address</h4>
              <p className="modal-otp-desc">
                We sent a 6-digit code to <strong>{verifyEmail}</strong>
              </p>

              <form onSubmit={handleVerifySubmit} className="modal-form">
                <div className="modal-otp-boxes" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e.target)}
                      className="modal-otp-box"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                </button>

                <div className="modal-resend-row">
                  {resendTimer > 0 ? (
                    <span className="resend-countdown">Resend code in {resendTimer}s</span>
                  ) : (
                    <button type="button" onClick={handleResend} className="btn-resend-link">
                      Resend Verification Code
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
