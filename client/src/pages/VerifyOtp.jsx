import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ArrowLeft, Landmark } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const VerifyOtp = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { verifyOtp, resendOtp } = useAuth()

  // Email passed via navigation state
  const email = location.state?.email || ''

  // 6 separate OTP input state — starts empty so user types the code
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])

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

  // Handle typing inside individual digit boxes
  const handleChange = (index, value) => {
    // Only accept numeric digits
    const cleanVal = value.replace(/[^0-9]/g, '')
    if (!cleanVal && value) return

    const newDigits = [...digits]
    newDigits[index] = cleanVal ? cleanVal[cleanVal.length - 1] : ''
    setDigits(newDigits)

    // Automatically advance to the next input box
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace navigation between boxes
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle pasting full 6-digit code
  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (!pasted) return

    const newDigits = [...digits]
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i]
    }
    setDigits(newDigits)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  // Submit OTP for account verification
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const fullCode = digits.join('')
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of the code.')
      return
    }

    setIsSubmitting(true)

    try {
      await verifyOtp(email, fullCode)
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
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
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
            <div className="brand-badge-pill">
              <Landmark size={15} color="#881421" />
              <span>Eventpatro</span>
            </div>
            <h2>
              Welcome to <span className="brand-red-text">Eventpatro</span>
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
            {/* 6-box OTP input */}
            <div className="otp-boxes-container" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="otp-box-input"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="btn-primary-action"
              disabled={isSubmitting || digits.join('').length !== 6}
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
