import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Calendar, MapPin, Users, CheckCircle2, AlertCircle,
  Edit, Trash2, Shield, UserCheck, Clock, Send, XCircle, ChevronDown,
  ClipboardList, FileText, Share2, Copy, Check, Coffee, Laptop,
  Award, ExternalLink, Mail, Phone, User as UserIcon, UserX, X, Search,
  Upload, QrCode
} from 'lucide-react'
import {
  fetchEventById, deleteEvent,
  submitRegistration, cancelRegistration,
  getMyRegistrationForEvent, getEventRegistrations, updateRegistrationStatus,
  uploadImage
} from '../utils/api'
import { useAuth } from '../context/AuthContext'
import EditEventPage from './EditEvent'
import { mediaUrl } from '../utils/mediaUrl'
import './EventDetail.css'

// Status badge config
const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', cls: 'status-confirmed' },
  attended:  { label: 'Attended', cls: 'status-attended' },
  pending:   { label: 'Application Pending', cls: 'status-pending' },
  selected:  { label: 'Selected', cls: 'status-selected' },
  rejected:  { label: 'Not Selected', cls: 'status-rejected' },
  cancelled: { label: 'Cancelled', cls: 'status-cancelled' },
}

const isLimitedCapacity = (ev) => ev?.capacity != null && Number(ev.capacity) > 0

const getAttendance = (reg) => {
  if (reg?.attendance === 'present' || reg?.attendance === 'absent') return reg.attendance
  if (reg?.status === 'attended') return 'present'
  return null
}

const canMarkAttendance = (reg) => ['confirmed', 'selected', 'attended'].includes(reg?.status)

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

const EventDetailPage = ({ eventId: propId, onBack, onRegistrationChange }) => {
  const params = useParams()
  const id = propId || params.id
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const handleBackToEvents = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(isAdmin ? '/admin' : '/dashboard')
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

  // Modal state for viewing submitted answers + passcode
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)

  // Tab navigation: 'overview' | 'instructor'
  const [activeTab, setActiveTab] = useState('overview')

  // Student's current registration for this event (null = not registered)
  const [myRegistration, setMyRegistration] = useState(undefined) // undefined = loading

  // Form answers state: { [fieldId]: string }
  const [answers, setAnswers] = useState({})
  // Payment screenshot for paid events
  const [paymentScreenshot, setPaymentScreenshot] = useState('')
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)
  const [screenshotError, setScreenshotError] = useState('')

  // Admin: list of all registrations for this event
  const [registrations, setRegistrations] = useState([])
  const [regLoading, setRegLoading] = useState(false)
  const [regActionMsg, setRegActionMsg] = useState('')

  // Admin: Edit event modal popup
  const [showEditModal, setShowEditModal] = useState(false)

  // Admin: Search & Filter states for Enrollments section
  const [attendeeSearch, setAttendeeSearch] = useState('')
  const [attendeeFilter, setAttendeeFilter] = useState('all') // 'all' | 'attended' | 'confirmed' | 'pending' | 'selected'
  const [selectedAnswersReg, setSelectedAnswersReg] = useState(null)

  // Load event details
  const loadEvent = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
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
    if (!id || !user || isAdmin) { setMyRegistration(null); return }
    try {
      const data = await getMyRegistrationForEvent(id)
      setMyRegistration(data.registration) // null if not registered
    } catch {
      setMyRegistration(null)
    }
  }, [id, user, isAdmin])

  // Admin: load all registrations
  const loadRegistrations = useCallback(async () => {
    if (!id || !isAdmin) return
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

  const [showCancelModal, setShowCancelModal] = useState(false)

  // ── Handle Enroll Now click from right sidebar ─────────────────────────────
  const handleEnrollClick = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    const isPaid = !event?.isFree && event?.fee && !/^free$/i.test(event.fee)

    // If event has custom registration questions OR is a paid event, open interactive modal
    if (event?.formFields?.length > 0 || isPaid) {
      setShowEnrollModal(true)
      return
    }

    // Instant 1-click enrollment for free open events without questionnaires
    setSubmitting(true)
    setActionMsg('')
    setActionError('')
    try {
      const res = await submitRegistration(id, { answers: [] })
      setActionMsg(res.message || 'Successfully enrolled!')
      if (res.registration) {
        setMyRegistration(res.registration)
      } else {
        await loadMyRegistration()
      }
      await loadEvent()
      if (onRegistrationChange) onRegistrationChange()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle uploading payment screenshot
  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshotError('')
    setUploadingScreenshot(true)
    try {
      const data = await uploadImage(file)
      setPaymentScreenshot(data.url)
    } catch (err) {
      setScreenshotError(err.message || 'Failed to upload screenshot')
    } finally {
      setUploadingScreenshot(false)
    }
  }

  // ── Handle Modal Registration Form Submission ──────────────────────────────
  const handleModalSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }

    const isPaid = !event?.isFree && event?.fee && !/^free$/i.test(event.fee)
    if (isPaid && !paymentScreenshot) {
      setActionError('Please upload a screenshot of your payment to proceed with enrollment.')
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
      const res = await submitRegistration(id, {
        answers: formattedAnswers,
        paymentScreenshot: isPaid ? paymentScreenshot : null,
      })
      setActionMsg(res.message || 'Registration submitted!')
      setShowEnrollModal(false)
      if (res.registration) {
        setMyRegistration(res.registration)
      } else {
        await loadMyRegistration()
      }
      await loadEvent()
      if (onRegistrationChange) onRegistrationChange()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Student cancel registration ────────────────────────────────────────────
  const handleCancelClick = () => {
    setShowCancelModal(true)
  }

  const handleCancelConfirm = async () => {
    setSubmitting(true)
    setActionMsg('')
    setActionError('')
    try {
      const res = await cancelRegistration(id)
      setActionMsg(res.message || 'Enrollment cancelled.')
      setMyRegistration(null)
      setShowCancelModal(false)
      await loadEvent()
      if (onRegistrationChange) onRegistrationChange()
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
      await updateRegistrationStatus(id, regId, { status })
      setRegActionMsg(`Applicant ${status} successfully.`)
      await loadRegistrations()
      if (onRegistrationChange) onRegistrationChange()
    } catch (err) {
      setRegActionMsg(`Error: ${err.message}`)
    }
  }

  const handleAttendanceChange = async (regId, attendance) => {
    setRegActionMsg('')
    try {
      await updateRegistrationStatus(id, regId, { attendance })
      setRegActionMsg(`Attendance marked ${attendance}.`)
      await loadRegistrations()
      if (onRegistrationChange) onRegistrationChange()
    } catch (err) {
      setRegActionMsg(`Error: ${err.message}`)
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const isRegistered   = myRegistration && ['confirmed', 'pending', 'selected', 'attended'].includes(myRegistration.status)
  const isPastEvent    = event?.date && new Date(event.date) < new Date()
  const deadlinePassed = event?.registrationDeadline && new Date() > new Date(event.registrationDeadline)
  const isFull         = event?.capacity !== null && event?.capacity !== undefined && (event?.spotsLeft === 0 || (event?.registeredUsers?.length ?? 0) >= event.capacity) && !isRegistered
  const canCancel      = isRegistered &&
    ['confirmed', 'pending', 'selected'].includes(myRegistration?.status) &&
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

  // Admin Enrollments section derived values
  const hasLimitedSeats = isLimitedCapacity(event)
  const totalEnrolled = registrations.length
  const attendedCount = registrations.filter(r => getAttendance(r) === 'present').length
  const absentCount = registrations.filter(r => getAttendance(r) === 'absent').length
  const confirmedCount = registrations.filter(r => r.status === 'confirmed' || r.status === 'selected').length
  const cancelledCount = registrations.filter(r => r.status === 'cancelled').length
  const pendingCount = registrations.filter(r => r.status === 'pending').length
  const selectedCount = registrations.filter(r => r.status === 'selected').length
  const rejectedCount = registrations.filter(r => r.status === 'rejected').length

  const filteredRegistrations = registrations.filter((reg) => {
    // Filter by tab
    if (attendeeFilter === 'attended' && getAttendance(reg) !== 'present') return false
    if (attendeeFilter === 'confirmed' && !['confirmed', 'selected'].includes(reg.status)) return false
    if (attendeeFilter === 'pending' && reg.status !== 'pending') return false
    if (attendeeFilter === 'selected' && reg.status !== 'selected') return false
    if (attendeeFilter === 'rejected' && reg.status !== 'rejected') return false
    if (attendeeFilter === 'cancelled' && reg.status !== 'cancelled') return false

    // Filter by search query
    if (!attendeeSearch.trim()) return true
    const q = attendeeSearch.toLowerCase().trim()
    const name = `${reg.student?.firstName || ''} ${reg.student?.lastName || ''}`.toLowerCase()
    const email = (reg.student?.email || '').toLowerCase()
    const code = (reg.registrationCode || '').toLowerCase()
    const studentId = (reg.student?.studentId || '').toLowerCase()
    return name.includes(q) || email.includes(q) || code.includes(q) || studentId.includes(q)
  })

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
          {hasLimitedSeats && (
            <span className="nc-badge-app-pill">Limited Seats</span>
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
                  {event.certificateProvided && (
                    <span className="nc-editorial-pill">Certificate of Participation</span>
                  )}
                  {event.hasBreakfast && (
                    <span className="nc-editorial-pill">Breakfast &amp; Refreshments Provided</span>
                  )}
                  {event.laptopRequired && (
                    <span className="nc-editorial-pill">Laptop Required</span>
                  )}
                  {!event.certificateProvided && !event.hasBreakfast && !event.laptopRequired && (
                    <span className="nc-editorial-pill" style={{ color: '#64748b' }}>Standard campus entry</span>
                  )}
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

          {/* Inline enrollment action bar — compact, no card */}
          {!isAdmin && isRegistered && (
            <div className="nc-enrollment-action-bar">
              <span className={`reg-status-badge ${STATUS_CONFIG[myRegistration.status]?.cls}`}>
                {STATUS_CONFIG[myRegistration.status]?.label || myRegistration.status}
              </span>
              <div className="nc-enrollment-bar-actions">
                <button
                  type="button"
                  className="nc-see-submission-btn"
                  onClick={() => setShowSubmissionModal(true)}
                >
                  See Submission
                </button>
                {canCancel && (
                  <button
                    type="button"
                    className="nc-cancel-enrollment-bar-btn"
                    onClick={handleCancelClick}
                    disabled={submitting}
                  >
                    {submitting ? 'Cancelling…' : 'Cancel Enrollment'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Admin Attendee & Application Management Section */}
          {isAdmin && (
            <div className="ed-enrollments-card">
              <div className="ed-enrollments-header">
                <div className="ed-enrollments-title-group">
                  <div className="ed-enrollments-icon-box">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h3 className="ed-enrollments-title">
                      {hasLimitedSeats ? 'Applications & Candidate Review' : 'Enrollments & Attendance'}
                    </h3>
                    <p className="ed-enrollments-subtitle">
                      Manage registered participants, review questionnaire responses, and track attendance.
                    </p>
                  </div>
                </div>
                <div className="ed-enrollments-count-pill">
                  <span>{totalEnrolled} Total Enrolled</span>
                </div>
              </div>

              {/* Summary Stats Strip */}
              <div className="ed-enrollments-stats-strip">
                <div className="ed-stat-box">
                  <span className="ed-stat-num">{totalEnrolled}</span>
                  <span className="ed-stat-label">Total Enrolled</span>
                </div>
                <div className="ed-stat-box ed-stat-box--attended">
                  <span className="ed-stat-num">{attendedCount}</span>
                  <span className="ed-stat-label">Present</span>
                </div>
                <div className="ed-stat-box ed-stat-box--absent">
                  <span className="ed-stat-num">{absentCount}</span>
                  <span className="ed-stat-label">Absent</span>
                </div>
                {hasLimitedSeats ? (
                  <>
                    <div className="ed-stat-box ed-stat-box--pending">
                      <span className="ed-stat-num">{pendingCount}</span>
                      <span className="ed-stat-label">Pending Review</span>
                    </div>
                    <div className="ed-stat-box ed-stat-box--selected">
                      <span className="ed-stat-num">{selectedCount}</span>
                      <span className="ed-stat-label">Selected</span>
                    </div>
                  </>
                ) : (
                  <div className="ed-stat-box ed-stat-box--selected">
                    <span className="ed-stat-num">{confirmedCount}</span>
                    <span className="ed-stat-label">Confirmed</span>
                  </div>
                )}
                {cancelledCount > 0 && (
                  <div className="ed-stat-box ed-stat-box--cancelled">
                    <span className="ed-stat-num">{cancelledCount}</span>
                    <span className="ed-stat-label">Cancelled</span>
                  </div>
                )}
              </div>

              {/* Action feedback message banner */}
              {regActionMsg && (
                <div className="ed-reg-alert-success">
                  <CheckCircle2 size={16} /> <span>{regActionMsg}</span>
                </div>
              )}

              {/* Search & Filter Bar */}
              <div className="ed-enrollments-toolbar">
                <div className="ed-enrollments-search-box">
                  <Search size={15} className="ed-search-icon" />
                  <input
                    type="text"
                    placeholder="Search enrolled students by name, email, or code…"
                    value={attendeeSearch}
                    onChange={(e) => setAttendeeSearch(e.target.value)}
                    className="ed-enrollments-search-input"
                  />
                  {attendeeSearch && (
                    <button
                      type="button"
                      className="ed-search-clear-btn"
                      onClick={() => setAttendeeSearch('')}
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="ed-enrollments-filter-pills">
                  <button
                    type="button"
                    className={`ed-filter-pill ${attendeeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setAttendeeFilter('all')}
                  >
                    All ({totalEnrolled})
                  </button>
                  {hasLimitedSeats ? (
                    <>
                      <button
                        type="button"
                        className={`ed-filter-pill ${attendeeFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setAttendeeFilter('pending')}
                      >
                        Pending ({pendingCount})
                      </button>
                      <button
                        type="button"
                        className={`ed-filter-pill ${attendeeFilter === 'selected' ? 'active' : ''}`}
                        onClick={() => setAttendeeFilter('selected')}
                      >
                        Selected ({selectedCount})
                      </button>
                      <button
                        type="button"
                        className={`ed-filter-pill ${attendeeFilter === 'attended' ? 'active' : ''}`}
                        onClick={() => setAttendeeFilter('attended')}
                      >
                        Present ({attendedCount})
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`ed-filter-pill ${attendeeFilter === 'confirmed' ? 'active' : ''}`}
                        onClick={() => setAttendeeFilter('confirmed')}
                      >
                        Registered ({confirmedCount})
                      </button>
                      <button
                        type="button"
                        className={`ed-filter-pill ${attendeeFilter === 'attended' ? 'active' : ''}`}
                        onClick={() => setAttendeeFilter('attended')}
                      >
                        Present ({attendedCount})
                      </button>
                    </>
                  )}
                  {cancelledCount > 0 && (
                    <button
                      type="button"
                      className={`ed-filter-pill ${attendeeFilter === 'cancelled' ? 'active' : ''}`}
                      onClick={() => setAttendeeFilter('cancelled')}
                    >
                      Cancelled ({cancelledCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Table or Empty state */}
              {regLoading ? (
                <div className="ed-enrollments-loading">
                  <Clock size={20} className="spinning" />
                  <span>Loading enrolled students…</span>
                </div>
              ) : registrations.length === 0 ? (
                <div className="ed-enrollments-empty-card">
                  <div className="ed-empty-icon-wrap">
                    <Users size={32} />
                  </div>
                  <h4 className="ed-empty-title">No Enrollments Yet</h4>
                  <p className="ed-empty-sub">
                    When students register for this event, their registration codes, questionnaire responses, and attendance status will be displayed here.
                  </p>
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="ed-enrollments-empty-card">
                  <p className="ed-empty-sub">
                    No enrolled students match your search <strong>"{attendeeSearch}"</strong>.
                  </p>
                  <button
                    type="button"
                    className="ed-empty-reset-btn"
                    onClick={() => { setAttendeeSearch(''); setAttendeeFilter('all'); }}
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (() => {
                const hasQuestions = Boolean(event.formFields && event.formFields.length > 0)
                const hasReview = hasLimitedSeats || pendingCount > 0

                return (
                  <div className="ed-reg-table-container">
                    <table className="ed-reg-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>#</th>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>Registered On</th>
                          <th>Status</th>
                          {(hasQuestions || !event.isFree) && <th>Submission / Proof</th>}
                          {hasReview && <th>Review</th>}
                          <th>Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRegistrations.map((reg, idx) => {
                          const student = reg.student || {}
                          const first = student.firstName || ''
                          const last = student.lastName || ''
                          const initials = ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase() || 'S'
                          const isCancelled = reg.status === 'cancelled'
                          const isRejected = reg.status === 'rejected'
                          const isSelected = reg.status === 'selected' || reg.status === 'attended'
                          const attendance = getAttendance(reg)
                          const showAttendance = canMarkAttendance(reg)
                          const hasAnswers = reg.answers && reg.answers.length > 0

                          return (
                            <tr key={reg._id} className={isCancelled ? 'ed-row-cancelled' : ''}>
                              <td className="ed-reg-td-idx">{idx + 1}</td>
                              <td>
                                <div className="ed-student-cell">
                                  <div className="ed-student-avatar">
                                    {initials}
                                  </div>
                                  <div className="ed-student-info">
                                    <div className="ed-student-name">
                                      {first} {last}
                                      {student.studentId && (
                                        <span className="ed-student-id-badge">{student.studentId}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="ed-student-email-cell">{student.email || '—'}</td>
                              <td className="ed-reg-date-cell">{formatDate(reg.createdAt)}</td>
                              <td>
                                <span className={`ed-status-badge ed-status-${reg.status}`}>
                                  {STATUS_CONFIG[reg.status]?.label || reg.status}
                                </span>
                              </td>

                              {/* Responses / Proof column */}
                              {(hasQuestions || !event.isFree) && (
                                <td>
                                  {isCancelled ? null : (hasAnswers || reg.paymentScreenshot) ? (
                                    <button
                                      type="button"
                                      className="ed-answers-btn"
                                      onClick={() => setSelectedAnswersReg(reg)}
                                      title="View student's questionnaire responses & payment proof"
                                    >
                                      <FileText size={13} />
                                      <span>
                                        {hasAnswers ? `Answers (${reg.answers.length})` : ''}
                                        {hasAnswers && reg.paymentScreenshot ? ' + ' : ''}
                                        {reg.paymentScreenshot ? 'Receipt' : ''}
                                      </span>
                                    </button>
                                  ) : (
                                    <span className="ed-no-answers">—</span>
                                  )}
                                </td>
                              )}

                              {/* Review column */}
                              {hasReview && (
                                <td>
                                  {isCancelled ? (
                                    <span className="ed-no-answers">—</span>
                                  ) : (
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      <button
                                        type="button"
                                        className={`ed-btn-confirm-review ${isSelected ? 'active' : ''}`}
                                        title="Select applicant"
                                        onClick={() => handleStatusChange(reg._id, 'selected')}
                                      >
                                        <Check size={12} /> Select
                                      </button>
                                      <button
                                        type="button"
                                        className={`ed-btn-reject-review ${isRejected ? 'active' : ''}`}
                                        title="Reject applicant"
                                        onClick={() => handleStatusChange(reg._id, 'rejected')}
                                      >
                                        <X size={12} /> Reject
                                      </button>
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* Attendance column — always rendered so it is never clipped/missing */}
                              <td>
                                {showAttendance ? (
                                  <div className="ed-reg-actions-row">
                                    <button
                                      type="button"
                                      className={`ed-att-btn ed-att-present ${attendance === 'present' ? 'active' : ''}`}
                                      onClick={() => handleAttendanceChange(reg._id, 'present')}
                                      title="Mark student as present"
                                    >
                                      <Check size={12} /> Present
                                    </button>
                                    <button
                                      type="button"
                                      className={`ed-att-btn ed-att-absent ${attendance === 'absent' ? 'active' : ''}`}
                                      onClick={() => handleAttendanceChange(reg._id, 'absent')}
                                      title="Mark student as absent"
                                    >
                                      <X size={12} /> Absent
                                    </button>
                                  </div>
                                ) : (
                                  <span className="ed-no-answers">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
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
                <button
                  type="button"
                  className="nc-btn-admin-edit"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit size={14} /> Edit Event
                </button>
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

              {isRegistered ? (
                <div className="nc-countdown-row nc-countdown-registered">
                  <span style={{ color: '#166534', fontWeight: 700 }}>Registered</span>
                </div>
              ) : remainingDays ? (
                <div className="nc-countdown-row">
                  <Clock size={14} color="#881421" />
                  <span>{remainingDays}</span>
                </div>
              ) : null}
            </div>

            {/* Sole Primary Enroll Now / Cancel CTA Button */}
            {!isAdmin && (
              <div className="nc-cta-container">
                {isRegistered ? (
                  <div className="nc-registered-cta-wrap">
                    <div className="nc-registered-notice">
                      <span>
                        Enrolled
                        {myRegistration?.createdAt && ` on ${formatShortDate(myRegistration.createdAt)}`}
                      </span>
                    </div>
                    {canCancel && (
                      <button
                        type="button"
                        onClick={handleCancelClick}
                        className="nc-cancel-now-btn"
                        disabled={submitting}
                      >
                        {submitting ? 'Cancelling…' : 'Cancel Registration'}
                      </button>
                    )}
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
                      : hasLimitedSeats
                        ? 'Apply Now'
                        : 'Enroll Now'}
                  </button>
                )}
              </div>
            )}

            {/* Inclusions summary */}
            {(event.certificateProvided || event.hasBreakfast || event.laptopRequired) && (
              <div className="nc-inclusions-section">
                <h4 className="nc-inclusions-title">This event includes:</h4>
                <ul className="nc-inclusions-list">
                  {event.certificateProvided && (
                    <li className="nc-inclusion-item">
                      <Award size={14} color="#881421" />
                      <span>Verified certificate of attendance</span>
                    </li>
                  )}
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
                </ul>
              </div>
            )}
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

      {/* ── Submission Detail Popup Modal ── */}
      {showSubmissionModal && myRegistration && (
        <div className="nc-modal-backdrop" onClick={() => setShowSubmissionModal(false)}>
          <div className="nc-submission-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nc-submission-modal-header">
              <div className="nc-submission-modal-title-group">
                <span className="nc-submission-modal-label">Your Enrollment</span>
                <h3 className="nc-submission-modal-event-name">{event.title}</h3>
              </div>
              <button
                type="button"
                className="nc-modal-close-btn"
                onClick={() => setShowSubmissionModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="nc-submission-modal-body">
              {/* Status + Passcode row */}
              <div className="nc-submission-status-row">
                <div className="nc-submission-status-col">
                  <span className="nc-submission-field-label">Status</span>
                  <span className={`reg-status-badge ${STATUS_CONFIG[myRegistration.status]?.cls}`}>
                    {STATUS_CONFIG[myRegistration.status]?.label || myRegistration.status}
                  </span>
                </div>
                <div className="nc-submission-passcode-col">
                  <span className="nc-submission-field-label">Your Passcode</span>
                  <div className="nc-submission-passcode-box">
                    {myRegistration.registrationCode}
                  </div>
                </div>
              </div>

              {/* Submitted answers */}
              {myRegistration.answers?.length > 0 ? (
                <div className="nc-submission-answers-block">
                  <p className="nc-submission-answers-title">Submitted Responses</p>
                  <div className="nc-submission-answers-list">
                    {myRegistration.answers.map((a, i) => (
                      <div key={i} className="nc-submission-answer-item">
                        <span className="nc-submission-q-num">Q{i + 1}</span>
                        <div className="nc-submission-qa-body">
                          <p className="nc-submission-q-text">{a.label}</p>
                          <p className="nc-submission-a-text">{a.value || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="nc-submission-no-answers">No additional responses submitted.</p>
              )}

              {/* Payment Receipt if submitted */}
              {myRegistration.paymentScreenshot && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155', margin: '0 0 8px' }}>Payment Receipt Attached:</p>
                  <a href={mediaUrl(myRegistration.paymentScreenshot)} target="_blank" rel="noreferrer">
                    <img
                      src={mediaUrl(myRegistration.paymentScreenshot)}
                      alt="Payment Receipt"
                      style={{ maxWidth: '140px', maxHeight: '140px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </a>
                </div>
              )}
            </div>

            <div className="nc-submission-modal-footer">
              <button
                type="button"
                className="nc-submission-close-btn"
                onClick={() => setShowSubmissionModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal for Questionnaire / Application Questions (if any) ── */}
      {showEnrollModal && (
        <div className="nc-modal-backdrop" onClick={() => setShowEnrollModal(false)}>
          <div className="nc-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nc-modal-header">
              <h3 className="nc-modal-title">
                {hasLimitedSeats ? 'Event Application Form' : 'Complete Enrollment'}
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
              {/* Payment Section for Paid Events */}
              {!event.isFree && event.fee && !/^free$/i.test(event.fee) && (
                <div style={{ background: '#fdf2f4', border: '1px solid #fecaca', borderRadius: '10px', padding: '16px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#881421', fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>
                    <QrCode size={18} />
                    <span>Payment Required: {event.fee}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 12px', lineHeight: 1.4 }}>
                    Please scan the QR code below using your banking/wallet app (eSewa, Khalti, or Mobile Banking) to pay the fee of <strong>{event.fee}</strong>, then upload the receipt screenshot.
                  </p>

                  {/* QR Image Display */}
                  {event.qrCode ? (
                    <div style={{ textAlign: 'center', margin: '10px 0 14px' }}>
                      <img
                        src={mediaUrl(event.qrCode)}
                        alt="Payment QR Code"
                        style={{ maxWidth: '180px', maxHeight: '180px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', padding: '6px' }}
                      />
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Scan with eSewa / Khalti / Mobile Banking</p>
                    </div>
                  ) : (
                    <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                      Please contact event organizer or transfer <strong>{event.fee}</strong> at entry verification.
                    </div>
                  )}

                  {/* Screenshot upload */}
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                      Upload Payment Screenshot *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <label
                        htmlFor="enroll-payment-screenshot"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '6px',
                          background: '#881421',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: uploadingScreenshot ? 'not-allowed' : 'pointer',
                          opacity: uploadingScreenshot ? 0.7 : 1,
                        }}
                      >
                        <Upload size={13} />
                        {uploadingScreenshot ? 'Uploading…' : paymentScreenshot ? 'Change Screenshot' : 'Upload Receipt Screenshot'}
                      </label>
                      <input
                        id="enroll-payment-screenshot"
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        disabled={uploadingScreenshot}
                        style={{ display: 'none' }}
                      />
                      {paymentScreenshot && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img
                            src={mediaUrl(paymentScreenshot)}
                            alt="Receipt"
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          />
                          <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Receipt attached</span>
                        </div>
                      )}
                    </div>
                    {screenshotError && (
                      <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>{screenshotError}</p>
                    )}
                  </div>
                </div>
              )}

              {event.formFields?.length > 0 && (
                <div className="reg-form-fields">
                  {event.formFields.map((field, idx) => (
                    <div key={field._id} className="reg-field">
                      <label className="reg-field-label">
                        <span className="reg-field-num">Q{idx + 1}.</span>
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

      {/* ── Modal for Enrollment Cancellation Confirmation ── */}
      {showCancelModal && (
        <div className="nc-modal-backdrop" onClick={() => !submitting && setShowCancelModal(false)}>
          <div className="nc-modal-box nc-cancel-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nc-modal-header">
              <h3 className="nc-modal-title">Cancel Enrollment</h3>
              <button
                type="button"
                className="nc-modal-close-btn"
                onClick={() => !submitting && setShowCancelModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="nc-cancel-modal-body">
              <h4>Are you sure you want to cancel your enrollment?</h4>
              <p>
                You are about to cancel your spot for <strong>{event?.title}</strong>. Your reserved seat will be released and made available to other students. You can re-enroll at any time before the registration deadline.
              </p>
            </div>
            <div className="nc-cancel-modal-footer">
              <button
                type="button"
                className="nc-cancel-modal-back-btn"
                onClick={() => setShowCancelModal(false)}
                disabled={submitting}
              >
                Keep My Spot
              </button>
              <button
                type="button"
                className="nc-confirm-cancel-btn"
                onClick={handleCancelConfirm}
                disabled={submitting}
              >
                {submitting ? 'Cancelling…' : 'Yes, Cancel Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal for Questionnaire Answers Inspection (Admin) ── */}
      {selectedAnswersReg && (
        <div className="nc-modal-backdrop" onClick={() => setSelectedAnswersReg(null)}>
          <div className="ed-answers-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ed-answers-modal-header">
              <div>
                <span className="ed-answers-modal-badge">Questionnaire Responses</span>
                <h3 className="ed-answers-modal-title">
                  {selectedAnswersReg.student?.firstName} {selectedAnswersReg.student?.lastName}
                </h3>
                <span className="ed-answers-modal-sub">
                  {selectedAnswersReg.student?.email} · Reg Code: <strong>{selectedAnswersReg.registrationCode}</strong>
                </span>
              </div>
              <button
                type="button"
                className="nc-modal-close-btn"
                onClick={() => setSelectedAnswersReg(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="ed-answers-modal-body">
              {selectedAnswersReg.paymentScreenshot && (
                <div style={{ marginBottom: '18px', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#881421', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <QrCode size={15} /> Payment Receipt
                  </div>
                  <a href={mediaUrl(selectedAnswersReg.paymentScreenshot)} target="_blank" rel="noreferrer" title="Click to view full receipt">
                    <img
                      src={mediaUrl(selectedAnswersReg.paymentScreenshot)}
                      alt="Student payment receipt"
                      style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </a>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Click image to open full preview in new tab</p>
                </div>
              )}

              {selectedAnswersReg.answers?.map((ans, idx) => (
                <div key={idx} className="ed-answer-item-card">
                  <div className="ed-answer-q-label">
                    <span className="ed-answer-idx">Q{idx + 1}</span>
                    <span>{ans.label}</span>
                  </div>
                  <div className="ed-answer-value">
                    {ans.value || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No response provided</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="ed-answers-modal-footer">
              <button
                type="button"
                className="ed-answers-close-btn"
                onClick={() => setSelectedAnswersReg(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal for Editing Event (Admin) with blurred backdrop ── */}
      {showEditModal && (
        <EditEventPage
          eventId={event._id}
          isModal={true}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            loadEvent()
            if (onRegistrationChange) onRegistrationChange()
          }}
        />
      )}
    </div>
  )
}

export default EventDetailPage
