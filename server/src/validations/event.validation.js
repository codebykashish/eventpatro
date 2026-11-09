const { z } = require('zod')
const { CATEGORIES, FIELD_TYPES } = require('../models/Event')

const formFieldSchema = z.object({
  label: z
    .string({ required_error: 'Field label is required' })
    .min(1, 'Label cannot be empty')
    .max(200, 'Label cannot exceed 200 characters'),
  type: z.enum(FIELD_TYPES, {
    errorMap: () => ({ message: `Field type must be one of: ${FIELD_TYPES.join(', ')}` }),
  }),
  options: z.array(z.string()).default([]),
  required: z.boolean().default(false),
})

const mentorSchema = z.object({
  name: z.string().trim().optional().default(''),
  occupation: z.string().trim().optional().default(''),
  photo: z.string().optional().default(''),
  linkedin: z.string().optional().default(''),
  bio: z.string().optional().default(''),
}).optional()

const contactPersonSchema = z.object({
  name: z.string().trim().optional().default(''),
  email: z.string().trim().optional().default(''),
  phone: z.string().trim().optional().default(''),
}).optional()

const coverImageSchema = z.preprocess(
  (v) => (v === '' ? null : v),
  z.union([
    z.string().url(),
    z.string().regex(/^\/uploads\//, 'Cover image path must be valid'),
  ]).nullable().optional()
)

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

  coverImage: coverImageSchema,

  registrationType: z.enum(['open', 'application']).default('open'),
  registrationDeadline: z.coerce.date().nullable().optional().default(null),
  formFields: z.array(formFieldSchema).default([]),

  mentor: mentorSchema,
  contactPerson: contactPersonSchema,
  learningOutcomes: z.array(z.string()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  duration: z.string().optional().default(''),
  fee: z.string().optional().default(''),
  isFree: z.boolean().optional(),
  hasBreakfast: z.boolean().optional().default(false),
  laptopRequired: z.boolean().optional().default(false),
  certificateProvided: z.boolean().optional().default(false),
})

const updateEventSchema = createEventSchema.partial()

module.exports = { createEventSchema, updateEventSchema }
