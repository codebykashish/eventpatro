import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  CheckCircle2,
  LogOut,
  Search,
  Bell,
  Eye,
  Edit,
  Trash2,
  Plus,
  ArrowRight,
  Megaphone,
  MapPin,
  Clock,
  X,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchEvents, deleteEvent, fetchUsers, fetchAllRegistrations, getEventRegistrations } from '../utils/api'
import EventDetailPage from './EventDetail'
import './AdminDashboard.css'

// Default fallback images matching campus aesthetics
const FALLBACK_EVENT_IMAGE = '/campus_hero_bg.jpg'

const formatEventDate = (iso) => {
  if (!iso) return 'TBA'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatJoinedDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getInitials = (firstName = '', lastName = '') => {
  const f = firstName?.trim()?.charAt(0)?.toUpperCase() || ''
  const l = lastName?.trim()?.charAt(0)?.toUpperCase() || ''
  return f + l || 'CA'
}

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { id: routeEventId } = useParams()

  // In-portal Event Detail View handling
  const [selectedEventId, setSelectedEventId] = useState(routeEventId || null)
  useEffect(() => {
    setSelectedEventId(routeEventId || null)
  }, [routeEventId])

  const currentEventId = routeEventId || selectedEventId

  // Tab & Data states
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'events' | 'registrations' | 'users' | 'attendance'
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Search query in top bar
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [deleteEventItem, setDeleteEventItem] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [viewAllEventsModal, setViewAllEventsModal] = useState(false)
  const [viewAllUsersModal, setViewAllUsersModal] = useState(false)

  // Registration popup for individual event
  const [selectedEventForRegs, setSelectedEventForRegs] = useState(null)
  const [eventRegsList, setEventRegsList] = useState([])
  const [loadingEventRegs, setLoadingEventRegs] = useState(false)

  // Topbar dropdown
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load all initial admin data
  const loadAdminData = async () => {
    setLoading(true)
    setError('')
    try {
      const [eventsRes, usersRes, regsRes] = await Promise.allSettled([
        fetchEvents({ limit: 100 }),
        fetchUsers(),
        fetchAllRegistrations(),
      ])

      if (eventsRes.status === 'fulfilled' && eventsRes.value) {
        setEvents(eventsRes.value.events || [])
      }

      if (usersRes.status === 'fulfilled' && usersRes.value) {
        setUsers(usersRes.value.users || [])
      }

      if (regsRes.status === 'fulfilled' && regsRes.value) {
        setRegistrations(regsRes.value.registrations || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load administrative data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  // Handle Event Deletion
  const handleDeleteEvent = async () => {
    if (!deleteEventItem?._id) return
    setDeleting(true)
    try {
      await deleteEvent(deleteEventItem._id)
      setSuccess(`Event "${deleteEventItem.title}" has been deleted.`)
      setEvents((prev) => prev.filter((ev) => ev._id !== deleteEventItem._id))
      setDeleteEventItem(null)
      setTimeout(() => setSuccess(''), 3500)
    } catch (err) {
      setError(err.message || 'Failed to delete event')
    } finally {
      setDeleting(false)
    }
  }

  // Handle viewing registrations for an event in a popup
  const handleOpenEventRegs = async (ev) => {
    setSelectedEventForRegs(ev)
    setLoadingEventRegs(true)
    try {
      const data = await getEventRegistrations(ev._id)
      setEventRegsList(data.registrations || [])
    } catch {
      setEventRegsList([])
    } finally {
      setLoadingEventRegs(false)
    }
  }

  // Filtered lists based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events
    const q = searchQuery.toLowerCase()
    return events.filter(
      (ev) =>
        ev.title?.toLowerCase().includes(q) ||
        ev.location?.toLowerCase().includes(q) ||
        ev.category?.toLowerCase().includes(q)
    )
  }, [events, searchQuery])

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const q = searchQuery.toLowerCase()
    return users.filter(
      (u) =>
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.studentId?.toLowerCase().includes(q)
    )
  }, [users, searchQuery])

  // Aggregate totals
  const totalEvents = events.length
  const totalUsers = users.length
  const totalRegistrations = useMemo(() => {
    return events.reduce((sum, ev) => sum + (ev.registeredUsers?.length || 0), 0)
  }, [events])

  // Events to show in dashboard list: 6 to 7
  const dashboardEvents = useMemo(() => {
    return filteredEvents.slice(0, 7)
  }, [filteredEvents])

  // Users to show in dashboard table: 5 to 7
  const dashboardUsers = useMemo(() => {
    return filteredUsers.slice(0, 6)
  }, [filteredUsers])

  // If viewing single event detail
  const handleBackToDashboard = () => {
    setSelectedEventId(null)
    navigate('/admin')
    loadAdminData()
  }

  return (
    <div className="admin-portal-layout">
      {/* ── Fixed Left Sidebar ─────────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        {/* Brand Header */}
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-brand">
            <img src="/logo.png" alt="CampusPulse" className="admin-brand-logo" />
            <span className="admin-brand-title">CampusPulse</span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="admin-nav-menu">
          <button
            type="button"
            className={`admin-nav-link ${activeTab === 'dashboard' && !currentEventId ? 'active' : ''}`}
            onClick={() => {
              setSelectedEventId(null)
              setActiveTab('dashboard')
              navigate('/admin')
            }}
          >
            <LayoutDashboard size={19} className="admin-nav-icon" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`admin-nav-link ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => {
              setSelectedEventId(null)
              setActiveTab('events')
              setViewAllEventsModal(true)
            }}
          >
            <Calendar size={19} className="admin-nav-icon" />
            <span>Events</span>
          </button>

          <button
            type="button"
            className={`admin-nav-link ${activeTab === 'registrations' ? 'active' : ''}`}
            onClick={() => {
              setSelectedEventId(null)
              setActiveTab('registrations')
              const el = document.getElementById('admin-registrations-section')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <ClipboardList size={19} className="admin-nav-icon" />
            <span>Registrations</span>
          </button>

          <button
            type="button"
            className={`admin-nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => {
              setSelectedEventId(null)
              setActiveTab('users')
              setViewAllUsersModal(true)
            }}
          >
            <Users size={19} className="admin-nav-icon" />
            <span>Users</span>
          </button>

          <button
            type="button"
            className={`admin-nav-link ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => {
              setSelectedEventId(null)
              setActiveTab('attendance')
              const el = document.getElementById('admin-registrations-section')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <CheckCircle2 size={19} className="admin-nav-icon" />
            <span>Attendance</span>
          </button>
        </nav>

        {/* Sidebar Footer with Administrator Info & Dedicated Logout */}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-profile-card">
            <div className="admin-sidebar-avatar">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div className="admin-sidebar-info">
              <span className="admin-sidebar-name">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'College Administrator'}
              </span>
              <span className="admin-sidebar-email">
                {user?.email || 'admin@sunway.edu.np'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-sidebar-logout-btn"
            onClick={() => setShowLogoutModal(true)}
            title="Log out from Admin Portal"
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Workspace Area ───────────────────────────────────────────── */}
      <main className="admin-workspace">
        {/* Top Header Bar */}
        <header className="admin-topbar">
          {/* Rounded Search Input */}
          <div className="admin-search-box">
            <Search size={18} color="#881421" />
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Topbar Right Actions */}
          <div className="admin-topbar-right">
            <button
              type="button"
              className="admin-bell-btn"
              title="Notifications"
              onClick={() => {}}
            >
              <Bell size={18} strokeWidth={2.2} />
              <span className="admin-bell-badge">3</span>
            </button>

            <div className="admin-topbar-avatar-wrap" ref={dropdownRef}>
              <button
                type="button"
                className="admin-topbar-avatar-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <div className="admin-topbar-avatar-circle">
                  {getInitials(user?.firstName, user?.lastName)}
                </div>
                <ChevronDown size={14} color="#881421" />
              </button>

              {showUserDropdown && (
                <div className="admin-topbar-dropdown">
                  <div className="admin-dropdown-user">
                    <div className="admin-dropdown-name">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="admin-dropdown-role">College Administrator</div>
                  </div>
                  <button
                    type="button"
                    className="admin-dropdown-logout"
                    onClick={() => {
                      setShowUserDropdown(false)
                      setShowLogoutModal(true)
                    }}
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Body Content */}
        {currentEventId ? (
          /* Render full EventDetail in-portal if an event is currently selected */
          <div style={{ padding: '24px 36px' }}>
            <EventDetailPage
              eventId={currentEventId}
              onBack={handleBackToDashboard}
              onRegistrationChange={loadAdminData}
            />
          </div>
        ) : (
          <div className="admin-content-container">
            {/* Feedback Banners */}
            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* Hero / Greeting */}
            <section className="admin-hero-section">
              <h1>Welcome back, College Administrator!</h1>
              <p>Here's an overview of your Eventify system.</p>
            </section>

            {/* 3 Top Metrics Cards */}
            <section className="admin-metrics-row">
              <div className="admin-metric-card">
                <div className="admin-metric-left">
                  <div className="admin-metric-icon-circle">
                    <Calendar size={22} strokeWidth={2.2} />
                  </div>
                  <div className="admin-metric-values">
                    <span className="admin-metric-num">{totalEvents}</span>
                    <span className="admin-metric-label">Total Events</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-metric-arrow-btn"
                  onClick={() => setViewAllEventsModal(true)}
                  title="View all events"
                >
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="admin-metric-card">
                <div className="admin-metric-left">
                  <div className="admin-metric-icon-circle">
                    <Users size={22} strokeWidth={2.2} />
                  </div>
                  <div className="admin-metric-values">
                    <span className="admin-metric-num">{totalUsers.toLocaleString()}</span>
                    <span className="admin-metric-label">Total Users</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-metric-arrow-btn"
                  onClick={() => setViewAllUsersModal(true)}
                  title="View all users"
                >
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="admin-metric-card">
                <div className="admin-metric-left">
                  <div className="admin-metric-icon-circle">
                    <CheckCircle2 size={22} strokeWidth={2.2} />
                  </div>
                  <div className="admin-metric-values">
                    <span className="admin-metric-num">{totalRegistrations.toLocaleString()}</span>
                    <span className="admin-metric-label">Registrations So Far</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-metric-arrow-btn"
                  onClick={() => {
                    const el = document.getElementById('admin-registrations-section')
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                  }}
                  title="View registrations"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>

            {/* 2-Column Split: Event Management & Users */}
            <div className="admin-split-grid">
              {/* Left Column: Event Management */}
              <div className="admin-panel-card">
                <div className="admin-panel-header">
                  <div className="admin-panel-title-wrap">
                    <Calendar size={18} className="admin-panel-title-icon" />
                    <h2>Event Management</h2>
                  </div>
                  <button
                    type="button"
                    className="admin-view-all-btn"
                    onClick={() => setViewAllEventsModal(true)}
                  >
                    <span>View All</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {loading ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    Loading events...
                  </div>
                ) : dashboardEvents.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    No events found.
                  </div>
                ) : (
                  <div className="admin-events-list">
                    {dashboardEvents.map((ev) => (
                      <div key={ev._id} className="admin-event-row">
                        {/* Event cover thumbnail */}
                        <img
                          src={ev.coverImage || FALLBACK_EVENT_IMAGE}
                          alt={ev.title}
                          className="admin-event-thumb"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_EVENT_IMAGE
                          }}
                        />

                        {/* Event metadata */}
                        <div className="admin-event-details">
                          <span className="admin-event-title" title={ev.title}>
                            {ev.title}
                          </span>
                          <div className="admin-event-meta-row">
                            <span className="admin-event-meta-item">
                              <Calendar size={13} className="admin-event-meta-icon" />
                              {formatEventDate(ev.date)}
                            </span>
                            <span className="admin-event-meta-item">
                              <MapPin size={13} className="admin-event-meta-icon" />
                              {ev.location || 'Campus'}
                            </span>
                          </div>
                        </div>

                        {/* Registrations Pill and Actions */}
                        <div className="admin-event-actions">
                          <span className="admin-reg-badge-pill">
                            {ev.registeredUsers?.length || 0} registered
                          </span>
                          {/* View details */}
                          <Link
                            to={`/events/${ev._id}`}
                            className="admin-action-icon-btn"
                            title="View Event Details"
                          >
                            <Eye size={15} />
                          </Link>
                          {/* Edit event */}
                          <Link
                            to={`/admin/events/${ev._id}/edit`}
                            className="admin-action-icon-btn"
                            title="Edit Event"
                          >
                            <Edit size={15} />
                          </Link>
                          {/* Delete event */}
                          <button
                            type="button"
                            className="admin-action-icon-btn admin-action-delete-btn"
                            title="Delete Event"
                            onClick={() => setDeleteEventItem(ev)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="admin-card-footer-info">
                  Showing {Math.min(dashboardEvents.length, filteredEvents.length)} of {events.length} events
                </div>
              </div>

              {/* Right Column: Users */}
              <div className="admin-panel-card">
                <div className="admin-panel-header">
                  <div className="admin-panel-title-wrap">
                    <Users size={18} className="admin-panel-title-icon" />
                    <h2>Users</h2>
                  </div>
                  <button
                    type="button"
                    className="admin-view-all-btn"
                    onClick={() => setViewAllUsersModal(true)}
                  >
                    <span>View All</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {loading ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    Loading user records...
                  </div>
                ) : dashboardUsers.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    No users registered yet.
                  </div>
                ) : (
                  <div className="admin-users-table-wrap">
                    <table className="admin-users-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Joined On</th>
                          <th>Registrations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardUsers.map((u) => (
                          <tr key={u._id || u.id}>
                            <td className="admin-user-cell-name">
                              {u.firstName} {u.lastName}
                            </td>
                            <td className="admin-user-cell-email">{u.email}</td>
                            <td className="admin-user-cell-joined">
                              {formatJoinedDate(u.createdAt)}
                            </td>
                            <td className="admin-user-reg-count">
                              {u.registrationsCount ?? 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="admin-card-footer-info">
                  Showing {Math.min(dashboardUsers.length, filteredUsers.length)} of {users.length} users
                </div>
              </div>
            </div>

            {/* ── Below Both Cards: Registrations Section ──────────────────────── */}
            <section className="admin-registrations-section" id="admin-registrations-section">
              <div className="admin-panel-header" style={{ marginBottom: '12px' }}>
                <div className="admin-panel-title-wrap">
                  <ClipboardList size={18} className="admin-panel-title-icon" />
                  <h2>Event Registrations Overview</h2>
                </div>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Click any event card to view attendees
                </span>
              </div>

              <div className="admin-reg-cards-grid">
                {events.map((ev) => (
                  <div
                    key={ev._id}
                    className="admin-event-reg-box"
                    onClick={() => handleOpenEventRegs(ev)}
                  >
                    <div className="admin-reg-box-header">
                      <span className="admin-reg-box-title">{ev.title}</span>
                      <span className="admin-reg-box-count">
                        {ev.registeredUsers?.length || 0}
                      </span>
                    </div>
                    <div className="admin-reg-box-footer">
                      <span>{formatEventDate(ev.date)}</span>
                      <span className="admin-reg-box-view-link">
                        View List <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Quick Actions Banner ────────────────────────────────────────── */}
            <section className="admin-quick-actions-banner">
              <div className="admin-quick-actions-left">
                <div className="admin-quick-actions-icon">
                  <Megaphone size={22} strokeWidth={2.2} />
                </div>
                <div className="admin-quick-actions-text">
                  <h3>Quick Actions</h3>
                  <p>Create a new event, manage registrations or view attendance records.</p>
                </div>
              </div>

              <Link to="/admin/events/new" className="admin-create-event-btn">
                <Plus size={18} strokeWidth={2.4} />
                <span>Create Event</span>
              </Link>
            </section>
          </div>
        )}
      </main>

      {/* ── Modal: View All Events ────────────────────────────────────────── */}
      {viewAllEventsModal && (
        <div className="admin-modal-overlay" onClick={() => setViewAllEventsModal(false)}>
          <div
            className="admin-modal-box admin-modal-box-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>All Campus Events ({events.length})</h3>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setViewAllEventsModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-events-list">
                {events.map((ev) => (
                  <div key={ev._id} className="admin-event-row">
                    <img
                      src={ev.coverImage || FALLBACK_EVENT_IMAGE}
                      alt={ev.title}
                      className="admin-event-thumb"
                    />
                    <div className="admin-event-details">
                      <span className="admin-event-title">{ev.title}</span>
                      <div className="admin-event-meta-row">
                        <span>{formatEventDate(ev.date)}</span>
                        <span>•</span>
                        <span>{ev.location}</span>
                      </div>
                    </div>
                    <div className="admin-event-actions">
                      <span className="admin-reg-badge-pill">
                        {ev.registeredUsers?.length || 0} registered
                      </span>
                      <Link
                        to={`/events/${ev._id}`}
                        className="admin-action-icon-btn"
                        onClick={() => setViewAllEventsModal(false)}
                      >
                        <Eye size={15} />
                      </Link>
                      <Link
                        to={`/admin/events/${ev._id}/edit`}
                        className="admin-action-icon-btn"
                        onClick={() => setViewAllEventsModal(false)}
                      >
                        <Edit size={15} />
                      </Link>
                      <button
                        type="button"
                        className="admin-action-icon-btn admin-action-delete-btn"
                        onClick={() => {
                          setViewAllEventsModal(false)
                          setDeleteEventItem(ev)
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: View All Users ─────────────────────────────────────────── */}
      {viewAllUsersModal && (
        <div className="admin-modal-overlay" onClick={() => setViewAllUsersModal(false)}>
          <div
            className="admin-modal-box admin-modal-box-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>All Registered Users ({users.length})</h3>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setViewAllUsersModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-users-table-wrap">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined On</th>
                      <th>Registrations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id || u.id}>
                        <td className="admin-user-cell-name">
                          {u.firstName} {u.lastName}
                        </td>
                        <td className="admin-user-cell-email">{u.email}</td>
                        <td style={{ textTransform: 'capitalize', color: '#64748b' }}>{u.role}</td>
                        <td className="admin-user-cell-joined">
                          {formatJoinedDate(u.createdAt)}
                        </td>
                        <td className="admin-user-reg-count">
                          {u.registrationsCount ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Single Event Registrations Popup ───────────────────────── */}
      {selectedEventForRegs && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedEventForRegs(null)}
        >
          <div
            className="admin-modal-box admin-modal-box-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3>Registrations: {selectedEventForRegs.title}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Total enrolled: {eventRegsList.length}
                </span>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setSelectedEventForRegs(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              {loadingEventRegs ? (
                <p style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  Loading registrations...
                </p>
              ) : eventRegsList.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No students have registered for this event yet.
                </p>
              ) : (
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Applied Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventRegsList.map((reg) => (
                      <tr key={reg._id}>
                        <td className="admin-user-cell-name">
                          {reg.student?.firstName} {reg.student?.lastName}
                        </td>
                        <td className="admin-user-cell-email">{reg.student?.email}</td>
                        <td>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background:
                                reg.status === 'confirmed'
                                  ? '#dcfce7'
                                  : reg.status === 'attended'
                                  ? '#e0e7ff'
                                  : '#f3f4f6',
                              color:
                                reg.status === 'confirmed'
                                  ? '#15803d'
                                  : reg.status === 'attended'
                                  ? '#3730a3'
                                  : '#374151',
                              textTransform: 'capitalize',
                            }}
                          >
                            {reg.status}
                          </span>
                        </td>
                        <td className="admin-user-cell-joined">
                          {formatJoinedDate(reg.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Confirmation ────────────────────────────────────── */}
      {deleteEventItem && (
        <div
          className="admin-modal-overlay"
          onClick={() => !deleting && setDeleteEventItem(null)}
        >
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Delete Event</h3>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setDeleteEventItem(null)}
                disabled={deleting}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '14px', color: '#475569', margin: '4px 0 16px' }}>
              Are you sure you want to delete <strong>"{deleteEventItem.title}"</strong>?
              This will remove the event listing and cancel all student enrollments.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn-cancel"
                onClick={() => setDeleteEventItem(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-confirm-delete"
                onClick={handleDeleteEvent}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Logout Confirmation ────────────────────────────────────── */}
      {showLogoutModal && (
        <div
          className="admin-modal-overlay"
          onClick={() => setShowLogoutModal(false)}
        >
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Sign Out</h3>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '14px', color: '#475569', margin: '4px 0 16px' }}>
              Are you sure you want to log out of the Administrator Portal?
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Stay Logged In
              </button>
              <button
                type="button"
                className="admin-btn-confirm-delete"
                onClick={() => {
                  setShowLogoutModal(false)
                  logout()
                  navigate('/login')
                }}
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

export default AdminDashboard
