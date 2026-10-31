import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Bell,
  User,
  LogOut,
  Search,
  ChevronDown,
  Check,
  MapPin,
  Clock,
  AlertTriangle,
  Sparkles,
  Hourglass,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchEvents, getMyRegistrations } from '../utils/api'
import CampusIllustration from '../components/CampusIllustration'
import EventDetailPage from './EventDetail'
import './Dashboard.css'

// Category colors for badges
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

// Status configuration for registration tags
const STATUS_CONFIG = {
  confirmed: { label: 'Registered', cls: 'status-confirmed' },
  pending: { label: 'Pending Review', cls: 'status-pending' },
  selected: { label: 'Selected', cls: 'status-selected' },
  rejected: { label: 'Not Selected', cls: 'status-rejected' },
  cancelled: { label: 'Cancelled', cls: 'status-cancelled' },
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

const getInitials = (first = '', last = '') => {
  const f = first.trim().charAt(0).toUpperCase()
  const l = last.trim().charAt(0).toUpperCase()
  return f && l ? `${f}${l}` : f || 'S'
}

const formatEventDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatEventTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
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
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  return `${diffDays} days left`
}

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { id: routeEventId } = useParams()

  // Selected event for in-portal detail view (null = dashboard feeds)
  const [selectedEventId, setSelectedEventId] = useState(routeEventId || null)

  // Keep synced if URL parameter changes
  useEffect(() => {
    if (routeEventId) {
      setSelectedEventId(routeEventId)
    }
  }, [routeEventId])

  const handleOpenEvent = (evtId) => {
    setSelectedEventId(evtId)
    window.history.pushState(null, '', `/events/${evtId}`)
  }

  const handleBackFromEvent = () => {
    setSelectedEventId(null)
    window.history.pushState(null, '', '/dashboard')
  }

  const handleTabChange = (tabName) => {
    setSelectedEventId(null)
    setActiveTab(tabName)
    if (window.location.pathname !== '/dashboard') {
      window.history.pushState(null, '', '/dashboard')
    }
  }

  // Tab & UI state
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [hasSeenUpdates, setHasSeenUpdates] = useState(false)

  // Data state
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  const dropdownRef = useRef(null)

  // Load events and user registrations
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [eventsRes, regsRes] = await Promise.all([
          fetchEvents({ limit: 50 }),
          getMyRegistrations().catch(() => ({ registrations: [] })),
        ])

        if (isMounted) {
          setEvents(eventsRes.events || [])
          setRegistrations(regsRes.registrations || [])
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Set of registered event IDs
  const registeredEventIds = new Set(
    registrations
      .filter((r) => ['confirmed', 'pending', 'selected'].includes(r.status))
      .map((r) => (typeof r.event === 'object' ? r.event?._id : r.event))
  )

  // Metric 1: Upcoming Events count (events happening now or in the future)
  const now = new Date()
  const upcomingEvents = events.filter((e) => new Date(e.date) >= now)
  const upcomingEventsCount = upcomingEvents.length > 0 ? upcomingEvents.length : events.length

  // Metric 2: Registrations count (current user's registrations)
  const activeRegistrations = registrations.filter((r) =>
    ['confirmed', 'pending', 'selected'].includes(r.status)
  )
  const registrationsCount = activeRegistrations.length

  // Metric 3: Events Attended count
  const attendedCount = registrations.filter(
    (r) =>
      ['confirmed', 'selected'].includes(r.status) &&
      r.event?.date &&
      new Date(r.event.date) < now
  ).length

  // Filtered upcoming events list according to search query
  const filteredEvents = events.filter((e) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      e.title?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q)
    )
  })

  // Execute logout
  const handleConfirmLogout = () => {
    setShowLogoutModal(false)
    logout()
    navigate('/')
  }

  return (
    <div className="portal-layout">
      {/* ── Hover-Expandable Left Sidebar (Always Shows Logo) ───────────── */}
      <aside
        className={`portal-sidebar ${isHovered ? 'expanded' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Sidebar Brand Header with always visible logo */}
        <div
          className="portal-sidebar-header"
          onClick={() => handleTabChange('dashboard')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <div className="portal-brand">
            <img src="/logo.png" alt="SSRC Events Logo" className="portal-brand-logo" />
            <span className="portal-brand-title">SSRC Events</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="portal-nav-menu">
          <button
            type="button"
            onClick={() => handleTabChange('dashboard')}
            className={`portal-nav-link ${!selectedEventId && activeTab === 'dashboard' ? 'active' : ''}`}
            title="Dashboard"
          >
            <LayoutDashboard size={20} className="nav-icon" />
            <span className="nav-label">Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('events')}
            className={`portal-nav-link ${!selectedEventId && activeTab === 'events' ? 'active' : ''}`}
            title="Events"
          >
            <Calendar size={20} className="nav-icon" />
            <span className="nav-label">Events</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('registrations')}
            className={`portal-nav-link ${!selectedEventId && activeTab === 'registrations' ? 'active' : ''}`}
            title="My Registrations"
          >
            <ClipboardList size={20} className="nav-icon" />
            <span className="nav-label">My Registrations</span>
          </button>

          <button
            type="button"
            onClick={() => { handleTabChange('updates'); setHasSeenUpdates(true) }}
            className={`portal-nav-link ${!selectedEventId && activeTab === 'updates' ? 'active' : ''}`}
            title="Updates"
          >
            <div className="nav-icon-badge-wrap">
              <Bell size={20} className="nav-icon" />
              {!isHovered && !hasSeenUpdates && <span className="nav-dot-badge" />}
            </div>
            <span className="nav-label">Updates</span>
            {!hasSeenUpdates && <span className="nav-count-badge">2</span>}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('profile')}
            className={`portal-nav-link ${!selectedEventId && activeTab === 'profile' ? 'active' : ''}`}
            title="Profile"
          >
            <User size={20} className="nav-icon" />
            <span className="nav-label">Profile</span>
          </button>
        </nav>

        {/* Sidebar Footer with campus architecture watermark & logout */}
        <div className="portal-sidebar-footer">
          <div className="portal-sidebar-watermark" aria-hidden="true">
            <CampusIllustration />
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="portal-sidebar-logout"
            title="Logout"
          >
            <LogOut size={18} className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Workspace Area (Clean Neutral, NO Red Tint) ───────────────── */}
      <main className="portal-workspace">
        {/* Top Header Bar */}
        <header className="portal-topbar">
          {/* Search bar */}
          <div className="portal-search-box">
            <Search size={17} className="portal-search-icon" />
            <input
              type="text"
              placeholder="Search for events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="portal-search-input"
            />
          </div>

          {/* User profile dropdown trigger */}
          <div className="portal-user-menu-container" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="portal-avatar-button"
              aria-expanded={showUserDropdown}
            >
              <div className="portal-avatar-circle">
                {getInitials(user?.firstName, user?.lastName)}
              </div>
              <ChevronDown
                size={14}
                className={`portal-chevron-icon ${showUserDropdown ? 'rotated' : ''}`}
              />
            </button>

            {/* User Dropdown Card */}
            {showUserDropdown && (
              <div className="portal-user-dropdown-card">
                <div className="dropdown-user-header">
                  <div className="dropdown-avatar-circle">
                    {getInitials(user?.firstName, user?.lastName)}
                  </div>
                  <div className="dropdown-user-details">
                    <span className="dropdown-user-name">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="dropdown-user-role">
                      {user?.role === 'admin' ? 'Administrator' : 'Student'}
                    </span>
                  </div>
                </div>

                <div className="dropdown-divider-line" />

                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false)
                    setShowLogoutModal(true)
                  }}
                  className="dropdown-logout-button"
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Main Content */}
        <div className="portal-main-content">
          {selectedEventId ? (
            <div className="portal-event-detail-wrap">
              <EventDetailPage
                eventId={selectedEventId}
                onBack={handleBackFromEvent}
              />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
            <div className="portal-dashboard-body">
              {/* Left Column: Greeting, Metrics, Events */}
              <div className="portal-dashboard-left">
                {/* Personalized Greeting */}
                <section className="portal-greeting-section">
                  <h1 className="portal-greeting-heading">
                    {getGreeting()}, {user?.firstName} 👋
                  </h1>
                  <p className="portal-greeting-subtext">
                    Here's what's happening with your campus.
                  </p>
                </section>

                {/* 3 Metric Cards */}
                <section className="portal-metrics-row">
                  <div className="portal-metric-card">
                    <div className="portal-metric-circle" />
                    <div className="portal-metric-text">
                      <span className="portal-metric-value">{upcomingEventsCount}</span>
                      <span className="portal-metric-title">Upcoming Events</span>
                    </div>
                  </div>
                  <div className="portal-metric-card">
                    <div className="portal-metric-circle" />
                    <div className="portal-metric-text">
                      <span className="portal-metric-value">{registrationsCount}</span>
                      <span className="portal-metric-title">Registrations</span>
                    </div>
                  </div>
                  <div className="portal-metric-card">
                    <div className="portal-metric-circle" />
                    <div className="portal-metric-text">
                      <span className="portal-metric-value">{attendedCount}</span>
                      <span className="portal-metric-title">Events Attended</span>
                    </div>
                  </div>
                </section>

                {/* Upcoming Events */}
                <section className="portal-events-block">
                  <div className="portal-block-header">
                    <div className="portal-title-with-accent">
                      <span className="portal-title-accent-bar" />
                      <h2 className="portal-block-title">Upcoming Events</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTabChange('events')}
                      className="portal-block-view-all"
                    >
                      View All
                    </button>
                  </div>

                  {loading ? (
                    <div className="portal-loading-state">
                      <p>Loading campus events…</p>
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="portal-empty-events">
                      <p>No events found matching your search.</p>
                    </div>
                  ) : (
                    <div className="portal-events-feed">
                      {filteredEvents.map((evt) => {
                        const isRegistered = registeredEventIds.has(evt._id)
                        const remainingDays = getRemainingDays(evt.date)
                        const descSnippet = evt.description
                          ? evt.description.slice(0, 130) + (evt.description.length > 130 ? '…' : '')
                          : ''

                        return (
                          <div
                            key={evt._id}
                            onClick={() => handleOpenEvent(evt._id)}
                            className="portal-event-card-link"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleOpenEvent(evt._id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="portal-event-card">
                              <div className="portal-event-thumb-wrap">
                                <img
                                  src={evt.coverImage || '/connected_events.jpg'}
                                  alt={evt.title}
                                  className="portal-event-thumb"
                                />
                                {evt.date && (
                                  <div className="portal-event-date-badge">
                                    <span className="date-badge-month">
                                      {new Date(evt.date).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                                    </span>
                                    <span className="date-badge-day">
                                      {new Date(evt.date).getDate()}
                                    </span>
                                  </div>
                                )}
                                {isRegistered && (
                                  <span className="portal-registered-pill card-pill-overlay">
                                    <Check size={11} strokeWidth={2.5} />
                                    <span>Registered</span>
                                  </span>
                                )}
                              </div>
                              <div className="portal-event-card-body">
                                <div className="portal-event-card-top-row">
                                  {evt.category ? (
                                    <span className="portal-event-category-tag">{evt.category}</span>
                                  ) : <span />}
                                  {remainingDays && (
                                    <span className="portal-event-countdown-pill">
                                      <Clock size={12} className="meta-svg" />
                                      <span>{remainingDays}</span>
                                    </span>
                                  )}
                                </div>
                                <h3 className="portal-event-title">{evt.title}</h3>
                                {descSnippet && (
                                  <p className="portal-event-description">{descSnippet}</p>
                                )}
                                <div className="portal-event-card-footer">
                                  <span className="portal-meta-item">
                                    <Clock size={12} className="meta-svg" />
                                    {formatEventDate(evt.date)}{evt.date && ` · ${formatEventTime(evt.date)}`}
                                  </span>
                                  <span className="portal-meta-item">
                                    <MapPin size={12} className="meta-svg" />
                                    {evt.location || 'Sunway College Campus'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              </div>

              {/* Right Side Panel: in blank space below profile icon */}
              <aside className="portal-right-panel">
                {/* Campus image card */}
                <div className="portal-campus-card">
                  <img
                    src="/1st.jpeg"
                    alt="Sunway College Campus"
                    className="portal-campus-img"
                  />
                  <div className="portal-campus-overlay">
                    <h2 className="portal-campus-heading">
                      Your Campus.<br />Your Events.
                    </h2>
                    <p className="portal-campus-tagline">
                      Discover. Participate. Grow.
                    </p>
                  </div>
                </div>

                {/* Be a Part of Something Bigger */}
                <div className="portal-cta-card">
                  <div className="portal-cta-text">
                    <h3 className="portal-cta-heading">Be a Part of Something Bigger</h3>
                    <p className="portal-cta-sub">
                      Attend events, connect with others and make the most of your campus life.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="portal-cta-btn"
                    onClick={() => handleTabChange('events')}
                  >
                    Explore Events
                  </button>
                </div>
              </aside>
            </div>
          )}

          {activeTab === 'events' && (
            <section className="portal-full-tab-section">
              <div className="portal-block-header">
                <div className="portal-title-with-accent">
                  <span className="portal-title-accent-bar" />
                  <h2 className="portal-block-title">All Campus Events</h2>
                </div>
              </div>

              {events.length === 0 ? (
                <div className="portal-empty-events">
                  <p>No campus events available currently.</p>
                </div>
              ) : (
                <div className="portal-events-grid-2col">
                  {events.map((evt) => {
                    const isRegistered = registeredEventIds.has(evt._id)
                    const remainingDays = getRemainingDays(evt.date)
                    const descSnippet = evt.description
                      ? evt.description.slice(0, 140) + (evt.description.length > 140 ? '…' : '')
                      : ''
                    const enrolledCount = evt.registeredUsers?.length ?? 0
                    const capacityCount = evt.capacity || 60
                    const badgeColor = CATEGORY_COLORS[evt.category] || '#881421'

                    return (
                      <div
                        key={evt._id}
                        onClick={() => handleOpenEvent(evt._id)}
                        className="portal-grid-event-card"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleOpenEvent(evt._id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* ── Top Cover Image ── */}
                        <div
                          className="portal-grid-cover"
                          style={{
                            backgroundImage: evt.coverImage
                              ? `url(${evt.coverImage})`
                              : `linear-gradient(135deg, #881421 0%, #3d0a10 100%)`,
                          }}
                        >
                          {/* Date badge on the picture */}
                          {evt.date && (
                            <div className="portal-grid-date-badge">
                              <span className="grid-date-month">
                                {new Date(evt.date).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                              </span>
                              <span className="grid-date-day">
                                {new Date(evt.date).getDate()}
                              </span>
                            </div>
                          )}

                          {/* Registered pill overlay if registered */}
                          {isRegistered && (
                            <span className="portal-registered-pill card-pill-overlay">
                              <Check size={12} strokeWidth={2.5} />
                              <span>Registered</span>
                            </span>
                          )}
                        </div>

                        {/* ── White Information Area ── */}
                        <div className="portal-grid-card-body">
                          {/* Category badge in the white part */}
                          {evt.category && (
                            <div className="portal-grid-cat-wrap">
                              <span
                                className="portal-grid-category-pill"
                                style={{ background: badgeColor }}
                              >
                                {evt.category}
                              </span>
                            </div>
                          )}

                          {/* Title */}
                          <h3 className="portal-grid-card-title">{evt.title}</h3>

                          {/* Description excerpt */}
                          {descSnippet && (
                            <p className="portal-grid-card-desc">{descSnippet}</p>
                          )}

                          {/* Timing & Location with RED icons */}
                          <div className="portal-grid-meta-list">
                            <div className="portal-grid-meta-item">
                              <Calendar size={14} color="#881421" strokeWidth={2.2} />
                              <span>{formatEventDate(evt.date)}{evt.date && ` • ${formatEventTime(evt.date)}`}</span>
                            </div>
                            <div className="portal-grid-meta-item">
                              <MapPin size={14} color="#881421" strokeWidth={2.2} />
                              <span>{evt.location || 'Sunway College Campus'}</span>
                            </div>
                          </div>

                          {/* Subtle Divider */}
                          <div className="portal-grid-card-divider" />

                          {/* Bottom Row: Remaining time (bottom-left) and enrolled count (bottom-right) */}
                          <div className="portal-grid-card-bottom-row">
                            <div className="portal-grid-bottom-left">
                              <Clock size={13} color="#881421" strokeWidth={2.2} />
                              <span>{remainingDays || 'Upcoming'}</span>
                            </div>
                            <div className="portal-grid-bottom-right">
                              <Users size={13} color="#881421" strokeWidth={2.2} />
                              <span>{enrolledCount}/{capacityCount} enrolled</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {activeTab === 'registrations' && (
            <section className="portal-full-tab-section">
              <div className="portal-block-header">
                <div className="portal-title-with-accent">
                  <span className="portal-title-accent-bar" />
                  <h2 className="portal-block-title">My Registrations & Passes</h2>
                </div>
              </div>

              {registrations.length === 0 ? (
                <div className="portal-empty-tab">
                  <p>You haven't registered for any events yet.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('events')}
                    className="portal-btn-register-now"
                    style={{ marginTop: '12px' }}
                  >
                    Find Events to Join
                  </button>
                </div>
              ) : (
                <div className="portal-registrations-grid">
                  {registrations.map((reg) => (
                    <div key={reg._id} className="portal-registration-card">
                      <div className="reg-card-top">
                        <span
                          className={`reg-status-chip ${STATUS_CONFIG[reg.status]?.cls || ''}`}
                        >
                          {STATUS_CONFIG[reg.status]?.label || reg.status}
                        </span>
                        {reg.registrationCode && (
                          <span className="reg-code-label">Pass: {reg.registrationCode}</span>
                        )}
                      </div>
                      <h3 className="reg-event-title">{reg.event?.title || 'Campus Event'}</h3>
                      <div className="reg-meta-wrap">
                        <span>
                          <Calendar size={13} /> {formatEventDate(reg.event?.date)}
                        </span>
                        <span>
                          <MapPin size={13} /> {reg.event?.location || 'Sunway Campus'}
                        </span>
                      </div>
                      {reg.event?._id && (
                        <button
                          type="button"
                          onClick={() => handleOpenEvent(reg.event._id)}
                          className="portal-btn-view-details"
                          style={{ marginTop: '14px', width: '100%', textAlign: 'center', cursor: 'pointer', border: 'none' }}
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'updates' && (
            <section className="portal-full-tab-section">
              <div className="portal-block-header">
                <div className="portal-title-with-accent">
                  <span className="portal-title-accent-bar" />
                  <h2 className="portal-block-title">Campus Updates & Announcements</h2>
                </div>
              </div>

              <div className="portal-updates-list">
                <div className="portal-update-card">
                  <div className="update-icon-circle">
                    <Sparkles size={18} color="#881421" />
                  </div>
                  <div className="update-body">
                    <h4>Sunway Tech Hackathon 2026 teams confirmed</h4>
                    <p>
                      Mentorship schedules and venue allocations have been finalized. Check your registered pass details.
                    </p>
                    <span className="update-time">2 hours ago</span>
                  </div>
                </div>

                <div className="portal-update-card">
                  <div className="update-icon-circle">
                    <Sparkles size={18} color="#881421" />
                  </div>
                  <div className="update-body">
                    <h4>Welcome to the SSRC Events Student Portal</h4>
                    <p>
                      Easily browse upcoming workshops, track your attendance, and manage event passes from your dashboard.
                    </p>
                    <span className="update-time">1 day ago</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'profile' && (
            <section className="portal-full-tab-section">
              <div className="portal-block-header">
                <div className="portal-title-with-accent">
                  <span className="portal-title-accent-bar" />
                  <h2 className="portal-block-title">Student Profile</h2>
                </div>
              </div>

              <div className="portal-profile-box">
                <div className="profile-box-avatar">
                  {getInitials(user?.firstName, user?.lastName)}
                </div>
                <div className="profile-info-grid">
                  <div className="profile-field">
                    <span className="field-label">Full Name</span>
                    <span className="field-value">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </div>
                  <div className="profile-field">
                    <span className="field-label">Email Address</span>
                    <span className="field-value">{user?.email}</span>
                  </div>
                  {user?.studentId && (
                    <div className="profile-field">
                      <span className="field-label">Student ID</span>
                      <span className="field-value">{user?.studentId}</span>
                    </div>
                  )}
                  <div className="profile-field">
                    <span className="field-label">Account Role</span>
                    <span className="field-value capitalize">{user?.role || 'Student'}</span>
                  </div>
                  <div className="profile-field">
                    <span className="field-label">Affiliation</span>
                    <span className="field-value">Sunway College Kathmandu</span>
                  </div>
                </div>
              </div>
            </section>
          )}
            </>
          )}
        </div>
      </main>

      {/* ── Logout Confirmation Modal ──────────────────────────────────────── */}
      {showLogoutModal && (
        <div className="portal-modal-backdrop" onClick={() => setShowLogoutModal(false)}>
          <div
            className="portal-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-icon-circle">
              <AlertTriangle size={24} color="#881421" />
            </div>
            <h3 className="modal-title">Sign Out of SSRC Events?</h3>
            <p className="modal-subtitle">
              You will need to sign in again to register for campus workshops and access your event passes.
            </p>
            <div className="modal-action-row">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="modal-btn-confirm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
