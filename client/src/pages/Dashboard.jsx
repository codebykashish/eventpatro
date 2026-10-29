import { User, Calendar, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <div className="dashboard-container">
      {/* Welcome header */}
      <div className="dashboard-header">
        <div>
          <h2>Student Portal</h2>
          <p className="dashboard-subtitle">
            Welcome back, {user?.firstName} {user?.lastName}!
          </p>
        </div>
        <div className="status-badge student-badge">
          <ShieldCheck size={16} />
          <span>Student Account</span>
        </div>
      </div>

      {/* User info card */}
      <div className="dashboard-grid">
        <div className="dash-card">
          <div className="card-top">
            <User size={22} color="#881421" />
            <h3>Profile Information</h3>
          </div>
          <div className="profile-details">
            <div className="detail-item">
              <span className="detail-label">Full Name:</span>
              <span className="detail-value">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Student ID:</span>
              <span className="detail-value code-font">{user?.studentId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">College Email:</span>
              <span className="detail-value">{user?.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Role:</span>
              <span className="detail-value capitalize">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Quick event overview placeholder */}
        <div className="dash-card">
          <div className="card-top">
            <Calendar size={22} color="#881421" />
            <h3>Registered Events</h3>
          </div>
          <div className="empty-state">
            <p>You have not registered for any upcoming events yet.</p>
            <span className="hint-text">
              Event discovery & registrations will be enabled in Phase 2 & 3.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
