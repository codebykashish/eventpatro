import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchEventById, updateEvent, deleteEvent } from '../utils/api'
import { AlertCircle, CheckCircle2, Trash2, Settings } from 'lucide-react'
import FormBuilder from '../components/FormBuilder'
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
    registrationType: 'open',
    registrationDeadline: '',
    mentorName: '',
    mentorOccupation: '',
    mentorPhoto: '',
    mentorLinkedin: '',
    mentorBio: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    learningOutcomes: '',
    requirements: '',
    duration: '',
    fee: 'Free',
    isFree: true,
    hasBreakfast: false,
    laptopRequired: false,
    certificateProvided: true,
  })

  // Custom form questions
  const [formFields, setFormFields] = useState([])

  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting]           = useState(false)

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
          registrationType: ev.registrationType || 'open',
          registrationDeadline: toDatetimeLocal(ev.registrationDeadline),
          mentorName: ev.mentor?.name || '',
          mentorOccupation: ev.mentor?.occupation || '',
          mentorPhoto: ev.mentor?.photo || '',
          mentorLinkedin: ev.mentor?.linkedin || '',
          mentorBio: ev.mentor?.bio || '',
          contactName: ev.contactPerson?.name || '',
          contactEmail: ev.contactPerson?.email || '',
          contactPhone: ev.contactPerson?.phone || '',
          learningOutcomes: Array.isArray(ev.learningOutcomes) ? ev.learningOutcomes.join('\n') : '',
          requirements: Array.isArray(ev.requirements) ? ev.requirements.join('\n') : '',
          duration: ev.duration || '',
          fee: ev.fee || 'Free',
          isFree: ev.isFree ?? true,
          hasBreakfast: ev.hasBreakfast ?? false,
          laptopRequired: ev.laptopRequired ?? false,
          certificateProvided: ev.certificateProvided ?? true,
        })
        setFormFields(ev.formFields || [])
      } catch (err) {
        setError(err.message || 'Failed to load event for editing')
      } finally {
        setLoading(false)
      }
    }
    loadEvent()
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      // Validate multiple_choice fields
      for (const field of formFields) {
        if (field.type === 'multiple_choice' && (!field.options || field.options.filter(Boolean).length < 2)) {
          setError(`Question "${field.label}" needs at least 2 answer options.`)
          setSubmitting(false)
          return
        }
      }

      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        date: form.date,
        location: form.location,
        capacity: form.capacity ? Number(form.capacity) : null,
        coverImage: form.coverImage || null,
        registrationType: form.registrationType,
        registrationDeadline: form.registrationDeadline || null,
        mentor: ['workshop', 'seminar'].includes(form.category) ? {
          name: form.mentorName || '',
          occupation: form.mentorOccupation || '',
          photo: form.mentorPhoto || '',
          linkedin: form.mentorLinkedin || '',
          bio: form.mentorBio || '',
        } : undefined,
        contactPerson: {
          name: form.contactName || '',
          email: form.contactEmail || '',
          phone: form.contactPhone || '',
        },
        learningOutcomes: form.learningOutcomes
          ? form.learningOutcomes.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
        requirements: form.requirements
          ? form.requirements.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
        duration: form.duration || '',
        fee: form.fee || 'Free',
        isFree: form.isFree,
        hasBreakfast: form.hasBreakfast,
        laptopRequired: form.laptopRequired,
        certificateProvided: form.certificateProvided,
        formFields: formFields.map(({ _tempId, ...f }) => f),
      }

      await updateEvent(id, payload)
      setSuccess('Event updated successfully!')
      setTimeout(() => navigate(`/events/${id}`), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteEvent(id)
      setSuccess('Event deleted.')
      setTimeout(() => navigate('/admin'), 1200)
    } catch (err) {
      setError(err.message)
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="event-form-page">
        <div className="event-form-loading">Loading event data…</div>
      </div>
    )
  }

  return (
    <div className="event-form-page">
      <div className="event-form-card">
        <div className="event-form-header">
          <h1>Edit Event</h1>
          <p>Update the details below and save your changes.</p>
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

          {/* ── Logistics & Perks ── */}
          <div className="form-section-divider">
            <Settings size={14} />
            <span>Event Logistics &amp; Inclusions</span>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="ef-duration">Duration / Hours</label>
              <input
                id="ef-duration"
                name="duration"
                type="text"
                value={form.duration}
                onChange={handleChange}
                placeholder="e.g. 2.5 hours or 3 days"
              />
            </div>
            <div className="form-field">
              <label htmlFor="ef-fee">Event Fee (or Free)</label>
              <input
                id="ef-fee"
                name="fee"
                type="text"
                value={form.fee}
                onChange={handleChange}
                placeholder="e.g. Free or Rs. 500"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', margin: '12px 0 20px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                name="hasBreakfast"
                checked={form.hasBreakfast}
                onChange={handleChange}
              />
              <span>Breakfast / Refreshments provided</span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                name="laptopRequired"
                checked={form.laptopRequired}
                onChange={handleChange}
              />
              <span>Laptop Required</span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                name="certificateProvided"
                checked={form.certificateProvided}
                onChange={handleChange}
              />
              <span>Certificate Provided</span>
            </label>
          </div>

          {/* ── Conditional Mentor Section (Workshop / Seminar) ── */}
          {['workshop', 'seminar'].includes(form.category) && (
            <>
              <div className="form-section-divider">
                <Settings size={14} />
                <span>Mentor / Instructor Details</span>
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label htmlFor="ef-mentorName">Mentor Name</label>
                  <input
                    id="ef-mentorName"
                    name="mentorName"
                    type="text"
                    value={form.mentorName}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Rajesh Sharma"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="ef-mentorOccupation">Occupation / Designation</label>
                  <input
                    id="ef-mentorOccupation"
                    name="mentorOccupation"
                    type="text"
                    value={form.mentorOccupation}
                    onChange={handleChange}
                    placeholder="e.g. Senior AI Engineer at TechCo"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label htmlFor="ef-mentorPhoto">Mentor Photo URL</label>
                  <input
                    id="ef-mentorPhoto"
                    name="mentorPhoto"
                    type="url"
                    value={form.mentorPhoto}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="ef-mentorLinkedin">Mentor LinkedIn Profile</label>
                  <input
                    id="ef-mentorLinkedin"
                    name="mentorLinkedin"
                    type="url"
                    value={form.mentorLinkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="ef-mentorBio">Mentor Short Bio</label>
                <textarea
                  id="ef-mentorBio"
                  name="mentorBio"
                  rows={2}
                  value={form.mentorBio}
                  onChange={handleChange}
                  placeholder="A few sentences highlighting experience, background and credentials..."
                />
              </div>
            </>
          )}

          {/* ── Contact Person for Queries (All events) ── */}
          <div className="form-section-divider">
            <Settings size={14} />
            <span>Contact Person (For student queries)</span>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="ef-contactName">Contact Person Name</label>
              <input
                id="ef-contactName"
                name="contactName"
                type="text"
                value={form.contactName}
                onChange={handleChange}
                placeholder="e.g. Bibek Shrestha (Event Lead)"
              />
            </div>
            <div className="form-field">
              <label htmlFor="ef-contactPhone">Contact Phone Number</label>
              <input
                id="ef-contactPhone"
                name="contactPhone"
                type="text"
                value={form.contactPhone}
                onChange={handleChange}
                placeholder="e.g. +977 9812345678"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="ef-contactEmail">Contact Email</label>
            <input
              id="ef-contactEmail"
              name="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={handleChange}
              placeholder="e.g. events@sunway.edu.np"
            />
          </div>

          {/* ── Learning Outcomes & Requirements ── */}
          <div className="form-section-divider">
            <Settings size={14} />
            <span>Learning Outcomes &amp; Requirements</span>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="ef-outcomes">What You Will Learn / Outcomes (One per line)</label>
              <textarea
                id="ef-outcomes"
                name="learningOutcomes"
                rows={3}
                value={form.learningOutcomes}
                onChange={handleChange}
                placeholder="Core concepts and principles&#10;Hands-on project experience&#10;Industry networking &amp; certificate"
              />
            </div>
            <div className="form-field">
              <label htmlFor="ef-requirements">Requirements &amp; Prerequisites (One per line)</label>
              <textarea
                id="ef-requirements"
                name="requirements"
                rows={3}
                value={form.requirements}
                onChange={handleChange}
                placeholder="Basic programming interest&#10;Active student ID card&#10;Own laptop recommended"
              />
            </div>
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
            <Link to={`/events/${id}`} className="btn-form-cancel">Cancel</Link>
            <button
              type="button"
              className="btn-form-delete"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
            >
              <Trash2 size={14} /> Delete Event
            </button>
            <button type="submit" className="btn-form-submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* Delete confirmation inline */}
          {showDeleteConfirm && (
            <div className="delete-confirm-box">
              <p>Are you sure? This will remove the event from the public listing.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-confirm-del"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  className="btn-cancel-del"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default EditEventPage
