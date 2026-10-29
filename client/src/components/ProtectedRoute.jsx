import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Protects routes from unauthorized access
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth()

  // Wait for initial token check to finish
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-muted)' }}>
        Loading session...
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
