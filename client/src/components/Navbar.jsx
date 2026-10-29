import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, User as UserIcon, Shield, AlertTriangle, Search, PlusCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const isHomePage = location.pathname === '/'

  // Execute logout after confirmation
  const confirmLogout = () => {
    setShowLogoutConfirm(false)
    logout()
    navigate('/')
  }

  return (
    <>
      <nav className={`navbar ${isHomePage ? 'navbar-hero-overlay' : ''}`}>
        <div className="navbar-container">
          {/* Brand identity without icon, written in cursive */}
          <Link to="/" className="nav-brand">
            <span className="nav-title brand-cursive">Eventpatro</span>
          </Link>

          {/* Center Navigation Links */}
          <div className="nav-center-links">
            <Link to="/" className="nav-center-link">
              Home
            </Link>
            <Link to="/events" className="nav-center-link">
              Events
            </Link>
            {isHomePage ? (
              <>
                <a href="#story" className="nav-center-link">
                  Our Story
                </a>
                <a href="#how-it-works" className="nav-center-link">
                  How It Works
                </a>
                <a href="#contact" className="nav-center-link">
                  Contact
                </a>
              </>
            ) : (
              <Link to="/events" className="nav-center-link">
                Browse
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="nav-actions">
            {/* Quick search button */}
            <Link to="/events" className="nav-search-btn" title="Search events">
              <Search size={17} />
            </Link>

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
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="btn-logout"
                  title="Log Out"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="nav-auth-link"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                  className="btn-signup"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

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
