const mongoose = require('mongoose')

// All possible categories for campus events
const CATEGORIES = [
  'academic',
  'cultural',
  'sports',
  'workshop',
  'seminar',
  'social',
  'club',
  'other',
]

const eventSchema = new mongoose.Schema(
  {
    // Basic details
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    // Category tag for filtering
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'other',
    },

    // When and where
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },

    // Optional capacity (null = unlimited)
    capacity: {
      type: Number,
      min: [1, 'Capacity must be at least 1'],
      default: null,
    },

    // Cover image URL (uploaded or generated)
    coverImage: {
      type: String,
      default: null,
    },

    // Who created this event (organiser — admin or club lead)
    organiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // List of user IDs who registered for this event
    registeredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Controls whether the event appears in the public listing
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
)

// Virtual: how many spots are left (null if no capacity limit set)
eventSchema.virtual('spotsLeft').get(function () {
  if (this.capacity === null) return null
  return Math.max(0, this.capacity - this.registeredUsers.length)
})

// Make virtuals visible in JSON responses
eventSchema.set('toJSON', { virtuals: true })
eventSchema.set('toObject', { virtuals: true })

const Event = mongoose.model('Event', eventSchema)

module.exports = { Event, CATEGORIES }
