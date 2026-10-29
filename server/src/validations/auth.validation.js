const { z } = require('zod')

// Schema to validate signup request bodies
const signupSchema = z
  .object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .trim()
      .min(2, 'First name must be at least 2 characters'),
    lastName: z
      .string({ required_error: 'Last name is required' })
      .trim()
      .min(2, 'Last name must be at least 2 characters'),
    studentId: z
      .string({ required_error: 'Student ID is required' })
      .trim()
      .min(3, 'Student ID must be at least 3 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address')
      .refine(
        (val) => val.endsWith('@sunway.edu.np'),
        'Email must be a valid Sunway College email (@sunway.edu.np)'
      ),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z
      .string({ required_error: 'Please confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'], // Highlights the confirmPassword field on error
  })

// Schema to validate login request bodies
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
})

module.exports = {
  signupSchema,
  loginSchema,
}
