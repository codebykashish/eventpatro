import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyOtp from './pages/VerifyOtp'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import EventDetailPage from './pages/EventDetail'
import CreateEventPage from './pages/CreateEvent'
import EditEventPage from './pages/EditEvent'
import AuthModal from './components/AuthModal'

// Automatically scrolls window to top on every navigation
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Role-aware redirect so /events never renders for authenticated users
function EventsRouteRedirect() {
  const { user, isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <BrowserRouter>
      {/* Scroll restoration on navigation */}
      <ScrollToTop />

      {/* Provide user auth context throughout the entire application */}
      <AuthProvider>
        {/* Global authentication modal popup */}
        <AuthModal />

        {/* Navigation bar visible on all pages */}
        <Navbar />

        {/* Application route definitions */}
        <main>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />

            {/* Standalone /events redirected directly to dashboard/admin for logged-in users */}
            <Route path="/events" element={<EventsRouteRedirect />} />
            <Route
              path="/events/:id"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected student & admin dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected admin-only dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected admin-only: create event */}
            <Route
              path="/admin/events/new"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CreateEventPage />
                </ProtectedRoute>
              }
            />

            {/* Protected admin-only: edit event */}
            <Route
              path="/admin/events/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EditEventPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
