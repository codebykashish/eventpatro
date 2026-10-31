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
  Filter,
  X,
  ArrowRight,
  SlidersHorizontal,
  Pencil,
  CalendarDays,
  BookMarked,
  Trophy,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchEvents, getMyRegistrations } from '../utils/api'
import CampusIllustration from '../components/CampusIllustration'
import EventDetailPage from './EventDetail'
import './Dashboard.css'

// Categories for the filter sidebar matching the mockup
const FILTER_CATEGORIES = [
  { id: 'workshop', label: 'Workshop', icon: '🔧' },
  { id: 'hackathon', label: 'Hackathon', icon: '</>' },
  { id: 'seminar', label: 'Seminar', icon: '🎓' },
  { id: 'cultural', label: 'Cultural', icon: '🎭' },
  { id: 'sports', label: 'Sports', icon: '🏆' },
]

// Number of events displayed per page in the Explore tab
const EVENTS_PER_PAGE = 9

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
  const [profileActivityTab, setProfileActivityTab] = useState('registered')

  // Explore Events Filter States
  const [filterSearch, setFilterSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [timelineFilter, setTimelineFilter] = useState('all') // 'all' | 'upcoming' | 'past'
  const [dateFilter, setDateFilter] = useState('any')
  const [availabilityFilters, setAvailabilityFilters] = useState({
    openRegistration: false,
    availableSeats: false,
  })
  const [sortBy, setSortBy] = useState('upcoming')

  // Pagination for Explore Events tab (resets to 1 whenever filters/sort change)
  const [currentPage, setCurrentPage] = useState(1)

  const toggleCategory = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    )
    setCurrentPage(1)
  }

  const toggleAvailability = (key) => {
    setAvailabilityFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    setFilterSearch('')
    setSelectedCategories([])
    setTimelineFilter('all')
    setDateFilter('any')
    setAvailabilityFilters({ openRegistration: false, availableSeats: false })
    setCurrentPage(1)
  }

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

  // Filtered and sorted events for Explore Campus Events tab
  const exploreFilteredEvents = events
    .filter((evt) => {
      // 1. Search text
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase()
        const matches =
          evt.title?.toLowerCase().includes(q) ||
          evt.description?.toLowerCase().includes(q) ||
          evt.location?.toLowerCase().includes(q)
        if (!matches) return false
      }

      // 2. Categories
      if (selectedCategories.length > 0) {
        const cat = (evt.category || '').toLowerCase()
        const matchesCat = selectedCategories.some((c) => {
          if (c === 'hackathon') {
            return cat.includes('hackathon') || evt.title?.toLowerCase().includes('hackathon')
          }
          return cat === c
        })
        if (!matchesCat) return false
      }

      // 3. Timeline Filter (Upcoming vs Past)
      const evtDate = evt.date ? new Date(evt.date) : null
      const isPastEvent = evtDate && evtDate < now
      if (timelineFilter === 'upcoming' && isPastEvent) return false
      if (timelineFilter === 'past' && !isPastEvent) return false

      // 4. Date window (week / month)
      if (dateFilter !== 'any' && evt.date) {
        const evtTime = new Date(evt.date).getTime()
        const currTime = new Date().getTime()
        const diffDays = (evtTime - currTime) / (1000 * 60 * 60 * 24)
        if (dateFilter === 'week') {
          if (diffDays < 0 || diffDays > 7) return false
        } else if (dateFilter === 'month') {
          if (diffDays < 0 || diffDays > 30) return false
        }
      }

      // 5. Availability
      if (availabilityFilters.openRegistration) {
        if (evt.registrationDeadline && new Date(evt.registrationDeadline) < new Date()) {
          return false
        }
      }
      if (availabilityFilters.availableSeats) {
        if (evt.capacity && (evt.registeredUsers?.length ?? 0) >= evt.capacity) {
          return false
        }
      }

      return true
    })
    .sort((a, b) => {
      if (sortBy === 'upcoming') {
        return new Date(a.date || 0) - new Date(b.date || 0)
      } else if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      } else if (sortBy === 'popular') {
        return (b.registeredUsers?.length ?? 0) - (a.registeredUsers?.length ?? 0)
      }
      return 0
    })

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil(exploreFilteredEvents.length / EVENTS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedEvents = exploreFilteredEvents.slice(
    (safePage - 1) * EVENTS_PER_PAGE,
    safePage * EVENTS_PER_PAGE
  )

  const goToPage = (page) => {
    setCurrentPage(page)
    document.querySelector('.explore-content-main')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Execute logout
  const handleConfirmLogout = () => {
    setShowLogoutModal(false)
    logout()
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
                                {new Date(evt.date) < now && (
                                  <span className="portal-past-pill card-pill-overlay">
                                    Past Event
                                  </span>
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
                                  {new Date(evt.date) < now ? (
                                    <span className="portal-event-countdown-pill past">
                                      <Clock size={12} className="meta-svg" />
                                      <span>Completed</span>
                                    </span>
                                  ) : remainingDays ? (
                                    <span className="portal-event-countdown-pill">
                                      <Clock size={12} className="meta-svg" />
                                      <span>{remainingDays}</span>
                                    </span>
                                  ) : null}
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
            <section className="explore-events-section">
              {/* Top Header Row matching mockup */}
              <div className="explore-events-header">
                <div className="explore-header-left">
                  <div className="portal-title-accent-bar" style={{ width: '40px', height: '4px', marginBottom: '8px' }} />
                  <h1 className="explore-main-title">Explore Campus Events</h1>
                  <p className="explore-main-subtitle">
                    Discover, join and be part of exciting events at Sunway College.
                  </p>
                </div>
                <div className="explore-header-right">
                  <span className="explore-events-count">
                    <strong>{exploreFilteredEvents.length}</strong> events found
                  </span>
                </div>
              </div>

              {/* Two-Column Layout: Sticky Left Filter + Right Scrollable Cards */}
              <div className="explore-layout-wrap">
                {/* ── Fixed / Sticky Left Filter Sidebar ── */}
                <aside className="explore-filter-sidebar">
                  <div className="explore-filter-card">
                    {/* Filter Card Header */}
                    <div className="filter-card-header">
                      <Filter size={18} color="#881421" strokeWidth={2.5} />
                      <h3 className="filter-card-title">Filter Events</h3>
                    </div>

                    {/* Timeline Group: Upcoming vs Past Events */}
                    <div className="filter-group">
                      <div className="filter-group-header">
                        <Clock size={14} className="filter-group-icon" />
                        <span className="filter-group-title">Event Status</span>
                      </div>
                      <div className="filter-options-list">
                        <label className="filter-radio-row">
                          <input
                            type="radio"
                            name="timelineFilter"
                            value="all"
                            checked={timelineFilter === 'all'}
                            onChange={(e) => {
                              setTimelineFilter(e.target.value)
                              setCurrentPage(1)
                            }}
                            className="filter-radio"
                          />
                          <span className="filter-radio-label">All Events</span>
                        </label>
                        <label className="filter-radio-row">
                          <input
                            type="radio"
                            name="timelineFilter"
                            value="upcoming"
                            checked={timelineFilter === 'upcoming'}
                            onChange={(e) => {
                              setTimelineFilter(e.target.value)
                              setCurrentPage(1)
                            }}
                            className="filter-radio"
                          />
                          <span className="filter-radio-label">Upcoming Events</span>
                        </label>
                        <label className="filter-radio-row">
                          <input
                            type="radio"
                            name="timelineFilter"
                            value="past"
                            checked={timelineFilter === 'past'}
                            onChange={(e) => {
                              setTimelineFilter(e.target.value)
                              setCurrentPage(1)
                            }}
                            className="filter-radio"
                          />
                          <span className="filter-radio-label">Past Events</span>
                        </label>
                      </div>
                    </div>

                    {/* Categories Group */}
                    <div className="filter-group">
                      <div className="filter-group-header">
                        <SlidersHorizontal size={14} className="filter-group-icon" />
                        <span className="filter-group-title">Categories</span>
                      </div>
                      <div className="filter-options-list">
                        {FILTER_CATEGORIES.map((cat) => {
                          const isChecked = selectedCategories.includes(cat.id)
                          return (
                            <label key={cat.id} className="filter-checkbox-row">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleCategory(cat.id)}
                                className="filter-checkbox"
                              />
                              <span className="filter-checkbox-label">{cat.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    {/* Date Group */}
                    <div className="filter-group">
                      <div className="filter-group-header">
                        <Calendar size={14} className="filter-group-icon" />
                        <span className="filter-group-title">Date</span>
                      </div>
                      <div className="filter-options-list">
                        <label className="filter-radio-row">
                          <input
                            type="radio"
                            name="dateFilter"
                            value="any"
                            checked={dateFilter === 'any'}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="filter-radio"
                          />
                          <span className="filter-radio-label">Any date</span>
                        </label>
                        <label className="filter-radio-row">
                          <input
                            type="radio"
                            name="dateFilter"
                            value="week"
                            checked={dateFilter === 'week'}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="filter-radio"
                          />
                          <span className="filter-radio-label">This week</span>
                        </label>
                        <label className="filter-radio-row">
                          <input
                            type="radio"
                            name="dateFilter"
                            value="month"
                            checked={dateFilter === 'month'}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="filter-radio"
                          />
                          <span className="filter-radio-label">This month</span>
                        </label>
                      </div>
                    </div>

                    {/* Availability Group */}
                    <div className="filter-group">
                      <div className="filter-group-header">
                        <Users size={14} className="filter-group-icon" />
                        <span className="filter-group-title">Availability</span>
                      </div>
                      <div className="filter-options-list">
                        <label className="filter-checkbox-row">
                          <input
                            type="checkbox"
                            checked={availabilityFilters.openRegistration}
                            onChange={() => toggleAvailability('openRegistration')}
                            className="filter-checkbox"
                          />
                          <span className="filter-checkbox-label">Open for registration</span>
                        </label>
                        <label className="filter-checkbox-row">
                          <input
                            type="checkbox"
                            checked={availabilityFilters.availableSeats}
                            onChange={() => toggleAvailability('availableSeats')}
                            className="filter-checkbox"
                          />
                          <span className="filter-checkbox-label">Available seats only</span>
                        </label>
                      </div>
                    </div>


                  </div>
                </aside>

                {/* ── Right Content Area: Sort Bar, Filter Chips & Cards ── */}
                <div className="explore-content-main">
                  {/* Top Bar: Sort By dropdown + Active filter tags */}
                  <div className="explore-actions-bar">
                    <div className="explore-sort-wrap">
                      <label className="explore-sort-label">Sort by:</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="explore-sort-select"
                      >
                        <option value="upcoming">Upcoming first</option>
                        <option value="newest">Newest first</option>
                        <option value="popular">Most popular</option>
                      </select>
                    </div>

                    {/* Active Filter Chips */}
                    <div className="explore-active-chips">
                      {selectedCategories.map((catId) => {
                        const cat = FILTER_CATEGORIES.find((c) => c.id === catId)
                        return (
                          <span key={catId} className="filter-chip">
                            <span>{cat?.label || catId}</span>
                            <button
                              type="button"
                              onClick={() => toggleCategory(catId)}
                              className="chip-remove-btn"
                              aria-label={`Remove ${cat?.label} filter`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        )
                      })}

                      {dateFilter !== 'any' && (
                        <span className="filter-chip">
                          <span>{dateFilter === 'week' ? 'This week' : 'This month'}</span>
                          <button
                            type="button"
                            onClick={() => setDateFilter('any')}
                            className="chip-remove-btn"
                            aria-label="Remove date filter"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )}

                      {availabilityFilters.openRegistration && (
                        <span className="filter-chip">
                          <span>Open for registration</span>
                          <button
                            type="button"
                            onClick={() => toggleAvailability('openRegistration')}
                            className="chip-remove-btn"
                            aria-label="Remove open registration filter"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )}

                      {availabilityFilters.availableSeats && (
                        <span className="filter-chip">
                          <span>Available seats</span>
                          <button
                            type="button"
                            onClick={() => toggleAvailability('availableSeats')}
                            className="chip-remove-btn"
                            aria-label="Remove available seats filter"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )}

                      {timelineFilter !== 'all' && (
                        <span className="filter-chip">
                          <span>{timelineFilter === 'upcoming' ? 'Upcoming Events' : 'Past Events'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTimelineFilter('all')
                              setCurrentPage(1)
                            }}
                            className="chip-remove-btn"
                            aria-label="Remove timeline filter"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )}

                      {(selectedCategories.length > 0 ||
                        timelineFilter !== 'all' ||
                        dateFilter !== 'any' ||
                        availabilityFilters.openRegistration ||
                        availabilityFilters.availableSeats ||
                        filterSearch) && (
                        <button
                          type="button"
                          onClick={clearAllFilters}
                          className="filter-clear-all-btn"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Event Cards Grid: exactly 2 per row — paginated */}
                  {exploreFilteredEvents.length === 0 ? (
                    <div className="explore-empty-state">
                      <p>No events match the selected filters.</p>
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="btn-reset-filters-clean"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="explore-cards-grid">
                        {paginatedEvents.map((evt) => {
                          const isRegistered = registeredEventIds.has(evt._id)
                          const descSnippet = evt.description
                            ? evt.description.slice(0, 110) + (evt.description.length > 110 ? '…' : '')
                            : ''
                          const enrolledCount = evt.registeredUsers?.length ?? 0
                          const capacityCount = evt.capacity
                          const categoryLabel = evt.category || 'Event'

                          return (
                            <div
                              key={evt._id}
                              onClick={() => handleOpenEvent(evt._id)}
                              className="explore-event-card"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && handleOpenEvent(evt._id)}
                            >
                              {/* Card Cover Image with Category overlay on image top-left */}
                              <div
                                className="explore-card-cover"
                                style={{
                                  backgroundImage: evt.coverImage
                                    ? `url(${evt.coverImage})`
                                    : `linear-gradient(135deg, #881421 0%, #3d0a10 100%)`,
                                }}
                              >
                                <span className="explore-card-cat-tag">
                                  {categoryLabel}
                                </span>

                                {(() => {
                                  const isPast = evt.date && new Date(evt.date) < now
                                  const isFull = capacityCount !== null && capacityCount !== undefined && enrolledCount >= capacityCount
                                  return (
                                    <div className="explore-card-top-badges">
                                      {isPast && (
                                        <span className="explore-past-event-badge">
                                          Past Event
                                        </span>
                                      )}
                                      {!isPast && isFull && (
                                        <span className="explore-full-badge">
                                          No Seats Available
                                        </span>
                                      )}
                                      {isRegistered && (
                                        <span className="explore-registered-badge">
                                          <Check size={11} strokeWidth={2.6} /> Registered
                                        </span>
                                      )}
                                    </div>
                                  )
                                })()}
                              </div>

                              {/* Card Body */}
                              <div className="explore-card-body">
                                <h3 className="explore-card-title">{evt.title}</h3>
                                {descSnippet && (
                                  <p className="explore-card-snippet">{descSnippet}</p>
                                )}

                                {/* Date & Location with red icons */}
                                <div className="explore-card-meta">
                                  <div className="explore-meta-item">
                                    <Calendar size={13} color="#881421" strokeWidth={2.2} />
                                    <span>{formatEventDate(evt.date)}{evt.date && ` • ${formatEventTime(evt.date)}`}</span>
                                  </div>
                                  <div className="explore-meta-item">
                                    <MapPin size={13} color="#881421" strokeWidth={2.2} />
                                    <span>{evt.location || 'Sunway College Campus'}</span>
                                  </div>
                                </div>

                                {/* Card Bottom Row */}
                                <div className="explore-card-footer">
                                  {(() => {
                                    const isFull = capacityCount !== null && capacityCount !== undefined && enrolledCount >= capacityCount
                                    return (
                                      <span className={`explore-spots-count ${isFull ? 'spots-full' : ''}`}>
                                        <Users size={13} color={isFull ? '#b91c1c' : '#881421'} strokeWidth={2.2} />
                                        {isFull
                                          ? 'No seats available'
                                          : capacityCount
                                            ? `${enrolledCount} / ${capacityCount} spots`
                                            : 'Unlimited spots'}
                                      </span>
                                    )
                                  })()}
                                  {(() => {
                                    const isPast = evt.date && new Date(evt.date) < now
                                    if (isPast) {
                                      return (
                                        <span className="explore-days-left past">
                                          <Clock size={13} color="#64748b" strokeWidth={2.2} />
                                          Completed
                                        </span>
                                      )
                                    }
                                    const rem = getRemainingDays(evt.date)
                                    return rem ? (
                                      <span className="explore-days-left">
                                        <Clock size={13} color="#881421" strokeWidth={2.2} />
                                        {rem}
                                      </span>
                                    ) : null
                                  })()}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* ── Pagination Bar ── */}
                      {totalPages > 1 && (
                        <div className="explore-pagination">
                          {/* Previous */}
                          <button
                            type="button"
                            className="page-nav-btn"
                            onClick={() => goToPage(safePage - 1)}
                            disabled={safePage === 1}
                            aria-label="Previous page"
                          >
                            ‹
                          </button>

                          {/* Numbered pages with ellipsis */}
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            const nearCurrent = Math.abs(page - safePage) <= 1
                            const isEdge = page === 1 || page === totalPages
                            const show = isEdge || nearCurrent

                            const ellipsisBefore = page === safePage - 2 && safePage > 3
                            const ellipsisAfter = page === safePage + 2 && safePage < totalPages - 2

                            if (ellipsisBefore || ellipsisAfter) {
                              return (
                                <span key={`ell-${page}`} className="page-ellipsis">
                                  …
                                </span>
                              )
                            }
                            if (!show) return null
                            return (
                              <button
                                key={page}
                                type="button"
                                className={`page-num-btn${page === safePage ? ' active' : ''}`}
                                onClick={() => goToPage(page)}
                                aria-current={page === safePage ? 'page' : undefined}
                              >
                                {page}
                              </button>
                            )
                          })}

                          {/* Next */}
                          <button
                            type="button"
                            className="page-nav-btn"
                            onClick={() => goToPage(safePage + 1)}
                            disabled={safePage === totalPages}
                            aria-label="Next page"
                          >
                            ›
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
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
            <section className="portal-full-tab-section profile-page-section">

              {/* ── Top Row: Hero Card & Account Info beside each other ── */}
              <div className="profile-top-row">
                {/* Hero Block (Avatar + stats) */}
                <div className="profile-hero-card">
                  {/* Avatar + pencil */}
                  <div className="profile-avatar-wrap">
                    <div className="profile-avatar-circle">
                      {getInitials(user?.firstName, user?.lastName)}
                    </div>
                    <button className="profile-avatar-edit-btn" title="Edit profile picture">
                      <Pencil size={13} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Name + role pill */}
                  <div className="profile-hero-identity">
                    <h2 className="profile-hero-name">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <span className="profile-hero-role-pill">
                      {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student'}
                    </span>
                  </div>

                  {/* Quick stat row */}
                  <div className="profile-stats-row">
                    <div className="profile-stat-item">
                      <span className="profile-stat-number">{registrations.length}</span>
                      <span className="profile-stat-label">Registered</span>
                    </div>
                    <div className="profile-stat-divider" />
                    <div className="profile-stat-item">
                      <span className="profile-stat-number">
                        {registrations.filter(r => r.status === 'attended').length}
                      </span>
                      <span className="profile-stat-label">Attended</span>
                    </div>
                    <div className="profile-stat-divider" />
                    <div className="profile-stat-item">
                      <span className="profile-stat-number">
                        {registrations.filter(r => new Date(r.event?.date) < new Date()).length}
                      </span>
                      <span className="profile-stat-label">Completed</span>
                    </div>
                  </div>
                </div>

                {/* Account Information Card beside hero */}
                <div className="profile-info-card">
                  <h3 className="profile-info-card-title">Account Information</h3>
                  <div className="profile-info-fields-grid">
                    <div className="profile-info-field">
                      <span className="profile-info-label">Full Name</span>
                      <span className="profile-info-value">{user?.firstName} {user?.lastName}</span>
                    </div>
                    <div className="profile-info-field">
                      <span className="profile-info-label">Email Address</span>
                      <span className="profile-info-value">{user?.email}</span>
                    </div>
                    {user?.studentId && (
                      <div className="profile-info-field">
                        <span className="profile-info-label">Student ID</span>
                        <span className="profile-info-value">{user.studentId}</span>
                      </div>
                    )}
                    <div className="profile-info-field">
                      <span className="profile-info-label">Account Role</span>
                      <span className="profile-info-value capitalize">{user?.role || 'Student'}</span>
                    </div>
                    <div className="profile-info-field">
                      <span className="profile-info-label">Affiliation</span>
                      <span className="profile-info-value">Sunway College Kathmandu</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Activity Tabs (Instagram style) ── */}
              <div className="profile-activity-section">
                <div className="profile-activity-tabs">
                  <button
                    className={`profile-activity-tab ${profileActivityTab === 'registered' ? 'active' : ''}`}
                    onClick={() => setProfileActivityTab('registered')}
                  >
                    <BookMarked size={15} strokeWidth={2.2} />
                    Registered
                  </button>
                  <button
                    className={`profile-activity-tab ${profileActivityTab === 'attended' ? 'active' : ''}`}
                    onClick={() => setProfileActivityTab('attended')}
                  >
                    <Trophy size={15} strokeWidth={2.2} />
                    Attended
                  </button>
                </div>

                {/* Tab content */}
                <div className="profile-activity-content">
                  {(() => {
                    const now = new Date()
                    const list = profileActivityTab === 'registered'
                      ? registrations
                      : registrations.filter(r => r.status === 'attended' || (r.event?.date && new Date(r.event.date) < now))

                    if (list.length === 0) {
                      return (
                        <div className="profile-empty-state">
                          <div className="profile-empty-icon">
                            {profileActivityTab === 'registered'
                              ? <BookMarked size={36} strokeWidth={1.5} color="#cbd5e1" />
                              : <Trophy size={36} strokeWidth={1.5} color="#cbd5e1" />}
                          </div>
                          <p className="profile-empty-title">
                            {profileActivityTab === 'registered'
                              ? 'No events registered yet'
                              : 'No attended events yet'}
                          </p>
                          <p className="profile-empty-sub">
                            {profileActivityTab === 'registered'
                              ? 'Browse campus events and register to see them here.'
                              : 'Events you attend will appear here.'}
                          </p>
                          <button
                            type="button"
                            className="profile-explore-btn"
                            onClick={() => handleTabChange('events')}
                          >
                            <CalendarDays size={16} strokeWidth={2.2} />
                            Explore Events
                          </button>
                        </div>
                      )
                    }

                    return (
                      <div className="profile-events-grid">
                        {list.map((reg) => {
                          const evt = reg.event || {}
                          const isPast = evt.date && new Date(evt.date) < now
                          const enrolledCount = evt.registeredUsers?.length ?? 0
                          const capacityCount = evt.capacity
                          const isFull = capacityCount !== null && capacityCount !== undefined && enrolledCount >= capacityCount
                          const categoryLabel = evt.category || 'Event'

                          return (
                            <div
                              key={reg._id}
                              className="profile-event-post-card"
                              onClick={() => evt._id && handleOpenEvent(evt._id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && evt._id && handleOpenEvent(evt._id)}
                            >
                              {/* Post Card Cover */}
                              <div
                                className="profile-post-cover"
                                style={{
                                  backgroundImage: evt.coverImage
                                    ? `url(${evt.coverImage})`
                                    : `linear-gradient(135deg, #881421 0%, #3d0a10 100%)`,
                                }}
                              >
                                <span className="profile-post-cat-tag">
                                  {categoryLabel}
                                </span>
                                <div className="profile-post-top-badges">
                                  {isPast && (
                                    <span className="profile-post-badge past">
                                      Past Event
                                    </span>
                                  )}
                                  <span className={`reg-status-chip ${STATUS_CONFIG[reg.status]?.cls || ''}`}>
                                    {STATUS_CONFIG[reg.status]?.label || reg.status || 'Registered'}
                                  </span>
                                </div>
                              </div>

                              {/* Post Card Body */}
                              <div className="profile-post-body">
                                <h4 className="profile-post-title">{evt.title || 'Campus Event'}</h4>

                                <div className="profile-post-meta">
                                  <div className="profile-post-meta-item">
                                    <Calendar size={12} color="#881421" strokeWidth={2.2} />
                                    <span>{formatEventDate(evt.date)}{evt.date && ` • ${formatEventTime(evt.date)}`}</span>
                                  </div>
                                  <div className="profile-post-meta-item">
                                    <MapPin size={12} color="#881421" strokeWidth={2.2} />
                                    <span>{evt.location || 'Sunway College Campus'}</span>
                                  </div>
                                </div>

                                <div className="profile-post-footer">
                                  <span className="profile-post-spots">
                                    <Users size={12} color="#881421" strokeWidth={2.2} />
                                    {capacityCount ? `${enrolledCount} / ${capacityCount} spots` : 'Campus event'}
                                  </span>
                                  <span className="profile-post-view-btn">
                                    View Details <ArrowRight size={12} strokeWidth={2.4} />
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
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
