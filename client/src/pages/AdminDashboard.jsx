import { Shield, Users, CalendarPlus, CheckSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const AdminDashboard = () => {
  const { user } = useAuth()

  return (
    <div className="dashboard-container">
      {/* Admin header */}
      <div className="dashboard-header">
        <div>
          <h2>Administrator Portal</h2>
          <p className="dashboard-subtitle">
            Welcome, Administrator {user?.firstName} {user?.lastName} ({user?.email})
          </p>
        </div>
        <div className="status-badge admin-badge">
          <Shield size={16} />
          <span>Full Admin Access</span>
        </div>
      </div>

      {/* Admin controls overview */}
      <div className="dashboard-grid">
        <div className="dash-card">
          <div className="card-top">
            <CalendarPlus size={22} color="#881421" />
            <h3>Event Management</h3>
          </div>
          <p className="card-desc">
            Create, update, and manage campus workshops, hackathons, and guest lectures.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <Link to="/admin/events/new" className="btn-primary-action" style={{ fontSize: '13px', padding: '7px 16px', textDecoration: 'none', borderRadius: '8px' }}>
              + Create Event
            </Link>
            <Link to="/events" className="btn-primary-action" style={{ fontSize: '13px', padding: '7px 16px', textDecoration: 'none', borderRadius: '8px', background: '#f3f4f6', color: '#374151' }}>
              View All Events
            </Link>
          </div>
        </div>

        <div className="dash-card">
          <div className="card-top">
            <Users size={22} color="#881421" />
            <h3>Student Registrations</h3>
          </div>
          <p className="card-desc">
            Review event applications, approve attendees, and manage participant lists.
          </p>
          <span className="badge-pill">Unlocks in Phase 3</span>
        </div>

        <div className="dash-card">
          <div className="card-top">
            <CheckSquare size={22} color="#881421" />
            <h3>Attendance & Feedback</h3>
          </div>
          <p className="card-desc">
            Mark student presence at venues and export attendance records.
          </p>
          <span className="badge-pill">Unlocks in Phase 4</span>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
