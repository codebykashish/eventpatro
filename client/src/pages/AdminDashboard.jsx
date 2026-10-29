import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  Users,
  CalendarPlus,
  CheckSquare,
  Calendar,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchEvents, deleteEvent } from '../utils/api'
import './Dashboard.css'

const CATEGORY_COLORS = {
  academic: '#3b82f6',
  cultural: '#ec4899',
  sports: '#22c55e',
  workshop: '#f59e0b',
  seminar: '#8b5cf6',
  social: '#14b8a6',
  club: '#f97316',
  other: '#6b7280',
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const AdminDashboard = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await fetchEvents({ limit: 50 })
      setEvents(data.events || [])
    } catch (err) {
      setError(err.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const handleDelete = async (id) => {
    setDeleting(true)
    setError('')
    try {
      await deleteEvent(id)
      setSuccess('Event removed successfully!')
      setDeleteId(null)
      // Optimistically update list
      setEvents((prev) => prev.filter((e) => e._id !== id))
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete event')
    } finally {
      setDeleting(false)
    }
  }

  // Calculate totals
  const totalRegistrations = events.reduce(
    (sum, ev) => sum + (ev.registeredUsers?.length || 0),
    0
  )

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

      {/* Metrics Row */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <span className="stat-label">Total Events</span>
          <span className="stat-value">{events.length}</span>
          <span className="stat-sub">Active campus listings</span>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">Total Registrations</span>
          <span className="stat-value">{totalRegistrations}</span>
          <span className="stat-sub">Across all campus events</span>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">System Status</span>
          <span className="stat-value" style={{ color: '#16a34a' }}>Active</span>
          <span className="stat-sub">MongoDB connected</span>
        </div>
      </div>

      {/* Feedback Banners */}
      {error && (
        <div className="form-banner form-banner-error" style={{ marginBottom: '16px' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}
      {success && (
        <div className="form-banner form-banner-success" style={{ marginBottom: '16px' }}>
          <CheckCircle2 size={15} /> {success}
        </div>
      )}

      {/* Event Management Table Card */}
      <div className="admin-table-card">
        <div className="admin-table-top">
          <div>
            <h3>Campus Events Management</h3>
            <p>Create, update, or remove campus events.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/admin/events/new" className="btn-primary-action" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: '13px', borderRadius: '8px' }}>
              + Create New Event
            </Link>
            <Link to="/events" className="btn-secondary-action" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: '13px', borderRadius: '8px', background: '#f3f4f6', color: '#374151' }}>
              Public Events Page
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#6b7280' }}>
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <p>No campus events created yet.</p>
            <Link to="/admin/events/new" className="btn-primary-action" style={{ display: 'inline-block', marginTop: '12px', textDecoration: 'none', padding: '8px 16px', fontSize: '13px' }}>
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-events-table">
              <thead>
                <tr>
                  <th>Event Name & Category</th>
                  <th>Schedule</th>
                  <th>Location</th>
                  <th>Registrations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev._id}>
                    <td>
                      <div className="event-table-title">{ev.title}</div>
                      <span
                        className="event-cat-tag"
                        style={{
                          background: CATEGORY_COLORS[ev.category] || '#6b7280',
                        }}
                      >
                        {ev.category}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} color="#881421" />
                        {formatDate(ev.date)}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: '#4b5563' }}>
                      {ev.location}
                    </td>
                    <td>
                      <span className="reg-count-pill">
                        {ev.registeredUsers?.length || 0}
                        {ev.capacity ? ` / ${ev.capacity}` : ' (Unlimited)'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          to={`/events/${ev._id}`}
                          className="btn-tbl-action"
                          title="View Event Details"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          to={`/admin/events/${ev._id}/edit`}
                          className="btn-tbl-action btn-tbl-edit"
                          title="Edit Event"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          type="button"
                          className="btn-tbl-action btn-tbl-delete"
                          title="Delete Event"
                          onClick={() => setDeleteId(ev._id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-content">
            <h4>Delete Event?</h4>
            <p>
              Are you sure you want to remove this event? It will no longer appear on the student public events page.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="btn-modal-delete"
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Admin Modules */}
      <div className="dashboard-grid" style={{ marginTop: '32px' }}>
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
