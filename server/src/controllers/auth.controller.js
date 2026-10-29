const User = require('../models/User')
const generateToken = require('../utils/generateToken')

// Helper function to format safe user output (omitting password)
const formatUserResponse = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  studentId: user.studentId,
  email: user.email,
  role: user.role,
  profilePicture: user.profilePicture,
})

// @desc    Register a new student account
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res, next) => {
  try {
    const { firstName, lastName, studentId, email, password } = req.body

    // Check if email already exists
    const existingEmail = await User.findOne({ email })
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      })
    }

    // Check if student ID already exists
    const existingStudentId = await User.findOne({ studentId: studentId.toUpperCase() })
    if (existingStudentId) {
      return res.status(409).json({
        success: false,
        message: 'An account with this Student ID already exists.',
      })
    }

    // Create new student (role is forced to 'student' to prevent privilege escalation)
    const user = await User.create({
      firstName,
      lastName,
      studentId: studentId.toUpperCase(),
      email,
      password,
      role: 'student',
    })

    // Generate JWT token
    const token = generateToken(user._id, user.role)

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: formatUserResponse(user),
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

    // Find user by email and include password hash
    const user = await User.findOne({ email }).select('+password')

    // If user does not exist or password is wrong, return 401
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    // Generate JWT token
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

module.exports = {
  signup,
  login,
  getMe,
}
