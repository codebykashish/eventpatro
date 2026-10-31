import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Calendar, MapPin, Users, ArrowLeft, CheckCircle2, AlertCircle,
  Edit, Trash2, Shield, UserCheck, Clock, Send, XCircle, ChevronDown,
  ClipboardList, FileText,
} from 'lucide-react'
import {
  fetchEventById, deleteEvent,
  submitRegistration, cancelRegistration,
  getMyRegistrationForEvent, getEventRegistrations, updateRegistrationStatus,
} from '../utils/api'
import { useAuth } from '../context/AuthContext'
import './EventDetail.css'

// Category colours (matches EventCard)
const CATEGORY_COLORS = {
  academic: '#3b82f6', cultural: '#ec4899', sports: '#22c55e',
  workshop: '#f59e0b', seminar: '#8b5cf6', social: '#14b8a6',
  club: '#f97316', other: '#6b7280',
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const formatShortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// Status badge config
const STATUS_CONFIG = {
  confirmed: { label: 'Registered ✓', cls: 'status-confirmed' },
  pending:   { label: 'Application Pending', cls: 'status-pending' },
  selected:  { label: 'Selected 🎉', cls: 'status-selected' },
  rejected:  { label: 'Not Selected', cls: 'status-rejected' },
  cancelled: { label: 'Cancelled', cls: 'status-cancelled' },
}

const EventDetailPage = ({ eventId: propId, onBack }) => {
  const params = useParams()
  const id = propId || params.id
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(isAdmin ? '/admin' : '/dashboard')
    }
  }

  const [event, setEvent]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [actionMsg, setActionMsg]   = useState('')
  const [actionError, setActionError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Student's current registration for this event (null = not registered)
  const [myRegistration, setMyRegistration] = useState(undefined) // undefined = loading

  // Form answers state: { [fieldId]: string }
  const [answers, setAnswers] = useState({})

  // Admin: list of all registrations for this event
  const [registrations, setRegistrations]   = useState([])
  const [regLoading, setRegLoading]         = useState(false)
  const [regActionMsg, setRegActionMsg]     = useState('')

  // Load event details
  const loadEvent = useCallback(async () => {
    try {
      const data = await fetchEventById(id)
      setEvent(data.event)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  // Load the logged-in student's registration for this event
  const loadMyRegistration = useCallback(async () => {
    if (!user || isAdmin) { setMyRegistration(null); return }
    try {
      const data = await getMyRegistrationForEvent(id)
      setMyRegistration(data.registration) // null if not registered
    } catch {
      setMyRegistration(null)
    }
  }, [id, user, isAdmin])

  // Admin: load all registrations
  const loadRegistrations = useCallback(async () => {
    if (!isAdmin) return
    setRegLoading(true)
    try {
      const data = await getEventRegistrations(id)
      setRegistrations(data.registrations || [])
    } catch { /* silent */ } finally {
      setRegLoading(false)
    }
  }, [id, isAdmin])

  useEffect(() => {
    setLoading(true)
    setError('')
    setEvent(null)
    loadEvent()
    loadMyRegistration()
    loadRegistrations()
  }, [id, loadEvent, loadMyRegistration, loadRegistrations])

  // Initialise answer state when event loads (one blank entry per field)
  useEffect(() => {
    if (!event?.formFields?.length) return
    setAnswers(Object.fromEntries(event.formFields.map((f) => [f._id, ''])))
  }, [event])

  // ── Registration submit ────────────────────────────────────────────────────
  const handleSubmitRegistration = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setActionMsg('')
    setActionError('')
    try {
      const payload = event.formFields.map((f) => ({
        fieldId: f._id,
        label: f.label,
        value: answers[f._id] || '',
      }))
      const res = await submitRegistration(id, { answers: payload })
      setActionMsg(res.message || 'Registered successfully!')
      await Promise.all([loadEvent(), loadMyRegistration()])
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Cancel registration ────────────────────────────────────────────────────
  const handleCancel = async () => {
    setSubmitting(true)
    setActionMsg('')
    setActionError('')
    try {
      const res = await cancelRegistration(id)
      setActionMsg(res.message || 'Registration cancelled.')
      setMyRegistration(null)
      await loadEvent()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete event (admin) ───────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteEvent(id)
      setActionMsg('Event deleted.')
      setTimeout(() => {
        if (onBack) onBack()
        else navigate(isAdmin ? '/admin' : '/dashboard')
      }, 1200)
    } catch (err) {
      setActionError(err.message)
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // ── Admin: change applicant status ────────────────────────────────────────
  const handleStatusChange = async (regId, status) => {
    setRegActionMsg('')
    try {
      await updateRegistrationStatus(id, regId, status)
      setRegActionMsg(`Applicant ${status} successfully.`)
      await loadRegistrations()
    } catch (err) {
      setRegActionMsg(`Error: ${err.message}`)
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const isRegistered      = myRegistration && myRegistration.status !== 'cancelled'
  const deadlinePassed    = event?.registrationDeadline && new Date() > new Date(event.registrationDeadline)
  const isFull            = event?.capacity !== null && event?.spotsLeft === 0 && !isRegistered
  const hasForm           = event?.formFields?.length > 0
  const canCancel         = isRegistered &&
    ['confirmed', 'pending'].includes(myRegistration?.status) &&
    !deadlinePassed

  // ─────────────────────────────────────────────────────────────────────────
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
        <button
          type="button"
          onClick={handleBack}
          className="btn-back-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
        >
          ← Back to {isAdmin ? 'Admin' : 'Dashboard'}
        </button>
      </div>
    )
  }

  const badgeColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other

  return (
    <div className="event-detail-page">
      {/* ── Back navigation ── */}
      <button
        type="button"
        onClick={handleBack}
        className="detail-back-link"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
      >
        <ArrowLeft size={16} />
        Back to {isAdmin ? 'Admin' : 'Dashboard'}
      </button>

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
        {/* Registration type badge */}
        <span className={`detail-reg-badge ${event.registrationType === 'application' ? 'badge-app' : 'badge-open'}`}>
          {event.registrationType === 'application' ? '📋 Application Required' : '✅ Open Registration'}
        </span>
      </div>

      {/* ── Content grid ── */}
      <div className="detail-content-grid">
        {/* Left: main info */}
        <div className="detail-main">
          <h1 className="detail-title">{event.title}</h1>
          <p className="detail-description">{event.description}</p>

          {/* ── Registration form for students ── */}
          {!isAdmin && (
            <div className="reg-form-section">
              {/* Already registered — show status card */}
              {myRegistration === undefined ? (
                <div className="reg-status-loading">Checking your registration…</div>
              ) : isRegistered ? (
                <div className="my-reg-status-card">
                  <div className="my-reg-header">
                    <ClipboardList size={18} />
                    <span>Your Registration</span>
                  </div>
                  <div className="my-reg-body">
                    <span className={`reg-status-badge ${STATUS_CONFIG[myRegistration.status]?.cls}`}>
                      {STATUS_CONFIG[myRegistration.status]?.label || myRegistration.status}
                    </span>
                    <div className="my-reg-code">
                      <span className="reg-code-label">Registration Code</span>
                      <span className="reg-code-value">{myRegistration.registrationCode}</span>
                    </div>
                    {myRegistration.answers?.length > 0 && (
                      <div className="my-reg-answers">
                        <p className="reg-answers-title">Your submitted answers:</p>
                        {myRegistration.answers.map((a, i) => (
                          <div key={i} className="reg-answer-row">
                            <span className="reg-q-label">{a.label}</span>
                            <span className="reg-q-value">{a.value || '—'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {canCancel && (
                      <button
                        type="button"
                        className="btn-cancel-registration"
                        onClick={handleCancel}
                        disabled={submitting}
                      >
                        <XCircle size={15} />
                        {submitting ? 'Cancelling…' : 'Cancel Registration'}
                      </button>
                    )}
                  </div>
                </div>
              ) : deadlinePassed ? (
                <div className="reg-closed-card">
                  <Clock size={18} />
                  <span>Registration for this event has closed.</span>
                </div>
              ) : isFull ? (
                <div className="reg-closed-card">
                  <Users size={18} />
                  <span>This event is fully booked.</span>
                </div>
              ) : (
                /* Registration form */
                <form className="registration-form" onSubmit={handleSubmitRegistration} id="reg-form">
                  <div className="reg-form-header">
                    <FileText size={18} />
                    <span>
                      {event.registrationType === 'application'
                        ? 'Submit Your Application'
                        : 'Register for this Event'}
                    </span>
                  </div>

                  {hasForm && (
                    <div className="reg-form-fields">
                      {event.formFields.map((field) => (
                        <div key={field._id} className="reg-field">
                          <label className="reg-field-label">
                            {field.label}
                            {field.required && <span className="req-star"> *</span>}
                          </label>

                          {field.type === 'short_answer' && (
                            <input
                              type="text"
                              className="reg-field-input"
                              value={answers[field._id] || ''}
                              onChange={(e) =>
                                setAnswers((prev) => ({ ...prev, [field._id]: e.target.value }))
                              }
                              required={field.required}
                              placeholder="Your answer…"
                            />
                          )}

                          {field.type === 'paragraph' && (
                            <textarea
                              className="reg-field-textarea"
                              rows={4}
                              value={answers[field._id] || ''}
                              onChange={(e) =>
                                setAnswers((prev) => ({ ...prev, [field._id]: e.target.value }))
                              }
                              required={field.required}
                              placeholder="Your answer…"
                            />
                          )}

                          {field.type === 'multiple_choice' && (
                            <div className="reg-field-select-wrap">
                              <select
                                className="reg-field-select"
                                value={answers[field._id] || ''}
                                onChange={(e) =>
                                  setAnswers((prev) => ({ ...prev, [field._id]: e.target.value }))
                                }
                                required={field.required}
                              >
                                <option value="">— Select an option —</option>
                                {field.options.map((opt, i) => (
                                  <option key={i} value={opt}>{opt}</option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="select-chevron" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

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

                  <button type="submit" className="btn-register" disabled={submitting}>
                    <Send size={15} />
                    {submitting
                      ? 'Submitting…'
                      : event.registrationType === 'application'
                        ? 'Submit Application'
                        : 'Register Now'}
                  </button>
                </form>
              )}

              {/* Non-form action feedback (cancel success/error) */}
              {!isRegistered && (actionMsg || actionError) && (
                <>
                  {actionMsg && <div className="action-success"><CheckCircle2 size={14} /> {actionMsg}</div>}
                  {actionError && <div className="action-error"><AlertCircle size={14} /> {actionError}</div>}
                </>
              )}
            </div>
          )}

          {/* ── Admin: Registrations / Applications list ── */}
          {isAdmin && (
            <div className="admin-attendees-section">
              <div className="attendees-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} color="#881421" />
                  <h3>
                    {event.registrationType === 'application' ? 'Applications' : 'Registrations'}
                    {' '}({registrations.length})
                  </h3>
                </div>
              </div>

              {regActionMsg && (
                <div className="action-success" style={{ marginBottom: '12px' }}>
                  <CheckCircle2 size={14} /> {regActionMsg}
                </div>
              )}

              {regLoading ? (
                <p className="attendees-empty">Loading registrations…</p>
              ) : registrations.length === 0 ? (
                <p className="attendees-empty">No registrations yet.</p>
              ) : (
                <div className="admin-reg-table-wrap">
                  <div className="admin-reg-table">
                    <div className="admin-reg-header">
                      <span>#</span>
                      <span>Student</span>
                      <span>Code</span>
                      <span>Status</span>
                      {event.registrationType === 'application' && <span>Actions</span>}
                    </div>
                    {registrations.map((reg, idx) => (
                      <div key={reg._id} className="admin-reg-row">
                        <span className="row-num">{idx + 1}</span>
                        <div className="reg-student-info">
                          <span className="row-name">
                            {reg.student?.firstName} {reg.student?.lastName}
                          </span>
                          <span className="row-email">{reg.student?.email}</span>
                          {/* Show submitted answers */}
                          {reg.answers?.length > 0 && (
                            <div className="admin-reg-answers">
                              {reg.answers.map((a, i) => (
                                <div key={i} className="admin-answer-row">
                                  <span className="admin-q">{a.label}:</span>
                                  <span className="admin-a">{a.value || '—'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="row-code">{reg.registrationCode}</span>
                        <span className={`reg-status-badge ${STATUS_CONFIG[reg.status]?.cls}`}>
                          {STATUS_CONFIG[reg.status]?.label || reg.status}
                        </span>
                        {event.registrationType === 'application' && (
                          <div className="admin-reg-actions">
                            {reg.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  className="btn-select"
                                  onClick={() => handleStatusChange(reg._id, 'selected')}
                                >
                                  Select
                                </button>
                                <button
                                  type="button"
                                  className="btn-reject"
                                  onClick={() => handleStatusChange(reg._id, 'rejected')}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {reg.status === 'selected' && (
                              <button
                                type="button"
                                className="btn-reject"
                                onClick={() => handleStatusChange(reg._id, 'rejected')}
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: sidebar */}
        <aside className="detail-sidebar">
          {/* Admin Controls */}
          {isAdmin && (
            <div className="admin-controls-card">
              <div className="admin-controls-title">
                <Shield size={16} />
                <span>Admin Actions</span>
              </div>
              <div className="admin-controls-actions">
                <Link to={`/admin/events/${event._id}/edit`} className="btn-admin-edit">
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
              {showDeleteModal && (
                <div className="admin-delete-confirm-box">
                  <p>Remove this event from the public listing?</p>
                  <div className="confirm-buttons">
                    <button type="button" className="btn-confirm-delete" onClick={handleDelete} disabled={deleting}>
                      {deleting ? 'Deleting…' : 'Yes, Delete'}
                    </button>
                    <button type="button" className="btn-cancel-delete" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Event info card */}
          <div className="detail-info-card">
            <div className="info-row">
              <Calendar size={16} />
              <div>
                <span className="info-label">Date &amp; Time</span>
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
            {event.registrationDeadline && (
              <div className="info-row">
                <Clock size={16} />
                <div>
                  <span className="info-label">Registration Deadline</span>
                  <span className={`info-value ${deadlinePassed ? 'deadline-past' : 'deadline-active'}`}>
                    {formatShortDate(event.registrationDeadline)}
                    {deadlinePassed ? ' (Closed)' : ''}
                  </span>
                </div>
              </div>
            )}
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
        </aside>
      </div>
    </div>
  )
}

export default EventDetailPage
