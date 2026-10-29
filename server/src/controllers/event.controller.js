const { Event } = require('../models/Event')

// ─── GET /api/events ─────────────────────────────────────────────────────────
// Public: list all published events with optional search & category filter
const getEvents = async (req, res) => {
  try {
    const { search = '', category = '', page = 1, limit = 12 } = req.query

    // Build query — only show published events
    const query = { isPublished: true }

    if (category) query.category = category

    // Case-insensitive search across title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)
    const total = await Event.countDocuments(query)
    const events = await Event.find(query)
      .sort({ date: 1 }) // upcoming first
      .skip(skip)
      .limit(Number(limit))
      .populate('organiser', 'firstName lastName email')

    res.json({ events, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events', error: err.message })
  }
}

// ─── GET /api/events/:id ─────────────────────────────────────────────────────
// Public: fetch one event by ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organiser', 'firstName lastName email')
      .populate('registeredUsers', 'firstName lastName email')

    if (!event || !event.isPublished) {
      return res.status(404).json({ message: 'Event not found' })
    }

    res.json({ event })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch event', error: err.message })
  }
}

// ─── POST /api/events ────────────────────────────────────────────────────────
// Admin only: create a new event
const createEvent = async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      organiser: req.user._id, // req.user is set by the protect middleware
    })

    res.status(201).json({ message: 'Event created successfully', event })
  } catch (err) {
    res.status(500).json({ message: 'Failed to create event', error: err.message })
  }
}

// ─── PUT /api/events/:id ─────────────────────────────────────────────────────
// Admin only: update an existing event
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )

    if (!event) return res.status(404).json({ message: 'Event not found' })

    res.json({ message: 'Event updated', event })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update event', error: err.message })
  }
}

// ─── DELETE /api/events/:id ──────────────────────────────────────────────────
// Admin only: soft-delete (unpublish) so data is kept in the database
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isPublished: false },
      { new: true }
    )

    if (!event) return res.status(404).json({ message: 'Event not found' })

    res.json({ message: 'Event removed from public listing' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event', error: err.message })
  }
}

// ─── POST /api/events/:id/register (legacy stub — now handled by registration.controller.js) ─
// This function is no longer exported; keeping the file note for reference.

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
}

