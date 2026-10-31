import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

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
          // Token is invalid or expired
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

  // Login handler
  const login = async (email, password) => {
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

    // Save token in localStorage and update state
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  // Signup handler
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

  // OTP verification handler
  const verifyOtp = async (email, otp) => {
    const response = await fetch(`${apiUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Verification failed')
    }

    // Save token and activate user session upon successful OTP check
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
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
