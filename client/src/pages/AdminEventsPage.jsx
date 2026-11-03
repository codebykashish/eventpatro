import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Eye, Edit, Trash2, X, Calendar, MapPin, Users, Clock,
  ChevronDown, ArrowRight, CheckCircle2, Check,
} from 'lucide-react'
import { fetchEvents, getEventRegistrations, deleteEvent, updateRegistrationStatus } from '../utils/api'
import EditEventPage from './EditEvent'
import './AdminEventsPage.css'

const CATEGORIES = ['Workshop', 'Seminar', 'Cultural', 'Sports', 'Hackathon', 'Other']

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
    try {
      const d = await getEventRegistrations(ev._id)
      setRegList(d.registrations || [])
    } catch { setRegList([]) }
    finally { setRegLoading(false) }
  }

  const handleStatusChange = async (regId, newStatus) => {
    if (!regPopupEvent) return
    try {
      await updateRegistrationStatus(regPopupEvent._id, regId, newStatus)
      setRegList(prev => prev.map(r => r._id === regId ? { ...r, status: newStatus } : r))
    } catch (err) {
      alert(err.message || 'Failed to update registration status')
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
      {regPopupEvent && (
        <div className="aep-overlay" onClick={() => setRegPopupEvent(null)}>
          <div className="aep-popup aep-popup--xl" onClick={e => e.stopPropagation()}>
            <div className="aep-popup-header">
              <div>
                <h3>Registrations &amp; Attendance — {regPopupEvent.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span className="aep-popup-sub">Total Registered: {regList.length}</span>
                  <span className="aep-popup-sub" style={{ color: '#15803d', fontWeight: 700 }}>
                    Total Present: {regList.filter(r => r.status === 'attended').length}
                  </span>
                  <span className="aep-popup-sub" style={{ color: '#dc2626', fontWeight: 700 }}>
                    Total Absent: {regList.filter(r => r.status === 'confirmed').length}
                  </span>
                </div>
              </div>
              <button className="aep-popup-close" onClick={() => setRegPopupEvent(null)}><X size={17}/></button>
            </div>

            {/* Attendance & Registration Summary Strip */}
            <div className="aep-attendance-bar">
              <div className="aep-attendance-stat aep-attendance-total">
                <span className="aep-att-num">{regList.length}</span>
                <span className="aep-att-label">Registrations</span>
              </div>
              <div className="aep-attendance-stat aep-attendance-confirmed">
                <span className="aep-att-num">{regList.filter(r => ['confirmed', 'selected', 'attended'].includes(r.status)).length}</span>
                <span className="aep-att-label">Confirmed Users</span>
              </div>
              <div className="aep-attendance-stat aep-attendance-present">
                <span className="aep-att-num">{regList.filter(r => r.status === 'attended').length}</span>
                <span className="aep-att-label">Total Present</span>
              </div>
              <div className="aep-attendance-stat aep-attendance-absent">
                <span className="aep-att-num">{regList.filter(r => r.status === 'confirmed').length}</span>
                <span className="aep-att-label">Total Absent</span>
              </div>
            </div>

            <div className="aep-popup-body aep-popup-scroll-x">
              {regLoading ? (
                <p className="aep-popup-empty">Loading…</p>
              ) : regList.length === 0 ? (
                <p className="aep-popup-empty">No registrations yet.</p>
              ) : (
                <table className="aep-reg-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Registered On</th>
                      {(regList[0]?.answers?.length > 0) && <th>Responses</th>}
                      {(Boolean(regPopupEvent.capacity && regPopupEvent.capacity > 0) || regPopupEvent.registrationType === 'application') && <th>Review Action</th>}
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regList.map(reg => {
                      const showReviewActions = Boolean(regPopupEvent.capacity && regPopupEvent.capacity > 0) || regPopupEvent.registrationType === 'application'
                      const isConfirmedOrAttended = ['confirmed', 'attended'].includes(reg.status)

                      return (
                        <tr key={reg._id}>
                          <td className="aep-reg-name">{reg.student?.firstName} {reg.student?.lastName}</td>
                          <td className="aep-reg-email">{reg.student?.email}</td>
                          <td>
                            <span className={`aep-status-chip aep-status-${reg.status}`}>{reg.status}</span>
                          </td>
                          <td className="aep-reg-date">{formatDate(reg.createdAt)}</td>
                          {reg.answers?.length > 0 && (
                            <td className="aep-reg-answers">
                              {reg.answers.map((a, i) => (
                                <div key={i} className="aep-answer-row">
                                  <span className="aep-answer-q">{a.fieldLabel || `Q${i+1}`}:</span>
                                  <span className="aep-answer-v">{a.value || '—'}</span>
                                </div>
                              ))}
                            </td>
                          )}
                          {showReviewActions && (
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="aep-action-allow-btn"
                                  title="Allow / Confirm"
                                  onClick={() => handleStatusChange(reg._id, 'confirmed')}
                                  disabled={reg.status === 'confirmed'}
                                >
                                  <Check size={13} /> Allow
                                </button>
                                <button
                                  type="button"
                                  className="aep-action-reject-btn"
                                  title="Reject"
                                  onClick={() => handleStatusChange(reg._id, 'rejected')}
                                  disabled={reg.status === 'rejected'}
                                >
                                  <X size={13} /> Reject
                                </button>
                              </div>
                            </td>
                          )}
                          <td>
                            {isConfirmedOrAttended ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className={`aep-att-btn aep-att-present ${reg.status === 'attended' ? 'active' : ''}`}
                                  title="Mark Present"
                                  onClick={() => handleStatusChange(reg._id, 'attended')}
                                >
                                  <Check size={12} /> Present
                                </button>
                                <button
                                  type="button"
                                  className={`aep-att-btn aep-att-absent ${reg.status === 'confirmed' ? 'active' : ''}`}
                                  title="Mark Absent"
                                  onClick={() => handleStatusChange(reg._id, 'confirmed')}
                                >
                                  <X size={12} /> Absent
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Confirm first</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
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
    <div className="aep-table-scroll">
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
  )
}
