import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Calendar, MapPin, Users, CheckCircle2, AlertCircle,
  Edit, Trash2, Shield, UserCheck, Clock, Send, XCircle, ChevronDown,
  ClipboardList, FileText, Share2, Copy, Check, Coffee, Laptop,
  Award, ExternalLink, Mail, Phone, User as UserIcon, UserX, X
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

  // Modal state for custom application / question forms
  const [showEnrollModal, setShowEnrollModal] = useState(false)

  // Tab navigation: 'overview' | 'instructor'
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

  // ── Handle Enroll Now click from right sidebar ─────────────────────────────
  const handleEnrollClick = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    // If event has custom registration questions, open interactive modal
    if (event?.formFields?.length > 0) {
      setShowEnrollModal(true)
      return
    }

    // Instant 1-click enrollment for open events without questionnaires
    setSubmitting(true)
    setActionMsg('')
    setActionError('')
    try {
      const res = await submitRegistration(id, [])
      setActionMsg(res.message || 'Successfully enrolled!')
      await loadMyRegistration()
      await loadEvent()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Handle Modal Registration Form Submission ──────────────────────────────
  const handleModalSubmit = async (e) => {
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
      setShowEnrollModal(false)
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
    if (!window.confirm('Are you sure you want to cancel your enrollment?')) return
    setSubmitting(true)
    setActionMsg('')
    setActionError('')
    try {
      const res = await cancelRegistration(id)
      setActionMsg(res.message || 'Enrollment cancelled.')
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
  const isPastEvent    = event?.date && new Date(event.date) < new Date()
  const deadlinePassed = event?.registrationDeadline && new Date() > new Date(event.registrationDeadline)
  const isFull         = event?.capacity !== null && event?.capacity !== undefined && (event?.spotsLeft === 0 || (event?.registeredUsers?.length ?? 0) >= event.capacity) && !isRegistered
  const canCancel      = isRegistered &&
    ['confirmed', 'pending'].includes(myRegistration?.status) &&
    !deadlinePassed &&
    !isPastEvent

  const hasMentor = !!(event?.mentor && (event.mentor.name || event.mentor.occupation))
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

  // Fallback rich outcomes & requirements
  const displayOutcomes = event.learningOutcomes?.length > 0 ? event.learningOutcomes : [
    'Gain hands-on practical experience through interactive sessions and live demonstrations.',
    'Collaborate and connect directly with fellow campus innovators and industry leaders.',
    'Receive verified Sunway credentials and certificate of completion for your portfolio.',
    'Direct Q&A session with organizers and industry practitioners.'
  ]

  const displayRequirements = event.requirements?.length > 0 ? event.requirements : [
    'Valid Sunway student identity card required for entry verification.',
    'Punctual arrival 15 minutes before scheduled start time.',
    'Curiosity, open mindset, and enthusiasm for active campus participation.'
  ]

  return (
    <div className="nextcoach-event-detail-container">
      {/* ── Breadcrumb Navigation: Events > Details ── */}
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

      {/* ── Event Title Row (Clean text pills without AI icons) ── */}
      <div className="nc-header-title-row">
        <div className="nc-title-tag-group">
          {event.category && (
            <span className="nc-text-category-tag">
              {event.category.toUpperCase()}
            </span>
          )}
          {isPastEvent && (
            <span className="nc-past-tag-pill">Past Event</span>
          )}
          {!isPastEvent && isFull && (
            <span className="nc-seats-full-pill">No Seats Available</span>
          )}
          {event.registrationType === 'application' && (
            <span className="nc-badge-app-pill">Application Required</span>
          )}
          {event.isFree && (
            <span className="nc-free-tag-pill">Free</span>
          )}
        </div>
        <h1 className="nc-event-headline">{event.title}</h1>
      </div>

      {/* ── Main Side-by-Side Flow ── */}
      <div className="nc-hero-two-column-layout">
        {/* LEFT COLUMN: Hero Image + Natural Human Layout */}
        <div className="nc-left-main-flow">
          {/* Cover Hero Image */}
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

          {/* Navigation Tabs: Overview vs Instructor */}
          <div className="nc-tabs-header">
            <button
              type="button"
              className={`nc-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              className={`nc-tab-btn ${activeTab === 'instructor' ? 'active' : ''}`}
              onClick={() => setActiveTab('instructor')}
            >
              Instructor
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="nc-tab-content">
              {/* Description Section */}
              <section className="nc-editorial-section">
                <h2 className="nc-editorial-heading">About the event</h2>
                <div className="nc-description-text">
                  {event.description}
                </div>
              </section>

              {/* What You'll Learn & Explore */}
              <section className="nc-editorial-section">
                <h2 className="nc-editorial-heading">What you will learn &amp; outcomes</h2>
                <div className="nc-natural-outcomes-list">
                  {displayOutcomes.map((item, i) => (
                    <div key={i} className="nc-natural-outcome-row">
                      <span className="nc-item-index">{i + 1}.</span>
                      <p className="nc-outcome-description">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Requirements & Prerequisites */}
              <section className="nc-editorial-section">
                <h2 className="nc-editorial-heading">Requirements</h2>
                <ul className="nc-natural-bullet-list">
                  {displayRequirements.map((req, i) => (
                    <li key={i} className="nc-natural-bullet-item">
                      {req}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Event Inclusions & Highlights */}
              <section className="nc-editorial-section">
                <h2 className="nc-editorial-heading">Key highlights</h2>
                <div className="nc-highlights-chips-row">
                  <span className="nc-editorial-pill">Certificate of Participation</span>
                  {event.hasBreakfast && (
                    <span className="nc-editorial-pill">Breakfast &amp; Refreshments Provided</span>
                  )}
                  {event.laptopRequired ? (
                    <span className="nc-editorial-pill">Laptop Required</span>
                  ) : (
                    <span className="nc-editorial-pill">No Laptop Required</span>
                  )}
                  <span className="nc-editorial-pill">Interactive Live Q&amp;A</span>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: INSTRUCTOR */}
          {activeTab === 'instructor' && (
            <div className="nc-tab-content">
              {hasMentor ? (
                <section className="nc-editorial-section">
                  <h2 className="nc-editorial-heading">Instructor Profile</h2>
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
                          <UserIcon size={40} color="#881421" />
                        </div>
                      )}
                    </div>
                    <div className="nc-mentor-info">
                      <h3 className="nc-mentor-name">{event.mentor.name}</h3>
                      {event.mentor.occupation && (
                        <p className="nc-mentor-occupation">{event.mentor.occupation}</p>
                      )}
                      {event.mentor.bio ? (
                        <p className="nc-mentor-bio">{event.mentor.bio}</p>
                      ) : (
                        <p className="nc-mentor-bio">
                          Industry practitioner leading this campus session with practical insights and hands-on guidance.
                        </p>
                      )}
                      {event.mentor.linkedin && (
                        <a
                          href={event.mentor.linkedin}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="nc-mentor-linkedin-btn"
                        >
                          <ExternalLink size={14} />
                          <span>View LinkedIn Profile</span>
                        </a>
                      )}
                    </div>
                  </div>
                </section>
              ) : (
                <div className="nc-no-instructor-state">
                  <UserX size={40} color="#9ca3af" />
                  <h3 className="nc-no-inst-title">No instructor found</h3>
                  <p className="nc-no-inst-desc">
                    This event is coordinated directly by Sunway Student Representative Committee and campus student leads.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Registration status confirmation (only shown when student has enrolled) */}
          {!isAdmin && isRegistered && (
            <div className="nc-enrolled-status-box">
              <div className="my-reg-header">
                <ClipboardList size={18} color="#881421" />
                <span>Your Enrollment Status</span>
              </div>
              <div className="my-reg-body">
                <span className={`reg-status-badge ${STATUS_CONFIG[myRegistration.status]?.cls}`}>
                  {STATUS_CONFIG[myRegistration.status]?.label || myRegistration.status}
                </span>
                <div className="my-reg-code">
                  <span className="reg-code-label">Passcode</span>
                  <span className="reg-code-value">{myRegistration.registrationCode}</span>
                </div>
                {myRegistration.answers?.length > 0 && (
                  <div className="my-reg-answers">
                    <p className="reg-answers-title">Your submitted details:</p>
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
                    <XCircle size={14} />
                    {submitting ? 'Cancelling…' : 'Cancel Enrollment'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Admin Attendees Section */}
          {isAdmin && (
            <div className="admin-attendees-section">
              <div className="attendees-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} color="#881421" />
                  <h3>
                    {event.registrationType === 'application' ? 'Applications' : 'Enrollments'}
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

        {/* RIGHT COLUMN: Sidebar with single primary Enroll Now CTA */}
        <aside className="nc-right-sidebar-flow">
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

          {/* Logistics Summary Card */}
          <div className="nc-summary-card">
            {/* Feedback messages */}
            {actionMsg && (
              <div className="action-success" style={{ marginBottom: '14px' }}>
                <CheckCircle2 size={14} /> {actionMsg}
              </div>
            )}
            {actionError && (
              <div className="action-error" style={{ marginBottom: '14px' }}>
                <AlertCircle size={14} /> {actionError}
              </div>
            )}

            {/* Parameters List */}
            <div className="nc-param-list">
              <div className="nc-param-row">
                <span className="nc-param-label">
                  <Calendar size={15} className="nc-param-icon" />
                  Date :
                </span>
                <span className="nc-param-val">{formatDate(event.date)}</span>
              </div>

              {event.location && (
                <div className="nc-param-row">
                  <span className="nc-param-label">
                    <MapPin size={15} className="nc-param-icon" />
                    Location :
                  </span>
                  <span className="nc-param-val">{event.location}</span>
                </div>
              )}

              {event.duration && (
                <div className="nc-param-row">
                  <span className="nc-param-label">
                    <Clock size={15} className="nc-param-icon" />
                    Duration :
                  </span>
                  <span className="nc-param-val">{event.duration}</span>
                </div>
              )}

              <div className="nc-param-row">
                <span className="nc-param-label">Category :</span>
                <span className="nc-param-val" style={{ textTransform: 'capitalize' }}>
                  {event.category || 'General'}
                </span>
              </div>

              <div className="nc-param-row">
                <span className="nc-param-label">
                  <Users size={15} className="nc-param-icon" />
                  Seats left :
                </span>
                <span className="nc-param-val">
                  {event.capacity !== null ? (
                    event.spotsLeft !== null ? (
                      <span className={event.spotsLeft === 0 ? 'nc-seats-full' : 'nc-seats-avail'}>
                        {event.spotsLeft} / {event.capacity} seats
                      </span>
                    ) : (
                      `${event.capacity} total seats`
                    )
                  ) : (
                    'Unlimited'
                  )}
                </span>
              </div>

              {event.registrationDeadline && (
                <div className="nc-param-row">
                  <span className="nc-param-label">
                    <Clock size={15} className="nc-param-icon" />
                    Deadline :
                  </span>
                  <span className={`nc-param-val ${deadlinePassed ? 'nc-deadline-closed' : ''}`}>
                    {formatShortDate(event.registrationDeadline)}
                  </span>
                </div>
              )}
            </div>

            {/* Price & Countdown */}
            <div className="nc-price-section">
              <div className="nc-price-row">
                <span className="nc-price-tag">
                  {event.fee || (event.isFree ? 'Free Admission' : 'Free')}
                </span>
                <span className="nc-fee-sub">
                  {event.isFree ? 'Complimentary Campus Event' : 'Standard Registration Fee'}
                </span>
              </div>

              {remainingDays && (
                <div className="nc-countdown-row">
                  <Clock size={14} color="#881421" />
                  <span>{remainingDays}</span>
                </div>
              )}
            </div>

            {/* Sole Primary Enroll Now CTA Button */}
            {!isAdmin && (
              <div className="nc-cta-container">
                {isRegistered ? (
                  <div className="nc-registered-notice">
                    <Check size={16} strokeWidth={2.6} />
                    <span>You are enrolled for this event</span>
                  </div>
                ) : isPastEvent ? (
                  <button type="button" className="nc-enroll-cta-btn disabled" disabled>
                    Past Event (Enrollment Closed)
                  </button>
                ) : deadlinePassed ? (
                  <button type="button" className="nc-enroll-cta-btn disabled" disabled>
                    Enrollment Closed
                  </button>
                ) : isFull ? (
                  <button type="button" className="nc-enroll-cta-btn disabled" disabled>
                    No Seats Available
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnrollClick}
                    className="nc-enroll-cta-btn"
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Processing…'
                      : event.registrationType === 'application'
                        ? 'Apply Now'
                        : 'Enroll Now'}
                  </button>
                )}
              </div>
            )}

            {/* Inclusions summary */}
            <div className="nc-inclusions-section">
              <h4 className="nc-inclusions-title">This event includes:</h4>
              <ul className="nc-inclusions-list">
                <li className="nc-inclusion-item">
                  <Award size={14} color="#881421" />
                  <span>Verified certificate of attendance</span>
                </li>
                {event.hasBreakfast && (
                  <li className="nc-inclusion-item">
                    <Coffee size={14} color="#881421" />
                    <span>Complimentary breakfast &amp; refreshments</span>
                  </li>
                )}
                {event.laptopRequired && (
                  <li className="nc-inclusion-item">
                    <Laptop size={14} color="#881421" />
                    <span>Laptop required for hands-on activities</span>
                  </li>
                )}
                <li className="nc-inclusion-item">
                  <CheckCircle2 size={14} color="#881421" />
                  <span>Networking with peers and organizers</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Person Card for Queries */}
          <div className="nc-contact-card">
            <h4 className="nc-card-header-small">
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

          {/* Share Event Card */}
          <div className="nc-share-card">
            <h4 className="nc-card-header-small">
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

      {/* ── Modal for Questionnaire / Application Questions (if any) ── */}
      {showEnrollModal && (
        <div className="nc-modal-backdrop" onClick={() => setShowEnrollModal(false)}>
          <div className="nc-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nc-modal-header">
              <h3 className="nc-modal-title">
                {event.registrationType === 'application' ? 'Event Application Form' : 'Complete Enrollment'}
              </h3>
              <button
                type="button"
                className="nc-modal-close-btn"
                onClick={() => setShowEnrollModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="nc-modal-form">
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
                        rows={3}
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

              <div className="nc-modal-footer">
                <button
                  type="button"
                  className="nc-modal-cancel-btn"
                  onClick={() => setShowEnrollModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="nc-enroll-cta-btn"
                  style={{ width: 'auto', padding: '10px 24px' }}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit & Enroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventDetailPage
