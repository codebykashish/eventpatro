const mongoose = require('mongoose')
const crypto = require('crypto')

// One submitted answer from a student
const answerSchema = new mongoose.Schema(
  {
    // The _id of the formField question this answer belongs to
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // Snapshot of the question label at submission time (survives future form edits)
    label: {
      type: String,
      required: true,
    },
    // The student's actual answer (string works for all question types)
    value: {
      type: String,
      default: '',
    },
  },
  { _id: false } // answers don't need their own _id
)

const registrationSchema = new mongoose.Schema(
  {
    // Which event this registration is for
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },

    // Which student submitted this registration
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Status lifecycle:
    //  open event → 'confirmed' immediately
    //  application event → 'pending' until admin reviews
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'selected', 'rejected', 'cancelled'],
      default: 'pending',
    },

    // Answers to every form field (empty array if no custom form)
    answers: {
      type: [answerSchema],
      default: [],
    },

    // Short unique code students can use as proof of registration (e.g. EP-A3F7K2)
    registrationCode: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
)

// Generate a unique 6-character code like EP-A3F7K2 before saving
registrationSchema.pre('save', function (next) {
  if (!this.registrationCode) {
    // 3 random bytes → 6 uppercase hex characters
    const code = crypto.randomBytes(3).toString('hex').toUpperCase()
    this.registrationCode = `EP-${code}`
  }
  next()
})

// Prevent a student from having two active registrations for the same event
registrationSchema.index(
  { event: 1, student: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['confirmed', 'pending', 'selected'] },
    },
  }
)

const Registration = mongoose.model('Registration', registrationSchema)

module.exports = Registration
