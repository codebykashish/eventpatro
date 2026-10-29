import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import {
  Search,
  Calendar,
  ArrowRight,
  Sparkles,
  MapPin,
  Mail,
  Clock,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchEvents } from '../utils/api'
import EventCard from '../components/EventCard'
import './Home.css'

const Home = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, openAuthModal, signup } = useAuth()

  // 1. Authenticated visitors are automatically redirected to their dashboard
  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Quick Sign Up Form State for the embedded form section
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signupSubmitting, setSignupSubmitting] = useState(false)

  // Fetch exactly 3 upcoming events for the showcase
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

  // Smooth scroll helper
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Handle Search Submission — scrolls down smoothly to the upcoming events
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    scrollToSection('upcoming-events')
  }

  // Handle Quick Sign Up Submit
  const handleQuickSignupSubmit = async (e) => {
    e.preventDefault()
    setSignupError('')

    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupError('Passwords do not match')
      return
    }

    if (signupForm.password.length < 8) {
      setSignupError('Password must be at least 8 characters long')
      return
    }

    setSignupSubmitting(true)
    try {
      const res = await signup(signupForm)
      if (res.requiresVerification) {
        navigate('/verify-otp', { state: { email: signupForm.email } })
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setSignupError(err.message || 'Signup failed')
    } finally {
      setSignupSubmitting(false)
    }
  }

  return (
    <div className="home-page-root">
      {/* ── 1. Full-Screen Desktop Hero Section with Floating Bar ──────────── */}
      <section id="home" className="hero-banner-fullscreen">
        <div className="hero-bg-media" />
        <div className="hero-gradient-overlay" />

        <div className="hero-content-center">
          <div className="hero-badge-pill">
            <Sparkles size={14} color="#881421" />
            <span>SUNWAY COLLEGE CAMPUS HUB</span>
          </div>

          <h1 className="hero-headline">
            Where Campus Life Comes{' '}
            <span className="hero-cursive brand-cursive">Together.</span>
          </h1>

          <p className="hero-subtext">
            Never miss a hackathon, workshop, or student fest again. Every official
            Sunway College event organized in one verified space.
          </p>

          {/* Integrated Floating Search Bar inside Hero */}
          <form onSubmit={handleSearchSubmit} className="hero-search-card">
            <div className="hero-search-input-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search workshops, seminars, competitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hero-search-input"
              />
            </div>

            <button type="submit" className="btn-hero-search">
              Search
            </button>

            <span className="hero-search-or">or</span>

            <button
              type="button"
              onClick={() => scrollToSection('upcoming-events')}
              className="btn-hero-browse"
            >
              <Calendar size={15} />
              <span>Explore Events</span>
            </button>
          </form>

          {/* Quick Stats Banner inside Hero */}
          <div className="hero-quick-stats">
            <div className="quick-stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Verified Events</span>
            </div>
            <div className="stat-divider" />
            <div className="quick-stat-item">
              <span className="stat-number">1-Click</span>
              <span className="stat-label">Student RSVP</span>
            </div>
            <div className="stat-divider" />
            <div className="quick-stat-item">
              <span className="stat-number">Real-Time</span>
              <span className="stat-label">Deadline Alerts</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Upcoming Events Section (Exactly 3 Events) ─────────────────── */}
      <section id="upcoming-events" className="events-showcase-section">
        <div className="section-container">
          <div className="showcase-header-centered">
            <span className="section-eyebrow">CURATED HAPPENINGS</span>
            <h2 className="showcase-title">
              Upcoming <span className="brand-cursive brand-red-text">Events</span>
            </h2>
            <p className="showcase-subtitle">
              Mark your calendar and secure your spot before registration closes.
            </p>
          </div>

          {loading ? (
            <div className="events-showcase-loading">
              <div className="loading-spinner" />
              <span>Loading campus events...</span>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="showcase-empty">
              <p>No upcoming events currently scheduled.</p>
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="btn-explore-more"
                style={{ marginTop: '12px' }}
              >
                Sign Up to Stay Updated
              </button>
            </div>
          ) : (
            <>
              {/* Exactly 3 event cards in row */}
              <div className="upcoming-events-grid">
                {upcomingEvents.slice(0, 3).map((ev) => (
                  <EventCard
                    key={ev._id}
                    event={ev}
                    requireAuth={!isAuthenticated}
                  />
                ))}
              </div>

              {/* Centered Explore More Events Button below the 3 cards */}
              <div className="explore-more-wrap">
                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                  className="btn-explore-more"
                >
                  <span>Explore More Events</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── 3. The Campus Problem & Why Eventpatro (Zig-Zag Layout) ────────── */}
      <section id="story" className="story-zigzag-section">
        <div className="section-container">
          <div className="story-section-header">
            <span className="section-eyebrow">THE CAMPUS CHALLENGE</span>
            <h2 className="story-main-heading">
              Never let valuable opportunities{' '}
              <span className="brand-cursive brand-red-text">slip away.</span>
            </h2>
            <p className="story-sub-heading">
              Between scattered WhatsApp groups, cluttered bulletin boards, and missed deadlines,
              university events were getting lost. We built Eventpatro to fix that.
            </p>
          </div>

          <div className="zigzag-container">
            {/* Block 1: Image Left, Story Right */}
            <div className="zigzag-row">
              <div className="zigzag-media">
                <img
                  src="/scattered_events.jpg"
                  alt="Students reading bulletin boards and checking phones in campus hallway"
                  className="zigzag-img"
                  loading="lazy"
                />
              </div>
              <div className="zigzag-content">
                <span className="zigzag-tag">THE PROBLEM</span>
                <h3 className="zigzag-title">
                  Announcements Were Scattered Across Dozens of Places
                </h3>
                <p className="zigzag-text">
                  Group chats get muted. Paper notices get covered over. Links shared in casual
                  conversations disappear. Students routinely missed life-changing hackathons,
                  industry guest lectures, and cultural fests simply because they heard about them
                  too late.
                </p>
                <div className="zigzag-highlight-pill">
                  <span className="highlight-dot red" />
                  <span>Buried messages & closed registration forms</span>
                </div>
              </div>
            </div>

            {/* Block 2: Story Left, Image Right */}
            <div className="zigzag-row reverse">
              <div className="zigzag-media">
                <img
                  src="/connected_events.jpg"
                  alt="Students collaborating together at a modern wooden conference table"
                  className="zigzag-img"
                  loading="lazy"
                />
              </div>
              <div className="zigzag-content">
                <span className="zigzag-tag">THE SOLUTION</span>
                <h3 className="zigzag-title">
                  One Unified Calendar for Every Club & Department
                </h3>
                <p className="zigzag-text">
                  Eventpatro consolidates student clubs, academic societies, and faculty organizers
                  into a single official platform. When an event is scheduled, every Sunway student
                  sees it immediately with verified details, venue information, and capacity limits.
                </p>
                <div className="zigzag-highlight-pill">
                  <span className="highlight-dot green" />
                  <span>100% verified Sunway College events in real-time</span>
                </div>
              </div>
            </div>

            {/* Block 3: Image Left, Story Right */}
            <div className="zigzag-row">
              <div className="zigzag-media">
                <img
                  src="/signup_banner.jpg"
                  alt="Sunway students celebrating together after a campus event"
                  className="zigzag-img"
                  loading="lazy"
                />
              </div>
              <div className="zigzag-content">
                <span className="zigzag-tag">THE EXPERIENCE</span>
                <h3 className="zigzag-title">
                  Live Countdown Deadlines & Instant Verification
                </h3>
                <p className="zigzag-text">
                  See how many days remain before registration closes. Reserve your seat in one
                  click using your student ID, track your upcoming schedule, and build an active
                  participation portfolio throughout your college years.
                </p>
                <div className="zigzag-highlight-pill">
                  <span className="highlight-dot red" />
                  <span>No paperwork, no confusion — just show up and learn</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. How It Works (Triptych Shared Panorama Across 3 Cards) ──────── */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-container">
          <div className="how-header-centered">
            <span className="section-eyebrow">SIMPLE & SEAMLESS</span>
            <h2 className="how-title">
              Few steps to <span className="brand-cursive brand-red-text">begin</span>
            </h2>
            <p className="how-subtitle">
              Join the Sunway student community in three effortless steps.
            </p>
          </div>

          <div className="how-steps-grid">
            {/* Step 1: Left 1/3 of continuous panoramic artwork */}
            <div className="how-step-card step-one">
              <div className="how-step-media">
                <div className="how-step-img-slice slice-one" />
                <span className="step-number-badge">01</span>
                <span className="step-slice-label">Step 1 • Profile Setup</span>
              </div>
              <div className="how-step-body">
                <h3 className="step-title">Create Your Student Account</h3>
                <p className="step-description">
                  Sign up with your Sunway College email. Quick 6-digit OTP verification activates your official student profile in under 60 seconds.
                </p>
                <div className="how-step-action-pill">
                  <span>Fast 60-Sec Activation</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>

            {/* Step 2: Middle 1/3 of continuous panoramic artwork */}
            <div className="how-step-card step-two">
              <div className="how-step-media">
                <div className="how-step-img-slice slice-two" />
                <span className="step-number-badge">02</span>
                <span className="step-slice-label">Step 2 • Registration</span>
              </div>
              <div className="how-step-body">
                <h3 className="step-title">Discover & Reserve Seats</h3>
                <p className="step-description">
                  Explore workshops, hackathons, guest lectures, and cultural fests. Check live countdowns and claim your spot before deadlines pass.
                </p>
                <div className="how-step-action-pill">
                  <span>One-Click Registration</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>

            {/* Step 3: Right 1/3 of continuous panoramic artwork */}
            <div className="how-step-card step-three">
              <div className="how-step-media">
                <div className="how-step-img-slice slice-three" />
                <span className="step-number-badge">03</span>
                <span className="step-slice-label">Step 3 • Recognition</span>
              </div>
              <div className="how-step-body">
                <h3 className="step-title">Attend & Build Portfolio</h3>
                <p className="step-description">
                  Check in at campus venues, collaborate with mentors, and earn verified participation records displayed on your personal dashboard.
                </p>
                <div className="how-step-action-pill">
                  <span>Verified Attendance</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Full-Screen Embedded Sign-Up Section with Background Image ─── */}
      <section className="fullscreen-signup-section">
        {/* Fullscreen background photo */}
        <img
          src="/signup_fullscreen_bg.jpg"
          alt="Sunway College event symposium amphitheater"
          className="fullscreen-signup-bg"
          loading="lazy"
        />
        {/* Cinematic dark crimson & obsidian overlay */}
        <div className="fullscreen-signup-overlay" />

        <div className="fullscreen-signup-container">
          <div className="fullscreen-signup-grid">
            {/* Left Perks & Campus Community */}
            <div className="fullscreen-perks-pane">
              <span className="fullscreen-perks-badge">
                <Sparkles size={13} className="badge-sparkle-icon" />
                <span>EXCLUSIVE FOR SUNWAY STUDENTS</span>
              </span>
              <h2 className="fullscreen-perks-heading">
                Step into the center of campus life.
              </h2>
              <p className="fullscreen-perks-sub">
                Create your student profile today to unlock priority workshop seats, automated countdown reminders, and your verified extracurricular portfolio.
              </p>

              <div className="fullscreen-perks-cards-list">
                <div className="fullscreen-perk-item">
                  <div className="fullscreen-perk-icon-wrap">
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 className="perk-title">100% Free Campus Access</h4>
                    <p className="perk-desc">
                      One-click registration for all student clubs, tech workshops, hackathons, and guest seminars.
                    </p>
                  </div>
                </div>

                <div className="fullscreen-perk-item">
                  <div className="fullscreen-perk-icon-wrap">
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 className="perk-title">Verified Attendance Records</h4>
                    <p className="perk-desc">
                      Build an authentic extracurricular credentials transcript directly on your student dashboard.
                    </p>
                  </div>
                </div>

                <div className="fullscreen-perk-item">
                  <div className="fullscreen-perk-icon-wrap">
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 className="perk-title">Live Countdown Tracking</h4>
                    <p className="perk-desc">
                      Instant seat vacancy indicators and deadline countdowns so you never miss out again.
                    </p>
                  </div>
                </div>
              </div>

              <div className="fullscreen-stats-row">
                <div className="fullscreen-stat-box">
                  <span className="stat-number">1,200+</span>
                  <span className="stat-label">Sunway Students</span>
                </div>
                <div className="fullscreen-stat-divider" />
                <div className="fullscreen-stat-box">
                  <span className="stat-number">50+</span>
                  <span className="stat-label">Events / Year</span>
                </div>
                <div className="fullscreen-stat-divider" />
                <div className="fullscreen-stat-box">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Free Access</span>
                </div>
              </div>
            </div>

            {/* Right Floating Glassmorphic Form Card */}
            <div className="fullscreen-form-card">
              <div className="quick-form-header">
                <span className="form-eyebrow">FAST ENROLLMENT</span>
                <h3 className="quick-form-title">
                  Get Started with <span className="brand-cursive brand-red-text">Eventpatro</span>
                </h3>
                <p className="quick-form-sub">
                  Create your student account in 60 seconds.
                </p>
              </div>

              {signupError && (
                <div className="quick-form-error">
                  <AlertCircle size={15} />
                  <span>{signupError}</span>
                </div>
              )}

              <form onSubmit={handleQuickSignupSubmit} className="quick-signup-form">
                <div className="quick-row">
                  <div className="quick-field">
                    <label htmlFor="home-fname">First Name</label>
                    <input
                      id="home-fname"
                      type="text"
                      placeholder="Hari"
                      value={signupForm.firstName}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="quick-field">
                    <label htmlFor="home-lname">Last Name</label>
                    <input
                      id="home-lname"
                      type="text"
                      placeholder="Sharma"
                      value={signupForm.lastName}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="quick-row">
                  <div className="quick-field">
                    <label htmlFor="home-stuid">Student ID</label>
                    <input
                      id="home-stuid"
                      type="text"
                      placeholder="STU-2024-001"
                      value={signupForm.studentId}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, studentId: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="quick-field">
                    <label htmlFor="home-email">College Email</label>
                    <input
                      id="home-email"
                      type="email"
                      placeholder="name@sunway.edu.np"
                      value={signupForm.email}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="quick-row">
                  <div className="quick-field">
                    <label htmlFor="home-pwd">Password</label>
                    <div className="quick-pwd-wrap">
                      <input
                        id="home-pwd"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 chars"
                        value={signupForm.password}
                        onChange={(e) =>
                          setSignupForm({ ...signupForm, password: e.target.value })
                        }
                        required
                      />
                      <button
                        type="button"
                        className="quick-eye-btn"
                        onClick={() => setShowPassword((p) => !p)}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="quick-field">
                    <label htmlFor="home-cpwd">Confirm Password</label>
                    <input
                      id="home-cpwd"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repeat password"
                      value={signupForm.confirmPassword}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, confirmPassword: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-quick-submit"
                  disabled={signupSubmitting}
                >
                  {signupSubmitting ? 'Creating account...' : 'Create Student Account'}
                </button>
              </form>

              <div className="quick-form-footer">
                <span>Already have an account? </span>
                <button
                  type="button"
                  className="quick-login-link"
                  onClick={() => openAuthModal('login')}
                >
                  Sign in here
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Contact & Footer Section ───────────────────────────────────── */}
      <footer id="contact" className="home-footer">
        <div className="section-container">
          <div className="footer-contact-grid">
            {/* Brand & Mission */}
            <div className="footer-col-brand">
              <span className="footer-brand-title brand-cursive">Eventpatro</span>
              <p className="footer-brand-desc">
                The centralized university event discovery and registration platform for Sunway College Kathmandu.
              </p>
              <div className="footer-social-icons">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                    <rect width="4" height="12" x="2" y="9"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                </a>
                <a href="https://github.com/codebykashish/eventpatro" target="_blank" rel="noreferrer" aria-label="GitHub">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                    <path d="M9 18c-4.51 2-5-2-7-2"/>
                  </svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
                    <polygon points="10 15 15 12 10 9 10 15"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-col-links">
              <h4 className="footer-col-title">Navigation</h4>
              <ul>
                <li>
                  <button type="button" onClick={() => scrollToSection('home')} className="footer-link-btn">
                    Home
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('upcoming-events')} className="footer-link-btn">
                    Upcoming Events
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('story')} className="footer-link-btn">
                    Our Story
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('how-it-works')} className="footer-link-btn">
                    How It Works
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('contact')} className="footer-link-btn">
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Details */}
            <div className="footer-col-contact">
              <h4 className="footer-col-title">Contact & Location</h4>
              <ul className="contact-list">
                <li>
                  <MapPin size={16} className="contact-icon" />
                  <span>Maitidevi, Kathmandu, Nepal</span>
                </li>
                <li>
                  <Mail size={16} className="contact-icon" />
                  <a href="mailto:events@sunway.edu.np">events@sunway.edu.np</a>
                </li>
                <li>
                  <Clock size={16} className="contact-icon" />
                  <span>Sun – Fri: 8:00 AM – 5:00 PM</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Row */}
          <div className="footer-bottom-bar">
            <span className="copyright-text">
              © {new Date().getFullYear()} Eventpatro. All rights reserved.
            </span>
            <span className="college-text">
              Sunway College Kathmandu
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
