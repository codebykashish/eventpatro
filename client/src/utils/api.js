// Central API helper — wraps fetch with base URL, JSON headers, and auth token injection
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Read JWT from localStorage (set by AuthContext on login/verify)
const getToken = () => localStorage.getItem('token')

// Generic request helper
const request = async (path, options = {}) => {
  const token = getToken()

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    // Use server message if available, fall back to status text
    throw new Error(data.message || res.statusText || 'Request failed')
  }

  return data
}

// ─── Event API ────────────────────────────────────────────────────────────────

/**
 * Fetch paginated, filtered event list
 * @param {{ search?: string, category?: string, page?: number }} params
 */
export const fetchEvents = ({ search = '', category = '', page = 1 } = {}) => {
  const qs = new URLSearchParams({ search, category, page }).toString()
  return request(`/events?${qs}`)
}

/** Fetch a single event by ID */
export const fetchEventById = (id) => request(`/events/${id}`)

/** Create a new event (admin only) */
export const createEvent = (data) =>
  request('/events', { method: 'POST', body: JSON.stringify(data) })

/** Update an existing event (admin only) */
export const updateEvent = (id, data) =>
  request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) })

/** Soft-delete an event (admin only) */
export const deleteEvent = (id) => request(`/events/${id}`, { method: 'DELETE' })

/** Register current user for an event */
export const registerForEvent = (id) =>
  request(`/events/${id}/register`, { method: 'POST' })

/** Cancel current user's registration */
export const cancelRegistration = (id) =>
  request(`/events/${id}/register`, { method: 'DELETE' })
