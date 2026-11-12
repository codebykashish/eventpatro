import { createContext, useContext, useState, useEffect, useRef } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  // loading stays true until the initial token check is done.
  // We also keep it true while login/verifyOtp are in flight so that
  // ProtectedRoute never sees a brief window where token exists but user is null.
  const [loading, setLoading] = useState(true)

  // Tracks how many async auth operations are currently in flight
  const authInFlight = useRef(0)

  // Auth modal overlay state: { isOpen: boolean, mode: 'login' | 'signup' }
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' })

  const openAuthModal = (mode = 'login') => setAuthModal({ isOpen: true, mode })
  const closeAuthModal = () => setAuthModal({ isOpen: false, mode: 'login' })
  const switchAuthModalMode = (mode) => setAuthModal((prev) => ({ ...prev, mode }))

  const apiUrl = import.meta.env.VITE_API_URL || '/api'

  // Verify stored token on initial app load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const savedToken = localStorage.getItem('token')
      if (!savedToken) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          setToken(savedToken)
        } else {
          // Token is invalid or expired — clear everything
          localStorage.removeItem('token')
          setUser(null)
          setToken(null)
        }
      } catch (error) {
        console.error('Failed to authenticate token:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentUser()
  }, [apiUrl])

  // Login handler — sets loading=true while in flight so ProtectedRoute waits
  const login = async (email, password) => {
    authInFlight.current += 1
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        const error = new Error(data.message || 'Login failed')
        error.isUnverified = data.isUnverified
        error.email = data.email
        throw error
      }

      // Persist token before updating state so api.js reads it immediately
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      return data.user
    } finally {
      authInFlight.current -= 1
      if (authInFlight.current === 0) setLoading(false)
    }
  }

  // Signup handler — no session is created yet, so no loading toggle needed
  const signup = async (formData) => {
    const response = await fetch(`${apiUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed')
    }

    // Return response indicating if verification is required
    return data
  }

  // OTP verification handler — sets loading=true while in flight
  const verifyOtp = async (email, otp) => {
    authInFlight.current += 1
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed')
      }

      // Persist token before updating state so api.js reads it immediately
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      return data.user
    } finally {
      authInFlight.current -= 1
      if (authInFlight.current === 0) setLoading(false)
    }
  }

  // Resend fresh OTP code
  const resendOtp = async (email) => {
    const response = await fetch(`${apiUrl}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to resend code')
    }

    return data
  }

  // Update profile handler
  const updateProfile = async (profileData) => {
    const savedToken = localStorage.getItem('token') || token
    const response = await fetch(`${apiUrl}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${savedToken}`,
      },
      body: JSON.stringify(profileData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile')
    }

    if (data.user) {
      setUser(data.user)
    }
    return data.user
  }

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        authModal,
        openAuthModal,
        closeAuthModal,
        switchAuthModalMode,
        login,
        signup,
        verifyOtp,
        resendOtp,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to consume auth context in any component
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
