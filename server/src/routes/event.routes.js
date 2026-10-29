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
  registerForEvent,
  cancelRegistration,
} = require('../controllers/event.controller')

const router = express.Router()

// ─── Public routes (no login required) ───────────────────────────────────────
router.get('/', getEvents)        // GET  /api/events
router.get('/:id', getEventById)  // GET  /api/events/:id

// ─── Admin-only routes ────────────────────────────────────────────────────────
router.post('/', protect, restrictTo('admin'), validate(createEventSchema), createEvent)
router.put('/:id', protect, restrictTo('admin'), validate(updateEventSchema), updateEvent)
router.delete('/:id', protect, restrictTo('admin'), deleteEvent)

// ─── Logged-in user routes ────────────────────────────────────────────────────
router.post('/:id/register', protect, registerForEvent)     // register for an event
router.delete('/:id/register', protect, cancelRegistration) // cancel registration

module.exports = router
