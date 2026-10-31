const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const generateToken = require('../utils/generateToken')
const sendEmail = require('../utils/sendEmail')

// Safe user output format omitting sensitive fields
const formatUserResponse = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  studentId: user.studentId,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  profilePicture: user.profilePicture,
})

// Helper to generate a 6-digit numeric OTP
const generateNumericOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// @desc    Register new student & send email OTP verification
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res, next) => {
  try {
    const { firstName, lastName, studentId, email, password } = req.body

    // Check if email already registered
    const existingEmail = await User.findOne({ email })
    if (existingEmail) {
      // If unverified, allow resending code instead of hard failure
      if (!existingEmail.isVerified) {
        const otp = generateNumericOtp()
        const hashedOtp = await bcrypt.hash(otp, 8)

        existingEmail.verificationOtp = hashedOtp
        existingEmail.verificationOtpExpires = Date.now() + 10 * 60 * 1000 // 10 minutes
        await existingEmail.save()

        await sendEmail({
          to: email,
          subject: 'Eventpatro — Verify Your Email Address',
          text: `Your Eventpatro 6-digit verification code is: ${otp}`,
          otp,
        })

        return res.status(200).json({
          success: true,
          requiresVerification: true,
          email,
          message: 'An unverified account was found. A new verification code has been sent.',
        })
      }

      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      })
    }

    // Check if student ID already registered
    const existingStudentId = await User.findOne({ studentId: studentId.toUpperCase() })
    if (existingStudentId) {
      return res.status(409).json({
        success: false,
        message: 'An account with this Student ID already exists.',
      })
    }

    // Generate 6-digit OTP
    const otp = generateNumericOtp()
    const hashedOtp = await bcrypt.hash(otp, 8)

    // Create student account marked as unverified until OTP check
    const user = await User.create({
      firstName,
      lastName,
      studentId: studentId.toUpperCase(),
      email,
      password,
      role: 'student',
      isVerified: false,
      verificationOtp: hashedOtp,
      verificationOtpExpires: Date.now() + 10 * 60 * 1000,
    })

    // Send email with verification code
    await sendEmail({
      to: email,
      subject: 'Eventpatro — Verify Your Email Address',
      text: `Welcome to Eventpatro! Your 6-digit verification code is: ${otp}`,
      otp,
    })

    res.status(201).json({
      success: true,
      requiresVerification: true,
      email: user.email,
      message: 'Account created! Please enter the 6-digit code sent to your email.',
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Verify 6-digit email OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and 6-digit verification code are required.',
      })
    }

    // Find user with OTP fields included
    const user = await User.findOne({ email }).select('+verificationOtp +verificationOtpExpires')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      })
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This account has already been verified. Please log in.',
      })
    }

    // Check if code has expired
    if (!user.verificationOtpExpires || user.verificationOtpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      })
    }

    // Check if OTP matches
    const isMatch = await bcrypt.compare(otp, user.verificationOtp)
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check and try again.',
      })
    }

    // Activate account and clear OTP
    user.isVerified = true
    user.verificationOtp = undefined
    user.verificationOtpExpires = undefined
    await user.save()

    // Generate JWT token
    const token = generateToken(user._id, user.role)

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to Eventpatro.',
      token,
      user: formatUserResponse(user),
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Resend fresh 6-digit email OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      })
    }

    const user = await User.findOne({ email }).select('+verificationOtp +verificationOtpExpires')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      })
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This account is already verified.',
      })
    }

    // Generate new OTP
    const otp = generateNumericOtp()
    user.verificationOtp = await bcrypt.hash(otp, 8)
    user.verificationOtpExpires = Date.now() + 10 * 60 * 1000
    await user.save()

    await sendEmail({
      to: email,
      subject: 'Eventpatro — New Verification Code',
      text: `Your new 6-digit verification code is: ${otp}`,
      otp,
    })

    res.status(200).json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Authenticate user & return JWT token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    // Generate JWT token directly (OTP is only required during signup)
    const token = generateToken(user._id, user.role)

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: formatUserResponse(user),
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: formatUserResponse(req.user),
  })
}

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, studentId, email, profilePicture } = req.body

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Check if new email is already in use by another user
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existingEmail = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id },
      })
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another account',
        })
      }
      user.email = email.toLowerCase().trim()
    }

    // Check studentId uniqueness if updated
    if (studentId !== undefined && studentId !== user.studentId) {
      if (studentId.trim()) {
        const existingId = await User.findOne({
          studentId: studentId.trim().toUpperCase(),
          _id: { $ne: user._id },
        })
        if (existingId) {
          return res.status(400).json({
            success: false,
            message: 'Student ID is already registered to another user',
          })
        }
        user.studentId = studentId.trim().toUpperCase()
      }
    }

    if (firstName) user.firstName = firstName.trim()
    if (lastName) user.lastName = lastName.trim()
    if (profilePicture !== undefined) user.profilePicture = profilePicture

    await user.save()

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUserResponse(user),
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  signup,
  verifyOtp,
  resendOtp,
  login,
  getMe,
  updateProfile,
}
