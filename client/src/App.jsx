import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyOtp from './pages/VerifyOtp'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import EventsPage from './pages/Events'
import EventDetailPage from './pages/EventDetail'
import CreateEventPage from './pages/CreateEvent'
import EditEventPage from './pages/EditEvent'

function App() {
  return (
    <BrowserRouter>
      {/* Provide user auth context throughout the entire application */}
      <AuthProvider>
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

            {/* Public event browsing */}
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />

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
