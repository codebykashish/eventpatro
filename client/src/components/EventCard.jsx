import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, ArrowRight, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './EventCard.css'

// Colour badge per category matching theme
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

const CATEGORY_LABELS = {
  academic: 'Academic',
  cultural: 'Cultural',
  sports: 'Sports',
  workshop: 'Workshop',
  seminar: 'Seminar',
  social: 'Social',
  club: 'Club',
  other: 'Other',
}

// Format "Apr 25, 2026 • 10:00 AM"
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

// Calculate "2 days remaining", "Happening Today!", etc.
const getRemainingDays = (dateStr) => {
  if (!dateStr) return null
  const now = new Date()
  const target = new Date(dateStr)
  const diffTime = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { text: 'Past Event', urgent: false, isPast: true }
  if (diffDays === 0) return { text: 'Happening Today!', urgent: true, isPast: false }
  if (diffDays === 1) return { text: '1 day remaining', urgent: true, isPast: false }
  return { text: `${diffDays} days remaining`, urgent: diffDays <= 3, isPast: false }
}

const EventCard = ({ event, requireAuth = false }) => {
  const navigate = useNavigate()
  const { isAuthenticated, openAuthModal } = useAuth()

  const {
    _id,
    title,
    category,
    date,
    location,
    capacity,
    spotsLeft,
    coverImage,
  } = event

  const badgeColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.other
  const isFull = capacity !== null && spotsLeft === 0
  const remaining = getRemainingDays(date)

  const handleClick = (e) => {
    e.preventDefault()
    // If requireAuth is enabled and user is not logged in, trigger auth modal
    if (requireAuth && !isAuthenticated) {
      openAuthModal('signup')
      return
    }
    navigate(`/events/${_id}`)
  }

  return (
    <div
      onClick={handleClick}
      className="event-card-modern"
      role="button"
      tabIndex={0}
      aria-label={`View details for ${title}`}
    >
      {/* Cover image area */}
      <div
        className="card-cover-container"
        style={{
          backgroundImage: coverImage
            ? `url(${coverImage})`
            : `linear-gradient(135deg, #881421 0%, #3d0a10 100%)`,
        }}
      >
        {/* Category Pill Tag floating at bottom left of cover */}
        <span
          className="card-category-tag"
          style={{ backgroundColor: badgeColor }}
        >
          {CATEGORY_LABELS[category] || 'Event'}
        </span>

        {/* Days remaining badge at top-right */}
        {remaining && (
          <span
            className={`card-countdown-tag ${remaining.urgent ? 'urgent' : ''} ${
              remaining.isPast ? 'past' : ''
            }`}
          >
            <Clock size={11} />
            <span>{remaining.text}</span>
          </span>
        )}

        {isFull && <span className="card-full-tag">Fully Booked</span>}
      </div>

      {/* Card Content */}
      <div className="card-modern-body">
        <h3 className="card-modern-title">{title}</h3>

        <div className="card-meta-list">
          <div className="card-meta-row">
            <Calendar size={14} className="meta-icon" />
            <span>{formatDate(date)}</span>
          </div>

          <div className="card-meta-footer">
            <div className="card-meta-row">
              <MapPin size={14} className="meta-icon" />
              <span className="location-text">{location}</span>
            </div>

            {/* Circular action button matching inspiration design */}
            <div className="card-circle-action" title="View event">
              <ArrowRight size={15} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventCard
