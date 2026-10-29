import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, AlertCircle, Sparkles, Calendar, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const user = await login(email, password)
      // Redirect admins to /admin and students to /dashboard
      if (user.role === 'admin') {
        navigate('/admin')
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
    <div className="auth-page-bg">
      <div className="auth-overlay">
        <div className="auth-split-layout">
          {/* Left information pane */}
          <div className="auth-info-pane">
            <span className="auth-pill-badge">
              <Sparkles size={14} />
              <span>Sunway College Eventpatro</span>
            </span>

            <h1 className="auth-hero-headline">
              Welcome Back to Campus Life & Activities
            </h1>
            <p className="auth-hero-subtext">
              Log in to check your registered events, manage upcoming university workshops,
              and stay connected with college programs.
            </p>

            {/* Ambient info cards */}
            <div className="floating-cards-stack">
              <div className="ambient-card float-card-1">
                <div className="ambient-icon">
                  <Calendar size={20} color="#ffffff" />
                </div>
                <div>
                  <h4>Real-Time Schedule</h4>
                  <p>View upcoming dates, venues, and registration deadlines.</p>
                </div>
              </div>

              <div className="ambient-card float-card-2">
                <div className="ambient-icon">
                  <ShieldCheck size={20} color="#ffffff" />
                </div>
                <div>
                  <h4>Secure Single Login</h4>
                  <p>Instant access with your verified Sunway College credentials.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right form card pane */}
          <div className="auth-form-pane">
            <div className="auth-card">
              {/* Header */}
              <div className="auth-header">
                <div className="auth-icon-wrap">
                  <LogIn size={24} color="#881421" />
                </div>
                <h2>Sign In</h2>
                <p className="auth-subtitle">Enter your college account credentials.</p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="auth-error-banner">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* Login form */}
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">College Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@sunway.edu.np"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-auth-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              {/* Link to signup */}
              <div className="auth-footer">
                <span>New to Eventpatro? </span>
                <Link to="/signup" className="auth-link">
                  Create student account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
