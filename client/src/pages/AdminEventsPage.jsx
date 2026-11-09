import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Eye, Edit, Trash2, X, MapPin, Users, Clock,
  ChevronDown, CheckCircle2, Check, UserCheck, FileText
} from 'lucide-react'
import { fetchEvents, getEventRegistrations, deleteEvent, updateRegistrationStatus } from '../utils/api'
import EditEventPage from './EditEvent'
import './AdminEventsPage.css'

const CATEGORIES = ['Workshop', 'Seminar', 'Cultural', 'Sports', 'Hackathon', 'Other']

const isLimitedCapacity = (ev) => ev?.capacity != null && Number(ev.capacity) > 0

const getAttendance = (reg) => {
  if (reg?.attendance === 'present' || reg?.attendance === 'absent') return reg.attendance
  if (reg?.status === 'attended') return 'present'
  return null
}

const canMarkAttendance = (reg) => ['confirmed', 'selected', 'attended'].includes(reg?.status)

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const daysUntil = (iso) => {
  if (!iso) return null
  const diff = Math.ceil((new Date(iso) - new Date()) / 86400000)
  return diff
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('')
  const [timeline, setTimeline] = useState('all') // 'all' | 'upcoming' | 'past'

  // Registrations popup
  const [regPopupEvent, setRegPopupEvent] = useState(null)
  const [regList, setRegList] = useState([])
  const [regLoading, setRegLoading] = useState(false)
  const [attendeeSearch, setAttendeeSearch] = useState('')
  const [attendeeFilter, setAttendeeFilter] = useState('all')
  const [selectedAnswersReg, setSelectedAnswersReg] = useState(null)

  // Delete confirm
  const [deleteItem, setDeleteItem] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Edit Event modal
  const [editingEventId, setEditingEventId] = useState(null)

  useEffect(() => {
    fetchEvents({ limit: 200 })
      .then((d) => setEvents(d.events || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        if (
          !ev.title?.toLowerCase().includes(q) &&
          !ev.location?.toLowerCase().includes(q) &&
          !ev.category?.toLowerCase().includes(q)
        ) return false
      }
      if (selectedCat && (ev.category || '').toLowerCase() !== selectedCat.toLowerCase()) return false
      const isPast = new Date(ev.date || 0) < now
      if (timeline === 'upcoming' && isPast) return false
      if (timeline === 'past' && !isPast) return false
      return true
    })
  }, [events, search, selectedCat, timeline, now])

  const upcomingEvents = useMemo(() => filtered.filter(ev => new Date(ev.date || 0) >= now).sort((a,b) => new Date(a.date)-new Date(b.date)), [filtered])
  const pastEvents    = useMemo(() => filtered.filter(ev => new Date(ev.date || 0) < now).sort((a,b) => new Date(b.date)-new Date(a.date)), [filtered])

  const totalAll      = events.length
  const totalUpcoming = events.filter(ev => new Date(ev.date || 0) >= now).length
  const totalPast     = events.filter(ev => new Date(ev.date || 0) < now).length

  const openRegs = async (ev) => {
    setRegPopupEvent(ev)
    setRegLoading(true)
    setRegList([])
    setAttendeeSearch('')
    setAttendeeFilter('all')
    setSelectedAnswersReg(null)
    try {
      const d = await getEventRegistrations(ev._id)
      setRegList(d.registrations || [])
    } catch { setRegList([]) }
    finally { setRegLoading(false) }
  }

  const handleStatusChange = async (regId, newStatus) => {
    if (!regPopupEvent) return
    try {
      const res = await updateRegistrationStatus(regPopupEvent._id, regId, { status: newStatus })
      setRegList(prev => prev.map(r => {
        if (r._id !== regId) return r
        return res.registration || {
          ...r,
          status: newStatus,
          attendance: newStatus === 'rejected' ? null : r.attendance,
        }
      }))
    } catch (err) {
      alert(err.message || 'Failed to update registration status')
    }
  }

  const handleAttendanceChange = async (regId, attendance) => {
    if (!regPopupEvent) return
    try {
      const res = await updateRegistrationStatus(regPopupEvent._id, regId, { attendance })
      setRegList(prev => prev.map(r => {
        if (r._id !== regId) return r
        return res.registration || { ...r, attendance }
      }))
    } catch (err) {
      alert(err.message || 'Failed to update attendance')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem?._id) return
    setDeleting(true)
    try {
      await deleteEvent(deleteItem._id)
      setEvents(prev => prev.filter(e => e._id !== deleteItem._id))
      setSuccessMsg(`"${deleteItem.title}" deleted.`)
      setDeleteItem(null)
      setTimeout(() => setSuccessMsg(''), 3500)
    } catch (err) {
      alert(err.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="aep-root">
      {/* ── Stat cards ── */}
      <div className="aep-stats-row">
        <div className="aep-stat-card">
          <span className="aep-stat-num">{totalAll}</span>
          <span className="aep-stat-label">Total Events</span>
        </div>
        <div className="aep-stat-card aep-stat-card--upcoming">
          <span className="aep-stat-num">{totalUpcoming}</span>
          <span className="aep-stat-label">Upcoming</span>
        </div>
        <div className="aep-stat-card aep-stat-card--past">
          <span className="aep-stat-num">{totalPast}</span>
          <span className="aep-stat-label">Past</span>
        </div>
      </div>

      {successMsg && (
        <div className="aep-success-bar"><CheckCircle2 size={15}/><span>{successMsg}</span></div>
      )}

      {/* ── Mobile Horizontal Chips Filter Row (same as user explore page) ── */}
      <div className="aep-mobile-chips-row">
        <div className="aep-mobile-search-box">
          <Search size={14} className="aep-mobile-search-icon" />
          <input
            type="text"
            placeholder="Search events, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="aep-mobile-search-input"
          />
          {search && (
            <button
              type="button"
              className="aep-search-clear"
              onClick={() => setSearch('')}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="aep-mobile-filter-chips">
          <button
            type="button"
            className={`mobile-chip ${timeline === 'all' && !selectedCat ? 'mobile-chip-active' : ''}`}
            onClick={() => { setTimeline('all'); setSelectedCat(''); }}
          >
            All
          </button>
          <button
            type="button"
            className={`mobile-chip ${timeline === 'upcoming' ? 'mobile-chip-active' : ''}`}
            onClick={() => setTimeline(t => t === 'upcoming' ? 'all' : 'upcoming')}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`mobile-chip ${timeline === 'past' ? 'mobile-chip-active' : ''}`}
            onClick={() => setTimeline(t => t === 'past' ? 'all' : 'past')}
          >
            Past
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`mobile-chip ${selectedCat.toLowerCase() === cat.toLowerCase() ? 'mobile-chip-active' : ''}`}
              onClick={() => setSelectedCat(c => c.toLowerCase() === cat.toLowerCase() ? '' : cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <Link to="/admin/events/new" className="aep-mobile-create-btn">
          + Create Event
        </Link>
      </div>

      {/* ── Body: filters + tables ── */}
      <div className="aep-body">
        {/* Filter sidebar */}
        <aside className="aep-filter-panel">
          <h3 className="aep-filter-heading">Filters</h3>

          <div className="aep-filter-group">
            <label>Search</label>
            <div className="aep-search-wrap">
              <Search size={14} className="aep-search-icon"/>
              <input
                type="text"
                placeholder="Event name, location…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="aep-search-input"
              />
              {search && (
                <button className="aep-search-clear" onClick={() => setSearch('')}><X size={13}/></button>
              )}
            </div>
          </div>

          <div className="aep-filter-group">
            <label>Category</label>
            <div className="aep-select-wrap">
              <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} className="aep-select">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="aep-select-arrow"/>
            </div>
          </div>

          <div className="aep-filter-group">
            <label>Timeline</label>
            <div className="aep-timeline-btns">
              {['all','upcoming','past'].map(t => (
                <button key={t} className={`aep-timeline-btn ${timeline === t ? 'active' : ''}`} onClick={() => setTimeline(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="aep-filter-results-count">
            Showing <strong>{filtered.length}</strong> of {totalAll} events
          </div>

          <Link to="/admin/events/new" className="aep-create-btn">
            + Create Event
          </Link>
        </aside>

        {/* Tables area */}
        <div className="aep-tables-area">
          {loading ? (
            <div className="aep-loading">Loading events…</div>
          ) : (
            <>
              {/* Upcoming */}
              {(timeline === 'all' || timeline === 'upcoming') && (
                <section className="aep-section">
                  <div className="aep-section-header">
                    <span className="aep-section-dot aep-dot-upcoming"/>
                    <h2>Upcoming Events <span className="aep-count-chip">{upcomingEvents.length}</span></h2>
                  </div>
                  <EventTable
                    rows={upcomingEvents}
                    onViewRegs={openRegs}
                    onEdit={(ev) => setEditingEventId(ev._id)}
                    onDelete={setDeleteItem}
                    formatDate={formatDate}
                    daysUntil={daysUntil}
                    isUpcoming
                  />
                </section>
              )}

              {/* Past */}
              {(timeline === 'all' || timeline === 'past') && (
                <section className="aep-section">
                  <div className="aep-section-header">
                    <span className="aep-section-dot aep-dot-past"/>
                    <h2>Past Events <span className="aep-count-chip aep-count-chip--past">{pastEvents.length}</span></h2>
                  </div>
                  <EventTable
                    rows={pastEvents}
                    onViewRegs={openRegs}
                    onEdit={(ev) => setEditingEventId(ev._id)}
                    onDelete={setDeleteItem}
                    formatDate={formatDate}
                    daysUntil={daysUntil}
                    isUpcoming={false}
                  />
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Registrations Popup ── */}
      {regPopupEvent && (() => {
        const hasQuestions = Boolean(regPopupEvent.formFields && regPopupEvent.formFields.length > 0)
        const hasReview = isLimitedCapacity(regPopupEvent) || regList.some((r) => r.status === 'pending')

        const totalEnrolled = regList.length
        const totalActive = regList.filter(r => ['confirmed', 'selected', 'attended'].includes(r.status)).length
        const attendedCount = regList.filter(r => getAttendance(r) === 'present').length
        const absentCount = regList.filter(r => getAttendance(r) === 'absent').length
        const cancelledCount = regList.filter(r => r.status === 'cancelled').length
        const rejectedCount = regList.filter(r => r.status === 'rejected').length
        const pendingCount = regList.filter(r => r.status === 'pending').length
        const selectedCount = regList.filter(r => r.status === 'selected' || (!hasReview && r.status === 'confirmed')).length

        const filteredRegs = regList.filter(r => {
          if (attendeeSearch.trim()) {
            const q = attendeeSearch.toLowerCase()
            const fullName = `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.toLowerCase()
            const email = (r.student?.email || '').toLowerCase()
            const code = (r.registrationCode || '').toLowerCase()
            if (!fullName.includes(q) && !email.includes(q) && !code.includes(q)) return false
          }
          if (attendeeFilter !== 'all') {
            if (attendeeFilter === 'confirmed') {
              if (hasReview) {
                if (r.status !== 'selected') return false
              } else if (r.status !== 'confirmed' && r.status !== 'selected') {
                return false
              }
            } else if (attendeeFilter === 'attended') {
              if (getAttendance(r) !== 'present') return false
            } else if (r.status !== attendeeFilter) {
              return false
            }
          }
          return true
        })

        return (
          <div className="aep-overlay" onClick={() => setRegPopupEvent(null)}>
            <div className="aep-popup aep-popup--xl" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="aep-reg-card-header">
                <div className="aep-reg-title-group">
                  <div className="aep-reg-icon-box">
                    <UserCheck size={22} />
                  </div>
                  <div>
                    <h3 className="aep-reg-main-title">
                      {hasReview ? 'Applications & Candidate Review' : 'Enrollments & Attendance'}
                    </h3>
                    <p className="aep-reg-main-sub">
                      {regPopupEvent.title} · Manage registered participants, questionnaire responses, and attendance.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="aep-reg-count-pill">
                    <span>{totalActive} Active Enrolled</span>
                  </div>
                  <button className="aep-popup-close" onClick={() => setRegPopupEvent(null)}><X size={17}/></button>
                </div>
              </div>

              {/* Stats Strip */}
              <div className="aep-attendance-bar">
                <div className="aep-attendance-stat aep-attendance-total">
                  <span className="aep-att-num">{totalEnrolled}</span>
                  <span className="aep-att-label">Total Enrolled</span>
                </div>
                <div className="aep-attendance-stat aep-attendance-present">
                  <span className="aep-att-num">{attendedCount}</span>
                  <span className="aep-att-label">Present / Attended</span>
                </div>
                <div className="aep-attendance-stat aep-attendance-absent">
                  <span className="aep-att-num">{absentCount}</span>
                  <span className="aep-att-label">Absent</span>
                </div>
                {cancelledCount > 0 && (
                  <div className="aep-attendance-stat aep-attendance-cancelled">
                    <span className="aep-att-num">{cancelledCount}</span>
                    <span className="aep-att-label">Cancelled</span>
                  </div>
                )}
                {hasReview && (
                  <>
                    <div className="aep-attendance-stat aep-attendance-pending">
                      <span className="aep-att-num">{pendingCount}</span>
                      <span className="aep-att-label">Pending Review</span>
                    </div>
                    <div className="aep-attendance-stat aep-attendance-rejected">
                      <span className="aep-att-num">{rejectedCount}</span>
                      <span className="aep-att-label">Rejected</span>
                    </div>
                  </>
                )}
              </div>

              {/* Toolbar: Search + Filter Pills */}
              <div className="aep-reg-toolbar">
                <div className="aep-reg-search-box">
                  <Search size={14} className="aep-reg-search-icon" />
                  <input
                    type="text"
                    placeholder="Search enrolled students by name, email, or code…"
                    value={attendeeSearch}
                    onChange={e => setAttendeeSearch(e.target.value)}
                    className="aep-reg-search-input"
                  />
                  {attendeeSearch && (
                    <button
                      type="button"
                      className="aep-search-clear"
                      onClick={() => setAttendeeSearch('')}
                      style={{ right: '8px' }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="aep-reg-filter-pills">
                  <button
                    type="button"
                    className={`aep-reg-filter-pill ${attendeeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setAttendeeFilter('all')}
                  >
                    All ({totalEnrolled})
                  </button>
                  {hasReview && (
                    <button
                      type="button"
                      className={`aep-reg-filter-pill ${attendeeFilter === 'pending' ? 'active' : ''}`}
                      onClick={() => setAttendeeFilter('pending')}
                    >
                      Pending ({pendingCount})
                    </button>
                  )}
                  <button
                    type="button"
                    className={`aep-reg-filter-pill ${attendeeFilter === 'confirmed' ? 'active' : ''}`}
                    onClick={() => setAttendeeFilter('confirmed')}
                  >
                    {hasReview ? `Selected (${selectedCount})` : `Registered (${selectedCount})`}
                  </button>
                  <button
                    type="button"
                    className={`aep-reg-filter-pill ${attendeeFilter === 'attended' ? 'active' : ''}`}
                    onClick={() => setAttendeeFilter('attended')}
                  >
                    Present ({attendedCount})
                  </button>
                  {cancelledCount > 0 && (
                    <button
                      type="button"
                      className={`aep-reg-filter-pill ${attendeeFilter === 'cancelled' ? 'active' : ''}`}
                      onClick={() => setAttendeeFilter('cancelled')}
                    >
                      Cancelled ({cancelledCount})
                    </button>
                  )}
                  {rejectedCount > 0 && (
                    <button
                      type="button"
                      className={`aep-reg-filter-pill ${attendeeFilter === 'rejected' ? 'active' : ''}`}
                      onClick={() => setAttendeeFilter('rejected')}
                    >
                      Rejected ({rejectedCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Table / Content */}
              <div className="aep-popup-body aep-popup-scroll-x">
                {regLoading ? (
                  <div className="aep-popup-loading">
                    <Clock size={18} className="spinning" />
                    <span>Loading enrolled students…</span>
                  </div>
                ) : regList.length === 0 ? (
                  <div className="aep-reg-empty-card">
                    <Users size={32} color="#94a3b8" />
                    <h4>No Enrollments Yet</h4>
                    <p>When students register for this event, their details and attendance options will appear here.</p>
                  </div>
                ) : filteredRegs.length === 0 ? (
                  <div className="aep-reg-empty-card">
                    <p>No enrolled students match your search <strong>"{attendeeSearch}"</strong>.</p>
                    <button
                      type="button"
                      className="aep-empty-reset-btn"
                      onClick={() => { setAttendeeSearch(''); setAttendeeFilter('all'); }}
                    >
                      Clear Filter
                    </button>
                  </div>
                ) : (
                  <div className="aep-reg-table-card">
                    <table className="aep-reg-table">
                      <thead>
                        <tr>
                          <th style={{ width: '36px' }}>#</th>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>Registered On</th>
                          <th>Status</th>
                          {hasQuestions && <th>Responses</th>}
                          {hasReview && <th>Review</th>}
                          <th>Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRegs.map((reg, idx) => {
                          const student = reg.student || {}
                          const first = student.firstName || ''
                          const last = student.lastName || ''
                          const initials = ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase() || 'S'
                          const isCancelled = reg.status === 'cancelled'
                          const isRejected = reg.status === 'rejected'
                          const isSelected = reg.status === 'selected' || reg.status === 'attended'
                          const attendance = getAttendance(reg)
                          const showAttendance = canMarkAttendance(reg)
                          const hasAnswers = reg.answers && reg.answers.length > 0

                          return (
                            <tr key={reg._id} className={isCancelled ? 'aep-row-cancelled' : ''}>
                              {/* # */}
                              <td className="aep-reg-idx">{idx + 1}</td>

                              {/* Student Name */}
                              <td>
                                <div className="aep-student-cell">
                                  <div className="aep-student-avatar">
                                    {initials}
                                  </div>
                                  <div className="aep-student-info">
                                    <span className="aep-student-name">
                                      {first} {last}
                                      {student.studentId && (
                                        <span className="aep-student-id-tag">{student.studentId}</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Email */}
                              <td className="aep-reg-email">{student.email || '—'}</td>

                              {/* Registered On */}
                              <td className="aep-reg-date">{formatDate(reg.createdAt)}</td>

                              {/* Status */}
                              <td>
                                <span className={`aep-status-chip aep-status-${reg.status}`}>{reg.status}</span>
                              </td>

                              {/* Responses (ONLY IF EVENT HAS QUESTIONS) */}
                              {hasQuestions && (
                                <td>
                                  {isCancelled ? null : hasAnswers ? (
                                    <button
                                      type="button"
                                      className="aep-answers-btn"
                                      onClick={() => setSelectedAnswersReg(reg)}
                                      title="View questionnaire responses"
                                    >
                                      <FileText size={13} />
                                      <span>View ({reg.answers.length})</span>
                                    </button>
                                  ) : (
                                    <span className="aep-no-answers">—</span>
                                  )}
                                </td>
                              )}

                              {/* Review (ONLY IF LIMITED SEATS OR APPLICATION) */}
                              {hasReview && (
                                <td>
                                  {isCancelled ? (
                                    <span className="aep-no-answers">—</span>
                                  ) : (
                                    <div className="aep-review-actions-wrap">
                                      <button
                                        type="button"
                                        className={`aep-action-allow-btn ${isSelected ? 'active' : ''}`}
                                        title="Select applicant"
                                        onClick={() => handleStatusChange(reg._id, 'selected')}
                                      >
                                        <Check size={12} /> Select
                                      </button>
                                      <button
                                        type="button"
                                        className={`aep-action-reject-btn ${isRejected ? 'active' : ''}`}
                                        title="Reject applicant"
                                        onClick={() => handleStatusChange(reg._id, 'rejected')}
                                      >
                                        <X size={12} /> Reject
                                      </button>
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* Attendance — always a cell so the column stays aligned */}
                              <td>
                                {showAttendance ? (
                                  <div className="aep-att-btns-wrap">
                                    <button
                                      type="button"
                                      className={`aep-att-btn aep-att-present ${attendance === 'present' ? 'active' : ''}`}
                                      title="Mark Present"
                                      onClick={() => handleAttendanceChange(reg._id, 'present')}
                                    >
                                      <Check size={12} /> Present
                                    </button>
                                    <button
                                      type="button"
                                      className={`aep-att-btn aep-att-absent ${attendance === 'absent' ? 'active' : ''}`}
                                      title="Mark Absent"
                                      onClick={() => handleAttendanceChange(reg._id, 'absent')}
                                    >
                                      <X size={12} /> Absent
                                    </button>
                                  </div>
                                ) : (
                                  <span className="aep-no-answers">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Modal for Questionnaire Answers Inspection (Admin) ── */}
      {selectedAnswersReg && (
        <div className="aep-overlay" onClick={() => setSelectedAnswersReg(null)} style={{ zIndex: 2200 }}>
          <div className="aep-answers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="aep-answers-header">
              <div>
                <h3 className="aep-answers-title">Questionnaire Responses</h3>
                <p className="aep-answers-subtitle">
                  {selectedAnswersReg.student?.firstName} {selectedAnswersReg.student?.lastName} · {selectedAnswersReg.student?.email}
                </p>
              </div>
              <button
                type="button"
                className="aep-popup-close"
                onClick={() => setSelectedAnswersReg(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="aep-answers-body">
              {selectedAnswersReg.answers && selectedAnswersReg.answers.length > 0 ? (
                <div className="aep-answers-list">
                  {selectedAnswersReg.answers.map((ans, idx) => (
                    <div key={idx} className="aep-answer-block">
                      <div className="aep-answer-badge">Q{idx + 1}</div>
                      <div className="aep-answer-content">
                        <h4 className="aep-answer-label">{ans.label || ans.fieldLabel || `Question ${idx + 1}`}</h4>
                        <p className="aep-answer-text">{ans.value || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="aep-answers-empty">No responses recorded for this registration.</p>
              )}
            </div>

            <div className="aep-answers-footer">
              <button
                type="button"
                className="aep-answers-close-btn"
                onClick={() => setSelectedAnswersReg(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteItem && (
        <div className="aep-overlay" onClick={() => !deleting && setDeleteItem(null)}>
          <div className="aep-popup" onClick={e => e.stopPropagation()}>
            <div className="aep-popup-header">
              <h3>Delete Event</h3>
              <button className="aep-popup-close" onClick={() => setDeleteItem(null)} disabled={deleting}><X size={17}/></button>
            </div>
            <p className="aep-delete-text">Delete <strong>"{deleteItem.title}"</strong>? This cannot be undone.</p>
            <div className="aep-popup-actions">
              <button className="aep-btn-cancel" onClick={() => setDeleteItem(null)} disabled={deleting}>Cancel</button>
              <button className="aep-btn-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Event Modal (with blurred background) ── */}
      {editingEventId && (
        <EditEventPage
          eventId={editingEventId}
          isModal={true}
          onClose={() => setEditingEventId(null)}
          onSuccess={() => {
            setEditingEventId(null)
            fetchEvents({ limit: 200 })
              .then((d) => setEvents(d.events || []))
              .catch(() => {})
          }}
        />
      )}
    </div>
  )
}

function EventTable({ rows, onViewRegs, onEdit, onDelete, formatDate, daysUntil, isUpcoming }) {
  if (rows.length === 0) {
    return <div className="aep-empty-table">No {isUpcoming ? 'upcoming' : 'past'} events found.</div>
  }
  return (
    <>
      {/* Desktop Table View */}
      <div className="aep-table-scroll aep-desktop-table-view">
        <table className="aep-events-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>{isUpcoming ? 'Days Until' : 'Days Ago'}</th>
              <th>Location</th>
              <th>Registrations</th>
              <th>View Regs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(ev => {
              const d = daysUntil(ev.date)
              const regCount = ev.registeredUsers?.length || 0
              return (
                <tr key={ev._id}>
                  {/* Event image + name */}
                  <td className="aep-ev-cell-name">
                    <img
                      src={ev.coverImage || '/campus_hero_bg.jpg'}
                      alt={ev.title}
                      className="aep-ev-thumb"
                      onError={e => { e.currentTarget.src = '/campus_hero_bg.jpg' }}
                    />
                    <div className="aep-ev-name-wrap">
                      <span className="aep-ev-title">{ev.title}</span>
                      {ev.category && <span className="aep-ev-cat">{ev.category}</span>}
                    </div>
                  </td>
                  <td className="aep-ev-date">{formatDate(ev.date)}</td>
                  <td>
                    {d !== null ? (
                      <span className={`aep-days-chip ${isUpcoming ? (d <= 3 ? 'aep-days-urgent' : 'aep-days-upcoming') : 'aep-days-past'}`}>
                        {isUpcoming ? (d === 0 ? 'Today' : `${d}d`) : `${Math.abs(d)}d ago`}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="aep-ev-location">
                    <span className="aep-loc-wrap"><MapPin size={13}/>{ev.location || 'Campus'}</span>
                  </td>
                  <td className="aep-ev-regs">
                    <span className="aep-reg-num">{regCount}</span>
                    {ev.capacity && <span className="aep-cap-text"> / {ev.capacity}</span>}
                  </td>
                  <td>
                    <button className="aep-view-regs-btn" onClick={() => onViewRegs(ev)}>
                      View Registrations
                    </button>
                  </td>
                  <td>
                    <div className="aep-row-actions">
                      <Link to={`/events/${ev._id}`} className="aep-icon-btn" title="View Details"><Eye size={14}/></Link>
                      <button
                        type="button"
                        className="aep-icon-btn"
                        title="Edit Event"
                        onClick={() => onEdit(ev)}
                      >
                        <Edit size={14}/>
                      </button>
                      <button className="aep-icon-btn aep-icon-btn--delete" title="Delete" onClick={() => onDelete(ev)}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (No horizontal scrolling!) */}
      <div className="aep-mobile-card-list">
        {rows.map(ev => {
          const d = daysUntil(ev.date)
          const regCount = ev.registeredUsers?.length || 0
          return (
            <div key={ev._id} className="aep-mobile-card">
              <div className="aep-mobile-card-top">
                <img
                  src={ev.coverImage || '/campus_hero_bg.jpg'}
                  alt={ev.title}
                  className="aep-mobile-card-thumb"
                  onError={e => { e.currentTarget.src = '/campus_hero_bg.jpg' }}
                />
                <div className="aep-mobile-card-header-info">
                  <span className="aep-mobile-card-title">{ev.title}</span>
                  <div className="aep-mobile-card-badges">
                    {ev.category && <span className="aep-ev-cat">{ev.category}</span>}
                    {d !== null && (
                      <span className={`aep-days-chip ${isUpcoming ? (d <= 3 ? 'aep-days-urgent' : 'aep-days-upcoming') : 'aep-days-past'}`}>
                        {isUpcoming ? (d === 0 ? 'Today' : `${d}d`) : `${Math.abs(d)}d ago`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="aep-mobile-card-details">
                <div className="aep-mobile-detail-item">
                  <span className="aep-mobile-detail-label">Date:</span>
                  <span className="aep-mobile-detail-val">{formatDate(ev.date)}</span>
                </div>
                <div className="aep-mobile-detail-item">
                  <span className="aep-mobile-detail-label">Location:</span>
                  <span className="aep-mobile-detail-val"><MapPin size={12}/>{ev.location || 'Campus'}</span>
                </div>
                <div className="aep-mobile-detail-item">
                  <span className="aep-mobile-detail-label">Registrations:</span>
                  <span className="aep-mobile-detail-val">
                    <strong style={{ color: '#881421' }}>{regCount}</strong>
                    {ev.capacity ? ` / ${ev.capacity}` : ''}
                  </span>
                </div>
              </div>

              <div className="aep-mobile-card-actions">
                <button
                  type="button"
                  className="aep-mobile-view-regs-btn"
                  onClick={() => onViewRegs(ev)}
                >
                  View Registrations ({regCount})
                </button>
                <div className="aep-row-actions">
                  <Link to={`/events/${ev._id}`} className="aep-icon-btn" title="View Details">
                    <Eye size={15}/>
                  </Link>
                  <button
                    type="button"
                    className="aep-icon-btn"
                    title="Edit Event"
                    onClick={() => onEdit(ev)}
                  >
                    <Edit size={15}/>
                  </button>
                  <button
                    type="button"
                    className="aep-icon-btn aep-icon-btn--delete"
                    title="Delete"
                    onClick={() => onDelete(ev)}
                  >
                    <Trash2 size={15}/>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
