import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  Eye,
  Edit,
  Trash2,
  Plus,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchEvents, getMyRegistrations, fetchUsers, fetchAllRegistrations, deleteEvent, getEventRegistrations, deleteUser } from '../utils/api'
import CampusIllustration from '../components/CampusIllustration'
import EventDetailPage from './EventDetail'
import AdminEventsPage from './AdminEventsPage'
import AdminUsersPage from './AdminUsersPage'
import CreateEventPage from './CreateEvent'
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
  attended: { label: 'Attended', cls: 'status-attended' },
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

const Dashboard = ({ defaultTab = 'dashboard' }) => {
  const { user, logout, updateProfile } = useAuth()
  const isAdmin = user?.role === 'admin'
  const navigate = useNavigate()
  const { id: routeEventId } = useParams()

  // Selected event for in-portal detail view (derived from URL param or state)
  const [selectedEventId, setSelectedEventId] = useState(routeEventId || null)

  // Keep synced whenever routeEventId changes
  useEffect(() => {
    if (routeEventId) {
      setSelectedEventId(routeEventId)
    } else {
      setSelectedEventId(null)
    }
  }, [routeEventId])

  const currentEventId = routeEventId || selectedEventId

  const handleOpenEvent = (evtId) => {
    setSelectedEventId(evtId)
    navigate(`/events/${evtId}`)
  }

  const handleBackFromEvent = () => {
    setSelectedEventId(null)
    navigate(isAdmin ? '/admin' : '/dashboard')
    loadData()
  }

  const handleTabChange = (tabName) => {
    setSelectedEventId(null)
    setActiveTab(tabName)
    navigate(isAdmin ? '/admin' : '/dashboard')
    loadData()
  }

  // Tab & UI state
  const [activeTab, setActiveTab] = useState(defaultTab)

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab)
    }
  }, [defaultTab])
  const [searchQuery, setSearchQuery] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [hasSeenUpdates, setHasSeenUpdates] = useState(false)
  const [profileActivityTab, setProfileActivityTab] = useState('registered')

  // Edit Profile Modal state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    profilePicture: '',
  })
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  const handleOpenEditProfile = () => {
    setEditFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      studentId: user?.studentId || '',
      profilePicture: user?.profilePicture || '',
    })
    setEditError('')
    setShowEditProfileModal(true)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setEditError('')
    setEditSubmitting(true)
    try {
      await updateProfile(editFormData)
      setShowEditProfileModal(false)
    } catch (err) {
      setEditError(err.message || 'Failed to update profile')
    } finally {
      setEditSubmitting(false)
    }
  }

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

  // ── Admin-only state ───────────────────────────────────────────────────────
  const [adminUsers, setAdminUsers] = useState([])
  const [adminAllRegistrations, setAdminAllRegistrations] = useState([])
  const [adminDeleteItem, setAdminDeleteItem] = useState(null)
  const [adminDeleting, setAdminDeleting] = useState(false)
  const [adminSuccess, setAdminSuccess] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminViewAllEventsModal, setAdminViewAllEventsModal] = useState(false)
  const [adminViewAllUsersModal, setAdminViewAllUsersModal] = useState(false)
  const [adminSelectedEventForRegs, setAdminSelectedEventForRegs] = useState(null)
  const [adminEventRegsList, setAdminEventRegsList] = useState([])
  const [adminLoadingEventRegs, setAdminLoadingEventRegs] = useState(false)

  const dropdownRef = useRef(null)

  // Load events and user registrations (+ admin data when admin)
  const loadData = useCallback(async () => {
    try {
      if (isAdmin) {
        const [eventsRes, usersRes, regsRes] = await Promise.allSettled([
          fetchEvents({ limit: 100 }),
          fetchUsers(),
          fetchAllRegistrations(),
        ])
        if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value?.events || [])
        if (usersRes.status === 'fulfilled') setAdminUsers(usersRes.value?.users || [])
        if (regsRes.status === 'fulfilled') setAdminAllRegistrations(regsRes.value?.registrations || [])
      } else {
        const [eventsRes, regsRes] = await Promise.all([
          fetchEvents({ limit: 50 }),
          getMyRegistrations().catch(() => ({ registrations: [] })),
        ])
        setEvents(eventsRes.events || [])
        setRegistrations(regsRes.registrations || [])
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Admin: open event registrations popup
  const handleAdminOpenEventRegs = async (ev) => {
    setAdminSelectedEventForRegs(ev)
    setAdminLoadingEventRegs(true)
    try {
      const data = await getEventRegistrations(ev._id)
      setAdminEventRegsList(data.registrations || [])
    } catch {
      setAdminEventRegsList([])
    } finally {
      setAdminLoadingEventRegs(false)
    }
  }

  // Admin: delete event
  const handleAdminDeleteEvent = async () => {
    if (!adminDeleteItem?._id) return
    setAdminDeleting(true)
    try {
      await deleteEvent(adminDeleteItem._id)
      setAdminSuccess(`"${adminDeleteItem.title}" deleted.`)
      setEvents((prev) => prev.filter((ev) => ev._id !== adminDeleteItem._id))
      setAdminDeleteItem(null)
      setTimeout(() => setAdminSuccess(''), 3500)
    } catch (err) {
      setAdminError(err.message || 'Failed to delete event')
    } finally {
      setAdminDeleting(false)
    }
  }

  // Admin: delete user state & handler
  const [adminDeleteUserItem, setAdminDeleteUserItem] = useState(null)
  const [adminDeletingUser, setAdminDeletingUser] = useState(false)

  const handleAdminDeleteUser = async () => {
    if (!adminDeleteUserItem) return
    const uid = adminDeleteUserItem._id || adminDeleteUserItem.id
    setAdminDeletingUser(true)
    try {
      await deleteUser(uid)
      setAdminSuccess(`User "${adminDeleteUserItem.firstName} ${adminDeleteUserItem.lastName}" deleted.`)
      setAdminUsers((prev) => prev.filter((u) => (u._id || u.id) !== uid))
      setAdminDeleteUserItem(null)
      setTimeout(() => setAdminSuccess(''), 3500)
    } catch (err) {
      setAdminError(err.message || 'Failed to delete user')
    } finally {
      setAdminDeletingUser(false)
    }
  }

  // Notification popover state & ref
  const [showNotifications, setShowNotifications] = useState(false)
  const [hasSeenNotifications, setHasSeenNotifications] = useState(false)
  const [readNotifications, setReadNotifications] = useState(() => new Set())
  const notificationRef = useRef(null)

  const handleNotificationClick = (rem) => {
    // Mark this notification as read to remove the red overlay
    setReadNotifications((prev) => new Set(prev).add(rem.id))
    if (rem.eventId) {
      handleOpenEvent(rem.eventId)
      setShowNotifications(false)
    }
  }

  // Compute smart notification reminders — different for admin vs student
  const reminders = (() => {
    const list = []
    const now = new Date()

    if (isAdmin) {
      // 1. New users joined in last 7 days
      const newUsers = adminUsers.filter(u => {
        if (!u.createdAt) return false
        return (now - new Date(u.createdAt)) / 86400000 <= 7
      })
      if (newUsers.length > 0) {
        list.push({
          id: 'admin-new-users',
          type: 'admin_users',
          title: `${newUsers.length} new user${newUsers.length > 1 ? 's' : ''} joined`,
          message: `${newUsers.map(u => u.firstName).join(', ')} joined SSRC Events recently.`,
          time: 'New',
          tag: 'Users',
        })
      }

      // 2. New events created in last 7 days
      const newEvents = events.filter(e => {
        if (!e.createdAt) return false
        return (now - new Date(e.createdAt)) / 86400000 <= 7
      })
      if (newEvents.length > 0) {
        list.push({
          id: 'admin-new-events',
          type: 'admin_events',
          title: `${newEvents.length} new event${newEvents.length > 1 ? 's' : ''} created`,
          message: `Recent: ${newEvents.slice(0,3).map(e => e.title).join(', ')}.`,
          time: 'New',
          tag: 'Events',
        })
      }

      // 3. High-registration events (>= 10)
      const hotEvents = events.filter(e => (e.registeredUsers?.length || 0) >= 10).slice(0, 2)
      hotEvents.forEach(e => {
        list.push({
          id: `admin-hot-${e._id}`,
          type: 'admin_hot',
          title: `High interest: ${e.title}`,
          message: `${e.registeredUsers?.length} students registered. Consider increasing capacity.`,
          eventId: e._id,
          time: '',
          tag: 'Trending',
        })
      })

      if (list.length === 0) {
        list.push({
          id: 'admin-all-clear',
          type: 'info',
          title: 'All systems good',
          message: 'No new users or events to review right now.',
          time: '',
          tag: 'Notice',
        })
      }
      return list
    }

    // --- STUDENT notifications ---
    // 1. Recently enrolled events (enrolled in last 48 hours)
    registrations.forEach((reg) => {
      const evt = reg.event || {}
      if (reg.createdAt) {
        const enrolledMs = now - new Date(reg.createdAt)
        const enrolledHours = enrolledMs / (1000 * 60 * 60)
        if (enrolledHours <= 48) {
          list.push({
            id: `enrolled-${reg._id}`,
            type: 'enrolled',
            title: 'Enrolled Successfully',
            message: `You have been enrolled in ${evt.title || 'the event'}. Check your pass!`,
            eventId: evt._id,
            time: 'Enrolled',
            tag: 'Enrolled',
          })
        }
      }
    })

    // 2. Registered events happening soon (active registrations only)
    registrations
      .filter((r) => ['confirmed', 'selected', 'pending'].includes(r.status))
      .forEach((reg) => {
        const evt = reg.event || {}
        if (evt.date) {
          const evtDate = new Date(evt.date)
          const diffMs = evtDate - now
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
          if (diffDays >= 0 && diffDays <= 7) {
            list.push({
              id: `reg-${reg._id}`,
              type: 'reminder',
              title: `${diffDays === 0 ? 'Today' : diffDays === 1 ? '1 day left' : `${diffDays} days left`}: ${evt.title || 'Upcoming Event'}`,
              message:
                diffDays === 0
                  ? `Happening today! Make sure to attend ${evt.title} on time.`
                  : diffDays === 1
                  ? `1 day left for ${evt.title}! Event starts tomorrow at ${formatEventTime(evt.date)}.`
                  : `${diffDays} days left for ${evt.title} (${formatEventDate(evt.date)}).`,
              eventId: evt._id,
              time: diffDays === 0 ? 'Today' : `${diffDays}d left`,
              tag: diffDays <= 1 ? 'Urgent' : 'Reminder',
            })
          }
        }
      })

    // 2. Newly added campus events (within last 7 days)
    events
      .filter((e) => {
        if (!e.createdAt) return false
        const createdMs = now - new Date(e.createdAt)
        const createdDays = createdMs / (1000 * 60 * 60 * 24)
        return createdDays <= 7 && new Date(e.date) > now
      })
      .slice(0, 3)
      .forEach((evt) => {
        list.push({
          id: `new-${evt._id}`,
          type: 'new_program',
          title: `New: ${evt.title}`,
          message: `A new program has been added for ${formatEventDate(evt.date)}. Seats are filling!`,
          eventId: evt._id,
          time: '',
          tag: 'Program Added',
        })
      })

    // Default welcome notice if no active reminders
    if (list.length === 0) {
      list.push({
        id: 'welcome',
        type: 'info',
        title: 'Welcome to SSRC Events',
        message: 'You have no urgent event reminders right now. Check back soon!',
        time: '',
        tag: 'Notice',
      })
    }

    return list
  })()

  // Close user dropdown & notification popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Set of registered event IDs
  const registeredEventIds = new Set(
    registrations
      .filter((r) => ['confirmed', 'pending', 'selected', 'attended'].includes(r.status))
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

  // Filtered upcoming events list according to search query:
  // On the dashboard tab, completed/past events are excluded, and capped to at most 10 events
  const filteredEvents = events
    .filter((e) => {
      // Exclude past/completed events from dashboard feed
      if (new Date(e.date) < now) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        e.title?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
    .slice(0, 10)

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
      // Always put upcoming events before past events in the Explore tab
      const isPastA = new Date(a.date || 0) < now
      const isPastB = new Date(b.date || 0) < now
      if (isPastA !== isPastB) {
        return isPastA ? 1 : -1
      }

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

  // ── Admin derived values ────────────────────────────────────────────────
  const adminTotalRegistrations = useMemo(
    () => events.reduce((s, ev) => s + (ev.registeredUsers?.length || 0), 0),
    [events]
  )
  const adminDashboardEvents = useMemo(() => events.slice(0, 8), [events])
  const adminDashboardUsers = useMemo(() => adminUsers.slice(0, 8), [adminUsers])

  const formatAdminDate = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="portal-layout">
      {/* ── Hover-Expandable Left Sidebar ─────────────────────────────────── */}
      <aside
        className={`portal-sidebar ${isHovered ? 'expanded' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Brand Header */}
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

        {/* Navigation Links */}
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
            onClick={() => handleTabChange(isAdmin ? 'adminEvents' : 'events')}
            className={`portal-nav-link ${!selectedEventId && (activeTab === 'events' || activeTab === 'adminEvents') ? 'active' : ''}`}
            title="Events"
          >
            <Calendar size={20} className="nav-icon" />
            <span className="nav-label">Events</span>
          </button>

          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => handleTabChange('adminCreateEvent')}
                className={`portal-nav-link ${activeTab === 'adminCreateEvent' ? 'active' : ''}`}
                title="Create Event"
              >
                <Plus size={20} className="nav-icon" />
                <span className="nav-label">Create Event</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('adminUsers')}
                className={`portal-nav-link ${activeTab === 'adminUsers' ? 'active' : ''}`}
                title="Users"
              >
                <Users size={20} className="nav-icon" />
                <span className="nav-label">Users</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleTabChange('dashboard')
                  setTimeout(() => {
                    const el = document.getElementById('admin-registrations-section')
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                  }, 100)
                }}
                className="portal-nav-link"
                title="Attendance"
              >
                <CheckCircle2 size={20} className="nav-icon" />
                <span className="nav-label">Attendance</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleTabChange('profile')}
              className={`portal-nav-link ${!selectedEventId && activeTab === 'profile' ? 'active' : ''}`}
              title="Profile"
            >
              <User size={20} className="nav-icon" />
              <span className="nav-label">Profile</span>
            </button>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="portal-sidebar-footer">
          {isAdmin ? (
            /* Admin: profile badge card + dedicated logout */
            <>
              <div className="admin-sidebar-profile-card">
                <div className="admin-sidebar-avatar">
                  {getInitials(user?.firstName, user?.lastName)}
                </div>
                <div className="admin-sidebar-info">
                  <span className="admin-sidebar-name">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="admin-sidebar-email">{user?.email}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="admin-sidebar-logout-btn"
                title="Logout"
              >
                <LogOut size={17} className="nav-icon" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            /* Student: campus watermark + logout */
            <>
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
            </>
          )}
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

          {/* Topbar Right Actions (Notifications + User profile) */}
          <div className="portal-topbar-right">
            {/* Notification Bell Button & Compact Popover */}
            <div className="portal-notification-container" ref={notificationRef}>
              <button
                type="button"
                className={`portal-topbar-bell-btn ${showNotifications ? 'active' : ''}`}
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  setShowUserDropdown(false)
                  setHasSeenNotifications(true)
                }}
                title="Notifications & Reminders"
                aria-expanded={showNotifications}
              >
                <Bell size={18} strokeWidth={2.2} />
                {!hasSeenNotifications && reminders.length > 0 && (
                  <span className="portal-topbar-bell-dot" />
                )}
              </button>

              {/* Compact Notification Popover */}
              {showNotifications && (
                <div className="portal-notification-popover">
                  <div className="notification-popover-header">
                    <div className="notification-header-left">
                      <span className="notification-header-title">Notifications</span>
                      <span className="notification-header-count">{reminders.length}</span>
                    </div>
                    <button
                      type="button"
                      className="notification-popover-close"
                      onClick={() => setShowNotifications(false)}
                      title="Close"
                    >
                      <X size={14} strokeWidth={2.4} />
                    </button>
                  </div>

                  <div className="notification-popover-body">
                    {reminders.map((rem) => {
                      const isUnread = !readNotifications.has(rem.id)
                      return (
                        <div
                          key={rem.id}
                          className={`notification-item ${isUnread ? 'notification-unread' : ''}`}
                          onClick={() => handleNotificationClick(rem)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="notification-item-icon-wrap">
                            {rem.type === 'reminder' ? (
                              <Clock size={14} color="#881421" strokeWidth={2.4} />
                            ) : (
                              <Bell size={14} color="#881421" strokeWidth={2.4} />
                            )}
                          </div>
                          <div className="notification-item-content">
                            <div className="notification-item-top">
                              <span className="notification-item-title">{rem.title}</span>
                              <span className="notification-item-time">{rem.time}</span>
                            </div>
                            <p className="notification-item-msg">{rem.message}</p>
                          </div>
                          {isUnread && <span className="notification-unread-dot" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* User profile dropdown trigger */}
            <div className="portal-user-menu-container" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown)
                  setShowNotifications(false)
                }}
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
        </div>
      </header>

        {/* Scrollable Main Content */}
        <div className="portal-main-content">
          {currentEventId ? (
            <div className="portal-event-detail-wrap" key={currentEventId}>
              <EventDetailPage
                eventId={currentEventId}
                onBack={handleBackFromEvent}
                onRegistrationChange={loadData}
              />
            </div>
          ) : (
            <>
              {/* ══════════════ ADMIN DASHBOARD TAB ══════════════ */}
              {isAdmin && activeTab === 'dashboard' && (
                <div className="admin-content-container">
                  {/* Feedback */}
                  {adminError && (
                    <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', padding:'12px 18px', borderRadius:'12px', display:'flex', alignItems:'center', gap:'10px', fontSize:'13px' }}>
                      <AlertCircle size={16} /><span>{adminError}</span>
                    </div>
                  )}
                  {adminSuccess && (
                    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', padding:'12px 18px', borderRadius:'12px', display:'flex', alignItems:'center', gap:'10px', fontSize:'13px' }}>
                      <CheckCircle2 size={16} /><span>{adminSuccess}</span>
                    </div>
                  )}

                  {/* Hero */}
                  <section className="admin-hero-section">
                    <h1>Welcome back, {user?.firstName}!</h1>
                    <p>Here's an overview of your SSRC Events system.</p>
                  </section>

                  {/* 3 Metrics */}
                  <section className="admin-metrics-row">
                    <div className="admin-metric-card">
                      <div className="admin-metric-left">
                        <div className="admin-metric-icon-circle"><Calendar size={22} /></div>
                        <div className="admin-metric-values">
                          <span className="admin-metric-num">{events.length}</span>
                          <span className="admin-metric-label">Total Events</span>
                        </div>
                      </div>
                      <button type="button" className="admin-metric-arrow-btn" onClick={() => setAdminViewAllEventsModal(true)}><ArrowRight size={16} /></button>
                    </div>
                    <div className="admin-metric-card">
                      <div className="admin-metric-left">
                        <div className="admin-metric-icon-circle"><Users size={22} /></div>
                        <div className="admin-metric-values">
                          <span className="admin-metric-num">{adminUsers.length}</span>
                          <span className="admin-metric-label">Total Users</span>
                        </div>
                      </div>
                      <button type="button" className="admin-metric-arrow-btn" onClick={() => setAdminViewAllUsersModal(true)}><ArrowRight size={16} /></button>
                    </div>
                    <div className="admin-metric-card">
                      <div className="admin-metric-left">
                        <div className="admin-metric-icon-circle"><CheckCircle2 size={22} /></div>
                        <div className="admin-metric-values">
                          <span className="admin-metric-num">{adminTotalRegistrations}</span>
                          <span className="admin-metric-label">Registrations So Far</span>
                        </div>
                      </div>
                      <button type="button" className="admin-metric-arrow-btn" onClick={() => handleTabChange('adminEvents')} title="View Events"><ArrowRight size={16} /></button>
                    </div>
                  </section>

                  {/* 2-Column: Events + Users */}
                  <div className="admin-split-grid">
                    {/* Event Management */}
                    <div className="admin-panel-card">
                      <div className="admin-panel-header">
                        <div className="admin-panel-title-wrap">
                          <Calendar size={18} className="admin-panel-title-icon" />
                          <h2>Event Management</h2>
                        </div>
                        <button type="button" className="admin-view-all-btn" onClick={() => setAdminViewAllEventsModal(true)}>
                          <span>View All</span>
                        </button>
                      </div>
                      {loading ? (
                        <div style={{ padding:'36px', textAlign:'center', color:'#64748b' }}>Loading events...</div>
                      ) : adminDashboardEvents.length === 0 ? (
                        <div style={{ padding:'36px', textAlign:'center', color:'#64748b' }}>No events found.</div>
                      ) : (
                        <div className="admin-events-list">
                          {adminDashboardEvents.map((ev) => (
                            <div key={ev._id} className="admin-event-row">
                              <img src={ev.coverImage || '/campus_hero_bg.jpg'} alt={ev.title} className="admin-event-thumb"
                                onError={(e) => { e.currentTarget.src = '/campus_hero_bg.jpg' }} />
                              <div className="admin-event-details">
                                <span className="admin-event-title" title={ev.title}>{ev.title}</span>
                                <div className="admin-event-meta-row">
                                  <span className="admin-event-meta-item"><Calendar size={13} className="admin-event-meta-icon" />{formatAdminDate(ev.date)}</span>
                                  <span className="admin-event-meta-item"><MapPin size={13} className="admin-event-meta-icon" />{ev.location || 'Campus'}</span>
                                </div>
                              </div>
                              <div className="admin-event-actions">
                                <span className="admin-reg-badge-pill">{ev.registeredUsers?.length || 0} registered</span>
                                <Link to={`/events/${ev._id}`} className="admin-action-icon-btn" title="View Details"><Eye size={15} /></Link>
                                <Link to={`/admin/events/${ev._id}/edit`} className="admin-action-icon-btn" title="Edit"><Edit size={15} /></Link>
                                <button type="button" className="admin-action-icon-btn admin-action-delete-btn" title="Delete" onClick={() => setAdminDeleteItem(ev)}><Trash2 size={15} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="admin-card-footer-info">Showing {adminDashboardEvents.length} of {events.length} events</div>
                    </div>

                    {/* Users Table */}
                    <div className="admin-panel-card">
                      <div className="admin-panel-header">
                        <div className="admin-panel-title-wrap">
                          <Users size={18} className="admin-panel-title-icon" />
                          <h2>Users</h2>
                        </div>
                        <button type="button" className="admin-view-all-btn" onClick={() => setAdminViewAllUsersModal(true)}>
                          <span>View All</span>
                        </button>
                      </div>
                      {loading ? (
                        <div style={{ padding:'36px', textAlign:'center', color:'#64748b' }}>Loading users...</div>
                      ) : adminDashboardUsers.length === 0 ? (
                        <div style={{ padding:'36px', textAlign:'center', color:'#64748b' }}>No users yet.</div>
                      ) : (
                        <div className="admin-users-table-wrap">
                          <table className="admin-users-table">
                            <thead>
                              <tr><th>Name</th><th>Email</th><th>Joined</th><th>Regs</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                              {adminDashboardUsers.map((u) => (
                                <tr key={u._id || u.id}>
                                  <td className="admin-user-cell-name">{u.firstName} {u.lastName}</td>
                                  <td className="admin-user-cell-email">{u.email}</td>
                                  <td className="admin-user-cell-joined">{formatAdminDate(u.createdAt)}</td>
                                  <td className="admin-user-reg-count">{u.registrationsCount ?? 0}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="admin-action-icon-btn admin-action-delete-btn"
                                      title="Delete User"
                                      onClick={() => setAdminDeleteUserItem(u)}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <div className="admin-card-footer-info">Showing {adminDashboardUsers.length} of {adminUsers.length} users</div>
                    </div>
                  </div>


                  {/* Quick Actions Banner */}
                  <section className="admin-quick-actions-banner">
                    <div className="admin-quick-actions-left">
                      <div className="admin-quick-actions-icon"><Megaphone size={22} /></div>
                      <div className="admin-quick-actions-text">
                        <h3>Quick Actions</h3>
                        <p>Create a new event, manage registrations or view attendance records.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="admin-create-event-btn"
                      onClick={() => handleTabChange('adminCreateEvent')}
                    >
                      <Plus size={18} /><span>Create Event</span>
                    </button>
                  </section>

                  {/* ── Admin Modals ── */}
                  {/* View All Events */}
                  {adminViewAllEventsModal && (
                    <div className="admin-modal-overlay" onClick={() => setAdminViewAllEventsModal(false)}>
                      <div className="admin-modal-box admin-modal-box-large" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                          <h3>All Events ({events.length})</h3>
                          <button type="button" className="admin-modal-close-btn" onClick={() => setAdminViewAllEventsModal(false)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                          <div className="admin-events-list">
                            {events.map((ev) => (
                              <div key={ev._id} className="admin-event-row">
                                <img src={ev.coverImage || '/campus_hero_bg.jpg'} alt={ev.title} className="admin-event-thumb" />
                                <div className="admin-event-details">
                                  <span className="admin-event-title">{ev.title}</span>
                                  <div className="admin-event-meta-row"><span>{formatAdminDate(ev.date)}</span><span>•</span><span>{ev.location}</span></div>
                                </div>
                                <div className="admin-event-actions">
                                  <span className="admin-reg-badge-pill">{ev.registeredUsers?.length || 0} reg</span>
                                  <Link to={`/events/${ev._id}`} className="admin-action-icon-btn" onClick={() => setAdminViewAllEventsModal(false)}><Eye size={15} /></Link>
                                  <Link to={`/admin/events/${ev._id}/edit`} className="admin-action-icon-btn" onClick={() => setAdminViewAllEventsModal(false)}><Edit size={15} /></Link>
                                  <button type="button" className="admin-action-icon-btn admin-action-delete-btn" onClick={() => { setAdminViewAllEventsModal(false); setAdminDeleteItem(ev) }}><Trash2 size={15} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* View All Users */}
                  {adminViewAllUsersModal && (
                    <div className="admin-modal-overlay" onClick={() => setAdminViewAllUsersModal(false)}>
                      <div className="admin-modal-box admin-modal-box-large" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                          <h3>All Users ({adminUsers.length})</h3>
                          <button type="button" className="admin-modal-close-btn" onClick={() => setAdminViewAllUsersModal(false)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                          <div className="admin-users-table-wrap">
                            <table className="admin-users-table">
                              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Regs</th></tr></thead>
                              <tbody>
                                {adminUsers.map((u) => (
                                  <tr key={u._id || u.id}>
                                    <td className="admin-user-cell-name">{u.firstName} {u.lastName}</td>
                                    <td className="admin-user-cell-email">{u.email}</td>
                                    <td style={{ textTransform:'capitalize', color:'#64748b' }}>{u.role}</td>
                                    <td className="admin-user-cell-joined">{formatAdminDate(u.createdAt)}</td>
                                    <td className="admin-user-reg-count">{u.registrationsCount ?? 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Event Registrations popup */}
                  {adminSelectedEventForRegs && (
                    <div className="admin-modal-overlay" onClick={() => setAdminSelectedEventForRegs(null)}>
                      <div className="admin-modal-box admin-modal-box-large" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                          <div>
                            <h3>Registrations: {adminSelectedEventForRegs.title}</h3>
                            <span style={{ fontSize:'12px', color:'#64748b' }}>Total: {adminEventRegsList.length}</span>
                          </div>
                          <button type="button" className="admin-modal-close-btn" onClick={() => setAdminSelectedEventForRegs(null)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                          {adminLoadingEventRegs ? (
                            <p style={{ textAlign:'center', padding:'24px', color:'#64748b' }}>Loading...</p>
                          ) : adminEventRegsList.length === 0 ? (
                            <p style={{ textAlign:'center', padding:'24px', color:'#64748b' }}>No registrations yet.</p>
                          ) : (
                            <table className="admin-users-table">
                              <thead><tr><th>Student</th><th>Email</th><th>Status</th><th>Applied</th></tr></thead>
                              <tbody>
                                {adminEventRegsList.map((reg) => (
                                  <tr key={reg._id}>
                                    <td className="admin-user-cell-name">{reg.student?.firstName} {reg.student?.lastName}</td>
                                    <td className="admin-user-cell-email">{reg.student?.email}</td>
                                    <td><span style={{ padding:'3px 8px', borderRadius:'999px', fontSize:'11px', fontWeight:'700', background: reg.status==='confirmed'?'#dcfce7': reg.status==='attended'?'#e0e7ff':'#f3f4f6', color: reg.status==='confirmed'?'#15803d': reg.status==='attended'?'#3730a3':'#374151', textTransform:'capitalize' }}>{reg.status}</span></td>
                                    <td className="admin-user-cell-joined">{formatAdminDate(reg.createdAt)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delete Event Confirm */}
                  {adminDeleteItem && (
                    <div className="admin-modal-overlay" onClick={() => !adminDeleting && setAdminDeleteItem(null)}>
                      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                          <h3>Delete Event</h3>
                          <button type="button" className="admin-modal-close-btn" onClick={() => setAdminDeleteItem(null)} disabled={adminDeleting}><X size={18} /></button>
                        </div>
                        <p style={{ fontSize:'14px', color:'#475569', margin:'4px 0 16px' }}>Delete <strong>"{adminDeleteItem.title}"</strong>? This cannot be undone.</p>
                        <div className="admin-modal-actions">
                          <button type="button" className="admin-btn-cancel" onClick={() => setAdminDeleteItem(null)} disabled={adminDeleting}>Cancel</button>
                          <button type="button" className="admin-btn-confirm-delete" onClick={handleAdminDeleteEvent} disabled={adminDeleting}>{adminDeleting ? 'Deleting...' : 'Yes, Delete'}</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delete User Confirm */}
                  {adminDeleteUserItem && (
                    <div className="admin-modal-overlay" onClick={() => !adminDeletingUser && setAdminDeleteUserItem(null)}>
                      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                          <h3>Delete User</h3>
                          <button type="button" className="admin-modal-close-btn" onClick={() => setAdminDeleteUserItem(null)} disabled={adminDeletingUser}><X size={18} /></button>
                        </div>
                        <p style={{ fontSize:'14px', color:'#475569', margin:'4px 0 16px' }}>
                          Are you sure you want to delete user <strong>"{adminDeleteUserItem.firstName} {adminDeleteUserItem.lastName}"</strong> ({adminDeleteUserItem.email})? This will also remove their event registrations.
                        </p>
                        <div className="admin-modal-actions">
                          <button type="button" className="admin-btn-cancel" onClick={() => setAdminDeleteUserItem(null)} disabled={adminDeletingUser}>Cancel</button>
                          <button type="button" className="admin-btn-confirm-delete" onClick={handleAdminDeleteUser} disabled={adminDeletingUser}>
                            {adminDeletingUser ? 'Deleting...' : 'Yes, Delete User'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════ STUDENT DASHBOARD TAB ══════════════ */}
              {!isAdmin && activeTab === 'dashboard' && (
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
                              </div>
                              <div className="portal-event-card-body">
                                <div className="portal-event-card-top-row">
                                  {evt.category ? (
                                    <span className="portal-event-category-tag">{evt.category}</span>
                                  ) : <span />}
                                  {isRegistered ? (
                                    <span className="portal-event-countdown-pill registered">
                                      <span>Registered</span>
                                    </span>
                                  ) : new Date(evt.date) < now ? (
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

          {/* ══ ADMIN Events Tab ══ */}
          {isAdmin && activeTab === 'adminEvents' && (
            <AdminEventsPage />
          )}

          {/* ══ ADMIN Users Tab ══ */}
          {isAdmin && activeTab === 'adminUsers' && (
            <AdminUsersPage users={adminUsers} allRegistrations={adminAllRegistrations} events={events} />
          )}

          {/* ══ ADMIN Create Event Tab ══ */}
          {isAdmin && activeTab === 'adminCreateEvent' && (
            <div style={{ padding: '8px 12px' }}>
              <CreateEventPage />
            </div>
          )}

          {/* ══ STUDENT Events (Explore) Tab ══ */}
          {!isAdmin && activeTab === 'events' && (
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
                                    if (isRegistered) {
                                      return (
                                        <span className="explore-days-left registered">
                                          Registered
                                        </span>
                                      )
                                    }
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
                    <button
                      type="button"
                      className="profile-avatar-edit-btn"
                      title="Edit profile information"
                      onClick={handleOpenEditProfile}
                    >
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
                      ? registrations.filter(r => ['confirmed', 'selected', 'pending', 'attended'].includes(r.status))
                      : registrations.filter(r => r.status === 'attended')

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
                                    View Details
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

      {/* ── Edit Profile Modal Overlay ────────────────────────────────────── */}
      {showEditProfileModal && (
        <div className="portal-modal-backdrop" onClick={() => !editSubmitting && setShowEditProfileModal(false)}>
          <div
            className="portal-modal-card edit-profile-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Cross close button at top */}
            <button
              type="button"
              className="edit-profile-close-btn"
              onClick={() => setShowEditProfileModal(false)}
              disabled={editSubmitting}
              title="Close"
            >
              <X size={18} strokeWidth={2.4} />
            </button>

            {/* Profile Picture in Center */}
            <div className="edit-profile-avatar-center">
              <div className="profile-avatar-circle edit-profile-avatar-large">
                {getInitials(editFormData.firstName, editFormData.lastName)}
              </div>
              <span className="edit-profile-avatar-badge">
                <Pencil size={12} strokeWidth={2.5} />
              </span>
            </div>

            <h3 className="edit-profile-modal-title">Edit Account Profile</h3>
            <p className="edit-profile-modal-subtitle">
              Update your personal and student information below
            </p>

            {editError && (
              <div className="edit-profile-error-alert">
                <AlertTriangle size={15} color="#b91c1c" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="edit-profile-form">
              <div className="edit-profile-form-row">
                <div className="edit-profile-input-group">
                  <label htmlFor="editFirstName">First Name</label>
                  <input
                    id="editFirstName"
                    type="text"
                    required
                    value={editFormData.firstName}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    placeholder="First name"
                  />
                </div>

                <div className="edit-profile-input-group">
                  <label htmlFor="editLastName">Last Name</label>
                  <input
                    id="editLastName"
                    type="text"
                    required
                    value={editFormData.lastName}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="edit-profile-input-group">
                <label htmlFor="editEmail">Email Address</label>
                <input
                  id="editEmail"
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="student@sunway.edu.np"
                />
              </div>

              {user?.role === 'student' && (
                <div className="edit-profile-input-group">
                  <label htmlFor="editStudentId">Student ID</label>
                  <input
                    id="editStudentId"
                    type="text"
                    value={editFormData.studentId}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, studentId: e.target.value }))
                    }
                    placeholder="e.g. 26140472"
                  />
                </div>
              )}

              {/* Form Action Buttons with Submit */}
              <div className="edit-profile-actions">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setShowEditProfileModal(false)}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="edit-profile-submit-btn"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
