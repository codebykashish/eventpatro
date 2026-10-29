import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchEventById, updateEvent, deleteEvent } from '../utils/api'
import { AlertCircle, CheckCircle2, Trash2 } from 'lucide-react'
import './EventForm.css'

const CATEGORIES = [
  'academic', 'cultural', 'sports', 'workshop', 'seminar', 'social', 'club', 'other',
]

// Convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
const toDatetimeLocal = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const offset = date.getTimezoneOffset() * 60000
  const localDate = new Date(date.getTime() - offset)
  return localDate.toISOString().slice(0, 16)
}

const EditEventPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other',
    date: '',
    location: '',
    capacity: '',
    coverImage: '',
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const data = await fetchEventById(id)
        const ev = data.event
        setForm({
          title: ev.title || '',
          description: ev.description || '',
          category: ev.category || 'other',
          date: toDatetimeLocal(ev.date),
          location: ev.location || '',
          capacity: ev.capacity !== null && ev.capacity !== undefined ? String(ev.capacity) : '',
          coverImage: ev.coverImage || '',
        })
      } catch (err) {
        setError(err.message || 'Failed to load event for editing')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const payload = {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
        coverImage: form.coverImage || null,
      }

      await updateEvent(id, payload)
      setSuccess('Event updated successfully!')
      setTimeout(() => navigate(`/events/${id}`), 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setError('')
    setDeleting(true)
    try {
      await deleteEvent(id)
      setSuccess('Event removed from listings.')
      setTimeout(() => navigate('/events'), 1200)
    } catch (err) {
      setError(err.message)
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="event-detail-loading" style={{ minHeight: '60vh' }}>
        <div className="loading-spinner" />
        <span>Loading event details...</span>
      </div>
    )
  }

  return (
    <div className="event-form-page">
      <div className="event-form-card">
        <div className="event-form-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Edit Event</h1>
            <button
              type="button"
              className="btn-danger-outline"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                border: '1px solid #dc2626',
                color: '#dc2626',
                background: 'transparent',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={15} /> Delete Event
            </button>
          </div>
          <p>Update the event details or schedule below.</p>
        </div>

        {/* Delete confirmation modal / prompt */}
        {showDeleteConfirm && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <strong style={{ color: '#991b1b', fontSize: '14px' }}>
              Are you sure you want to delete this event?
            </strong>
            <p style={{ color: '#7f1d1d', fontSize: '13px', margin: 0 }}>
              This will remove the event from the public listing.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 14px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Feedback banners */}
        {error && (
          <div className="form-banner form-banner-error">
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {success && (
          <div className="form-banner form-banner-success">
            <CheckCircle2 size={15} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="event-form" id="edit-event-form">
          {/* Title */}
          <div className="form-field">
            <label htmlFor="ef-title">Event Title *</label>
            <input
              id="ef-title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="e.g. Annual Sports Day 2025"
            />
          </div>

          {/* Description */}
          <div className="form-field">
            <label htmlFor="ef-description">Description *</label>
            <textarea
              id="ef-description"
              name="description"
              rows={5}
              value={form.description}
              onChange={handleChange}
              required
              placeholder="Describe what will happen, who should attend, and any other relevant details..."
            />
          </div>

          {/* Category + Date row */}
          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="ef-category">Category</label>
              <select id="ef-category" name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="ef-date">Date & Time *</label>
              <input
                id="ef-date"
                name="date"
                type="datetime-local"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Location + Capacity row */}
          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="ef-location">Location *</label>
              <input
                id="ef-location"
                name="location"
                type="text"
                value={form.location}
                onChange={handleChange}
                required
                placeholder="e.g. Main Hall, Block A"
              />
            </div>
            <div className="form-field">
              <label htmlFor="ef-capacity">Capacity (leave blank for unlimited)</label>
              <input
                id="ef-capacity"
                name="capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={handleChange}
                placeholder="e.g. 100"
              />
            </div>
          </div>

          {/* Cover image URL */}
          <div className="form-field">
            <label htmlFor="ef-coverImage">Cover Image URL (optional)</label>
            <input
              id="ef-coverImage"
              name="coverImage"
              type="url"
              value={form.coverImage}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          {/* Action buttons */}
          <div className="form-actions">
            <Link to={`/events/${id}`} className="btn-form-cancel">Cancel</Link>
            <button type="submit" className="btn-form-submit" disabled={submitting}>
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditEventPage
