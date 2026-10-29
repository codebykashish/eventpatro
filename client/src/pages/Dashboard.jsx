import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Calendar, ShieldCheck, ClipboardList, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMyRegistrations } from '../utils/api'
import './Dashboard.css'

// Status badge config (matches EventDetail)
const STATUS_CONFIG = {
  confirmed: { label: 'Registered ✓', cls: 'status-confirmed' },
  pending:   { label: 'Pending Review', cls: 'status-pending' },
  selected:  { label: 'Selected 🎉', cls: 'status-selected' },
  rejected:  { label: 'Not Selected', cls: 'status-rejected' },
  cancelled: { label: 'Cancelled', cls: 'status-cancelled' },
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const Dashboard = () => {
  const { user } = useAuth()

  const [registrations, setRegistrations] = useState([])
  const [regLoading, setRegLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyRegistrations()
        setRegistrations(data.registrations || [])
      } catch { /* silent */ } finally {
        setRegLoading(false)
      }
    }
    load()
  }, [])

  // Split into active vs past/cancelled
  const active = registrations.filter((r) =>
    ['confirmed', 'pending', 'selected'].includes(r.status)
  )
  const past = registrations.filter((r) =>
    ['rejected', 'cancelled'].includes(r.status)
  )

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

      {/* Top grid: profile + quick actions */}
      <div className="dashboard-grid">
        {/* Profile card */}
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
            {user?.role === 'student' && user?.studentId && (
              <div className="detail-item">
                <span className="detail-label">Student ID:</span>
                <span className="detail-value code-font">{user?.studentId}</span>
              </div>
            )}
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

        {/* Quick events card */}
        <div className="dash-card">
          <div className="card-top">
            <Calendar size={22} color="#881421" />
            <h3>Campus Events</h3>
          </div>
          <div className="empty-state">
            <p>Explore all active campus events, workshops, and competitions.</p>
            <Link to="/events" className="dash-browse-btn">
              Browse Campus Events →
            </Link>
          </div>
        </div>
      </div>

      {/* ── My Registrations ── */}
      <div className="dash-section">
        <div className="dash-section-header">
          <ClipboardList size={18} color="#881421" />
          <h3>My Registrations</h3>
          <span className="dash-reg-count">{registrations.length} total</span>
        </div>

        {regLoading ? (
          <p className="dash-loading">Loading your registrations…</p>
        ) : registrations.length === 0 ? (
          <div className="dash-empty-regs">
            <p>You haven't registered for any events yet.</p>
            <Link to="/events" className="dash-browse-btn">
              Find Events to Join
            </Link>
          </div>
        ) : (
          <>
            {/* Active registrations */}
            {active.length > 0 && (
              <div className="reg-group">
                <span className="reg-group-label">Active</span>
                <div className="reg-list">
                  {active.map((reg) => (
                    <div key={reg._id} className="reg-item">
                      <div className="reg-item-main">
                        <Link
                          to={`/events/${reg.event?._id}`}
                          className="reg-event-title"
                        >
                          {reg.event?.title || 'Event'}
                          <ExternalLink size={12} />
                        </Link>
                        <span className="reg-event-date">
                          {reg.event?.date ? formatDate(reg.event.date) : ''}
                        </span>
                        <span className="reg-event-location">{reg.event?.location}</span>
                      </div>
                      <div className="reg-item-right">
                        <span className={`dash-reg-status ${STATUS_CONFIG[reg.status]?.cls}`}>
                          {STATUS_CONFIG[reg.status]?.label || reg.status}
                        </span>
                        <span className="dash-reg-code">{reg.registrationCode}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past / cancelled registrations */}
            {past.length > 0 && (
              <div className="reg-group">
                <span className="reg-group-label">Past / Cancelled</span>
                <div className="reg-list">
                  {past.map((reg) => (
                    <div key={reg._id} className="reg-item reg-item-past">
                      <div className="reg-item-main">
                        <Link
                          to={`/events/${reg.event?._id}`}
                          className="reg-event-title"
                        >
                          {reg.event?.title || 'Event'}
                          <ExternalLink size={12} />
                        </Link>
                        <span className="reg-event-date">
                          {reg.event?.date ? formatDate(reg.event.date) : ''}
                        </span>
                      </div>
                      <div className="reg-item-right">
                        <span className={`dash-reg-status ${STATUS_CONFIG[reg.status]?.cls}`}>
                          {STATUS_CONFIG[reg.status]?.label || reg.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard
