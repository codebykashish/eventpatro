const { z } = require('zod')
const { CATEGORIES } = require('../models/Event')

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
})

// For updating — all fields are optional
const updateEventSchema = createEventSchema.partial()

module.exports = { createEventSchema, updateEventSchema }
