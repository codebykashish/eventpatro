import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users } from 'lucide-react'
import './EventCard.css'

// Colour badge per category
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

// Friendly display names
const CATEGORY_LABELS = {
  academic:  'Academic',
  cultural:  'Cultural',
  sports:    'Sports',
  workshop:  'Workshop',
  seminar:   'Seminar',
  social:    'Social',
  club:      'Club',
  other:     'Other',
}

// Format "29 Oct 2026, 10:30 AM"
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const EventCard = ({ event }) => {
  const {
    _id,
    title,
    description,
    category,
    date,
    location,
    capacity,
    spotsLeft,
    coverImage,
    registeredUsers = [],
  } = event

  const badgeColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.other
  const isFull = capacity !== null && spotsLeft === 0

  return (
    <Link to={`/events/${_id}`} className="event-card" aria-label={`View details for ${title}`}>
      {/* Cover image or gradient placeholder */}
      <div
        className="event-card-cover"
        style={{
          backgroundImage: coverImage
            ? `url(${coverImage})`
            : `linear-gradient(135deg, #881421 0%, #3d0a10 100%)`,
        }}
      >
        {/* Category badge */}
        <span className="event-category-badge" style={{ background: badgeColor }}>
          {CATEGORY_LABELS[category] || 'Other'}
        </span>

        {/* Full / limited seats warning */}
        {isFull && <span className="event-full-badge">Fully Booked</span>}
      </div>

      {/* Card body */}
      <div className="event-card-body">
        <h3 className="event-card-title">{title}</h3>
        <p className="event-card-desc">
          {description.length > 90 ? description.slice(0, 90) + '…' : description}
        </p>

        <div className="event-card-meta">
          <span className="meta-item">
            <Calendar size={14} />
            {formatDate(date)}
          </span>
          <span className="meta-item">
            <MapPin size={14} />
            {location}
          </span>
          {capacity !== null && (
            <span className="meta-item">
              <Users size={14} />
              {isFull
                ? 'No seats left'
                : `${spotsLeft} / ${capacity} spots left`}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default EventCard
