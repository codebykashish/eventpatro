import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, AlertCircle, Check, X, Calendar, ShieldCheck, Sparkles } from 'lucide-react'
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

  // Calculate live password strength and individual requirement states
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

    // Validate Sunway email domain
    if (!formData.email.endsWith('@sunway.edu.np')) {
      setError('College email must end with @sunway.edu.np')
      return
    }

    // Verify passwords match
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
    <div className="auth-page-bg">
      <div className="auth-overlay">
        <div className="auth-split-layout">
          {/* Left information pane with ambient animated cards */}
          <div className="auth-info-pane">
            <span className="auth-pill-badge">
              <Sparkles size={14} />
              <span>Sunway College Eventpatro</span>
            </span>

            <h1 className="auth-hero-headline">
              Your Gateway to Every Campus Event & Activity
            </h1>
            <p className="auth-hero-subtext">
              Create your student account to register for upcoming hackathons, guest lectures,
              and club competitions across departments.
            </p>

            {/* Ambient floating info cards */}
            <div className="floating-cards-stack">
              <div className="ambient-card float-card-1">
                <div className="ambient-icon">
                  <Calendar size={20} color="#ffffff" />
                </div>
                <div>
                  <h4>Departmental Events & Workshops</h4>
                  <p>Discover real-time schedules and register in one click.</p>
                </div>
              </div>

              <div className="ambient-card float-card-2">
                <div className="ambient-icon">
                  <ShieldCheck size={20} color="#ffffff" />
                </div>
                <div>
                  <h4>Verified Student Community</h4>
                  <p>Exclusive portal for students with @sunway.edu.np accounts.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right form pane with glassmorphism card */}
          <div className="auth-form-pane">
            <div className="auth-card signup-card">
              {/* Header */}
              <div className="auth-header">
                <div className="auth-icon-wrap">
                  <UserPlus size={24} color="#881421" />
                </div>
                <h2>Student Registration</h2>
                <p className="auth-subtitle">Enter your college details to get started.</p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="auth-error-banner">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* Signup form */}
              <form onSubmit={handleSubmit} className="auth-form">
                {/* First & Last Name */}
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

                {/* Password with live glowing checklist */}
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />

                  {/* Password strength bar */}
                  {formData.password.length > 0 && (
                    <div className="password-feedback">
                      <div className="strength-bar-wrap">
                        <div className={`strength-bar ${passwordStats.colorClass}`}></div>
                      </div>
                      <span className="strength-label">Strength: {passwordStats.label}</span>

                      {/* Glowing criteria badges */}
                      <div className="password-checklist">
                        <div className={`check-badge ${passwordStats.checks.length ? 'badge-satisfied' : 'badge-pending'}`}>
                          {passwordStats.checks.length ? <Check size={14} className="check-icon" /> : <X size={14} />}
                          <span>8+ Characters</span>
                        </div>
                        <div className={`check-badge ${passwordStats.checks.hasUpper ? 'badge-satisfied' : 'badge-pending'}`}>
                          {passwordStats.checks.hasUpper ? <Check size={14} className="check-icon" /> : <X size={14} />}
                          <span>Uppercase (A-Z)</span>
                        </div>
                        <div className={`check-badge ${passwordStats.checks.hasLower ? 'badge-satisfied' : 'badge-pending'}`}>
                          {passwordStats.checks.hasLower ? <Check size={14} className="check-icon" /> : <X size={14} />}
                          <span>Lowercase (a-z)</span>
                        </div>
                        <div className={`check-badge ${passwordStats.checks.hasNumber ? 'badge-satisfied' : 'badge-pending'}`}>
                          {passwordStats.checks.hasNumber ? <Check size={14} className="check-icon" /> : <X size={14} />}
                          <span>Number (0-9)</span>
                        </div>
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
                    placeholder="Repeat password"
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
        </div>
      </div>
    </div>
  )
}

export default Signup
