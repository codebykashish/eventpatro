import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Eye, EyeOff, AlertCircle, CheckCircle2, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import '../pages/Auth.css'
import './AuthModal.css'

const AuthModal = () => {
  const navigate = useNavigate()
  const {
    authModal,
    closeAuthModal,
    switchAuthModalMode,
    login,
    signup,
    verifyOtp,
    resendOtp,
  } = useAuth()

  // Mode: 'login' | 'signup' | 'verify'
  const [mode, setMode] = useState(authModal.mode || 'login')

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Signup form state
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // OTP state
  const [verifyEmail, setVerifyEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(60)
  const otpInputRefs = useRef([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Clean reset function for all credentials and form states
  const resetFormFields = () => {
    setLoginEmail('')
    setLoginPassword('')
    setShowLoginPassword(false)
    setRememberMe(false)
    setSignupData({
      firstName: '',
      lastName: '',
      studentId: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
    setShowSignupPassword(false)
    setShowConfirmPassword(false)
    setVerifyEmail('')
    setOtpDigits(['', '', '', '', '', ''])
    setError('')
    setSuccess('')
  }

  const handleClose = () => {
    resetFormFields()
    closeAuthModal()
  }

  // When modal opens or closes, wipe clean all form fields so past credentials never persist
  useEffect(() => {
    if (authModal.isOpen) {
      setMode(authModal.mode || 'login')
      resetFormFields()
    } else {
      resetFormFields()
    }
  }, [authModal.isOpen, authModal.mode])

  // Close when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && authModal.isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [authModal.isOpen])

  // Resend countdown timer
  useEffect(() => {
    if (mode === 'verify' && resendTimer > 0) {
      const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [mode, resendTimer])

  if (!authModal.isOpen) return null

  // Password criteria check for signup
  const pwd = signupData.password
  const passwordStats = {
    length: pwd.length >= 8,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
  }

  // Handle Login Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const loggedInUser = await login(loginEmail, loginPassword)
      resetFormFields()
      closeAuthModal()
      navigate(loggedInUser.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      if (err.isUnverified) {
        setVerifyEmail(err.email || loginEmail)
        setMode('verify')
        setError('Please enter the 6-digit verification code sent to your email.')
      } else {
        setError(err.message || 'Login failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Signup Submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (
      !passwordStats.length ||
      !passwordStats.hasUpper ||
      !passwordStats.hasLower ||
      !passwordStats.hasNumber
    ) {
      setError('Please satisfy all password security requirements')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await signup(signupData)
      if (res.requiresVerification) {
        setVerifyEmail(signupData.email)
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

  // OTP input handlers
  const handleOtpChange = (index, value) => {
    const clean = value.replace(/[^0-9]/g, '')
    if (!clean && value) return
    const nextDigits = [...otpDigits]
    nextDigits[index] = clean ? clean[clean.length - 1] : ''
    setOtpDigits(nextDigits)
    if (clean && index < 5) {
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
    const nextDigits = pasted.split('').concat(Array(6 - pasted.length).fill(''))
    setOtpDigits(nextDigits)
    const nextIdx = Math.min(pasted.length, 5)
    otpInputRefs.current[nextIdx]?.focus()
  }

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
      const loggedInUser = await verifyOtp(verifyEmail, code)
      resetFormFields()
      closeAuthModal()
      navigate(loggedInUser.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSubmitting) return
    setError('')
    try {
      await resendOtp(verifyEmail)
      setSuccess('A new 6-digit verification code has been sent to your email.')
      setResendTimer(60)
    } catch (err) {
      setError(err.message || 'Failed to resend code')
    }
  }

  return (
    <div className="auth-overlay-backdrop" onClick={handleClose}>
      <div className="auth-overlay-card-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Floating close button */}
        <button
          type="button"
          className="auth-overlay-close-btn"
          onClick={handleClose}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Form card only — no red image panel, consistent size */}
        <div className="auth-main-card">
          <div className="auth-form-panel">
            {/* Header with App Branding and red Eventpatro */}
            <div className="form-header">
              <div className="auth-brand-logo brand-cursive">Eventpatro</div>
              <h2>
                Welcome to <span className="brand-red-text brand-cursive">Eventpatro</span>
              </h2>
              <p className="form-subtitle">
                {mode === 'login'
                  ? 'Login to your account'
                  : mode === 'signup'
                  ? 'Create your student account'
                  : 'Verify your email address'}
              </p>
            </div>

            {/* Error & Success banners */}
            {error && (
              <div className="auth-clean-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="auth-clean-success">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* ── 1. LOGIN MODE ── */}
            {mode === 'login' && (
              <>
                <form onSubmit={handleLoginSubmit} className="clean-form" autoComplete="off">
                  <div className="clean-field">
                    <label htmlFor="modal-login-email">Email Address</label>
                    <input
                      id="modal-login-email"
                      type="email"
                      autoComplete="off"
                      placeholder="name@sunway.edu.np"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="clean-field">
                    <label htmlFor="modal-login-pwd">Password</label>
                    <div className="password-input-wrap">
                      <input
                        id="modal-login-pwd"
                        type={showLoginPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="eye-toggle-btn"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        title={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-row-between">
                    <label className="checkbox-wrap">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Remember me</span>
                    </label>
                    <span
                      className="link-subtle"
                      onClick={() => alert('Please contact administrator to reset password.')}
                    >
                      Forgot password?
                    </span>
                  </div>

                  <button type="submit" className="btn-primary-action" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in...' : 'Login'}
                  </button>
                </form>

                <div className="auth-switch-footer">
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    className="modal-text-link"
                    onClick={() => {
                      resetFormFields()
                      setMode('signup')
                      switchAuthModalMode('signup')
                    }}
                  >
                    Register here
                  </button>
                </div>
              </>
            )}

            {/* ── 2. SIGNUP MODE ── */}
            {mode === 'signup' && (
              <>
                <form onSubmit={handleSignupSubmit} className="clean-form">
                  {/* First Name & Last Name in one row */}
                  <div className="clean-row">
                    <div className="clean-field">
                      <label htmlFor="modal-signup-fname">First Name</label>
                      <input
                        id="modal-signup-fname"
                        type="text"
                        placeholder="Hari"
                        value={signupData.firstName}
                        onChange={(e) =>
                          setSignupData({ ...signupData, firstName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="clean-field">
                      <label htmlFor="modal-signup-lname">Last Name</label>
                      <input
                        id="modal-signup-lname"
                        type="text"
                        placeholder="Sharma"
                        value={signupData.lastName}
                        onChange={(e) =>
                          setSignupData({ ...signupData, lastName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Student ID & Email in one row for compact matching card height */}
                  <div className="clean-row">
                    <div className="clean-field">
                      <label htmlFor="modal-signup-stuId">Student ID</label>
                      <input
                        id="modal-signup-stuId"
                        type="text"
                        placeholder="STU-2024-001"
                        value={signupData.studentId}
                        onChange={(e) =>
                          setSignupData({ ...signupData, studentId: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="clean-field">
                      <label htmlFor="modal-signup-email">Email Address</label>
                      <input
                        id="modal-signup-email"
                        type="email"
                        placeholder="name@sunway.edu.np"
                        value={signupData.email}
                        onChange={(e) =>
                          setSignupData({ ...signupData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Password & Confirm Password in one row */}
                  <div className="clean-row">
                    <div className="clean-field">
                      <label htmlFor="modal-signup-pwd">Password</label>
                      <div className="password-input-wrap">
                        <input
                          id="modal-signup-pwd"
                          type={showSignupPassword ? 'text' : 'password'}
                          placeholder="Min 8 chars"
                          value={signupData.password}
                          onChange={(e) =>
                            setSignupData({ ...signupData, password: e.target.value })
                          }
                          required
                        />
                        <button
                          type="button"
                          className="eye-toggle-btn"
                          onClick={() => setShowSignupPassword((prev) => !prev)}
                          title={showSignupPassword ? 'Hide password' : 'Show password'}
                        >
                          {showSignupPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>

                    <div className="clean-field">
                      <label htmlFor="modal-signup-cpwd">Confirm Password</label>
                      <div className="password-input-wrap">
                        <input
                          id="modal-signup-cpwd"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Repeat password"
                          value={signupData.confirmPassword}
                          onChange={(e) =>
                            setSignupData({ ...signupData, confirmPassword: e.target.value })
                          }
                          required
                        />
                        <button
                          type="button"
                          className="eye-toggle-btn"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password criteria chips */}
                  {signupData.password.length > 0 && (
                    <div className="clean-checklist">
                      <span className={`check-rule ${passwordStats.length ? 'rule-met' : ''}`}>
                        <Check size={13} /> 8+ chars
                      </span>
                      <span className={`check-rule ${passwordStats.hasUpper ? 'rule-met' : ''}`}>
                        <Check size={13} /> Upper
                      </span>
                      <span className={`check-rule ${passwordStats.hasLower ? 'rule-met' : ''}`}>
                        <Check size={13} /> Lower
                      </span>
                      <span className={`check-rule ${passwordStats.hasNumber ? 'rule-met' : ''}`}>
                        <Check size={13} /> Number
                      </span>
                    </div>
                  )}

                  <button type="submit" className="btn-primary-action" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>

                <div className="auth-switch-footer">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    className="modal-text-link"
                    onClick={() => {
                      resetFormFields()
                      setMode('login')
                      switchAuthModalMode('login')
                    }}
                  >
                    Log in
                  </button>
                </div>
              </>
            )}

            {/* ── 3. VERIFY OTP MODE ── */}
            {mode === 'verify' && (
              <>
                <form onSubmit={handleVerifySubmit} className="clean-form">
                  <div className="otp-boxes-container" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="otp-digit-box"
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>

                  <button type="submit" className="btn-primary-action" disabled={isSubmitting}>
                    {isSubmitting ? 'Verifying...' : 'Verify Email & Continue'}
                  </button>
                </form>

                <div className="otp-resend-area">
                  {resendTimer > 0 ? (
                    <span className="otp-timer-text">Resend code in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="btn-resend-clean"
                      disabled={isSubmitting}
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
