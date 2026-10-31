const express = require('express')
const rateLimit = require('express-rate-limit')
const {
  signup,
  verifyOtp,
  resendOtp,
  login,
  getMe,
  updateProfile,
} = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { signupSchema, loginSchema } = require('../validations/auth.validation')

const router = express.Router()

// Rate limiter for login route: Max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Public authentication routes
router.post('/signup', validate(signupSchema), signup)
router.post('/login', loginLimiter, validate(loginSchema), login)
router.post('/verify-otp', verifyOtp)
router.post('/resend-otp', resendOtp)

// Protected user routes
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile)

module.exports = router
