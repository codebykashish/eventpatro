import { useState, useEffect } from 'react'
import { Landmark, CalendarDays, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import './App.css'

function App() {
  // Store backend health status in component state
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch health check endpoint from backend API
  const checkBackendHealth = async () => {
    setLoading(true)
    setError(null)

    try {
      // Uses the proxy or full VITE_API_URL
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const response = await fetch(`${apiUrl}/health`)

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`)
      }

      const data = await response.json()
      setHealth(data)
    } catch (err) {
      setError(err.message || 'Failed to connect to backend')
    } finally {
      setLoading(false)
    }
  }

  // Run health check once when the component first mounts
  useEffect(() => {
    checkBackendHealth()
  }, [])

  return (
    <div className="app-container">
      {/* Header bar with brand identity */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <Landmark size={24} color="#881421" />
          </div>
          <div>
            <h1 className="brand-name">Eventpatro</h1>
            <p className="brand-subtitle">Sunway College Event Platform</p>
          </div>
        </div>
        <span className="badge">Phase 0 — Setup</span>
      </header>

      {/* Main hero card */}
      <main className="content">
        <div className="welcome-card">
          <div className="card-header">
            <CalendarDays size={28} color="#881421" />
            <div>
              <h2>Frontend & Backend Connection</h2>
              <p className="card-desc">
                Verifying that React can communicate with the Express server and MongoDB.
              </p>
            </div>
          </div>

          {/* System status indicators */}
          <div className="status-grid">
            {/* Frontend status */}
            <div className="status-item">
              <span className="status-label">Frontend (Vite + React)</span>
              <div className="status-pill status-online">
                <CheckCircle2 size={16} />
                <span>Running</span>
              </div>
            </div>

            {/* Backend status */}
            <div className="status-item">
              <span className="status-label">Backend (Express)</span>
              {loading ? (
                <div className="status-pill status-loading">
                  <RefreshCw size={14} className="spin" />
                  <span>Checking...</span>
                </div>
              ) : error ? (
                <div className="status-pill status-offline">
                  <AlertCircle size={16} />
                  <span>Offline</span>
                </div>
              ) : (
                <div className="status-pill status-online">
                  <CheckCircle2 size={16} />
                  <span>Connected</span>
                </div>
              )}
            </div>

            {/* MongoDB status */}
            <div className="status-item">
              <span className="status-label">Database (MongoDB)</span>
              {loading ? (
                <div className="status-pill status-loading">
                  <RefreshCw size={14} className="spin" />
                  <span>Checking...</span>
                </div>
              ) : health?.database === 'connected' ? (
                <div className="status-pill status-online">
                  <CheckCircle2 size={16} />
                  <span>Connected</span>
                </div>
              ) : (
                <div className="status-pill status-offline">
                  <AlertCircle size={16} />
                  <span>Not Connected</span>
                </div>
              )}
            </div>
          </div>

          {/* Details or error banner */}
          {error && (
            <div className="error-box">
              <AlertCircle size={18} />
              <span>Could not reach backend at /api/health ({error}). Is the server running?</span>
            </div>
          )}

          {health && (
            <div className="success-box">
              <p><strong>Server Message:</strong> {health.message}</p>
              <p className="meta-text">Timestamp: {health.timestamp}</p>
            </div>
          )}

          {/* Retry button */}
          <div className="card-actions">
            <button className="btn-primary" onClick={checkBackendHealth} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              <span>Re-check Connection</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
