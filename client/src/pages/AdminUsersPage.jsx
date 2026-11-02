import { useState, useEffect, useMemo } from 'react'
import { X, Search, Trash2 } from 'lucide-react'
import { deleteUser, fetchUserRegistrations } from '../utils/api'
import './AdminUsersPage.css'

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminUsersPage({ users = [], allRegistrations = [], events = [], onUserDeleted }) {
  const [search, setSearch] = useState('')
  const [userList, setUserList] = useState(users)
  const [userToDelete, setUserToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Map events by ID for quick lookup when reg.event is just an ID
  const eventsMap = useMemo(() => {
    const map = {}
    events.forEach(ev => {
      if (ev?._id) map[String(ev._id)] = ev
    })
    return map
  }, [events])

  // Sync userList whenever parent users prop changes
  useEffect(() => {
    setUserList(users)
  }, [users])

  // Popup state
  const [popup, setPopup] = useState(null) // { user, type: 'registered' | 'attended' }
  const [popupEvents, setPopupEvents] = useState([]) // list of events for the popup
  const [popupLoading, setPopupLoading] = useState(false)

  const handleDelete = async () => {
    if (!userToDelete) return
    const uid = String(userToDelete._id || userToDelete.id)
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteUser(uid)
      setUserList(prev => prev.filter(u => String(u._id || u.id) !== uid))
      if (onUserDeleted) onUserDeleted(uid)
      setUserToDelete(null)
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return userList
    return userList.filter(u =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    )
  }, [userList, search])

  // Compute per-user registration and attended counts
  const userStats = useMemo(() => {
    const map = {}
    allRegistrations.forEach(reg => {
      if (!reg || reg.status === 'cancelled') return
      const rawId = typeof reg.student === 'object' ? (reg.student?._id || reg.student?.id) : reg.student
      if (!rawId) return
      const uid = String(rawId)
      if (!map[uid]) map[uid] = { registered: [], attended: [] }
      map[uid].registered.push(reg)
      if (reg.status === 'attended') {
        map[uid].attended.push(reg)
      }
    })
    return map
  }, [allRegistrations])

  const openPopup = async (u, type) => {
    setPopup({ user: u, type })
    setPopupEvents([])
    setPopupLoading(true)

    try {
      const uid = String(u._id || u.id)
      const res = await fetchUserRegistrations(uid)
      if (res && Array.isArray(res.registrations)) {
        const fetchedList = type === 'attended'
          ? res.registrations.filter(r => r.status === 'attended')
          : res.registrations.filter(r => r.status !== 'cancelled')
        setPopupEvents(fetchedList)
      } else {
        // Fallback: use preloaded allRegistrations data
        const uid2 = String(u._id || u.id)
        const localRegs = userStats[uid2] || { registered: [], attended: [] }
        setPopupEvents(type === 'attended' ? localRegs.attended : localRegs.registered)
      }
    } catch (err) {
      console.warn('Could not fetch user registrations dynamically, using preloaded data', err)
      // Fallback: use preloaded allRegistrations data
      const uid2 = String(u._id || u.id)
      const localRegs = userStats[uid2] || { registered: [], attended: [] }
      setPopupEvents(type === 'attended' ? localRegs.attended : localRegs.registered)
    } finally {
      setPopupLoading(false)
    }
  }

  return (
    <div className="aup-root">
      {/* Header */}
      <div className="aup-page-header">
        <div>
          <h1 className="aup-page-title">Users</h1>
          <p className="aup-page-sub">{users.length} registered users in SSRC Events</p>
        </div>
        <div className="aup-search-wrap">
          <Search size={14} className="aup-search-icon"/>
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="aup-search-input"
          />
          {search && <button className="aup-search-clear" onClick={() => setSearch('')}><X size={13}/></button>}
        </div>
      </div>

      {/* Table */}
      <div className="aup-table-card">
        <div className="aup-table-scroll">
          <table className="aup-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Registrations</th>
                <th>Attended</th>
                <th>Joined On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="aup-empty">No users found.</td>
                </tr>
              ) : filteredUsers.map((u, idx) => {
                const uid = String(u._id || u.id)
                const stats = userStats[uid] || { registered: [], attended: [] }
                const regCount = stats.registered.length || u.registrationsCount || 0
                return (
                  <tr key={uid}>
                    <td className="aup-idx">{idx + 1}</td>
                    <td className="aup-name">{u.firstName} {u.lastName}</td>
                    <td className="aup-email">{u.email}</td>
                    <td>
                      <button
                        className="aup-count-btn"
                        onClick={() => openPopup(u, 'registered')}
                        title="View registered events"
                      >
                        {regCount}
                      </button>
                    </td>
                    <td>
                      <button
                        className="aup-count-btn aup-count-btn--attended"
                        onClick={() => openPopup(u, 'attended')}
                        title="View attended events"
                      >
                        {stats.attended.length}
                      </button>
                    </td>
                    <td className="aup-joined">{formatDate(u.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="aup-delete-btn"
                        title="Delete user"
                        onClick={() => setUserToDelete(u)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="aup-table-footer">
          Showing {filteredUsers.length} of {userList.length} users
        </div>
      </div>

      {/* Popup */}
      {popup && (
        <div className="aup-overlay" onClick={() => setPopup(null)}>
          <div className="aup-popup" onClick={e => e.stopPropagation()}>
            <div className="aup-popup-header">
              <div>
                <h3>{popup.user.firstName} {popup.user.lastName}</h3>
                <span className="aup-popup-sub">
                  {popup.type === 'attended' ? 'Attended events' : 'Registered events'} · {popupEvents.length} total
                </span>
              </div>
              <button className="aup-popup-close" onClick={() => setPopup(null)}><X size={16}/></button>
            </div>
            <div className="aup-popup-body">
              {popupLoading && popupEvents.length === 0 ? (
                <p className="aup-popup-empty">Loading registered events…</p>
              ) : popupEvents.length === 0 ? (
                <p className="aup-popup-empty">No {popup.type} events found.</p>
              ) : (
                <div className="aup-popup-scroll-x">
                  <table className="aup-event-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Registered On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {popupEvents.map(reg => {
                        const rawEv = reg.event
                        const eventObj = (typeof rawEv === 'object' && rawEv !== null)
                          ? rawEv
                          : (eventsMap[String(rawEv)] || {})
                        const title = eventObj.title || 'Event'
                        const cover = eventObj.coverImage || '/campus_hero_bg.jpg'
                        const date = eventObj.date || reg.createdAt

                        return (
                          <tr key={reg._id}>
                            <td>
                              <div className="aup-ev-cell">
                                <img
                                  src={cover}
                                  alt={title}
                                  className="aup-ev-thumb"
                                  onError={(e) => { e.currentTarget.src = '/campus_hero_bg.jpg' }}
                                />
                                <div>
                                  <div className="aup-ev-title-text" title={title}>{title}</div>
                                  {eventObj.category && (
                                    <span className="aup-ev-cat-pill">{eventObj.category}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="aup-ev-date">{formatDate(date)}</td>
                            <td>
                              <span className={`aup-status aup-status-${reg.status}`}>{reg.status}</span>
                            </td>
                            <td className="aup-ev-date">{formatDate(reg.createdAt)}</td>
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
      )}

      {/* Delete User Modal */}
      {userToDelete && (
        <div className="aup-overlay" onClick={() => !deleting && setUserToDelete(null)}>
          <div className="aup-popup aup-popup--sm" onClick={e => e.stopPropagation()}>
            <div className="aup-popup-header">
              <h3>Delete User</h3>
              <button className="aup-popup-close" onClick={() => setUserToDelete(null)} disabled={deleting}><X size={16}/></button>
            </div>
            <div className="aup-popup-body">
              {deleteError && (
                <div style={{ color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
                  {deleteError}
                </div>
              )}
              <p style={{ margin: '0 0 16px', color: '#1e293b', fontSize: '14px', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>"{userToDelete.firstName} {userToDelete.lastName}"</strong> ({userToDelete.email})? This action cannot be undone and will remove all their registrations.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc', color: '#1e293b', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setUserToDelete(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
