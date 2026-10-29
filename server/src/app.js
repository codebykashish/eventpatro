// app.js
// This file sets up the Express application — middleware, routes, and error handling.
// It does NOT start the server or connect to the database.
// That happens in server.js, which imports this file.

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// --- Security middleware ---
// helmet() automatically sets a collection of HTTP headers that protect
// against common attacks (e.g. clickjacking, MIME sniffing).
app.use(helmet());

// cors() controls which web origins are allowed to send requests to this API.
// The CLIENT_URL environment variable should be your React app's address.
// During development that is typically http://localhost:5173 (Vite's default port).
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // Allow cookies to be sent with requests (needed for auth later)
  })
);

// --- Body parsing ---
// This tells Express to automatically parse incoming JSON request bodies.
// Without this, req.body would be undefined when the frontend sends JSON.
app.use(express.json());

// --- Routes ---

// Health-check route.
// Purpose: a quick way to confirm the server is running and can respond.
// The React app will call this during Phase 0 to verify the connection works.
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Eventpatro server is running.',
    timestamp: new Date().toISOString(),
  });
});

// --- 404 handler ---
// If a request reaches this point, no route above matched it.
// We return a JSON 404 instead of Express's default HTML error page.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// --- Global error handler ---
// Express recognises this as an error handler because it has four parameters.
// When any route or middleware calls next(error), it ends up here.
// We send a consistent JSON error response and never expose stack traces
// to the client in production.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message =
    err.isOperational
      ? err.message // Known, safe-to-show errors (e.g. "Event not found")
      : 'Something went wrong. Please try again.'; // Hide unexpected server errors

  // Only log the full error in development so we can debug
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
});

module.exports = app;
