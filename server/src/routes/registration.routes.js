const express = require('express')
const { protect, restrictTo } = require('../middleware/auth')
const {
  getMyRegistrations,
  getMyRegistrationForEvent,
} = require('../controllers/registration.controller')

const router = express.Router()

// All registration routes require login
router.use(protect)

// GET /api/registrations/me — student's full registration history
router.get('/me', getMyRegistrations)

// GET /api/registrations/me/:eventId — check registration for one event
router.get('/me/:eventId', getMyRegistrationForEvent)

module.exports = router
