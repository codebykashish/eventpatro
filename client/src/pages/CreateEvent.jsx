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
    category: 'workshop',
    date: '',
    location: '',
    capacity: '',
    coverImage: '',
    registrationType: 'open',
    registrationDeadline: '',
    // Mentor details
    mentorName: '',
    mentorOccupation: '',
    mentorPhoto: '',
    mentorLinkedin: '',
    mentorBio: '',
    // Contact person details
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    // Details
    learningOutcomes: '',
    requirements: '',
    duration: '',
    fee: 'Free',
    isFree: true,
    hasBreakfast: false,
    laptopRequired: false,
    certificateProvided: true,
  })

  // Custom form questions state
  const [formFields, setFormFields] = useState([])

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
      // Validate multiple_choice fields have at least 2 options
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
