import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, AlertCircle, Check, X } from 'lucide-react'
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
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { signup } = useAuth()
  const navigate = useNavigate()

  // Handle form input changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // Calculate live password strength
  const passwordStats = useMemo(() => {
    const pwd = formData.password
    const checks = {
      length: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
    }

    const passedCount = Object.values(checks).filter(Boolean).length

    let label = 'Weak'
    let colorClass = 'strength-weak'
    if (passedCount >= 4) {
      label = 'Strong'
      colorClass = 'strength-strong'
    } else if (passedCount >= 3) {
      label = 'Medium'
      colorClass = 'strength-medium'
    }

    return { checks, passedCount, label, colorClass }
  }, [formData.password])

  // Handle registration submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side quick checks
    if (!formData.email.endsWith('@sunway.edu.np')) {
      setError('College email must end with @sunway.edu.np')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)

    try {
      await signup(formData)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card signup-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon-wrap">
            <UserPlus size={26} color="#881421" />
          </div>
          <h2>Create Student Account</h2>
          <p className="auth-subtitle">Register to discover, attend, and apply for campus events.</p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Signup form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* First & Last Name row */}
          <div className="form-row">
            <div className="form-group">
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

            <div className="form-group">
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
          <div className="form-group">
            <label htmlFor="studentId">Student ID</label>
            <input
              id="studentId"
              name="studentId"
              type="text"
              placeholder="e.g. STU-2024-001"
              value={formData.studentId}
              onChange={handleChange}
              required
            />
          </div>

          {/* College Email */}
          <div className="form-group">
            <label htmlFor="email">College Email (@sunway.edu.np)</label>
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

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password (minimum 8 characters)</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {/* Live password strength indicator */}
            {formData.password.length > 0 && (
              <div className="password-feedback">
                <div className="strength-bar-wrap">
                  <div className={`strength-bar ${passwordStats.colorClass}`}></div>
                </div>
                <span className="strength-label">Strength: {passwordStats.label}</span>

                {/* Password requirement checklist */}
                <div className="password-checklist">
                  <span className={passwordStats.checks.length ? 'check-pass' : 'check-fail'}>
                    {passwordStats.checks.length ? <Check size={12} /> : <X size={12} />} At least 8 chars
                  </span>
                  <span className={passwordStats.checks.hasUpper ? 'check-pass' : 'check-fail'}>
                    {passwordStats.checks.hasUpper ? <Check size={12} /> : <X size={12} />} Uppercase letter
                  </span>
                  <span className={passwordStats.checks.hasLower ? 'check-pass' : 'check-fail'}>
                    {passwordStats.checks.hasLower ? <Check size={12} /> : <X size={12} />} Lowercase letter
                  </span>
                  <span className={passwordStats.checks.hasNumber ? 'check-pass' : 'check-fail'}>
                    {passwordStats.checks.hasNumber ? <Check size={12} /> : <X size={12} />} Number (0-9)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Link to login */}
        <div className="auth-footer">
          <span>Already registered? </span>
          <Link to="/login" className="auth-link">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Signup
