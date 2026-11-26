import { useState, useEffect, useMemo } from 'react'
import { X, Search } from 'lucide-react'
import { fetchUserRegistrations, fetchAllRegistrations } from '../utils/api'
import './AdminUsersPage.css'

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const idOf = (value) => {
  if (!value) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return String(value._id || value.id || '')
}

const isPresent = (reg) => reg?.attendance === 'present' || reg?.status === 'attended'

const matchesUser = (reg, u) => {
  if (!reg || !u) return false
  const uid = idOf(u._id || u.id)
  const student = reg.student
  const sid = idOf(student)
  if (uid && sid && uid === sid) return true
  const userEmail = (u.email || '').toLowerCase()
  const studentEmail = (typeof student === 'object' ? student?.email : '')?.toLowerCase()
  return Boolean(userEmail && studentEmail && userEmail === studentEmail)
}

const listedForType = (regs, type) => {
  if (type === 'attended') return regs.filter(isPresent)
  return regs.filter((r) => r.status !== 'cancelled')
}

export default function AdminUsersPage({ users = [], allRegistrations = [], events = [] }) {
  const [search, setSearch] = useState('')
  const [userList, setUserList] = useState(users)
  const [regCache, setRegCache] = useState(allRegistrations)

  const eventsMap = useMemo(() => {
    const map = {}
    events.forEach((ev) => {
      if (ev?._id) map[String(ev._id)] = ev
    })
    return map
  }, [events])

  useEffect(() => {
    setUserList(users)
  }, [users])

  useEffect(() => {
    setRegCache(allRegistrations)
  }, [allRegistrations])

  useEffect(() => {
    if (allRegistrations.length > 0) return
    fetchAllRegistrations()
      .then((d) => setRegCache(d.registrations || []))
      .catch(() => {})
  }, [allRegistrations.length])

  const [popup, setPopup] = useState(null)
  const [popupEvents, setPopupEvents] = useState([])
  const [popupLoading, setPopupLoading] = useState(false)

  const resolveEvent = (reg) => {
    const rawEv = reg?.event
    if (rawEv && typeof rawEv === 'object' && (rawEv.title || rawEv.date || rawEv.coverImage)) {
      return rawEv
    }
    const eventId = idOf(rawEv)
    return (eventId && eventsMap[eventId]) || (typeof rawEv === 'object' && rawEv !== null ? rawEv : {}) || {}
  }

  const regsForUser = (u, list = regCache) => list.filter((r) => matchesUser(r, u))

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return userList
    return userList.filter((u) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    )
  }, [userList, search])

  const userStats = useMemo(() => {
    const map = {}
    userList.forEach((u) => {
      const uid = idOf(u._id || u.id)
      const regs = regsForUser(u, regCache)
      map[uid] = {
        registered: listedForType(regs, 'registered'),
        attended: listedForType(regs, 'attended'),
      }
    })
    return map
  }, [regCache, userList])

  const openPopup = async (u, type) => {
    const uid = idOf(u._id || u.id)
    const localList = listedForType(regsForUser(u), type)

    setPopup({ user: u, type })
    setPopupEvents(localList)
    setPopupLoading(localList.length === 0)

    try {
      const res = await fetchUserRegistrations(uid)
      const source = Array.isArray(res?.registrations) ? res.registrations : []
      const fetchedList = listedForType(source, type)
      if (fetchedList.length > 0) {
        setPopupEvents(fetchedList)
      } else if (localList.length === 0 && source.length > 0) {
        setPopupEvents(source)
      }
    } catch (err) {
      console.warn('Could not fetch user registrations dynamically, using preloaded data', err)
      if (localList.length === 0) {
        setPopupEvents(listedForType(regsForUser(u), type))
      }
    } finally {
      setPopupLoading(false)
    }
  }

  return (
    <div className="aup-root">
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
            onChange={(e) => setSearch(e.target.value)}
            className="aup-search-input"
          />
          {search && <button className="aup-search-clear" onClick={() => setSearch('')}><X size={13}/></button>}
        </div>
      </div>

      <div className="aup-table-card">
        {/* Desktop Table View */}
        <div className="aup-table-scroll aup-desktop-table-view">
          <table className="aup-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Email</th>
                <th>Registered</th>
                <th>Attended</th>
                <th>Joined On</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="aup-empty">No users found.</td>
                </tr>
              ) : filteredUsers.map((u, idx) => {
                const uid = idOf(u._id || u.id)
                const stats = userStats[uid] || { registered: [], attended: [] }
                const regCount = stats.registered.length || u.registrationsCount || 0
                const first = u.firstName || ''
                const last = u.lastName || ''
                const initials = ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase() || 'U'

                return (
                  <tr key={uid || idx}>
                    <td className="aup-idx">{idx + 1}</td>
                    <td className="aup-user-cell">
                      <div className="aup-avatar-circle" title={`${first} ${last}`}>
                        {initials}
                      </div>
                      <div className="aup-user-info">
                        <span className="aup-name">{first} {last}</span>
                        {u.role === 'admin' && <span className="aup-role-badge">Admin</span>}
                      </div>
                    </td>
                    <td className="aup-email">{u.email}</td>
                    <td>
                      <button
                        type="button"
                        className="aup-count-btn"
                        onClick={() => openPopup(u, 'registered')}
                        title="Click to view registered events"
                      >
                        {regCount}
                      </button>
                    </td>
                    <td>
                      {/* Attended events count: static badge, NOT clickable */}
                      <span
                        className="aup-count-static"
                        title="Attended events count"
                      >
                        {stats.attended.length}
                      </span>
                    </td>
                    <td className="aup-joined">{formatDate(u.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View (No horizontal scrolling!) */}
        <div className="aup-mobile-card-list">
          {filteredUsers.length === 0 ? (
            <div className="aup-empty" style={{ padding: '24px', textAlign: 'center' }}>No users found.</div>
          ) : filteredUsers.map((u, idx) => {
            const uid = idOf(u._id || u.id)
            const stats = userStats[uid] || { registered: [], attended: [] }
            const regCount = stats.registered.length || u.registrationsCount || 0
            const first = u.firstName || ''
            const last = u.lastName || ''
            const initials = ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase() || 'U'

            return (
              <div key={uid || idx} className="aup-mobile-user-card">
                <div className="aup-mobile-user-top">
                  <div className="aup-mobile-user-avatar">{initials}</div>
                  <div className="aup-mobile-user-identity">
                    <span className="aup-mobile-user-name">{u.firstName} {u.lastName}</span>
                    <span className="aup-mobile-user-email">{u.email}</span>
                  </div>
                </div>

                <div className="aup-mobile-user-stats-row">
                  <button
                    type="button"
                    className="aup-mobile-stat-pill"
                    onClick={() => openPopup(u, 'registered')}
                    title="Click to view registered events"
                  >
                    <span className="aup-mobile-stat-label">Registered</span>
                    <span className="aup-mobile-stat-badge">{regCount}</span>
                  </button>

                  <div className="aup-mobile-stat-pill aup-mobile-stat-pill--static">
                    <span className="aup-mobile-stat-label">Attended</span>
                    <span className="aup-mobile-stat-badge attended">{stats.attended.length}</span>
                  </div>
                </div>

                <div className="aup-mobile-user-footer">
                  <span>Joined: {formatDate(u.createdAt)}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="aup-table-footer">
          Showing {filteredUsers.length} of {userList.length} users
        </div>
      </div>

      {popup && (
        <div className="aup-overlay" onClick={() => setPopup(null)}>
          <div className="aup-popup" onClick={(e) => e.stopPropagation()}>
            <div className="aup-popup-header">
              <div>
                <h3>{popup.user.firstName} {popup.user.lastName}</h3>
                <span className="aup-popup-sub">
                  Registered events
                  {popupEvents.length > 0 ? ` · ${popupEvents.length}` : ''}
                </span>
              </div>
              <button className="aup-popup-close" onClick={() => setPopup(null)}><X size={16}/></button>
            </div>
            <div className="aup-popup-body">
              {popupLoading && popupEvents.length === 0 ? (
                <p className="aup-popup-empty">Loading registered events…</p>
              ) : popupEvents.length === 0 ? (
                <p className="aup-popup-empty">No registered events found for this user.</p>
              ) : (
                <ul className="aup-simple-event-list">
                  {popupEvents.map((reg, idx) => {
                    const eventObj = resolveEvent(reg)
                    const title = eventObj.title || 'Untitled event'
                    const cover = eventObj.coverImage || '/campus_hero_bg.jpg'
                    const date = eventObj.date || reg.createdAt

                    return (
                      <li key={reg._id || idx} className="aup-simple-event-row">
                        <img
                          src={cover}
                          alt=""
                          className="aup-ev-thumb"
                          onError={(e) => { e.currentTarget.src = '/campus_hero_bg.jpg' }}
                        />
                        <div className="aup-simple-event-copy">
                          <span className="aup-simple-event-name">{title}</span>
                          <span className="aup-simple-event-date">{formatDate(date)}</span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
