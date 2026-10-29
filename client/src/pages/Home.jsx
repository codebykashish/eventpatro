import { Link } from 'react-router-dom'
import { CalendarDays, ShieldCheck, UsersRound, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Home.css'

const Home = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="home-container">
      {/* Hero section */}
      <section className="hero-section">
        <span className="hero-badge">Sunway College Event Management</span>
        <h1 className="hero-title">Discover, Register, and Connect with Campus Events</h1>
        <p className="hero-description">
          Eventpatro is the official event portal for Sunway College students. Browse workshops,
          hackathons, cultural programs, and student club activities in one central place.
        </p>

        <div className="hero-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-hero-primary">
              <span>Go to Dashboard ({user?.firstName})</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn-hero-primary">
                <span>Create Student Account</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-hero-secondary">
                <span>Student & Admin Login</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Feature pillars */}
      <section className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <CalendarDays size={24} color="#881421" />
          </div>
          <h3>Campus Programs</h3>
          <p>Explore upcoming guest lectures, departmental workshops, and college tournaments.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <ShieldCheck size={24} color="#881421" />
          </div>
          <h3>Verified College IDs</h3>
          <p>Access reserved exclusively for registered students and faculty with @sunway.edu.np emails.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <UsersRound size={24} color="#881421" />
          </div>
          <h3>Attendance & Badges</h3>
          <p>Track your participation history, earn event completion records, and leave feedback.</p>
        </div>
      </section>
    </div>
  )
}

export default Home
