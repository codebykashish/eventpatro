import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Check, Landmark } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
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
            <p className="form-subtitle">Create your student account</p>
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

            {/* Student ID and Email in one row for compact matching card height */}
            <div className="clean-row">
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

              <div className="clean-field">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@sunway.edu.np"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password and Confirm Password in one row */}
            <div className="clean-row">
              <div className="clean-field">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 chars"
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
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="clean-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-wrap">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
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
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Minimal password requirements checklist */}
            {formData.password.length > 0 && (
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
