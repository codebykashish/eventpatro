import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CampusIllustration from '../components/CampusIllustration'
import './Auth.css'

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { signup } = useAuth()
  const navigate = useNavigate()

  // Input change handler
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // Live password criteria check
  const passwordStats = useMemo(() => {
    const pwd = formData.password
    return {
      length: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
    }
  }, [formData.password])

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await signup(formData)
      if (res.requiresVerification) {
        navigate('/verify-otp', {
          state: {
            email: formData.email,
            devOtp: res.devOtp, // Convenient helper if SMTP is not set up
          },
        })
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleClick = () => {
    alert('Google Workspace registration (@sunway.edu.np) will be enabled with college single sign-on.')
  }

  return (
    <div className="auth-clean-page">
      <div className="auth-main-card">
        {/* Left branding panel in college burgundy */}
        <div className="auth-theme-panel">
          <div className="panel-brand-header">
            <div className="brand-logomark">
              <span className="brand-dot"></span>
              <span className="brand-text">Eventpatro</span>
            </div>
            <p className="brand-tagline">Discover. Participate. Grow.</p>
          </div>

          <div className="panel-illustration-wrap">
            <CampusIllustration />
          </div>
        </div>

        {/* Right form panel in pure clean white */}
        <div className="auth-form-panel">
          <div className="form-header">
            <h2>Create Account</h2>
            <p className="form-subtitle">Register for Sunway College events</p>
          </div>

          {/* Error notification */}
          {error && (
            <div className="auth-clean-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="clean-form">
            {/* First and Last Name in one row */}
            <div className="clean-row">
              <div className="clean-field">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Hari"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="clean-field">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Sharma"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Student ID */}
            <div className="clean-field">
              <label htmlFor="studentId">Student ID</label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                placeholder="STU-2024-001"
                value={formData.studentId}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email Address */}
            <div className="clean-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. yourname@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password input with show/hide toggle */}
            <div className="clean-field">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Minimal password requirements checklist */}
              {formData.password.length > 0 && (
                <div className="clean-checklist">
                  <span className={`check-rule ${passwordStats.length ? 'rule-met' : ''}`}>
                    <Check size={13} /> 8+ chars
                  </span>
                  <span className={`check-rule ${passwordStats.hasUpper ? 'rule-met' : ''}`}>
                    <Check size={13} /> Upper (A-Z)
                  </span>
                  <span className={`check-rule ${passwordStats.hasLower ? 'rule-met' : ''}`}>
                    <Check size={13} /> Lower (a-z)
                  </span>
                  <span className={`check-rule ${passwordStats.hasNumber ? 'rule-met' : ''}`}>
                    <Check size={13} /> Number
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password input with show/hide toggle */}
            <div className="clean-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrap">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button type="submit" className="btn-primary-action" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="auth-or-divider">
              <span>or</span>
            </div>

            {/* Continue with Google button */}
            <button type="button" className="btn-google-auth" onClick={handleGoogleClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Footer switch */}
          <div className="auth-switch-footer">
            <span>Already have an account? </span>
            <Link to="/login" className="switch-link">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
