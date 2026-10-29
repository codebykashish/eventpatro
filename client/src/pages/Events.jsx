import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import EventCard from '../components/EventCard'
import { fetchEvents } from '../utils/api'
import './Events.css'

// Categories match those defined in the backend Event model
const CATEGORIES = [
  { value: '', label: 'All Events' },
  { value: 'academic', label: 'Academic' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'social', label: 'Social' },
  { value: 'club', label: 'Club' },
  { value: 'other', label: 'Other' },
]

const EventsPage = () => {
  const [events, setEvents] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Debounce search so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // Fetch events whenever filters or page change
  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchEvents({ search: debouncedSearch, category, page })
      setEvents(data.events)
      setTotal(data.total)
      setPages(data.pages)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, category, page])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, category])

  const clearSearch = () => setSearch('')

  return (
    <div className="events-page">
      {/* ── Page header ── */}
      <div className="events-hero">
        <h1 className="events-hero-title">Campus Events</h1>
        <p className="events-hero-sub">Explore and register for upcoming events at Sunway College</p>
      </div>

      {/* ── Filters ── */}
      <div className="events-filters-bar">
        {/* Search input */}
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            id="event-search"
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button className="search-clear-btn" onClick={clearSearch} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="category-pills" role="group" aria-label="Filter by category">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`category-pill ${category === cat.value ? 'active' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results info ── */}
      <div className="events-results-info">
        {!loading && !error && (
          <span>
            {total === 0 ? 'No events found' : `${total} event${total !== 1 ? 's' : ''} found`}
          </span>
        )}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="events-loading">
          <div className="loading-spinner" />
          <span>Loading events...</span>
        </div>
      ) : error ? (
        <div className="events-error">{error}</div>
      ) : events.length === 0 ? (
        <div className="events-empty">
          <SlidersHorizontal size={40} />
          <p>No events match your current filters.</p>
          <button className="btn-reset-filters" onClick={() => { setSearch(''); setCategory('') }}>
            Reset filters
          </button>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((ev) => (
            <EventCard key={ev._id} event={ev} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div className="events-pagination">
          <button
            className="page-btn"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`page-btn ${p === page ? 'active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
            disabled={page === pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export default EventsPage
