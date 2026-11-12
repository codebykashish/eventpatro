import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Protects routes from unauthorized access
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth()

  // A token in localStorage means an auth operation is in-flight (login / verifyOtp).
  // Keep showing the loading screen until AuthContext resolves the user, so we never
  // briefly redirect an authenticated user back to the home page.
  const hasStoredToken = Boolean(localStorage.getItem('token'))

  if (loading || (hasStoredToken && !user)) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'var(--font-family)',
          color: 'var(--color-muted)',
          fontSize: '15px',
          gap: '12px',
        }}
      >
        <span
          style={{
            width: '20px',
            height: '20px',
            border: '2.5px solid #e2e8f0',
            borderTopColor: '#881421',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        Loading your session...
      </div>
    )
  }

  // If user is not logged in, redirect to home page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // If role is restricted (e.g., student trying to open admin page), redirect to dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
