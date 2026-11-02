const { Event } = require('../models/Event')
const Registration = require('../models/Registration')

// ─── POST /api/events/:id/registrations ──────────────────────────────────────
// Logged-in students: submit registration + form answers for an event
const createRegistration = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event || !event.isPublished) {
      return res.status(404).json({ message: 'Event not found' })
    }

    // Block registration after deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ message: 'Registration deadline has passed' })
    }

    // Count active registrations to enforce capacity
    const activeCount = await Registration.countDocuments({
      event: event._id,
      status: { $in: ['confirmed', 'pending', 'selected', 'attended'] },
    })

    if (event.capacity !== null && activeCount >= event.capacity) {
      return res.status(400).json({ message: 'Event is fully booked' })
    }

    // Check for an existing active registration by this student
    const existing = await Registration.findOne({
      event: event._id,
      student: req.user._id,
      status: { $in: ['confirmed', 'pending', 'selected', 'attended'] },
    })

    if (existing) {
      return res.status(400).json({ message: 'You are already registered for this event' })
    }

    // Validate required form fields
    const rawAnswers = Array.isArray(req.body) ? req.body : (req.body?.answers || [])
    const answers = Array.isArray(rawAnswers) ? rawAnswers : []
    const missingRequired = []

    for (const field of event.formFields) {
      if (!field.required) continue
      const submitted = answers.find((a) => a.fieldId === field._id.toString())
      if (!submitted || !submitted.value || submitted.value.trim() === '') {
        missingRequired.push(field.label)
      }
    }

    if (missingRequired.length > 0) {
      return res.status(400).json({
        message: `Please answer all required questions: ${missingRequired.join(', ')}`,
      })
    }

    // Build answer array with label snapshots (preserve question text at submission time)
    // NOTE: label is required in answerSchema, so we must always supply a non-empty string
    const savedAnswers = answers.map((a) => {
      const field = event.formFields.find((f) => f._id.toString() === a.fieldId)
      const resolvedLabel = (field && field.label) ? field.label : (a.label && a.label.trim() ? a.label.trim() : 'Response')
      return {
        fieldId: a.fieldId,
        label: resolvedLabel,
        value: a.value || '',
      }
    })

    // Determine initial status based on event registration type
    const status = event.registrationType === 'open' ? 'confirmed' : 'pending'

    // If student had a previous registration (e.g. cancelled), overwrite/reactivate it
    let registration = await Registration.findOne({
      event: event._id,
      student: req.user._id,
    }).sort({ createdAt: -1 })

    if (registration) {
      registration.status = status
      registration.answers = savedAnswers
      await registration.save()
    } else {
      registration = await Registration.create({
        event: event._id,
        student: req.user._id,
        status,
        answers: savedAnswers,
      })
    }

    // Also ensure student is in registeredUsers array so spotsLeft virtual stays accurate
    await Event.findByIdAndUpdate(event._id, {
      $addToSet: { registeredUsers: req.user._id },
    })

    res.status(201).json({
      message:
        status === 'confirmed'
          ? 'Registered successfully!'
          : 'Application submitted! You will be notified of the outcome.',
      registration,
    })
  } catch (err) {
    // Unique index violation = duplicate active registration
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You are already registered for this event' })
    }
    // Log exact error for debugging
    console.error('[Registration Error]', err.name, err.message)
    res.status(500).json({ message: err.message || 'Registration failed', error: err.message })
  }
}

// ─── DELETE /api/events/:id/registrations ────────────────────────────────────
// Logged-in students: cancel their own active registration
const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      event: req.params.id,
      student: req.user._id,
      status: { $in: ['confirmed', 'pending', 'selected'] },
    })

    if (!registration) {
      return res.status(404).json({ message: 'Active registration not found' })
    }

    registration.status = 'cancelled'
    await registration.save()

    // Remove from registeredUsers array too
    await Event.findByIdAndUpdate(req.params.id, {
      $pull: { registeredUsers: req.user._id },
    })

    res.json({ message: 'Registration cancelled successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel registration', error: err.message })
  }
}

// ─── GET /api/events/:id/registrations ───────────────────────────────────────
// Admin only: list all registrations for an event (with student details + answers)
const getEventRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.id })
      .populate('student', 'firstName lastName email studentId')
      .sort({ createdAt: -1 })

    res.json({ registrations })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch registrations', error: err.message })
  }
}

// ─── PATCH /api/events/:id/registrations/:regId ──────────────────────────────
// Admin only: update a registration's status (select / reject)
const updateRegistrationStatus = async (req, res) => {
  try {
    const { status } = req.body

    // Admin can set selected, rejected, or attended (attendance marking)
    if (!['selected', 'rejected', 'attended', 'confirmed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "selected", "rejected", "attended", or "confirmed"' })
    }

    const registration = await Registration.findOneAndUpdate(
      { _id: req.params.regId, event: req.params.id },
      { status },
      { new: true }
    ).populate('student', 'firstName lastName email')

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' })
    }

    res.json({ message: `Registration ${status}`, registration })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status', error: err.message })
  }
}

// ─── GET /api/registrations/me ────────────────────────────────────────────────
// Logged-in student: get all their own registrations with event details
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.user._id })
      .populate('event', 'title date location category registrationType coverImage capacity registeredUsers description')
      .sort({ createdAt: -1 })

    res.json({ registrations })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your registrations', error: err.message })
  }
}

// ─── GET /api/registrations/me/:eventId ──────────────────────────────────────
// Logged-in student: check if they are registered for a specific event
const getMyRegistrationForEvent = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      event: req.params.eventId,
      student: req.user._id,
    }).sort({ updatedAt: -1, createdAt: -1 })

    res.json({ registration }) // null if not registered
  } catch (err) {
    res.status(500).json({ message: 'Failed to check registration', error: err.message })
  }
}

// ─── GET /api/registrations/all ──────────────────────────────────────────────
// Admin only: get all registrations with student and event details
const getAllRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ status: { $ne: 'cancelled' } })
      .populate('student', 'firstName lastName email studentId')
      .populate('event', 'title date location category capacity coverImage')
      .sort({ createdAt: -1 })
      .limit(100)

    res.json({
      success: true,
      registrations,
      total: registrations.length,
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch registrations', error: err.message })
  }
}

// ─── GET /api/registrations/user/:userId ──────────────────────────────────────
// Admin only: get all registrations for a specific user with event details
const getUserRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      student: req.params.userId,
      status: { $ne: 'cancelled' },
    })
      .populate('event', 'title date location category capacity coverImage')
      .populate('student', 'firstName lastName email studentId')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      registrations,
      total: registrations.length,
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user registrations', error: err.message })
  }
}

module.exports = {
  createRegistration,
  cancelRegistration,
  getEventRegistrations,
  updateRegistrationStatus,
  getMyRegistrations,
  getMyRegistrationForEvent,
  getAllRegistrations,
  getUserRegistrations,
}
