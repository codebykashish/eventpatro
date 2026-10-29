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
 * @param {{ search?: string, category?: string, page?: number, limit?: number }} params
 */
export const fetchEvents = ({ search = '', category = '', page = 1, limit = 12 } = {}) => {
  const qs = new URLSearchParams({ search, category, page, limit }).toString()
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

// ─── Registration API ─────────────────────────────────────────────────────────

/**
 * Submit a registration for an event with optional form answers
 * @param {string} eventId
 * @param {{ answers: Array<{ fieldId: string, value: string }> }} body
 */
export const submitRegistration = (eventId, body = { answers: [] }) =>
  request(`/events/${eventId}/registrations`, { method: 'POST', body: JSON.stringify(body) })

/** Cancel the current student's active registration for an event */
export const cancelRegistration = (eventId) =>
  request(`/events/${eventId}/registrations`, { method: 'DELETE' })

/** Check if the current student is registered for a specific event */
export const getMyRegistrationForEvent = (eventId) =>
  request(`/registrations/me/${eventId}`)

/** Get all of the current student's registrations */
export const getMyRegistrations = () => request('/registrations/me')

/** Admin: fetch all registrations for an event */
export const getEventRegistrations = (eventId) =>
  request(`/events/${eventId}/registrations`)

/** Admin: update a registration's status (select / reject) */
export const updateRegistrationStatus = (eventId, regId, status) =>
  request(`/events/${eventId}/registrations/${regId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

