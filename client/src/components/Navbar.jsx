import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, User as UserIcon, Shield, AlertTriangle, Search, PlusCircle, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const isHomePage = location.pathname === '/'
  const isPortalRoute = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/events') || location.pathname.startsWith('/admin')

  // Portal views have their own dedicated sidebar and topbar — never render old navbar
  if (isPortalRoute || (isAuthenticated && !isHomePage)) {
    return null
  }

  // Track window scroll to smoothly elevate floating sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  // Smoothly scroll to a section on the landing page with animation
  const scrollToSection = (e, sectionId) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    if (!isHomePage) {
      navigate('/')
      setTimeout(() => {
        const el = document.getElementById(sectionId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 120)
      return
    }

    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Execute logout after confirmation
  const confirmLogout = () => {
    setShowLogoutConfirm(false)
    logout()
    navigate('/')
  }

  return (
    <>
      <nav
        className={`navbar ${isHomePage ? 'navbar-hero-overlay' : ''} ${
          isScrolled ? 'navbar-scrolled' : ''
        }`}
      >
        <div className="navbar-container">
          {/* Brand identity with logo on left */}
          <Link to="/" onClick={(e) => scrollToSection(e, 'home')} className="nav-brand">
            <img src="/logo.png" alt="SSRC Events Logo" className="nav-logo" />
            <span className="nav-title brand-cursive">SSRC Events</span>
          </Link>

          {/* Center Navigation Links with smooth scroll animations — desktop only */}
          <div className="nav-center-links">
            {isHomePage ? (
              <>
                <button type="button" onClick={(e) => scrollToSection(e, 'home')} className="nav-center-link nav-btn-link">Home</button>
                <button type="button" onClick={(e) => scrollToSection(e, 'upcoming-events')} className="nav-center-link nav-btn-link">Events</button>
                <button type="button" onClick={(e) => scrollToSection(e, 'story')} className="nav-center-link nav-btn-link">Our Story</button>
                <button type="button" onClick={(e) => scrollToSection(e, 'how-it-works')} className="nav-center-link nav-btn-link">How It Works</button>
                <button type="button" onClick={(e) => scrollToSection(e, 'contact')} className="nav-center-link nav-btn-link">Contact</button>
              </>
            ) : (
              <Link to={isAdmin ? "/admin" : "/dashboard"} className="nav-center-link">Dashboard</Link>
            )}
          </div>

          {/* Right Actions — desktop */}
          <div className="nav-actions nav-actions-desktop">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <>
                    <Link to="/admin/events/new" className="nav-link">
                      <PlusCircle size={16} />
                      <span>Create Event</span>
                    </Link>
                    <Link to="/admin" className="nav-link admin-link">
                      <Shield size={16} />
                      <span>Admin Panel</span>
                    </Link>
                  </>
                )}
                <Link to="/dashboard" className="nav-link">
                  <UserIcon size={16} />
                  <span>Dashboard</span>
                </Link>
                <div className="user-badge">
                  <span className="user-name">{user?.firstName}</span>
                  <span className={`role-tag role-${user?.role}`}>{user?.role}</span>
                </div>
                <button type="button" onClick={() => setShowLogoutConfirm(true)} className="btn-logout" title="Log Out">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => openAuthModal('login')} className="nav-auth-link">Login</button>
                <button type="button" onClick={() => openAuthModal('signup')} className="btn-signup">Sign Up</button>
              </>
            )}
          </div>

          {/* Hamburger button — mobile only */}
          <button
            type="button"
            className="nav-hamburger"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'mobile-nav-open' : ''}`}>
        {/* Drawer header */}
        <div className="mobile-nav-header">
          <div className="mobile-nav-brand">
            <img src="/logo.png" alt="SSRC Events" className="mobile-nav-logo" />
            <span className="brand-cursive" style={{ fontSize: '20px', color: '#881421', fontWeight: 700 }}>SSRC Events</span>
          </div>
          <button type="button" className="mobile-nav-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {/* Navigation links */}
        {isHomePage && (
          <div className="mobile-nav-links">
            <button type="button" onClick={(e) => scrollToSection(e, 'home')} className="mobile-nav-link">Home</button>
            <button type="button" onClick={(e) => scrollToSection(e, 'upcoming-events')} className="mobile-nav-link">Events</button>
            <button type="button" onClick={(e) => scrollToSection(e, 'story')} className="mobile-nav-link">Our Story</button>
            <button type="button" onClick={(e) => scrollToSection(e, 'how-it-works')} className="mobile-nav-link">How It Works</button>
            <button type="button" onClick={(e) => scrollToSection(e, 'contact')} className="mobile-nav-link">Contact</button>
          </div>
        )}

        {/* Auth actions */}
        <div className="mobile-nav-auth">
          {isAuthenticated ? (
            <>
              <div className="mobile-nav-user-info">
                <div className="mobile-nav-avatar">{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>{user?.firstName} {user?.lastName}</div>
                  <span className={`role-tag role-${user?.role}`} style={{ fontSize: 11 }}>{user?.role}</span>
                </div>
              </div>
              {isAdmin && (
                <Link to="/admin/events/new" className="mobile-nav-btn-primary" onClick={() => setMobileMenuOpen(false)}>
                  <PlusCircle size={16} /> Create Event
                </Link>
              )}
              <Link to={isAdmin ? '/admin' : '/dashboard'} className="mobile-nav-btn-secondary" onClick={() => setMobileMenuOpen(false)}>
                <UserIcon size={16} /> Dashboard
              </Link>
              <button type="button" onClick={() => { setMobileMenuOpen(false); setShowLogoutConfirm(true) }} className="mobile-nav-btn-logout">
                <LogOut size={16} /> Log Out
              </button>
            </>
          ) : (
            <div className="mobile-nav-auth-btns">
              <button type="button" onClick={() => { openAuthModal('login'); setMobileMenuOpen(false) }} className="mobile-nav-btn-secondary">Login</button>
              <button type="button" onClick={() => { openAuthModal('signup'); setMobileMenuOpen(false) }} className="mobile-nav-btn-primary">Sign Up Free</button>
            </div>
          )}
        </div>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap">
              <AlertTriangle size={24} color="#881421" />
            </div>
            <h3 className="modal-title">Confirm Logout</h3>
            <p className="modal-desc">
              Are you sure you want to log out of your Eventpatro account?
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-confirm"
                onClick={confirmLogout}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar


