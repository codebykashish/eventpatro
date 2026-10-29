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
