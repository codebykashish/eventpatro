const express = require('express')
const { protect, restrictTo } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { createEventSchema, updateEventSchema } = require('../validations/event.validation')
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/event.controller')
const {
  createRegistration,
  cancelRegistration,
  getEventRegistrations,
  updateRegistrationStatus,
} = require('../controllers/registration.controller')

const router = express.Router()

// ─── Public routes (no login required) ───────────────────────────────────────
router.get('/', getEvents)        // GET  /api/events
router.get('/:id', getEventById)  // GET  /api/events/:id

// ─── Admin-only routes ────────────────────────────────────────────────────────
router.post('/', protect, restrictTo('admin'), validate(createEventSchema), createEvent)
router.put('/:id', protect, restrictTo('admin'), validate(updateEventSchema), updateEvent)
router.delete('/:id', protect, restrictTo('admin'), deleteEvent)

// ─── Registration routes (logged-in students) ─────────────────────────────────
router.post('/:id/registrations', protect, createRegistration)    // submit registration + answers
router.delete('/:id/registrations', protect, cancelRegistration)  // cancel active registration

// ─── Admin: view and manage registrations for an event ────────────────────────
router.get('/:id/registrations', protect, restrictTo('admin'), getEventRegistrations)
router.patch('/:id/registrations/:regId', protect, restrictTo('admin'), updateRegistrationStatus)

module.exports = router

