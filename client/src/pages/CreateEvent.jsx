import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createEvent } from '../utils/api'
import { AlertCircle, CheckCircle2, Settings } from 'lucide-react'
import FormBuilder from '../components/FormBuilder'
import './EventForm.css'

const CATEGORIES = [
  'academic', 'cultural', 'sports', 'workshop', 'seminar', 'social', 'club', 'other',
]

const CreateEventPage = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other',
    date: '',
    location: '',
    capacity: '',
    coverImage: '',
    registrationType: 'open',
    registrationDeadline: '',
  })

  // Custom form questions state
  const [formFields, setFormFields] = useState([])

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
      // Validate multiple_choice fields have at least 2 options
      for (const field of formFields) {
        if (field.type === 'multiple_choice' && (!field.options || field.options.filter(Boolean).length < 2)) {
          setError(`Question "${field.label}" needs at least 2 answer options.`)
          setSubmitting(false)
          return
        }
      }

      const payload = {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
        coverImage: form.coverImage || null,
        registrationDeadline: form.registrationDeadline || null,
        formFields: formFields.map(({ _tempId, ...f }) => f), // strip temp id before sending
      }

      await createEvent(payload)
      setSuccess('Event created successfully!')
      setTimeout(() => navigate('/admin'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="event-form-page">
      <div className="event-form-card">
        <div className="event-form-header">
          <h1>Create New Event</h1>
          <p>Fill in the details below to publish a new campus event.</p>
        </div>

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

        <form onSubmit={handleSubmit} className="event-form" id="create-event-form">
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
              <label htmlFor="ef-date">Date &amp; Time *</label>
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
              <label htmlFor="ef-capacity">Capacity (blank = unlimited)</label>
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

          {/* ── Phase 3: Registration settings ── */}
          <div className="form-section-divider">
            <Settings size={14} />
            <span>Registration Settings</span>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="ef-regType">Registration Type</label>
              <select
                id="ef-regType"
                name="registrationType"
                value={form.registrationType}
                onChange={handleChange}
              >
                <option value="open">Open — Anyone can join instantly</option>
                <option value="application">Application — Admin reviews &amp; selects</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="ef-deadline">Registration Deadline (optional)</label>
              <input
                id="ef-deadline"
                name="registrationDeadline"
                type="datetime-local"
                value={form.registrationDeadline}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Form builder */}
          <div className="form-field">
            <label>Custom Registration Form</label>
            <FormBuilder fields={formFields} onChange={setFormFields} />
          </div>

          {/* Action buttons */}
          <div className="form-actions">
            <Link to="/admin" className="btn-form-cancel">Cancel</Link>
            <button type="submit" className="btn-form-submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateEventPage
