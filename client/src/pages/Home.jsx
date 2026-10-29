import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Calendar,
  ArrowRight,
  CalendarDays,
  Users,
  TrendingUp,
  Landmark,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchEvents } from '../utils/api'
import EventCard from '../components/EventCard'
import './Home.css'

const Home = () => {
  const navigate = useNavigate()
  const { isAuthenticated, openAuthModal } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch 3 upcoming published events for the showcase
  useEffect(() => {
    const loadUpcoming = async () => {
      try {
        const data = await fetchEvents({ limit: 3 })
        setUpcomingEvents(data.events || [])
      } catch (err) {
        console.error('Failed to load upcoming events:', err)
      } finally {
        setLoading(false)
      }
    }
    loadUpcoming()
  }, [])

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/events')
    }
  }

  // Handle "View All" click
  const handleViewAllClick = (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      openAuthModal('signup')
    } else {
      navigate('/events')
    }
  }

  return (
    <div className="home-page-root">
      {/* ── 1. Hero Section ─────────────────────────────────────────────────── */}
      <section className="hero-banner">
        {/* Background photo & overlay */}
        <div className="hero-bg-media" />
        <div className="hero-gradient-overlay" />

        <div className="hero-inner-container">
          <div className="hero-content">
            <span className="hero-eyebrow">CONNECT • EXPLORE • PARTICIPATE</span>

            <h1 className="hero-headline">
              Your Campus.
              <br />
              <span className="hero-highlight">Our Events.</span>
            </h1>

            <p className="hero-subtext">
              Discover workshops, seminars and programs that help you learn, grow and belong.
            </p>

            <div className="hero-cta-row">
              <Link to="/events" className="btn-hero-explore">
                <span>Explore Events</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Carousel indicator dots */}
            <div className="hero-dots">
              <span className="dot active" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        </div>

        {/* Curved Wave Mask at bottom */}
        <div className="hero-wave-divider">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0,48 C320,120 720,0 1440,64 L1440,120 L0,120 Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      {/* ── 2. Floating Search & Browse Bar ─────────────────────────────────── */}
      <div className="floating-search-wrapper">
        <form onSubmit={handleSearchSubmit} className="floating-search-card">
          <div className="search-input-group">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Explore upcoming events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-field"
            />
          </div>

          <button type="submit" className="btn-search-primary">
            Search
          </button>

          <span className="search-or-divider">or</span>

          <Link to="/events" className="btn-browse-events">
            <Calendar size={15} />
            <span>Browse Events</span>
          </Link>
        </form>
      </div>

      {/* ── 3. Upcoming Events Section ─────────────────────────────────────── */}
      <section className="events-showcase-section">
        <div className="section-container">
          {/* Section Header */}
          <div className="showcase-header">
            <div>
              <div className="section-accent-bar" />
              <h2 className="showcase-title">Upcoming Events</h2>
              <p className="showcase-subtitle">Be part of something exciting on campus.</p>
            </div>

            <button
              type="button"
              onClick={handleViewAllClick}
              className="btn-view-all-link"
            >
              <span>View All</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Event Cards Grid */}
          {loading ? (
            <div className="events-showcase-loading">
              <div className="loading-spinner" />
              <span>Loading campus events...</span>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="showcase-empty">
              <p>No upcoming events currently scheduled.</p>
              <Link to="/events" className="btn-browse-events" style={{ marginTop: '12px' }}>
                Explore All Events
              </Link>
            </div>
          ) : (
            <div className="upcoming-events-grid">
              {upcomingEvents.map((ev) => (
                <EventCard
                  key={ev._id}
                  event={ev}
                  requireAuth={!isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Why Eventpatro? Section ──────────────────────────────────────── */}
      <section id="about" className="why-section">
        <div className="section-container">
          <div className="why-header">
            <div className="section-accent-bar" />
            <span className="why-tag">Why Eventpatro?</span>
            <h2 className="why-title">More Events. More Opportunities.</h2>
            <p className="why-desc">
              From workshops to cultural fests, Eventpatro helps you stay connected with campus life.
            </p>
          </div>

          <div className="why-pillars-grid">
            <div className="pillar-item">
              <div className="pillar-icon-circle">
                <CalendarDays size={24} color="#881421" />
              </div>
              <h3 className="pillar-title">Discover Events</h3>
              <p className="pillar-text">
                Browse official workshops, seminars, competitions, and guest lectures in one place.
              </p>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-circle">
                <Users size={24} color="#881421" />
              </div>
              <h3 className="pillar-title">Track Your Participation</h3>
              <p className="pillar-text">
                Register with a single click and keep track of all attended campus programs.
              </p>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-circle">
                <TrendingUp size={24} color="#881421" />
              </div>
              <h3 className="pillar-title">Grow Your Skills</h3>
              <p className="pillar-text">
                Gain hands-on experience, earn certifications, and expand your student network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Ready to Get Started? CTA Banner ─────────────────────────────── */}
      <section className="cta-banner-section">
        <div className="section-container">
          <div className="cta-banner-card">
            <div className="cta-content">
              <h2 className="cta-title">Ready to get started?</h2>
              <p className="cta-desc">
                Sign up now and never miss out on campus events.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/events')
                } else {
                  openAuthModal('signup')
                }
              }}
              className="btn-cta-signup"
            >
              <span>{isAuthenticated ? 'Browse All Events' : 'Sign Up Free'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── 6. Footer ───────────────────────────────────────────────────────── */}
      <footer className="home-footer">
        <div className="section-container">
          <div className="footer-top-row">
            <div className="footer-brand">
              <div className="footer-logo">
                <Landmark size={22} color="#881421" />
                <span className="footer-brand-name">Eventpatro</span>
              </div>
              <p className="footer-tagline">
                A smarter way to experience campus events.
              </p>
            </div>

            <div className="footer-nav-links">
              <Link to="/">Home</Link>
              <Link to="/events">Events</Link>
              <a href="#about">About</a>
              <Link to="/events">Contact</Link>
            </div>

            <div className="footer-social-links">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              <a href="https://github.com/codebykashish/eventpatro" target="_blank" rel="noreferrer" aria-label="GitHub">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                  <path d="M9 18c-4.51 2-5-2-7-2"/>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect width="4" height="12" x="2" y="9"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
                  <polygon points="10 15 15 12 10 9 10 15"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-bottom-row">
            <span className="copyright-text">
              © {new Date().getFullYear()} Eventpatro. All rights reserved.
            </span>
            <span className="college-text">
              Sunway College, Kathmandu
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
