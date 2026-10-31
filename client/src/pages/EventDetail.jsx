import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Calendar, MapPin, Users, ArrowLeft, CheckCircle2, AlertCircle,
  Edit, Trash2, Shield, UserCheck, Clock, Send, XCircle, ChevronDown,
  ClipboardList, FileText, Share2, Copy, Check, Coffee, Laptop,
  Award, ExternalLink, Mail, Phone, User as UserIcon, BookOpen,
  Sparkles, Layers
} from 'lucide-react'
import {
  fetchEventById, deleteEvent,
  submitRegistration, cancelRegistration,
  getMyRegistrationForEvent, getEventRegistrations, updateRegistrationStatus,
} from '../utils/api'
import { useAuth } from '../context/AuthContext'
import './EventDetail.css'

// Status badge config
const STATUS_CONFIG = {
  confirmed: { label: 'Registered ✓', cls: 'status-confirmed' },
  pending:   { label: 'Application Pending', cls: 'status-pending' },
  selected:  { label: 'Selected 🎉', cls: 'status-selected' },
  rejected:  { label: 'Not Selected', cls: 'status-rejected' },
  cancelled: { label: 'Cancelled', cls: 'status-cancelled' },
}

const formatDate = (iso) => {
  if (!iso) return 'TBA'
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const formatShortDate = (iso) => {
  if (!iso) return 'TBA'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const getRemainingDays = (iso) => {
  if (!iso) return null
  const eventDate = new Date(iso)
  if (isNaN(eventDate.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(eventDate)
  targetDate.setHours(0, 0, 0, 0)
  const diffTime = targetDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'Completed'
  if (diffDays === 0) return 'Starts Today'
  if (diffDays === 1) return '1 day left for the event to start'
  return `${diffDays} days left for the event to start`
}

const EventDetailPage = ({ eventId: propId, onBack }) => {
  const params = useParams()
  const id = propId || params.id
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const handleBackToEvents = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/dashboard')
    }
  }

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [actionError, setActionError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Tab navigation in left overview: 'overview' | 'mentor'
  const [activeTab, setActiveTab] = useState('overview')

  // Student's current registration for this event (null = not registered)
  const [myRegistration, setMyRegistration] = useState(undefined) // undefined = loading

  // Form answers state: { [fieldId]: string }
  const [answers, setAnswers] = useState({})

  // Admin: list of all registrations for this event
  const [registrations, setRegistrations] = useState([])
  const [regLoading, setRegLoading] = useState(false)
  const [regActionMsg, setRegActionMsg] = useState('')

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
    } catch (err) {
      setRegActionMsg(`Could not load attendees: ${err.message}`)
    } finally {
      setRegLoading(false)
    }
  }, [id, isAdmin])

  useEffect(() => {
    loadEvent()
    loadMyRegistration()
    loadRegistrations()
  }, [loadEvent, loadMyRegistration, loadRegistrations])

  // Copy shareable link
  const handleCopyLink = () => {
    const url = window.location.origin + `/events/${id}`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2200)
  }

  // ── Student register ───────────────────────────────────────────────────────
  const handleSubmitRegistration = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }

    setSubmitting(true)
    setActionMsg('')
    setActionError('')

    const formattedAnswers = Object.entries(answers).map(([fieldId, value]) => ({
      fieldId,
      value: String(value),
    }))

    try {
      const res = await submitRegistration(id, formattedAnswers)
      setActionMsg(res.message || 'Registration submitted!')
      await loadMyRegistration()
      await loadEvent()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Student cancel registration ────────────────────────────────────────────
  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) return
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
  const isRegistered   = myRegistration && myRegistration.status !== 'cancelled'
  const deadlinePassed = event?.registrationDeadline && new Date() > new Date(event.registrationDeadline)
  const isFull         = event?.capacity !== null && event?.spotsLeft === 0 && !isRegistered
  const hasForm        = event?.formFields?.length > 0
  const canCancel      = isRegistered &&
    ['confirmed', 'pending'].includes(myRegistration?.status) &&
    !deadlinePassed

  const isWorkshopOrSeminar = ['workshop', 'seminar'].includes(event?.category)
  const hasMentor = isWorkshopOrSeminar && (event?.mentor?.name || event?.mentor?.occupation)
  const remainingDays = getRemainingDays(event?.date)

  if (loading) {
    return (
      <div className="event-detail-loading">
        <div className="loading-spinner" />
        <span>Loading event details...</span>
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
          onClick={handleBackToEvents}
          className="btn-back-link"
        >
          ← Back to Events
        </button>
      </div>
    )
  }

  return (
    <div className="nextcoach-event-detail-container">
      {/* ── Breadcrumb Navigation ── */}
      <nav className="nc-breadcrumb-bar" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={handleBackToEvents}
          className="nc-breadcrumb-link"
        >
          Events
        </button>
        <span className="nc-breadcrumb-sep">&gt;</span>
        <span className="nc-breadcrumb-current">Details</span>
      </nav>

      {/* ── Event Title Row (Above Full-Width Image) ── */}
      <div className="nc-header-title-row">
        <div className="nc-title-tag-group">
          <span className="nc-status-badge-pill">
            <Sparkles size={13} />
            {event.category ? event.category.toUpperCase() : 'EVENT'}
          </span>
          {event.registrationType === 'application' && (
            <span className="nc-badge-app-pill">Application Required</span>
          )}
        </div>
        <h1 className="nc-event-headline">{event.title}</h1>
      </div>

      {/* ── Full-Width Hero Cover Image ── */}
      <div className="nc-fullwidth-image-wrapper">
        <img
          src={event.coverImage || '/connected_events.jpg'}
          alt={event.title}
          className="nc-fullwidth-image"
        />
        <div className="nc-image-overlay-category">
          <span className="nc-category-overlay-tag">
            {event.category || 'Campus Event'}
          </span>
          {event.location && (
            <span className="nc-location-overlay-tag">
              <MapPin size={13} />
              {event.location}
            </span>
          )}
        </div>
      </div>

      {/* ── Main Two-Column Layout (Left: Tabs & Content, Right: Summary Cards) ── */}
      <div className="nc-detail-grid">
        {/* Left Column: Tabs, Description, Mentor, Registration Form */}
        <div className="nc-detail-left-column">
          {/* Navigation Tabs */}
          <div className="nc-tabs-header">
            <button
              type="button"
              className={`nc-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            {hasMentor && (
              <button
                type="button"
                className={`nc-tab-btn ${activeTab === 'mentor' ? 'active' : ''}`}
                onClick={() => setActiveTab('mentor')}
              >
                Instructor / Mentor
              </button>
            )}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="nc-tab-content">
              {/* Description Section */}
              <section className="nc-content-block">
                <h2 className="nc-block-title">Description</h2>
                <div className="nc-description-text">
                  {event.description}
                </div>
              </section>

              {/* What You Will Learn / Outcomes */}
              {event.learningOutcomes && event.learningOutcomes.length > 0 && (
                <section className="nc-content-block">
                  <h2 className="nc-block-title">What you'll explore &amp; learn</h2>
                  <div className="nc-outcomes-list">
                    {event.learningOutcomes.map((item, i) => (
                      <div key={i} className="nc-outcome-item">
                        <CheckCircle2 size={16} color="#881421" className="nc-check-icon" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Requirements & Prerequisites */}
              {event.requirements && event.requirements.length > 0 && (
                <section className="nc-content-block">
                  <h2 className="nc-block-title">Requirements &amp; Prerequisites</h2>
                  <div className="nc-requirements-list">
                    {event.requirements.map((req, i) => (
                      <div key={i} className="nc-requirement-item">
                        <span className="nc-bullet-dot">•</span>
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Tab 2: Mentor / Instructor (only for workshop/seminar) */}
          {activeTab === 'mentor' && hasMentor && (
            <div className="nc-tab-content">
              <section className="nc-content-block">
                <h2 className="nc-block-title">About the Instructor</h2>
                <div className="nc-mentor-profile-card">
                  <div className="nc-mentor-avatar-wrap">
                    {event.mentor.photo ? (
                      <img
                        src={event.mentor.photo}
                        alt={event.mentor.name}
                        className="nc-mentor-avatar"
                      />
                    ) : (
                      <div className="nc-mentor-avatar-fallback">
                        <UserIcon size={36} color="#881421" />
                      </div>
                    )}
                  </div>
                  <div className="nc-mentor-info">
                    <h3 className="nc-mentor-name">{event.mentor.name}</h3>
                    {event.mentor.occupation && (
                      <p className="nc-mentor-occupation">{event.mentor.occupation}</p>
                    )}
                    {event.mentor.bio && (
                      <p className="nc-mentor-bio">{event.mentor.bio}</p>
                    )}
                    {event.mentor.linkedin && (
                      <a
                        href={event.mentor.linkedin}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="nc-mentor-linkedin-btn"
                      >
                        <ExternalLink size={14} />
                        <span>LinkedIn Profile</span>
                      </a>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ── Student Registration Form / Status ── */}
          {!isAdmin && (
            <div className="nc-registration-area">
              {myRegistration === undefined ? (
                <div className="reg-status-loading">Checking your registration…</div>
              ) : isRegistered ? (
                <div className="my-reg-status-card">
                  <div className="my-reg-header">
                    <ClipboardList size={18} color="#881421" />
                    <span>Your Registration Status</span>
                  </div>
                  <div className="my-reg-body">
                    <span className={`reg-status-badge ${STATUS_CONFIG[myRegistration.status]?.cls}`}>
                      {STATUS_CONFIG[myRegistration.status]?.label || myRegistration.status}
                    </span>
                    <div className="my-reg-code">
                      <span className="reg-code-label">Registration Passcode</span>
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
              ) : (
                /* Registration input form */
                <form className="registration-form" onSubmit={handleSubmitRegistration} id="reg-form">
                  <div className="reg-form-header">
                    <FileText size={18} color="#881421" />
                    <span>
                      {event.registrationType === 'application'
                        ? 'Submit Application for Review'
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

                  {!deadlinePassed && !isFull && (
                    <button type="submit" className="nc-enroll-cta-btn" disabled={submitting}>
                      <Send size={15} />
                      {submitting
                        ? 'Submitting…'
                        : event.registrationType === 'application'
                          ? 'Submit Application'
                          : 'Confirm & Register Now'}
                    </button>
                  )}
                </form>
              )}
            </div>
          )}

          {/* ── Admin: Registrations & Applications Manager ── */}
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

        {/* ── Right Column: Sidebar Details Card ── */}
        <aside className="nc-detail-sidebar">
          {/* Admin Controls */}
          {isAdmin && (
            <div className="nc-admin-card">
              <div className="nc-admin-title">
                <Shield size={16} color="#881421" />
                <span>Admin Management</span>
              </div>
              <div className="nc-admin-actions">
                <Link to={`/admin/events/${event._id}/edit`} className="nc-btn-admin-edit">
                  <Edit size={14} /> Edit Event
                </Link>
                <button
                  type="button"
                  className="nc-btn-admin-delete"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleting}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
              {showDeleteModal && (
                <div className="admin-delete-confirm-box">
                  <p>Remove this event from public listing?</p>
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

          {/* Primary Logistics & Registration Card */}
          <div className="nc-summary-card">
            {/* Rows of event parameters */}
            <div className="nc-param-list">
              <div className="nc-param-row">
                <span className="nc-param-label">
                  <Calendar size={14} className="nc-param-icon" />
                  Date :
                </span>
                <span className="nc-param-val">{formatDate(event.date)}</span>
              </div>

              {event.location && (
                <div className="nc-param-row">
                  <span className="nc-param-label">
                    <MapPin size={14} className="nc-param-icon" />
                    Location :
                  </span>
                  <span className="nc-param-val">{event.location}</span>
                </div>
              )}

              {event.duration && (
                <div className="nc-param-row">
                  <span className="nc-param-label">
                    <Clock size={14} className="nc-param-icon" />
                    Duration :
                  </span>
                  <span className="nc-param-val">{event.duration}</span>
                </div>
              )}

              <div className="nc-param-row">
                <span className="nc-param-label">
                  <Layers size={14} className="nc-param-icon" />
                  Category :
                </span>
                <span className="nc-param-val" style={{ textTransform: 'capitalize' }}>
                  {event.category || 'General'}
                </span>
              </div>

              <div className="nc-param-row">
                <span className="nc-param-label">
                  <Users size={14} className="nc-param-icon" />
                  Seats left :
                </span>
                <span className="nc-param-val">
                  {event.capacity !== null ? (
                    event.spotsLeft !== null ? (
                      <span className={event.spotsLeft === 0 ? 'nc-seats-full' : 'nc-seats-avail'}>
                        {event.spotsLeft} / {event.capacity}
                      </span>
                    ) : (
                      `${event.capacity}`
                    )
                  ) : (
                    'Unlimited'
                  )}
                </span>
              </div>

              {event.registrationDeadline && (
                <div className="nc-param-row">
                  <span className="nc-param-label">
                    <Clock size={14} className="nc-param-icon" />
                    Deadline :
                  </span>
                  <span className={`nc-param-val ${deadlinePassed ? 'nc-deadline-closed' : ''}`}>
                    {formatShortDate(event.registrationDeadline)}
                  </span>
                </div>
              )}
            </div>

            {/* Price & Status */}
            <div className="nc-price-section">
              <div className="nc-price-row">
                <span className="nc-price-tag">
                  {event.fee || (event.isFree ? 'Free Admission' : 'Free')}
                </span>
                <span className="nc-fee-sub">
                  {event.isFree ? 'Complimentary Campus Event' : 'Registration Fee'}
                </span>
              </div>

              {remainingDays && (
                <div className="nc-countdown-row">
                  <Clock size={14} color="#881421" />
                  <span>{remainingDays}</span>
                </div>
              )}
            </div>

            {/* Enroll Now / Action Button */}
            {!isAdmin && (
              <div className="nc-cta-container">
                {isRegistered ? (
                  <div className="nc-registered-notice">
                    <Check size={16} strokeWidth={2.6} />
                    <span>You are registered for this event</span>
                  </div>
                ) : deadlinePassed ? (
                  <button type="button" className="nc-enroll-cta-btn disabled" disabled>
                    Registration Closed
                  </button>
                ) : isFull ? (
                  <button type="button" className="nc-enroll-cta-btn disabled" disabled>
                    Event Fully Booked
                  </button>
                ) : (
                  <a href="#reg-form" className="nc-enroll-cta-btn">
                    {event.registrationType === 'application' ? 'Apply Now' : 'Enroll Now'}
                  </a>
                )}
              </div>
            )}

            {/* Event Inclusions / Highlights */}
            <div className="nc-inclusions-section">
              <h4 className="nc-inclusions-title">This event includes:</h4>
              <ul className="nc-inclusions-list">
                <li className="nc-inclusion-item">
                  <Award size={14} color="#881421" />
                  <span>Certificate of participation</span>
                </li>
                {event.hasBreakfast && (
                  <li className="nc-inclusion-item">
                    <Coffee size={14} color="#881421" />
                    <span>Breakfast &amp; refreshments included</span>
                  </li>
                )}
                {event.laptopRequired && (
                  <li className="nc-inclusion-item">
                    <Laptop size={14} color="#881421" />
                    <span>Bring your own laptop</span>
                  </li>
                )}
                <li className="nc-inclusion-item">
                  <CheckCircle2 size={14} color="#881421" />
                  <span>Hands-on campus experience &amp; networking</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ── Contact Person for Queries Card ── */}
          <div className="nc-contact-card">
            <h4 className="nc-card-header-small">
              <UserCheck size={16} color="#881421" />
              <span>Any queries? Contact Us</span>
            </h4>
            <div className="nc-contact-details">
              <div className="nc-contact-name">
                {event.contactPerson?.name || `${event.organiser?.firstName || 'Campus'} ${event.organiser?.lastName || 'Events Team'}`}
              </div>
              {event.contactPerson?.phone && (
                <a href={`tel:${event.contactPerson.phone}`} className="nc-contact-link">
                  <Phone size={13} color="#881421" />
                  <span>{event.contactPerson.phone}</span>
                </a>
              )}
              <a
                href={`mailto:${event.contactPerson?.email || event.organiser?.email || 'events@sunway.edu.np'}`}
                className="nc-contact-link"
              >
                <Mail size={13} color="#881421" />
                <span>{event.contactPerson?.email || event.organiser?.email || 'events@sunway.edu.np'}</span>
              </a>
            </div>
          </div>

          {/* ── Share Event / Copy Link Card ── */}
          <div className="nc-share-card">
            <h4 className="nc-card-header-small">
              <Share2 size={15} color="#881421" />
              <span>Share this event:</span>
            </h4>
            <div className="nc-share-actions">
              <button
                type="button"
                onClick={handleCopyLink}
                className="nc-copy-link-btn"
              >
                {copiedLink ? <Check size={14} color="#15803d" /> : <Copy size={14} />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default EventDetailPage
