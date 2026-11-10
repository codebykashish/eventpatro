import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const VerifyOtp = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { verifyOtp, resendOtp } = useAuth()

  // Email passed via navigation state
  const email = location.state?.email || ''

  // Single OTP code state
  const [code, setCode] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timer, setTimer] = useState(60)

  // Countdown timer for resend button
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  // Redirect if no email is provided
  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true })
    }
  }, [email, navigate])

  // Submit OTP for account verification
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const cleanCode = code.trim()
    if (cleanCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.')
      return
    }

    setIsSubmitting(true)

    try {
      await verifyOtp(email, cleanCode)
      setSuccess('Verified successfully! Redirecting to your dashboard...')
      setTimeout(() => {
        navigate('/dashboard')
      }, 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Request a fresh verification code
  const handleResend = async () => {
    if (timer > 0) return
    setError('')
    setSuccess('')

    try {
      await resendOtp(email)
      setSuccess('A new 6-digit code has been sent.')
      setTimer(60)
      setCode('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-clean-page">
      <div className="auth-main-card">
        {/* Clean form card without red image panel */}
        <div className="auth-form-panel">
          <div className="form-header">
            <div className="auth-brand-logo brand-cursive">SSRC Events</div>
            <h2>
              Welcome to the <span className="brand-red-text brand-cursive">SSRC Portal</span>
            </h2>
            <p className="form-subtitle">
              Enter the 6-digit code sent to <strong className="email-highlight">{email}</strong>
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

          <form onSubmit={handleSubmit} className="clean-form">
            <div className="otp-single-field-wrap">
              <label className="otp-input-label" htmlFor="verify-page-otp">
                Enter 6-digit code
              </label>
              <input
                id="verify-page-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
                  setCode(clean)
                }}
                placeholder="••••••"
                className="otp-single-code-input"
                autoFocus
                autoComplete="one-time-code"
              />
              <span className="otp-hint-text">
                Paste or enter the 6 digits sent to your college email
              </span>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="btn-primary-action"
              disabled={isSubmitting || code.trim().length !== 6}
            >
              {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
            </button>

            {/* Resend code footer */}
            <div className="otp-resend-row">
              <span>Didn't receive the code? </span>
              {timer > 0 ? (
                <span className="timer-text">Resend in {timer}s</span>
              ) : (
                <button type="button" className="btn-resend-link" onClick={handleResend}>
                  Resend Code
                </button>
              )}
            </div>
          </form>

          {/* Back link */}
          <div className="auth-switch-footer">
            <Link to="/signup" className="switch-link inline-flex-link">
              <ArrowLeft size={14} />
              <span>Change email or register</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyOtp
