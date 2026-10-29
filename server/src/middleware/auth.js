const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Protect middleware: Verifies JWT token from Authorization header
const protect = async (req, res, next) => {
  try {
    let token

    // Extract Bearer token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }

    // Reject if no token is provided
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'You are not logged in. Please log in to access this resource.',
      })
    }

    // Verify token validity
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check if the user still exists in database
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      })
    }

    // Attach authenticated user to request object
    req.user = currentUser
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    })
  }
}

// RestrictTo middleware: Restricts route access to specified roles (e.g., 'admin')
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      })
    }
    next()
  }
}

module.exports = {
  protect,
  restrictTo,
}
