import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Clock, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './EventCard.css'

// Category colour badge
const CATEGORY_COLORS = {
  academic:  '#3b82f6',
  cultural:  '#ec4899',
  sports:    '#22c55e',
  workshop:  '#f59e0b',
  seminar:   '#8b5cf6',
  social:    '#14b8a6',
  club:      '#f97316',
  other:     '#6b7280',
}

// Short date: "Apr 25 • 10:00 AM"
const formatDate = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' • ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// Countdown badge text
const getRemainingDays = (dateStr) => {
  if (!dateStr) return null
  const now = new Date()
  const target = new Date(dateStr)
  const diff = Math.ceil((target.setHours(0,0,0,0) - now.setHours(0,0,0,0)) / 86400000)

  if (diff < 0)  return { text: 'Past Event',        urgent: false, isPast: true  }
  if (diff === 0) return { text: 'Happening Today!', urgent: true,  isPast: false }
  if (diff === 1) return { text: '1 day remaining',  urgent: true,  isPast: false }
  return           { text: `${diff} days remaining`, urgent: diff <= 3, isPast: false }
}

/**
 * EventCard — used on landing page (requireAuth=true for visitors)
 * and on the event listing page (requireAuth=false for logged-in users).
 *
 * requireAuth=true  → clicking the card/button opens the auth modal for guests
 * requireAuth=false → clicking navigates directly to /events/:id
 */
const EventCard = ({ event, requireAuth = false }) => {
  const navigate = useNavigate()
  const { isAuthenticated, openAuthModal } = useAuth()

  const {
    _id, title, description, category, date, location,
    capacity, spotsLeft, registeredUsers, coverImage, registrationType,
  } = event

  const badgeColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.other
  const isFull     = capacity !== null && spotsLeft === 0
  const remaining  = getRemainingDays(date)

  // Total registered count for display
  const registeredCount = registeredUsers?.length ?? 0

  const handleAction = (e) => {
    e.stopPropagation()
    if (requireAuth && !isAuthenticated) {
      openAuthModal('signup')
      return
    }
    navigate(`/events/${_id}`)
  }

  // Clicking anywhere on the card also triggers the same action
  const handleCardClick = () => {
    if (requireAuth && !isAuthenticated) {
      openAuthModal('signup')
      return
    }
    navigate(`/events/${_id}`)
  }

  return (
    <div
      className="ec-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      aria-label={`View details for ${title}`}
    >
      {/* ── Cover Image ── */}
      <div
        className="ec-cover"
        style={{
          backgroundImage: coverImage
            ? `url(${coverImage})`
            : `linear-gradient(135deg, #881421 0%, #3d0a10 100%)`,
        }}
      >
        {/* Category pill — bottom left */}
        <span className="ec-category-pill" style={{ background: badgeColor }}>
          {category}
        </span>

        {/* Countdown badge — top right */}
        {remaining && (
          <span className={`ec-countdown ${remaining.urgent ? 'urgent' : ''} ${remaining.isPast ? 'past' : ''}`}>
            <Clock size={11} />
            {remaining.text}
          </span>
        )}

        {/* Fully booked badge */}
        {isFull && <span className="ec-full-badge">Fully Booked</span>}

        {/* Registration type badge — application events */}
        {registrationType === 'application' && !isFull && (
          <span className="ec-app-badge">Application</span>
        )}
      </div>

      {/* ── Card Body ── */}
      <div className="ec-body">
        {/* Title */}
        <h3 className="ec-title">{title}</h3>

        {/* Short description excerpt */}
        {description && (
          <p className="ec-description">
            {description.length > 90 ? description.slice(0, 90) + '…' : description}
          </p>
        )}

        {/* Meta info row */}
        <div className="ec-meta-row">
          <div className="ec-meta-item">
            <Calendar size={13} />
            <span>{formatDate(date)}</span>
          </div>
          {capacity !== null && (
            <div className="ec-meta-item">
              <Users size={13} />
              <span>{registeredCount}/{capacity}</span>
            </div>
          )}
          <div className="ec-meta-item ec-location">
            <MapPin size={13} />
            <span>{location}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="ec-divider" />

        {/* CTA button */}
        <button
          type="button"
          className={`ec-cta-btn ${isFull ? 'ec-cta-full' : ''}`}
          onClick={handleAction}
          disabled={isFull}
          aria-label={isFull ? 'Fully booked' : requireAuth && !isAuthenticated ? 'Sign up to register' : 'Register now'}
        >
          {isFull
            ? 'Fully Booked'
            : requireAuth && !isAuthenticated
              ? 'Sign Up to Register'
              : 'Register Now'}
          {!isFull && <ArrowRight size={15} />}
        </button>
      </div>
    </div>
  )
}

export default EventCard
