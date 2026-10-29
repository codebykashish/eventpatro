import { Link, useNavigate } from 'react-router-dom'
import { Landmark, LogOut, User as UserIcon, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand identity */}
        <Link to="/" className="nav-brand">
          <div className="nav-logo">
            <Landmark size={22} color="#881421" />
          </div>
          <div className="nav-titles">
            <span className="nav-title">Eventpatro</span>
            <span className="nav-subtitle">Sunway College</span>
          </div>
        </Link>

        {/* Navigation actions */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="nav-link admin-link">
                  <Shield size={16} />
                  <span>Admin Panel</span>
                </Link>
              )}
              <Link to="/dashboard" className="nav-link">
                <UserIcon size={16} />
                <span>Dashboard</span>
              </Link>
              <div className="user-badge">
                <span className="user-name">{user?.firstName}</span>
                <span className={`role-tag role-${user?.role}`}>{user?.role}</span>
              </div>
              <button onClick={handleLogout} className="btn-logout" title="Log Out">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Log In
              </Link>
              <Link to="/signup" className="btn-signup">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
