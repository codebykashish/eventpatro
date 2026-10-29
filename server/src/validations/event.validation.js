const { z } = require('zod')
const { CATEGORIES, FIELD_TYPES } = require('../models/Event')

// Validation for a single form field question
const formFieldSchema = z.object({
  label: z
    .string({ required_error: 'Field label is required' })
    .min(1, 'Label cannot be empty')
    .max(200, 'Label cannot exceed 200 characters'),

  type: z.enum(FIELD_TYPES, {
    errorMap: () => ({ message: `Field type must be one of: ${FIELD_TYPES.join(', ')}` }),
  }),

  // Options required only for multiple_choice, ignored for others
  options: z.array(z.string()).default([]),

  required: z.boolean().default(false),
})

// Validation for creating a new event
const createEventSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),

  description: z
    .string({ required_error: 'Description is required' })
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),

  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: `Category must be one of: ${CATEGORIES.join(', ')}` }),
  }).default('other'),

  // Accept ISO string from frontend and coerce to Date
  date: z.coerce.date({ required_error: 'Event date is required' }),

  location: z
    .string({ required_error: 'Location is required' })
    .min(2, 'Location must be at least 2 characters'),

  capacity: z
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .nullable()
    .optional()
    .default(null),

  coverImage: z.string().url('Cover image must be a valid URL').nullable().optional().default(null),

  // --- Phase 3 fields ---
  registrationType: z.enum(['open', 'application']).default('open'),

  registrationDeadline: z.coerce.date().nullable().optional().default(null),

  // Array of custom form questions (may be empty)
  formFields: z.array(formFieldSchema).default([]),
})

// For updating — all fields are optional
const updateEventSchema = createEventSchema.partial()

module.exports = { createEventSchema, updateEventSchema }

