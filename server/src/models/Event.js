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

// Supported question types for the custom registration form builder
const FIELD_TYPES = ['short_answer', 'paragraph', 'multiple_choice']

// Schema for one custom question in the registration form
const formFieldSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    // Type of input students will see
    type: {
      type: String,
      enum: FIELD_TYPES,
      required: true,
    },
    // Choices only used when type === 'multiple_choice'
    options: {
      type: [String],
      default: [],
    },
    // Whether the student must fill this question before submitting
    required: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true } // keep _id so frontend can reference specific fields by id
)

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

    // List of user IDs who registered for this event (legacy — kept for spotsLeft virtual)
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

    // --- Phase 3: Registration type and form builder ---

    // 'open' = anyone can register instantly (Confirmed)
    // 'application' = student applies and admin reviews (Pending → Selected/Rejected)
    registrationType: {
      type: String,
      enum: ['open', 'application'],
      default: 'open',
    },

    // Last date/time students can submit registrations (null = no deadline)
    registrationDeadline: {
      type: Date,
      default: null,
    },

    // Custom questions admin builds for this event's registration form
    formFields: {
      type: [formFieldSchema],
      default: [],
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

module.exports = { Event, CATEGORIES, FIELD_TYPES }
