import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createEvent, uploadImage } from '../utils/api'
import { derivePricing, linesToList } from '../utils/eventForm'
import { mediaUrl } from '../utils/mediaUrl'
import { AlertCircle, CheckCircle2, Settings, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
import FormBuilder from '../components/FormBuilder'
import './EventForm.css'

const CATEGORIES = [
  'academic', 'cultural', 'sports', 'workshop', 'seminar', 'social', 'club', 'other',
]

const INITIAL_FORM = {
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
  fee: '',
  qrCode: '',
  isFree: true,
  hasBreakfast: false,
  laptopRequired: false,
  certificateProvided: false,
}

const CreateEventPage = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL_FORM)

  // Custom form questions state
  const [formFields, setFormFields] = useState([])

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [createdEventId, setCreatedEventId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingQr, setUploadingQr] = useState(false)

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploadingImage(true)
    try {
      const data = await uploadImage(file)
      setForm((prev) => ({ ...prev, coverImage: data.url }))
    } catch (err) {
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploadingQr(true)
    try {
      const data = await uploadImage(file)
      setForm((prev) => ({ ...prev, qrCode: data.url }))
    } catch (err) {
      setError(err.message || 'Failed to upload QR code')
    } finally {
      setUploadingQr(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  // Current local datetime string for input min attribute (YYYY-MM-DDTHH:mm)
  const nowMin = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // Validate event date is strictly in the future
      const eventTime = new Date(form.date).getTime()
      if (isNaN(eventTime) || eventTime <= Date.now()) {
        setError('Event date and time must be in the future.')
        setSubmitting(false)
        return
      }

      if (form.registrationDeadline) {
        const deadlineTime = new Date(form.registrationDeadline).getTime()
        if (isNaN(deadlineTime) || deadlineTime <= Date.now()) {
          setError('Registration deadline must be in the future.')
          setSubmitting(false)
          return
        }
        if (deadlineTime >= eventTime) {
          setError('Registration deadline must be before the event date and time.')
          setSubmitting(false)
          return
        }
      }
      // Validate multiple_choice fields have at least 2 options
      for (const field of formFields) {
        if (field.type === 'multiple_choice' && (!field.options || field.options.filter(Boolean).length < 2)) {
          setError(`Question "${field.label}" needs at least 2 answer options.`)
          setSubmitting(false)
          return
        }
      }

      const pricing = derivePricing(form.fee)

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
        learningOutcomes: linesToList(form.learningOutcomes),
        requirements: linesToList(form.requirements),
        duration: form.duration || '',
        ...pricing,
        qrCode: pricing.isFree ? null : (form.qrCode || null),
        hasBreakfast: form.hasBreakfast,
        laptopRequired: form.laptopRequired,
        certificateProvided: form.certificateProvided,
        formFields: formFields.map(({ _tempId, ...f }) => f), // strip temp id before sending
      }

      const res = await createEvent(payload)
      const newId = res.event?._id || res.event?.id
      setCreatedEventId(newId)
      setSuccess('Event published successfully!')
      // Refresh / clear the create event form inputs
      setForm(INITIAL_FORM)
      setFormFields([])
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
                min={nowMin}
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

          {/* Event Cover Image Upload */}
          <div className="form-field">
            <label>Cover Image (Upload from Device or paste URL)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* File upload button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label
                  htmlFor="ef-fileUpload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: '#881421',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                    opacity: uploadingImage ? 0.7 : 1,
                    transition: 'background 0.2s',
                  }}
                >
                  <Upload size={16} />
                  <span>{uploadingImage ? 'Uploading image...' : 'Upload from Device'}</span>
                </label>
                <input
                  id="ef-fileUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  style={{ display: 'none' }}
                />

                <span style={{ fontSize: '13px', color: '#64748b' }}>or paste an online URL:</span>
                <input
                  id="ef-coverImage"
                  name="coverImage"
                  type="text"
                  value={form.coverImage}
                  onChange={handleChange}
                  placeholder="https://... or /uploads/..."
                  style={{ flex: 1, minWidth: '200px' }}
                />
              </div>

              {/* Image preview */}
              {form.coverImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <img
                    src={mediaUrl(form.coverImage)}
                    alt="Cover preview"
                    style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                    onError={(e) => { e.currentTarget.src = '/connected_events.jpg' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {form.coverImage}
                    </span>
                    <span style={{ fontSize: '11px', color: '#16a34a' }}>Image selected</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, coverImage: '' }))}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                    title="Remove image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
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

          {/* Conditional Payment QR Upload — only shown for paid events */}
          {!derivePricing(form.fee).isFree && (
            <div className="form-field" style={{ background: '#fdf2f4', padding: '16px', borderRadius: '10px', border: '1px dashed #b91c1c', marginBottom: '16px' }}>
              <label style={{ color: '#881421', fontWeight: 600 }}>Payment QR Code (Required for paid event enrollments)</label>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 10px' }}>
                Upload the official QR code (eSewa / Khalti / Fonepay / Bank QR) that students will scan to pay the fee.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <label
                    htmlFor="ef-qrUpload"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: '#881421',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: uploadingQr ? 'not-allowed' : 'pointer',
                      opacity: uploadingQr ? 0.7 : 1,
                    }}
                  >
                    <Upload size={14} />
                    {uploadingQr ? 'Uploading QR…' : 'Upload Payment QR'}
                  </label>
                  <input
                    id="ef-qrUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    disabled={uploadingQr}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '12px', color: '#64748b' }}>or paste image URL:</span>
                  <input
                    type="url"
                    name="qrCode"
                    value={form.qrCode || ''}
                    onChange={handleChange}
                    placeholder="https://.../qr.png"
                    style={{ flex: 1, minWidth: '200px', fontSize: '13px', padding: '7px 10px' }}
                  />
                </div>
                {form.qrCode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <img
                      src={mediaUrl(form.qrCode)}
                      alt="Payment QR preview"
                      style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff' }}
                    />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, qrCode: '' }))}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Remove QR"
                    >
                      <Trash2 size={15} /> Remove QR
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

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
                min={nowMin}
                max={form.date || undefined}
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

        {/* Success Modal Popup */}
        {success && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '16px',
            }}
            onClick={() => setSuccess('')}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '32px 28px',
                maxWidth: '460px',
                width: '100%',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
                textAlign: 'center',
                animation: 'popIn 0.25s ease-out',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
                Event Published Successfully!
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
                Your event has been published to the campus catalog. The form has been reset for new entries, or you can manage this event right now.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSuccess('')}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Create Another Event
                </button>
                {createdEventId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${createdEventId}`)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#881421',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    View / Edit Event
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateEventPage
