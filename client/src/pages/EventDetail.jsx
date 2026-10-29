import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, ArrowLeft, CheckCircle2, AlertCircle, Edit, Trash2, Shield, UserCheck } from 'lucide-react'
import { fetchEventById, registerForEvent, cancelRegistration, deleteEvent } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import './EventDetail.css'

// Category colours (matches EventCard)
const CATEGORY_COLORS = {
  academic: '#3b82f6', cultural: '#ec4899', sports: '#22c55e',
  workshop: '#f59e0b', seminar: '#8b5cf6', social: '#14b8a6',
  club: '#f97316',     other:   '#6b7280',
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const EventDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [actionError, setActionError] = useState('')
  const [registering, setRegistering] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Check if the logged-in user is already registered
  const isRegistered =
    user && event?.registeredUsers?.some((u) => (u._id || u) === user.id)

  // Full capacity check
  const isFull = event?.capacity !== null && event?.spotsLeft === 0 && !isRegistered

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchEventById(id)
        setEvent(data.event)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    setActionError('')
    try {
      await deleteEvent(id)
      setActionMsg('Event deleted successfully.')
      setTimeout(() => navigate('/events'), 1200)
    } catch (err) {
      setActionError(err.message)
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleRegister = async () => {
    if (!user) return navigate('/login')
    setRegistering(true)
    setActionMsg('')
    setActionError('')
    try {
      const res = await registerForEvent(id)
      setActionMsg(res.message || 'Registered successfully!')
      // Refresh event to update spots count
      const data = await fetchEventById(id)
      setEvent(data.event)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setRegistering(false)
    }
  }

  const handleCancel = async () => {
    setRegistering(true)
    setActionMsg('')
    setActionError('')
    try {
      const res = await cancelRegistration(id)
      setActionMsg(res.message || 'Registration cancelled.')
      const data = await fetchEventById(id)
      setEvent(data.event)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="event-detail-loading">
        <div className="loading-spinner" />
        <span>Loading event...</span>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="event-detail-error">
        <AlertCircle size={40} />
        <p>{error || 'Event not found.'}</p>
        <Link to="/events" className="btn-back-link">← Back to Events</Link>
      </div>
    )
  }

  const badgeColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other

  return (
    <div className="event-detail-page">
      {/* ── Back navigation ── */}
      <Link to="/events" className="detail-back-link">
        <ArrowLeft size={16} />
        All Events
      </Link>

      {/* ── Cover ── */}
      <div
        className="detail-cover"
        style={{
          backgroundImage: event.coverImage
            ? `url(${event.coverImage})`
            : 'linear-gradient(135deg, #881421 0%, #3d0a10 100%)',
        }}
      >
        <span className="detail-category-badge" style={{ background: badgeColor }}>
          {event.category}
        </span>
      </div>

      {/* ── Content grid ── */}
      <div className="detail-content-grid">
        {/* Left: main info */}
        <div className="detail-main">
          <h1 className="detail-title">{event.title}</h1>
          <p className="detail-description">{event.description}</p>

          {/* Admin Attendee List */}
          {user?.role === 'admin' && (
            <div className="admin-attendees-section">
              <div className="attendees-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} color="#881421" />
                  <h3>Registered Participants ({event.registeredUsers?.length ?? 0})</h3>
                </div>
              </div>

              {(!event.registeredUsers || event.registeredUsers.length === 0) ? (
                <p className="attendees-empty">No students registered for this event yet.</p>
              ) : (
                <div className="attendees-list-table">
                  <div className="attendees-table-header">
                    <span>#</span>
                    <span>Student Name</span>
                    <span>Email Address</span>
                  </div>
                  {event.registeredUsers.map((attendee, idx) => (
                    <div key={attendee._id || idx} className="attendees-table-row">
                      <span className="row-num">{idx + 1}</span>
                      <span className="row-name">
                        {attendee.firstName} {attendee.lastName}
                      </span>
                      <span className="row-email">{attendee.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: sidebar */}
        <aside className="detail-sidebar">
          {/* Admin Controls Panel */}
          {user?.role === 'admin' && (
            <div className="admin-controls-card">
              <div className="admin-controls-title">
                <Shield size={16} />
                <span>Admin Actions</span>
              </div>
              <div className="admin-controls-actions">
                <Link
                  to={`/admin/events/${event._id}/edit`}
                  className="btn-admin-edit"
                >
                  <Edit size={14} /> Edit Event
                </Link>
                <button
                  type="button"
                  className="btn-admin-delete"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleting}
                >
                  <Trash2 size={14} /> Delete Event
                </button>
              </div>

              {/* Delete confirmation box */}
              {showDeleteModal && (
                <div className="admin-delete-confirm-box">
                  <p>Permanently remove this event from the public listing?</p>
                  <div className="confirm-buttons">
                    <button
                      type="button"
                      className="btn-confirm-delete"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      type="button"
                      className="btn-cancel-delete"
                      onClick={() => setShowDeleteModal(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info card */}
          <div className="detail-info-card">
            <div className="info-row">
              <Calendar size={16} />
              <div>
                <span className="info-label">Date & Time</span>
                <span className="info-value">{formatDate(event.date)}</span>
              </div>
            </div>
            <div className="info-row">
              <MapPin size={16} />
              <div>
                <span className="info-label">Location</span>
                <span className="info-value">{event.location}</span>
              </div>
            </div>
            {event.capacity !== null && (
              <div className="info-row">
                <Users size={16} />
                <div>
                  <span className="info-label">Capacity</span>
                  <span className="info-value">
                    {event.registeredUsers?.length ?? 0} / {event.capacity} registered
                    {!isRegistered && (
                      <span className={`spots-tag ${event.spotsLeft === 0 ? 'full' : ''}`}>
                        {event.spotsLeft === 0 ? 'Full' : `${event.spotsLeft} spots left`}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
            <div className="info-row">
              <span className="organiser-label">Organised by</span>
              <span className="info-value">
                {event.organiser?.firstName} {event.organiser?.lastName}
              </span>
            </div>
          </div>

          {/* Action feedback */}
          {actionMsg && (
            <div className="action-success">
              <CheckCircle2 size={14} /> {actionMsg}
            </div>
          )}
          {actionError && (
            <div className="action-error">
              <AlertCircle size={14} /> {actionError}
            </div>
          )}

          {/* Register / Cancel button */}
          {isRegistered ? (
            <button
              className="btn-cancel-registration"
              onClick={handleCancel}
              disabled={registering}
            >
              {registering ? 'Cancelling...' : '✕ Cancel Registration'}
            </button>
          ) : isFull ? (
            <button className="btn-register" disabled>
              Event Full
            </button>
          ) : (
            <button
              className="btn-register"
              onClick={handleRegister}
              disabled={registering}
            >
              {registering ? 'Registering...' : user ? 'Register Now' : 'Login to Register'}
            </button>
          )}
        </aside>
      </div>
    </div>
  )
}

export default EventDetailPage
